/**
 * Multisim Web - Modified Nodal Analysis (MNA) & Transient Circuit Engine
 * Real-time simulation of linear, non-linear, reactive, analog, and digital logic components.
 */

export class MNACircuitSolver {
  constructor() {
    this.nodes = new Map(); // id -> node index (0 is Ground)
    this.groundNodeId = 'GND';
    this.components = [];
    this.time = 0;
    this.dt = 1e-4; // 100 microseconds default step
    this.simSpeed = 1.0;
    this.isRunning = false;
    this.iterationsMax = 50;
    this.tolerance = 1e-5;
    
    // Waveform history for oscilloscope and probes
    this.historyBufferLength = 2000;
    this.probeHistories = new Map(); // componentId/pin -> ring buffer of {t, v, i}
    
    // Audio engine for buzzers and speakers
    this.audioCtx = null;
    this.audioNodes = new Map();
    this.soundEnabled = true;

    // Callbacks
    this.onUpdate = null;
  }

  reset() {
    this.time = 0;
    this.probeHistories.clear();
    for (const comp of this.components) {
      if (comp.resetState) comp.resetState();
    }
  }

  setComponents(components) {
    this.components = components;
    this.reset();
  }

  // Gaussian elimination with partial pivoting for Ax = b
  solveLinearSystem(A, b, n) {
    // Clone matrices
    const M = A.map(row => [...row]);
    const x = [...b];

    for (let i = 0; i < n; i++) {
      // Find pivot
      let maxRow = i;
      let maxVal = Math.abs(M[i][i]);
      for (let k = i + 1; k < n; k++) {
        if (Math.abs(M[k][i]) > maxVal) {
          maxVal = Math.abs(M[k][i]);
          maxRow = k;
        }
      }

      if (maxVal < 1e-12) {
        // Singular or floating node - small regularization
        M[i][i] = 1e-9;
      }

      // Swap rows
      if (maxRow !== i) {
        const tempRow = M[i];
        M[i] = M[maxRow];
        M[maxRow] = tempRow;
        const tempB = x[i];
        x[i] = x[maxRow];
        x[maxRow] = tempB;
      }

      // Eliminate
      for (let k = i + 1; k < n; k++) {
        const factor = M[k][i] / M[i][i];
        if (Math.abs(factor) > 1e-15) {
          for (let j = i; j < n; j++) {
            M[k][j] -= factor * M[i][j];
          }
          x[k] -= factor * x[i];
        }
      }
    }

    // Back substitution
    for (let i = n - 1; i >= 0; i--) {
      let sum = x[i];
      for (let j = i + 1; j < n; j++) {
        sum -= M[i][j] * x[j];
      }
      x[i] = sum / (Math.abs(M[i][i]) < 1e-12 ? 1e-9 : M[i][i]);
    }

    return x;
  }

  // Build netlist nodes and indexes
  buildNodeMap() {
    const nodeSet = new Set();
    nodeSet.add(this.groundNodeId);

    // Collect all connected pins/nets
    for (const comp of this.components) {
      for (const pin of comp.pins) {
        if (pin.netId) {
          nodeSet.add(pin.netId);
        }
      }
    }

    // Assign integer index: 0 is Ground
    this.nodeMap = new Map();
    this.nodeMap.set(this.groundNodeId, 0);
    let index = 1;
    for (const netId of nodeSet) {
      if (netId !== this.groundNodeId) {
        this.nodeMap.set(netId, index++);
      }
    }

    this.numNodes = index; // 0..numNodes-1 (0 is ref)
  }

  // Stamp conductance G between node1 and node2
  stampConductance(G_mat, n1, n2, g) {
    if (isNaN(g) || !isFinite(g)) return;
    if (n1 > 0) G_mat[n1 - 1][n1 - 1] += g;
    if (n2 > 0) G_mat[n2 - 1][n2 - 1] += g;
    if (n1 > 0 && n2 > 0) {
      G_mat[n1 - 1][n2 - 1] -= g;
      G_mat[n2 - 1][n1 - 1] -= g;
    }
  }

  // Stamp independent current source from n1 to n2
  stampCurrentSource(I_vec, n1, n2, current) {
    if (isNaN(current) || !isFinite(current)) return;
    // Current leaves n1, enters n2
    if (n1 > 0) I_vec[n1 - 1] -= current;
    if (n2 > 0) I_vec[n2 - 1] += current;
  }

  // Perform single transient timestep with Newton-Raphson iteration
  step(dt) {
    this.buildNodeMap();
    const N = this.numNodes - 1; // number of unknown node voltages (excluding ground)
    if (N <= 0) {
      this.time += dt;
      return;
    }

    // Identify auxiliary branches (voltage sources, inductors, op-amp outputs, etc.)
    const vSources = [];
    for (const comp of this.components) {
      if (comp.type === 'DC_POWER' || comp.type === 'AC_POWER' || comp.type === 'VCC' ||
          comp.type === 'VDD' || comp.type === 'VEE' || comp.type === 'DIGITAL_CLOCK' ||
          comp.type === 'PULSE_VOLTAGE' || comp.type === 'SINE_GEN' || comp.type === 'VOLTAGE_REG_7805' ||
          comp.type === 'VOLTAGE_REG_7812' || comp.type === 'VOLTAGE_REG_LM317' || comp.type === 'VCVS') {
        vSources.push(comp);
      } else if (comp.type === 'INDUCTOR') {
        // Inductors handled as companion conductance + current source or auxiliary branch
      }
    }

    const M = vSources.length;
    const totalSize = N + M;

    // Previous node voltages or initial guess
    let V = new Array(totalSize).fill(0);
    // Seed with existing voltages if available
    for (const comp of this.components) {
      for (const pin of comp.pins) {
        const n = this.nodeMap.get(pin.netId);
        if (n && n > 0 && pin.voltage !== undefined) {
          V[n - 1] = pin.voltage;
        }
      }
    }

    let converged = false;
    let iteration = 0;

    while (!converged && iteration < this.iterationsMax) {
      iteration++;

      // Create matrix A and RHS b
      const A = Array.from({ length: totalSize }, () => new Array(totalSize).fill(0));
      const b = new Array(totalSize).fill(0);

      // 1. Shunt resistors to ground to ensure matrix is well-conditioned
      for (let i = 0; i < N; i++) {
        A[i][i] += 1e-11; // 100 G-ohm to ground
      }

      // 2. Stamp basic passives, reactive companion models, and non-linear devices
      for (const comp of this.components) {
        this.stampComponent(comp, A, b, V, dt);
      }

      // 3. Stamp auxiliary voltage sources
      for (let k = 0; k < M; k++) {
        const src = vSources[k];
        const vIdx = N + k;
        const nPos = this.nodeMap.get(src.pins[0]?.netId) || 0;
        const nNeg = this.nodeMap.get(src.pins[1]?.netId) || 0;
        const vVal = this.getVoltageSourceValue(src, this.time);

        if (nPos > 0) {
          A[nPos - 1][vIdx] += 1;
          A[vIdx][nPos - 1] += 1;
        }
        if (nNeg > 0) {
          A[nNeg - 1][vIdx] -= 1;
          A[vIdx][nNeg - 1] -= 1;
        }
        b[vIdx] += vVal;
      }

      // Solve Ax = b
      const V_next = this.solveLinearSystem(A, b, totalSize);

      // Check convergence
      let maxDiff = 0;
      for (let i = 0; i < N; i++) {
        const diff = Math.abs(V_next[i] - V[i]);
        if (diff > maxDiff) maxDiff = diff;
      }

      V = V_next;
      if (maxDiff < this.tolerance || iteration >= this.iterationsMax) {
        converged = true;
      }
    }

    // Extract node voltages
    const nodeVoltages = new Map();
    nodeVoltages.set(this.groundNodeId, 0);
    for (const [netId, idx] of this.nodeMap.entries()) {
      if (idx === 0) {
        nodeVoltages.set(netId, 0);
      } else {
        nodeVoltages.set(netId, V[idx - 1] || 0);
      }
    }

    // Update pin voltages, component currents, reactive states, logic states
    for (const comp of this.components) {
      this.updateComponentState(comp, nodeVoltages, dt);
    }

    // Update audio synthesis if active
    if (this.soundEnabled) {
      this.updateAudioFeedback();
    }

    this.time += dt;
  }

  getVoltageSourceValue(comp, t) {
    switch (comp.type) {
      case 'DC_POWER':
      case 'VCC':
        return comp.voltage ?? 5.0;
      case 'VDD':
        return comp.voltage ?? 12.0;
      case 'VEE':
        return -(comp.voltage ?? 12.0);
      case 'AC_POWER': {
        const freq = comp.frequency ?? 50.0;
        const vPeak = (comp.voltage ?? 120.0) * Math.SQRT2;
        const phase = (comp.phase ?? 0) * (Math.PI / 180);
        return vPeak * Math.sin(2 * Math.PI * freq * t + phase);
      }
      case 'DIGITAL_CLOCK': {
        const freq = comp.frequency ?? 1000.0;
        const period = 1.0 / freq;
        const duty = comp.dutyCycle ?? 0.5;
        const cyclePos = (t % period) / period;
        const vHigh = comp.vHigh ?? 5.0;
        const vLow = comp.vLow ?? 0.0;
        return cyclePos < duty ? vHigh : vLow;
      }
      case 'PULSE_VOLTAGE': {
        const freq = comp.frequency ?? 500.0;
        const period = 1.0 / freq;
        const pulseWidth = comp.pulseWidth ?? (period * 0.2);
        const cycleTime = t % period;
        return cycleTime < pulseWidth ? (comp.vHigh ?? 5.0) : (comp.vLow ?? 0.0);
      }
      case 'SINE_GEN': {
        const freq = comp.frequency ?? 1000.0;
        const amp = comp.amplitude ?? 5.0;
        const offset = comp.offset ?? 0.0;
        return offset + amp * Math.sin(2 * Math.PI * freq * t);
      }
      case 'VOLTAGE_REG_7805':
        return 5.0;
      case 'VOLTAGE_REG_7812':
        return 12.0;
      case 'VOLTAGE_REG_LM317': {
        // Vout = Vref * (1 + R2/R1) where Vref = 1.25V
        return comp.calculatedVout ?? 5.0;
      }
      default:
        return comp.voltage ?? 0.0;
    }
  }

  // Stamp each component type into MNA system
  stampComponent(comp, A, b, V, dt) {
    const pins = comp.pins;
    const n = pins.map(p => this.nodeMap.get(p.netId) || 0);

    switch (comp.type) {
      case 'RESISTOR': {
        const r = Math.max(comp.resistance ?? 1000, 1e-4);
        this.stampConductance(A, n[0], n[1], 1 / r);
        break;
      }

      case 'POTENTIOMETER': {
        // 3 pins: 0=A, 1=Wiper, 2=B
        const rTotal = Math.max(comp.resistance ?? 10000, 1e-4);
        const pos = Math.min(Math.max(comp.sliderValue ?? 0.5, 0.001), 0.999);
        const r1 = rTotal * pos;
        const r2 = rTotal * (1 - pos);
        this.stampConductance(A, n[0], n[1], 1 / r1);
        this.stampConductance(A, n[1], n[2], 1 / r2);
        break;
      }

      case 'LDR': {
        // Light Dependent Resistor: Lux changes resistance
        // Dark: ~1M ohm, Bright: ~100 ohm
        const lux = comp.lux ?? 500; // 0 to 1000 lux
        const r = Math.max(100, 1000000 / (1 + lux * 0.1));
        comp.currentResistance = r;
        this.stampConductance(A, n[0], n[1], 1 / r);
        break;
      }

      case 'THERMISTOR_NTC': {
        // NTC: resistance decreases as temperature rises
        const temp = comp.temperature ?? 25; // °C
        const r0 = 10000;
        const beta = 3950;
        const tK = temp + 273.15;
        const t0K = 298.15;
        const r = r0 * Math.exp(beta * (1 / tK - 1 / t0K));
        comp.currentResistance = r;
        this.stampConductance(A, n[0], n[1], 1 / r);
        break;
      }

      case 'CAPACITOR':
      case 'CAPACITOR_ELECTROLYTIC': {
        // Companion model: G_eq = 2*C/dt (trapezoidal) or C/dt (Euler)
        const c = Math.max(comp.capacitance ?? 1e-6, 1e-15);
        const geq = (2 * c) / dt;
        comp.vPrev = comp.vPrev || 0;
        comp.iPrev = comp.iPrev || 0;
        const ieq = geq * comp.vPrev + comp.iPrev;

        this.stampConductance(A, n[0], n[1], geq);
        this.stampCurrentSource(b, n[0], n[1], ieq);
        break;
      }

      case 'INDUCTOR': {
        // Companion model: G_eq = dt / (2*L)
        const l = Math.max(comp.inductance ?? 1e-3, 1e-9);
        const geq = dt / (2 * l);
        comp.vPrev = comp.vPrev || 0;
        comp.iPrev = comp.iPrev || 0;
        const ieq = comp.iPrev + geq * comp.vPrev;

        this.stampConductance(A, n[0], n[1], geq);
        this.stampCurrentSource(b, n[0], n[1], -ieq);
        break;
      }

      case 'SWITCH_SPST':
      case 'PUSH_BUTTON_NO':
      case 'PUSH_BUTTON_NC': {
        const isOpen = comp.isOpen ?? (comp.type === 'PUSH_BUTTON_NO');
        const r = isOpen ? 1e8 : 0.01;
        this.stampConductance(A, n[0], n[1], 1 / r);
        break;
      }

      case 'SWITCH_SPDT': {
        // Common pin 0, pos A pin 1, pos B pin 2
        const isPosA = comp.isPosA ?? true;
        const rA = isPosA ? 0.01 : 1e8;
        const rB = isPosA ? 1e8 : 0.01;
        this.stampConductance(A, n[0], n[1], 1 / rA);
        this.stampConductance(A, n[0], n[2], 1 / rB);
        break;
      }

      case 'RELAY_SPDT': {
        // Coil pins 0,1; Common 2; NC 3; NO 4
        // Coil resistance ~100 ohm
        this.stampConductance(A, n[0], n[1], 1 / 100);
        const vCoil = Math.abs((V[n[0] - 1] || 0) - (V[n[1] - 1] || 0));
        const energized = vCoil >= (comp.pullInVoltage ?? 3.5);
        comp.energized = energized;
        const rNC = energized ? 1e8 : 0.05;
        const rNO = energized ? 0.05 : 1e8;
        this.stampConductance(A, n[2], n[3], 1 / rNC);
        this.stampConductance(A, n[2], n[4], 1 / rNO);
        break;
      }

      case 'FUSE': {
        if (comp.isBlown) {
          this.stampConductance(A, n[0], n[1], 1e-9); // open
        } else {
          this.stampConductance(A, n[0], n[1], 1 / 0.02); // 20 mOhm
        }
        break;
      }

      case 'FILAMENT_LAMP': {
        // Non-linear thermal resistance
        const r = Math.max(5, (comp.filamentTemp ?? 300) / 30);
        this.stampConductance(A, n[0], n[1], 1 / r);
        break;
      }

      case 'DC_MOTOR': {
        // Armature resistance Ra ~ 5 ohm, inductance La, back-EMF Eb = Ke * w
        this.stampConductance(A, n[0], n[1], 1 / 5);
        break;
      }

      case 'DIODE_1N4007':
      case 'DIODE_1N4148':
      case 'SCHOTTKY_1N5819':
      case 'LED_RED':
      case 'LED_GREEN':
      case 'LED_BLUE':
      case 'LED_YELLOW':
      case 'LED_RGB': {
        // Shockley diode linearized: Id = Is * (exp(Vd / (n*Vt)) - 1)
        const vAnode = n[0] > 0 ? (V[n[0] - 1] || 0) : 0;
        const vCathode = n[1] > 0 ? (V[n[1] - 1] || 0) : 0;
        const Vd = vAnode - vCathode;
        
        let Vf = 0.7;
        let Is = 1e-12;
        let nVt = 0.026 * 1.5;
        if (comp.type.startsWith('LED')) {
          Vf = comp.forwardVoltage ?? (comp.type === 'LED_RED' ? 1.8 : comp.type === 'LED_BLUE' ? 3.2 : 2.1);
          nVt = 0.026 * 2.0;
        } else if (comp.type === 'SCHOTTKY_1N5819') {
          Vf = 0.35;
        }

        // Linearized conductance and companion current
        let gd, ieq;
        if (Vd > Vf) {
          gd = 1.0 / 0.5; // low forward dynamic resistance ~ 0.5 ohm
          const Id = (Vd - Vf) * gd;
          ieq = Id - gd * Vd;
        } else if (Vd > 0) {
          // Exponential transition
          const expTerm = Math.exp(Math.min(Vd / nVt, 20));
          const Id = Is * (expTerm - 1);
          gd = Math.max((Is / nVt) * expTerm, 1e-9);
          ieq = Id - gd * Vd;
        } else {
          // Reverse bias
          gd = 1e-9;
          ieq = 0;
        }

        this.stampConductance(A, n[0], n[1], gd);
        this.stampCurrentSource(b, n[0], n[1], ieq);
        break;
      }

      case 'ZENER_1N4733A':
      case 'ZENER_1N4742A': {
        // Zener diode: forward like diode (0.7V), reverse breakdown at Vz
        const Vz = comp.zenerVoltage ?? (comp.type === 'ZENER_1N4733A' ? 5.1 : 12.0);
        const vAnode = n[0] > 0 ? (V[n[0] - 1] || 0) : 0;
        const vCathode = n[1] > 0 ? (V[n[1] - 1] || 0) : 0;
        const Vd = vAnode - vCathode;

        let gd = 1e-9;
        let ieq = 0;

        if (Vd > 0.7) {
          // Forward conduction
          gd = 1.0 / 0.5;
          const Id = (Vd - 0.7) * gd;
          ieq = Id - gd * Vd;
        } else if (Vd < -Vz) {
          // Zener breakdown reverse conduction
          gd = 1.0 / 1.0; // 1 ohm dynamic zener resistance
          const Iz = (-Vd - Vz) * gd; // current flows from cathode to anode
          ieq = -Iz - gd * Vd;
        }

        this.stampConductance(A, n[0], n[1], gd);
        this.stampCurrentSource(b, n[0], n[1], ieq);
        break;
      }

      case 'BRIDGE_RECTIFIER': {
        // 4 pins: 0=AC1, 1=AC2, 2=DC+, 3=DC-
        // D1: AC1 -> DC+; D2: AC2 -> DC+; D3: DC- -> AC1; D4: DC- -> AC2
        this.stampIdealDiode(A, b, V, n[0], n[2], 0.7);
        this.stampIdealDiode(A, b, V, n[1], n[2], 0.7);
        this.stampIdealDiode(A, b, V, n[3], n[0], 0.7);
        this.stampIdealDiode(A, b, V, n[3], n[1], 0.7);
        break;
      }

      case 'BJT_NPN_2N2222':
      case 'BJT_NPN_BC547': {
        // 3 pins: 0=Collector, 1=Base, 2=Emitter
        const vC = n[0] > 0 ? (V[n[0] - 1] || 0) : 0;
        const vB = n[1] > 0 ? (V[n[1] - 1] || 0) : 0;
        const vE = n[2] > 0 ? (V[n[2] - 1] || 0) : 0;
        const Vbe = vB - vE;
        const Vce = vC - vE;
        const beta = comp.beta ?? 150;

        // Base-Emitter diode
        let gbe = 1e-9;
        let ib = 0;
        if (Vbe > 0.65) {
          gbe = 1 / 20; // 20 ohm forward dynamic resistance
          ib = Math.max(0, (Vbe - 0.65) * gbe);
        }
        this.stampConductance(A, n[1], n[2], gbe);
        this.stampCurrentSource(b, n[1], n[2], ib - gbe * Vbe);

        // Collector current: Ic = beta * Ib (when Vce > 0.2V active region)
        if (ib > 0 && Vce > 0) {
          const satFactor = Math.min(1.0, Vce / 0.2);
          const ic = beta * ib * satFactor;
          // Current leaves collector, enters emitter
          this.stampCurrentSource(b, n[0], n[2], ic);
        }
        break;
      }

      case 'BJT_PNP_2N2907':
      case 'BJT_PNP_BC557': {
        // 3 pins: 0=Collector, 1=Base, 2=Emitter
        const vC = n[0] > 0 ? (V[n[0] - 1] || 0) : 0;
        const vB = n[1] > 0 ? (V[n[1] - 1] || 0) : 0;
        const vE = n[2] > 0 ? (V[n[2] - 1] || 0) : 0;
        const Veb = vE - vB;
        const Vec = vE - vC;
        const beta = comp.beta ?? 150;

        let geb = 1e-9;
        let ib = 0;
        if (Veb > 0.65) {
          geb = 1 / 20;
          ib = Math.max(0, (Veb - 0.65) * geb);
        }
        this.stampConductance(A, n[2], n[1], geb);
        this.stampCurrentSource(b, n[2], n[1], ib - geb * Veb);

        if (ib > 0 && Vec > 0) {
          const satFactor = Math.min(1.0, Vec / 0.2);
          const ic = beta * ib * satFactor;
          this.stampCurrentSource(b, n[2], n[0], ic);
        }
        break;
      }

      case 'MOSFET_N_IRF540':
      case 'MOSFET_2N7000': {
        // 3 pins: 0=Drain, 1=Gate, 2=Source
        const vD = n[0] > 0 ? (V[n[0] - 1] || 0) : 0;
        const vG = n[1] > 0 ? (V[n[1] - 1] || 0) : 0;
        const vS = n[2] > 0 ? (V[n[2] - 1] || 0) : 0;
        const Vgs = vG - vS;
        const Vds = vD - vS;
        const Vth = comp.vth ?? 3.0;
        const K = comp.k ?? 0.5; // transconductance parameter

        // Gate is isolated
        this.stampConductance(A, n[1], n[2], 1e-11);

        if (Vgs > Vth && Vds > 0) {
          const Vov = Vgs - Vth;
          let Id;
          if (Vds < Vov) {
            // Linear / Triode region: Id = K * (2*Vov*Vds - Vds^2)
            Id = K * (2 * Vov * Vds - Vds * Vds);
          } else {
            // Saturation region: Id = K * Vov^2
            Id = K * Vov * Vov;
          }
          const gd = Math.max(Id / Math.max(Vds, 0.1), 1e-6);
          this.stampConductance(A, n[0], n[2], gd);
          this.stampCurrentSource(b, n[0], n[2], Id - gd * Vds);
        } else {
          this.stampConductance(A, n[0], n[2], 1e-9);
        }
        break;
      }

      case 'OPAMP_741':
      case 'OPAMP_3T_VIRTUAL': {
        // Pins: 0=Non-Inverting (+), 1=Inverting (-), 2=Output, 3=V+, 4=V-
        const vInPlus = n[0] > 0 ? (V[n[0] - 1] || 0) : 0;
        const vInMinus = n[1] > 0 ? (V[n[1] - 1] || 0) : 0;
        const vPosSupply = (pins.length > 3 && n[3] > 0) ? (V[n[3] - 1] || 15) : 15;
        const vNegSupply = (pins.length > 4 && n[4] > 0) ? (V[n[4] - 1] || -15) : -15;

        // High input impedance
        this.stampConductance(A, n[0], 0, 1e-10);
        this.stampConductance(A, n[1], 0, 1e-10);

        // Linear high gain op-amp with saturation limits
        const Aol = 1e5;
        const vDiff = vInPlus - vInMinus;
        let vTarget = vDiff * Aol;
        const vMax = vPosSupply - 1.2;
        const vMin = vNegSupply + 1.2;
        vTarget = Math.max(vMin, Math.min(vMax, vTarget));

        // Output resistance ~25 ohm driving towards vTarget
        const Rout = 25;
        const gout = 1 / Rout;
        this.stampConductance(A, n[2], 0, gout);
        if (n[2] > 0) {
          b[n[2] - 1] += gout * vTarget;
        }
        break;
      }

      case 'COMPARATOR_LM393':
      case 'COMPARATOR_LM311': {
        // Pins: 0=+, 1=-, 2=Output (open collector)
        const vPlus = n[0] > 0 ? (V[n[0] - 1] || 0) : 0;
        const vMinus = n[1] > 0 ? (V[n[1] - 1] || 0) : 0;
        const isOpen = vPlus > vMinus;
        const rOut = isOpen ? 1e8 : 10; // Open-collector pulls to ground when low
        this.stampConductance(A, n[2], 0, 1 / rOut);
        break;
      }

      case 'TIMER_555': {
        // Standard 555 pins:
        // 0=GND, 1=TRIG, 2=OUT, 3=RESET, 4=CTRL, 5=THRES, 6=DISCH, 7=VCC
        const vGnd = n[0] > 0 ? (V[n[0] - 1] || 0) : 0;
        const vTrig = n[1] > 0 ? (V[n[1] - 1] || 0) : 0;
        const vReset = n[3] > 0 ? (V[n[3] - 1] || 5) : 5;
        const vThres = n[5] > 0 ? (V[n[5] - 1] || 0) : 0;
        const vVcc = n[7] > 0 ? (V[n[7] - 1] || 5) : 5;

        // Internal resistive divider (3x 5k)
        const vRefHigh = vVcc * (2 / 3);
        const vRefLow = vVcc * (1 / 3);

        // RS flip flop logic
        comp.state = comp.state ?? false; // true = OUT HIGH, DISCH OFF
        if (vReset < 0.7) {
          comp.state = false;
        } else if (vTrig < vRefLow) {
          comp.state = true;
        } else if (vThres > vRefHigh) {
          comp.state = false;
        }

        // Pin 2 OUT driver: 0.1V when LOW, VCC-1.4V when HIGH
        const vOutTarget = comp.state ? (vVcc - 1.4) : 0.1;
        this.stampConductance(A, n[2], 0, 1 / 15);
        if (n[2] > 0) b[n[2] - 1] += (1 / 15) * vOutTarget;

        // Pin 6 Discharge transistor: ON when state is FALSE (OUT is LOW)
        const rDisch = comp.state ? 1e8 : 5;
        this.stampConductance(A, n[6], n[0], 1 / rDisch);
        break;
      }

      case 'LOGIC_GATE':
      case 'TTL_7400':
      case 'TTL_7402':
      case 'TTL_7404':
      case 'TTL_7408':
      case 'TTL_7432':
      case 'TTL_7486':
      case 'CMOS_4001':
      case 'CMOS_4011':
      case 'CMOS_4069':
      case 'CMOS_4071':
      case 'CMOS_4081': {
        this.stampLogicGate(comp, A, b, V, n);
        break;
      }

      case 'TTL_7447': {
        // BCD to 7-segment active-low decoder
        // Inputs: A, B, C, D (pins 0..3)
        // Outputs: a, b, c, d, e, f, g (pins 4..10)
        const bcd = (this.readDigitalPin(V, n[0]) ? 1 : 0) |
                    ((this.readDigitalPin(V, n[1]) ? 1 : 0) << 1) |
                    ((this.readDigitalPin(V, n[2]) ? 1 : 0) << 2) |
                    ((this.readDigitalPin(V, n[3]) ? 1 : 0) << 3);
        
        // 7-segment font lookup for 0..9 (active-low open collector outputs)
        const segPatterns = [
          0b00111111, // 0
          0b00000110, // 1
          0b01011011, // 2
          0b01001111, // 3
          0b01100110, // 4
          0b01101101, // 5
          0b01111101, // 6
          0b00000111, // 7
          0b01111111, // 8
          0b01101111  // 9
        ];
        const pat = bcd <= 9 ? segPatterns[bcd] : 0;
        for (let s = 0; s < 7; s++) {
          const segOn = (pat >> s) & 1;
          const outPin = n[4 + s];
          // Active-low: turns ON by pulling low to ground
          const rOut = segOn ? 15 : 1e8;
          this.stampConductance(A, outPin, 0, 1 / rOut);
        }
        break;
      }

      case 'TTL_7490':
      case 'TTL_7493':
      case 'CMOS_4017': {
        this.stampCounter(comp, A, b, V, n);
        break;
      }

      case 'SEVEN_SEGMENT_CC':
      case 'SEVEN_SEGMENT_CA': {
        // Common Cathode (CC) or Common Anode (CA)
        // Pins: 0=Common, 1..7=Segments a..g, 8=dp
        const isCC = comp.type === 'SEVEN_SEGMENT_CC';
        const vCom = n[0] > 0 ? (V[n[0] - 1] || 0) : 0;
        comp.activeSegments = [];

        for (let s = 1; s <= 8 && s < pins.length; s++) {
          const segPin = n[s];
          const vSeg = segPin > 0 ? (V[segPin - 1] || 0) : 0;
          const vDiode = isCC ? (vSeg - vCom) : (vCom - vSeg);

          if (vDiode > 1.8) {
            comp.activeSegments.push(s - 1);
            if (isCC) {
              this.stampIdealDiode(A, b, V, segPin, n[0], 1.8);
            } else {
              this.stampIdealDiode(A, b, V, n[0], segPin, 1.8);
            }
          } else {
            this.stampConductance(A, segPin, n[0], 1e-8);
          }
        }
        break;
      }

      case 'DCD_HEX': {
        // Decoded Hex Display: 4 input pins (0..3)
        // High input impedance
        for (let i = 0; i < 4; i++) {
          this.stampConductance(A, n[i], 0, 1e-10);
        }
        const hexVal = (this.readDigitalPin(V, n[0]) ? 1 : 0) |
                       ((this.readDigitalPin(V, n[1]) ? 1 : 0) << 1) |
                       ((this.readDigitalPin(V, n[2]) ? 1 : 0) << 2) |
                       ((this.readDigitalPin(V, n[3]) ? 1 : 0) << 3);
        comp.displayedChar = hexVal.toString(16).toUpperCase();
        break;
      }

      case 'PIEZO_BUZZER': {
        // 2 pins, impedance ~100 ohm
        this.stampConductance(A, n[0], n[1], 1 / 120);
        break;
      }

      default:
        break;
    }
  }

  stampIdealDiode(A, b, V, nA, nC, Vf) {
    const vA = nA > 0 ? (V[nA - 1] || 0) : 0;
    const vC = nC > 0 ? (V[nC - 1] || 0) : 0;
    const Vd = vA - vC;
    if (Vd > Vf) {
      const gd = 1 / 0.5;
      const id = (Vd - Vf) * gd;
      this.stampConductance(A, nA, nC, gd);
      this.stampCurrentSource(b, nA, nC, id - gd * Vd);
    } else {
      this.stampConductance(A, nA, nC, 1e-9);
    }
  }

  readDigitalPin(V, nodeIdx) {
    if (nodeIdx <= 0) return false;
    const v = V[nodeIdx - 1] || 0;
    return v > 1.8; // Logic HIGH threshold
  }

  stampLogicGate(comp, A, b, V, n) {
    // Determine inputs and output pin
    // Last pin is Output, preceding are Inputs
    const numInputs = comp.pins.length - 1;
    const outNode = n[numInputs];
    const inputs = [];

    for (let i = 0; i < numInputs; i++) {
      this.stampConductance(A, n[i], 0, 1e-10); // high input Z
      inputs.push(this.readDigitalPin(V, n[i]));
    }

    let outVal = false;
    const gateType = comp.gateType || comp.type;

    if (gateType.includes('AND') && !gateType.includes('NAND')) {
      outVal = inputs.every(Boolean);
    } else if (gateType.includes('NAND')) {
      outVal = !inputs.every(Boolean);
    } else if (gateType.includes('NOR')) {
      outVal = !inputs.some(Boolean);
    } else if (gateType.includes('OR')) {
      outVal = inputs.some(Boolean);
    } else if (gateType.includes('NOT') || gateType.includes('4069') || gateType.includes('7404')) {
      outVal = !inputs[0];
    } else if (gateType.includes('XOR')) {
      outVal = (inputs[0] ? 1 : 0) ^ (inputs[1] ? 1 : 0);
    }

    comp.logicOutput = outVal;
    const vTarget = outVal ? 4.9 : 0.05;
    const rDrive = 30; // 30 ohm CMOS/TTL drive impedance
    this.stampConductance(A, outNode, 0, 1 / rDrive);
    if (outNode > 0) {
      b[outNode - 1] += (1 / rDrive) * vTarget;
    }
  }

  stampCounter(comp, A, b, V, n) {
    // 7490 / 4017 Decade Counter
    // Clock pin 0, Reset pin 1, Outputs...
    const clkNode = n[0];
    const clkVal = this.readDigitalPin(V, clkNode);
    comp.lastClk = comp.lastClk ?? false;
    comp.count = comp.count ?? 0;

    // Rising edge detection
    if (clkVal && !comp.lastClk) {
      comp.count = (comp.count + 1) % (comp.type === 'CMOS_4017' ? 10 : 16);
    }
    comp.lastClk = clkVal;

    // Reset check
    if (n.length > 1 && this.readDigitalPin(V, n[1])) {
      comp.count = 0;
    }

    if (comp.type === 'CMOS_4017') {
      // 10 outputs (pins 2..11)
      for (let i = 0; i < 10; i++) {
        const outPin = n[2 + i];
        if (outPin !== undefined) {
          const isHigh = comp.count === i;
          const vTarget = isHigh ? 5.0 : 0.0;
          this.stampConductance(A, outPin, 0, 1 / 30);
          if (outPin > 0) b[outPin - 1] += (1 / 30) * vTarget;
        }
      }
    } else {
      // 4-bit binary outputs QA, QB, QC, QD
      for (let bit = 0; bit < 4; bit++) {
        const outPin = n[2 + bit];
        if (outPin !== undefined) {
          const isHigh = ((comp.count >> bit) & 1) === 1;
          const vTarget = isHigh ? 4.8 : 0.1;
          this.stampConductance(A, outPin, 0, 1 / 30);
          if (outPin > 0) b[outPin - 1] += (1 / 30) * vTarget;
        }
      }
    }
  }

  // Update component physics, power, heat, motor speed, probe histories
  updateComponentState(comp, nodeVoltages, dt) {
    // Pin voltages
    for (const pin of comp.pins) {
      pin.voltage = pin.netId ? (nodeVoltages.get(pin.netId) ?? 0) : 0;
    }

    // Branch voltage
    const v0 = comp.pins[0]?.voltage ?? 0;
    const v1 = comp.pins[1]?.voltage ?? 0;
    const vDiff = v0 - v1;
    comp.voltageDiff = vDiff;

    // Branch current calculation & power dissipation
    switch (comp.type) {
      case 'RESISTOR': {
        const r = comp.resistance ?? 1000;
        comp.current = vDiff / r;
        comp.power = vDiff * comp.current;
        this.checkRatedVirtual(comp, Math.abs(comp.power), comp.maxPower ?? 0.25);
        break;
      }

      case 'CAPACITOR':
      case 'CAPACITOR_ELECTROLYTIC': {
        const c = comp.capacitance ?? 1e-6;
        comp.current = (c / dt) * (vDiff - (comp.vPrev || 0));
        comp.vPrev = vDiff;
        comp.iPrev = comp.current;
        this.checkRatedVirtual(comp, Math.abs(vDiff), comp.maxVoltage ?? 50);
        break;
      }

      case 'INDUCTOR': {
        const l = comp.inductance ?? 1e-3;
        comp.current = (comp.iPrev || 0) + (dt / l) * vDiff;
        comp.vPrev = vDiff;
        comp.iPrev = comp.current;
        break;
      }

      case 'LED_RED':
      case 'LED_GREEN':
      case 'LED_BLUE':
      case 'LED_YELLOW':
      case 'LED_RGB': {
        const vf = comp.forwardVoltage ?? 2.0;
        const iforward = vDiff > vf ? (vDiff - vf) / 10 : 0;
        comp.current = iforward;
        comp.brightness = Math.min(1.0, iforward / 0.02); // Full brightness at 20mA
        this.checkRatedVirtual(comp, iforward, comp.maxCurrent ?? 0.03);
        break;
      }

      case 'FILAMENT_LAMP': {
        const i = vDiff / Math.max(5, (comp.filamentTemp ?? 300) / 30);
        comp.current = i;
        const p = Math.abs(vDiff * i);
        // Thermal inertia
        comp.filamentTemp = (comp.filamentTemp ?? 300) + (p * 50 - ((comp.filamentTemp ?? 300) - 300) * 0.1) * dt;
        comp.brightness = Math.min(1.0, Math.max(0, (comp.filamentTemp - 500) / 1500));
        break;
      }

      case 'DC_MOTOR': {
        // Motor dynamic model
        const vArm = vDiff;
        comp.rpm = comp.rpm ?? 0;
        const targetRpm = (vArm / 12) * 3000; // 3000 RPM at 12V
        // Acceleration with inertia
        comp.rpm += (targetRpm - comp.rpm) * 5 * dt;
        comp.motorAngle = ((comp.motorAngle ?? 0) + (comp.rpm / 60) * 360 * dt) % 360;
        break;
      }

      case 'PIEZO_BUZZER': {
        comp.buzzerActive = Math.abs(vDiff) > 1.8;
        break;
      }

      case 'FUSE': {
        const i = vDiff / 0.02;
        comp.current = i;
        if (!comp.isBlown) {
          const iRated = comp.ratedCurrent ?? 1.0;
          if (Math.abs(i) > iRated) {
            comp.i2t = (comp.i2t ?? 0) + i * i * dt;
            if (comp.i2t > 0.05) {
              comp.isBlown = true;
              comp.smokeEffect = true;
            }
          }
        }
        break;
      }

      default:
        break;
    }

    // Record probe history for oscilloscope
    for (let p = 0; p < comp.pins.length; p++) {
      const key = `${comp.id}_p${p}`;
      let buf = this.probeHistories.get(key);
      if (!buf) {
        buf = [];
        this.probeHistories.set(key, buf);
      }
      buf.push({ t: this.time, v: comp.pins[p].voltage });
      if (buf.length > this.historyBufferLength) {
        buf.shift();
      }
    }
  }

  checkRatedVirtual(comp, actual, maxAllowed) {
    if (comp.isRatedVirtual) {
      if (actual > maxAllowed) {
        comp.isDamaged = true;
        comp.smokeEffect = true;
      }
    }
  }

  // Real-time audio feedback with Web Audio API
  updateAudioFeedback() {
    let anyBuzzerActive = false;
    for (const comp of this.components) {
      if (comp.type === 'PIEZO_BUZZER' && comp.buzzerActive) {
        anyBuzzerActive = true;
        break;
      }
    }

    if (anyBuzzerActive) {
      this.startBeepTone();
    } else {
      this.stopBeepTone();
    }
  }

  startBeepTone() {
    try {
      if (!this.audioCtx) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (AudioContext) this.audioCtx = new AudioContext();
      }
      if (this.audioCtx && this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }
      if (this.audioCtx && !this.activeOscillator) {
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(2400, this.audioCtx.currentTime); // 2.4kHz piezo frequency
        gain.gain.setValueAtTime(0.08, this.audioCtx.currentTime);
        osc.connect(gain);
        gain.connect(this.audioCtx.destination);
        osc.start();
        this.activeOscillator = osc;
        this.activeGain = gain;
      }
    } catch {
      // Audio autoplay policy
    }
  }

  stopBeepTone() {
    if (this.activeOscillator) {
      try {
        this.activeOscillator.stop();
        this.activeOscillator.disconnect();
      } catch {}
      this.activeOscillator = null;
      this.activeGain = null;
    }
  }
}
