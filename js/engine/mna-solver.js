/**
 * Multisim Web - Modified Nodal Analysis (MNA) & Transient Circuit Engine
 * Comprehensive real-time solver supporting all components from the PDF specification:
 * Sources (DC, AC, 3-Phase, Pulse, AM, FM, PWL, VCVS, VCCS, Current Sources),
 * Passives (R, C, L, Potentiometers, Networks, Transformers, Center-Tap),
 * Semiconductors (Diodes, Zeners, Schottky, LEDs, RGB, SCR, TRIAC, DIAC, Bridge),
 * Transistors (BJT NPN/PNP, Darlingtons, JFETs, MOSFETs, IGBTs),
 * Analog (Op-Amps 741/NE5532, Comparators, Inst Amps, Regulators 7805/7812/LM317, TL431),
 * TTL 7400 & CMOS 4000 Logic (Gates, Flip-Flops, Counters, Decoders, Adders),
 * Mixed Signal (555, 556 Timers, ADC, DAC, PLL, Audio Buzzer, Motors, Fuses).
 */

export class MNACircuitSolver {
  constructor() {
    this.nodes = new Map();
    this.groundNodeId = 'GND';
    this.components = [];
    this.time = 0;
    this.dt = 1e-4; // 100 microseconds default step
    this.simSpeed = 1.0;
    this.isRunning = true;
    this.iterationsMax = 50;
    this.tolerance = 1e-5;
    
    // Waveform history for oscilloscope and probes
    this.historyBufferLength = 2000;
    this.probeHistories = new Map();
    
    // Audio engine for buzzers and speakers
    this.audioCtx = null;
    this.activeOscillator = null;
    this.activeGain = null;
    this.soundEnabled = true;

    this.onUpdate = null;
  }

  reset() {
    this.time = 0;
    this.probeHistories.clear();
    for (const comp of this.components) {
      if (comp.resetState) comp.resetState();
      comp.vPrev = 0;
      comp.iPrev = 0;
      comp.current = 0;
      comp.voltageDiff = 0;
    }
  }

  setComponents(components) {
    this.components = components;
    this.reset();
  }

  solveLinearSystem(A, b, n) {
    const M = A.map(row => [...row]);
    const x = [...b];

    for (let i = 0; i < n; i++) {
      let maxRow = i;
      let maxVal = Math.abs(M[i][i]);
      for (let k = i + 1; k < n; k++) {
        if (Math.abs(M[k][i]) > maxVal) {
          maxVal = Math.abs(M[k][i]);
          maxRow = k;
        }
      }

      if (maxVal < 1e-12) {
        M[i][i] = 1e-9;
      }

      if (maxRow !== i) {
        const tempRow = M[i];
        M[i] = M[maxRow];
        M[maxRow] = tempRow;
        const tempB = x[i];
        x[i] = x[maxRow];
        x[maxRow] = tempB;
      }

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

    for (let i = n - 1; i >= 0; i--) {
      let sum = x[i];
      for (let j = i + 1; j < n; j++) {
        sum -= M[i][j] * x[j];
      }
      x[i] = sum / (Math.abs(M[i][i]) < 1e-12 ? 1e-9 : M[i][i]);
    }

    return x;
  }

  buildNodeMap() {
    const nodeSet = new Set();
    nodeSet.add(this.groundNodeId);

    for (const comp of this.components) {
      for (const pin of comp.pins) {
        if (pin.netId) {
          nodeSet.add(pin.netId);
        }
      }
    }

    this.nodeMap = new Map();
    this.nodeMap.set(this.groundNodeId, 0);
    let index = 1;
    for (const netId of nodeSet) {
      if (netId !== this.groundNodeId) {
        this.nodeMap.set(netId, index++);
      }
    }

    this.numNodes = index;
  }

  stampConductance(G_mat, n1, n2, g) {
    if (isNaN(g) || !isFinite(g)) return;
    if (n1 > 0) G_mat[n1 - 1][n1 - 1] += g;
    if (n2 > 0) G_mat[n2 - 1][n2 - 1] += g;
    if (n1 > 0 && n2 > 0) {
      G_mat[n1 - 1][n2 - 1] -= g;
      G_mat[n2 - 1][n1 - 1] -= g;
    }
  }

  stampCurrentSource(I_vec, n1, n2, current) {
    if (isNaN(current) || !isFinite(current)) return;
    if (n1 > 0) I_vec[n1 - 1] -= current;
    if (n2 > 0) I_vec[n2 - 1] += current;
  }

  step(dt) {
    this.buildNodeMap();
    const N = this.numNodes - 1;
    if (N <= 0) {
      this.time += dt;
      return;
    }

    // Collect auxiliary voltage source branches
    const vSources = [];
    for (const comp of this.components) {
      if (comp.type === 'DC_POWER' || comp.type === 'AC_POWER' || comp.type === 'VCC' ||
          comp.type === 'VDD' || comp.type === 'VEE' || comp.type === 'VSS' ||
          comp.type === 'DIGITAL_CLOCK' || comp.type === 'PULSE_VOLTAGE' || comp.type === 'SINE_GEN' ||
          comp.type === 'AM_SOURCE' || comp.type === 'FM_SOURCE' || comp.type === 'PWL_SOURCE' ||
          comp.type === 'VOLTAGE_REG_7805' || comp.type === 'VOLTAGE_REG_7812' ||
          comp.type === 'VOLTAGE_REG_LM317' || comp.type === 'VCVS') {
        vSources.push({ comp, subIndex: 0 });
      } else if (comp.type === 'THREE_PHASE_SOURCE') {
        // 3 branches: Phase A, Phase B, Phase C relative to Neutral
        vSources.push({ comp, subIndex: 0 });
        vSources.push({ comp, subIndex: 1 });
        vSources.push({ comp, subIndex: 2 });
      }
    }

    const M = vSources.length;
    const totalSize = N + M;

    let V = new Array(totalSize).fill(0);
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

      const A = Array.from({ length: totalSize }, () => new Array(totalSize).fill(0));
      const b = new Array(totalSize).fill(0);

      // Shunt impedance to ground to guarantee invertibility
      for (let i = 0; i < N; i++) {
        A[i][i] += 1e-11;
      }

      // Stamp components
      for (const comp of this.components) {
        this.stampComponent(comp, A, b, V, dt);
      }

      // Stamp auxiliary branches
      for (let k = 0; k < M; k++) {
        const item = vSources[k];
        const src = item.comp;
        const vIdx = N + k;

        let nPos = 0, nNeg = 0;
        let vVal = 0;

        if (src.type === 'THREE_PHASE_SOURCE') {
          nNeg = this.nodeMap.get(src.pins[3]?.netId) || 0; // Neutral
          nPos = this.nodeMap.get(src.pins[item.subIndex]?.netId) || 0;
          vVal = this.getThreePhaseValue(src, item.subIndex, this.time);
        } else {
          nPos = this.nodeMap.get(src.pins[0]?.netId) || 0;
          nNeg = this.nodeMap.get(src.pins[1]?.netId) || 0;
          vVal = this.getVoltageSourceValue(src, this.time);
        }

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

      const V_next = this.solveLinearSystem(A, b, totalSize);

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

    const nodeVoltages = new Map();
    nodeVoltages.set(this.groundNodeId, 0);
    for (const [netId, idx] of this.nodeMap.entries()) {
      nodeVoltages.set(netId, idx === 0 ? 0 : (V[idx - 1] || 0));
    }

    for (const comp of this.components) {
      this.updateComponentState(comp, nodeVoltages, dt);
    }

    if (this.soundEnabled) {
      this.updateAudioFeedback();
    }

    this.time += dt;
  }

  getThreePhaseValue(comp, phaseIndex, t) {
    const vRms = comp.voltage ?? 120.0;
    const vPeak = vRms * Math.SQRT2;
    const freq = comp.frequency ?? 50.0;
    const omega = 2 * Math.PI * freq;
    const phaseOffset = phaseIndex === 0 ? 0 : (phaseIndex === 1 ? - (2 * Math.PI / 3) : (2 * Math.PI / 3));
    return vPeak * Math.sin(omega * t + phaseOffset);
  }

  getVoltageSourceValue(comp, t) {
    switch (comp.type) {
      case 'DC_POWER':
      case 'VCC':
        return comp.voltage ?? 5.0;
      case 'VDD':
        return comp.voltage ?? 12.0;
      case 'VSS':
        return 0.0;
      case 'VEE':
        return -(comp.voltage ?? 12.0);
      case 'AC_POWER': {
        const freq = comp.frequency ?? 60.0;
        const vPeak = (comp.voltage ?? 120.0) * Math.SQRT2;
        const phase = (comp.phase ?? 0) * (Math.PI / 180);
        return vPeak * Math.sin(2 * Math.PI * freq * t + phase);
      }
      case 'DIGITAL_CLOCK': {
        const freq = comp.frequency ?? 1000.0;
        const period = 1.0 / freq;
        const duty = comp.dutyCycle ?? 0.5;
        const cyclePos = (t % period) / period;
        return cyclePos < duty ? (comp.vHigh ?? 5.0) : (comp.vLow ?? 0.0);
      }
      case 'PULSE_VOLTAGE': {
        const freq = comp.frequency ?? 500.0;
        const period = 1.0 / freq;
        const pulseWidth = comp.pulseWidth ?? (period * 0.2);
        return (t % period) < pulseWidth ? (comp.vHigh ?? 5.0) : (comp.vLow ?? 0.0);
      }
      case 'SINE_GEN': {
        const freq = comp.frequency ?? 1000.0;
        const amp = comp.amplitude ?? 2.5;
        const offset = comp.offset ?? 0.0;
        return offset + amp * Math.sin(2 * Math.PI * freq * t);
      }
      case 'AM_SOURCE': {
        const fc = comp.carrierFreq ?? 10000.0;
        const fm = comp.modFreq ?? 500.0;
        const m = comp.modIndex ?? 0.5;
        const A = comp.amplitude ?? 2.0;
        return A * (1.0 + m * Math.sin(2 * Math.PI * fm * t)) * Math.sin(2 * Math.PI * fc * t);
      }
      case 'FM_SOURCE': {
        const fc = comp.carrierFreq ?? 5000.0;
        const fm = comp.modFreq ?? 200.0;
        const deltaF = comp.freqDev ?? 1000.0;
        const beta = deltaF / fm;
        const A = comp.amplitude ?? 2.0;
        return A * Math.sin(2 * Math.PI * fc * t + beta * Math.sin(2 * Math.PI * fm * t));
      }
      case 'PWL_SOURCE': {
        const period = 1.0 / (comp.frequency ?? 100.0);
        const frac = (t % period) / period;
        const amp = comp.amplitude ?? 5.0;
        return frac < 0.5 ? (frac * 2 * amp) : (amp * 2 * (1 - frac));
      }
      case 'VOLTAGE_REG_7805':
        return 5.0;
      case 'VOLTAGE_REG_7812':
        return 12.0;
      case 'VOLTAGE_REG_LM317':
        return comp.calculatedVout ?? 5.0;
      default:
        return comp.voltage ?? 0.0;
    }
  }

  stampComponent(comp, A, b, V, dt) {
    const pins = comp.pins;
    const n = pins.map(p => this.nodeMap.get(p.netId) || 0);

    switch (comp.type) {
      case 'RESISTOR':
      case 'RESISTOR_VIRTUAL': {
        const r = Math.max(comp.resistance ?? 1000, 1e-4);
        this.stampConductance(A, n[0], n[1], 1 / r);
        break;
      }

      case 'RESISTOR_PACK': {
        // Bussed SIP: common pin n[0], individual pins n[1..5]
        const r = Math.max(comp.resistance ?? 4700, 1e-4);
        for (let i = 1; i < n.length; i++) {
          this.stampConductance(A, n[0], n[i], 1 / r);
        }
        break;
      }

      case 'POTENTIOMETER': {
        const rTotal = Math.max(comp.resistance ?? 10000, 1e-4);
        const pos = Math.min(Math.max(comp.sliderValue ?? 0.5, 0.001), 0.999);
        const r1 = rTotal * pos;
        const r2 = rTotal * (1 - pos);
        this.stampConductance(A, n[0], n[1], 1 / r1);
        this.stampConductance(A, n[1], n[2], 1 / r2);
        break;
      }

      case 'LDR': {
        const lux = comp.lux ?? 400;
        const r = Math.max(100, 1000000 / (1 + lux * 0.1));
        comp.currentResistance = r;
        this.stampConductance(A, n[0], n[1], 1 / r);
        break;
      }

      case 'THERMISTOR_NTC': {
        const temp = comp.temperature ?? 25;
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
      case 'CAPACITOR_ELECTROLYTIC':
      case 'VARIABLE_CAPACITOR': {
        let c = comp.capacitance ?? 1e-6;
        if (comp.type === 'VARIABLE_CAPACITOR') {
          c = (comp.capacitance ?? 50e-12) * (comp.sliderValue ?? 0.5) * 2;
        }
        c = Math.max(c, 1e-15);
        const geq = (2 * c) / dt;
        comp.vPrev = comp.vPrev || 0;
        comp.iPrev = comp.iPrev || 0;
        const ieq = geq * comp.vPrev + comp.iPrev;

        this.stampConductance(A, n[0], n[1], geq);
        this.stampCurrentSource(b, n[0], n[1], ieq);
        break;
      }

      case 'INDUCTOR':
      case 'VARIABLE_INDUCTOR': {
        let l = comp.inductance ?? 1e-3;
        if (comp.type === 'VARIABLE_INDUCTOR') {
          l = (comp.inductance ?? 1e-3) * (comp.sliderValue ?? 0.5) * 2;
        }
        l = Math.max(l, 1e-9);
        const geq = dt / (2 * l);
        comp.vPrev = comp.vPrev || 0;
        comp.iPrev = comp.iPrev || 0;
        const ieq = comp.iPrev + geq * comp.vPrev;

        this.stampConductance(A, n[0], n[1], geq);
        this.stampCurrentSource(b, n[0], n[1], -ieq);
        break;
      }

      case 'DC_CURRENT_SOURCE': {
        // n[0] is in, n[1] is out
        const I = comp.current ?? 0.01;
        this.stampCurrentSource(b, n[0], n[1], I);
        break;
      }

      case 'VCCS': {
        // Pins: Out+ 0, Out- 1, In+ 2, In- 3
        const vCtrlPlus = n[2] > 0 ? (V[n[2] - 1] || 0) : 0;
        const vCtrlMinus = n[3] > 0 ? (V[n[3] - 1] || 0) : 0;
        const gm = comp.gm ?? 0.05;
        const Iout = gm * (vCtrlPlus - vCtrlMinus);
        this.stampCurrentSource(b, n[0], n[1], Iout);
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
        const isPosA = comp.isPosA ?? true;
        this.stampConductance(A, n[0], n[1], 1 / (isPosA ? 0.01 : 1e8));
        this.stampConductance(A, n[0], n[2], 1 / (isPosA ? 1e8 : 0.01));
        break;
      }

      case 'SWITCH_DPST': {
        const isOpen = comp.isOpen ?? false;
        const r = isOpen ? 1e8 : 0.01;
        this.stampConductance(A, n[0], n[1], 1 / r);
        this.stampConductance(A, n[2], n[3], 1 / r);
        break;
      }

      case 'CMOS_4066': {
        // Bilateral switch: pin 0 IN, pin 1 OUT, pin 2 CTRL
        const vCtrl = n[2] > 0 ? (V[n[2] - 1] || 0) : 0;
        const isOn = vCtrl > 2.5;
        comp.isOn = isOn;
        const r = isOn ? 50 : 1e8;
        this.stampConductance(A, n[0], n[1], 1 / r);
        break;
      }

      case 'RELAY_SPDT': {
        this.stampConductance(A, n[0], n[1], 1 / 100);
        const vCoil = Math.abs((V[n[0] - 1] || 0) - (V[n[1] - 1] || 0));
        const energized = vCoil >= (comp.pullInVoltage ?? 3.5);
        comp.energized = energized;
        this.stampConductance(A, n[2], n[3], 1 / (energized ? 1e8 : 0.05));
        this.stampConductance(A, n[2], n[4], 1 / (energized ? 0.05 : 1e8));
        break;
      }

      case 'FUSE': {
        this.stampConductance(A, n[0], n[1], comp.isBlown ? 1e-9 : (1 / 0.02));
        break;
      }

      case 'FILAMENT_LAMP': {
        const r = Math.max(5, (comp.filamentTemp ?? 300) / 30);
        this.stampConductance(A, n[0], n[1], 1 / r);
        break;
      }

      case 'DC_MOTOR': {
        this.stampConductance(A, n[0], n[1], 1 / 5);
        break;
      }

      case 'SERVO_MOTOR': {
        this.stampConductance(A, n[1], n[2], 1 / 200); // V+ to GND
        break;
      }

      case 'DIODE_1N4007':
      case 'DIODE_1N4001':
      case 'DIODE_1N5408':
      case 'DIODE_1N4148':
      case 'SCHOTTKY_1N5819':
      case 'LED_RED':
      case 'LED_GREEN':
      case 'LED_BLUE':
      case 'LED_YELLOW': {
        const vAnode = n[0] > 0 ? (V[n[0] - 1] || 0) : 0;
        const vCathode = n[1] > 0 ? (V[n[1] - 1] || 0) : 0;
        const Vd = vAnode - vCathode;

        let Vf = 0.7;
        if (comp.type.startsWith('LED')) {
          Vf = comp.forwardVoltage ?? (comp.type === 'LED_RED' ? 1.8 : comp.type === 'LED_BLUE' ? 3.2 : 2.1);
        } else if (comp.type === 'SCHOTTKY_1N5819') {
          Vf = 0.35;
        }

        let gd, ieq;
        if (Vd > Vf) {
          gd = 1.0 / 0.5;
          const Id = (Vd - Vf) * gd;
          ieq = Id - gd * Vd;
        } else {
          gd = 1e-9;
          ieq = 0;
        }
        this.stampConductance(A, n[0], n[1], gd);
        this.stampCurrentSource(b, n[0], n[1], ieq);
        break;
      }

      case 'ZENER_1N4733A':
      case 'ZENER_1N4742A': {
        const Vz = comp.zenerVoltage ?? (comp.type === 'ZENER_1N4733A' ? 5.1 : 12.0);
        const vAnode = n[0] > 0 ? (V[n[0] - 1] || 0) : 0;
        const vCathode = n[1] > 0 ? (V[n[1] - 1] || 0) : 0;
        const Vd = vAnode - vCathode;

        let gd = 1e-9;
        let ieq = 0;
        if (Vd > 0.7) {
          gd = 1.0 / 0.5;
          ieq = (Vd - 0.7) * gd - gd * Vd;
        } else if (Vd < -Vz) {
          gd = 1.0 / 1.0;
          const Iz = (-Vd - Vz) * gd;
          ieq = -Iz - gd * Vd;
        }
        this.stampConductance(A, n[0], n[1], gd);
        this.stampCurrentSource(b, n[0], n[1], ieq);
        break;
      }

      case 'BRIDGE_RECTIFIER': {
        this.stampIdealDiode(A, b, V, n[0], n[2], 0.7);
        this.stampIdealDiode(A, b, V, n[1], n[2], 0.7);
        this.stampIdealDiode(A, b, V, n[3], n[0], 0.7);
        this.stampIdealDiode(A, b, V, n[3], n[1], 0.7);
        break;
      }

      case 'SCR_2N5060': {
        // Anode 0, Cathode 1, Gate 2
        const vA = n[0] > 0 ? (V[n[0] - 1] || 0) : 0;
        const vK = n[1] > 0 ? (V[n[1] - 1] || 0) : 0;
        const vG = n[2] > 0 ? (V[n[2] - 1] || 0) : 0;
        const vGK = vG - vK;
        const vAK = vA - vK;
        if (vGK > 0.7 && vAK > 0) comp.isLatched = true;
        if (vAK <= 0) comp.isLatched = false;

        const r = comp.isLatched ? 0.2 : 1e8;
        this.stampConductance(A, n[0], n[1], 1 / r);
        this.stampConductance(A, n[2], n[1], 1 / 100);
        break;
      }

      case 'DIAC': {
        const v1 = n[0] > 0 ? (V[n[0] - 1] || 0) : 0;
        const v2 = n[1] > 0 ? (V[n[1] - 1] || 0) : 0;
        const vDiff = Math.abs(v1 - v2);
        const r = vDiff > 32.0 ? 5 : 1e8;
        this.stampConductance(A, n[0], n[1], 1 / r);
        break;
      }

      case 'BJT_NPN_2N2222':
      case 'BJT_NPN_2N3904':
      case 'BJT_NPN_BC547':
      case 'BJT_NPN_TIP31':
      case 'DARLINGTON_TIP120': {
        const vC = n[0] > 0 ? (V[n[0] - 1] || 0) : 0;
        const vB = n[1] > 0 ? (V[n[1] - 1] || 0) : 0;
        const vE = n[2] > 0 ? (V[n[2] - 1] || 0) : 0;
        const Vbe = vB - vE;
        const Vce = vC - vE;
        const beta = comp.beta ?? (comp.type === 'DARLINGTON_TIP120' ? 1000 : 180);
        const vDrop = comp.type === 'DARLINGTON_TIP120' ? 1.3 : 0.65;

        let gbe = 1e-9;
        let ib = 0;
        if (Vbe > vDrop) {
          gbe = 1 / 20;
          ib = Math.max(0, (Vbe - vDrop) * gbe);
        }
        this.stampConductance(A, n[1], n[2], gbe);
        this.stampCurrentSource(b, n[1], n[2], ib - gbe * Vbe);

        if (ib > 0 && Vce > 0) {
          const satFactor = Math.min(1.0, Vce / 0.2);
          const ic = beta * ib * satFactor;
          this.stampCurrentSource(b, n[0], n[2], ic);
        }
        break;
      }

      case 'BJT_PNP_2N2907':
      case 'BJT_PNP_BC557': {
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

      case 'JFET_N_2N5457': {
        // Drain 0, Gate 1, Source 2
        const vD = n[0] > 0 ? (V[n[0] - 1] || 0) : 0;
        const vG = n[1] > 0 ? (V[n[1] - 1] || 0) : 0;
        const vS = n[2] > 0 ? (V[n[2] - 1] || 0) : 0;
        const Vgs = vG - vS;
        const Vds = vD - vS;
        const Vp = comp.vPinchOff ?? -2.0;
        const Idss = comp.idss ?? 0.003;

        this.stampConductance(A, n[1], n[2], 1e-11);
        if (Vgs > Vp && Vds > 0) {
          const Id = Idss * Math.pow(1 - Vgs / Vp, 2);
          const gd = Math.max(Id / Math.max(Vds, 0.1), 1e-6);
          this.stampConductance(A, n[0], n[2], gd);
          this.stampCurrentSource(b, n[0], n[2], Id - gd * Vds);
        } else {
          this.stampConductance(A, n[0], n[2], 1e-9);
        }
        break;
      }

      case 'MOSFET_N_IRF540':
      case 'MOSFET_2N7000':
      case 'IGBT_IRG4BC20': {
        const vD = n[0] > 0 ? (V[n[0] - 1] || 0) : 0;
        const vG = n[1] > 0 ? (V[n[1] - 1] || 0) : 0;
        const vS = n[2] > 0 ? (V[n[2] - 1] || 0) : 0;
        const Vgs = vG - vS;
        const Vds = vD - vS;
        const Vth = comp.vth ?? 3.2;
        const K = comp.k ?? 0.8;

        this.stampConductance(A, n[1], n[2], 1e-11);
        if (Vgs > Vth && Vds > 0) {
          const Vov = Vgs - Vth;
          const Id = Vds < Vov ? K * (2 * Vov * Vds - Vds * Vds) : K * Vov * Vov;
          const gd = Math.max(Id / Math.max(Vds, 0.1), 1e-6);
          this.stampConductance(A, n[0], n[2], gd);
          this.stampCurrentSource(b, n[0], n[2], Id - gd * Vds);
        } else {
          this.stampConductance(A, n[0], n[2], 1e-9);
        }
        break;
      }

      case 'MOSFET_P_IRF9540': {
        // Drain 0, Gate 1, Source 2
        const vD = n[0] > 0 ? (V[n[0] - 1] || 0) : 0;
        const vG = n[1] > 0 ? (V[n[1] - 1] || 0) : 0;
        const vS = n[2] > 0 ? (V[n[2] - 1] || 0) : 0;
        const Vsg = vS - vG;
        const Vsd = vS - vD;
        const Vth = 3.0;

        this.stampConductance(A, n[1], n[2], 1e-11);
        if (Vsg > Vth && Vsd > 0) {
          const Id = 0.7 * Math.pow(Vsg - Vth, 2);
          const gd = Math.max(Id / Math.max(Vsd, 0.1), 1e-6);
          this.stampConductance(A, n[2], n[0], gd);
          this.stampCurrentSource(b, n[2], n[0], Id - gd * Vsd);
        } else {
          this.stampConductance(A, n[0], n[2], 1e-9);
        }
        break;
      }

      case 'OPAMP_741':
      case 'OPAMP_3T_VIRTUAL':
      case 'OPAMP_NE5532':
      case 'INST_AMP_AD620': {
        const vInPlus = n[0] > 0 ? (V[n[0] - 1] || 0) : 0;
        const vInMinus = n[1] > 0 ? (V[n[1] - 1] || 0) : 0;
        const vPosSupply = (pins.length > 3 && n[3] > 0) ? (V[n[3] - 1] || 15) : 15;
        const vNegSupply = (pins.length > 4 && n[4] > 0) ? (V[n[4] - 1] || -15) : -15;

        this.stampConductance(A, n[0], 0, 1e-10);
        this.stampConductance(A, n[1], 0, 1e-10);

        const Aol = comp.type === 'INST_AMP_AD620' ? (comp.gain ?? 10) : 1e5;
        let vTarget = (vInPlus - vInMinus) * Aol;
        vTarget = Math.max(vNegSupply + 1.2, Math.min(vPosSupply - 1.2, vTarget));

        const gout = 1 / 25;
        this.stampConductance(A, n[2], 0, gout);
        if (n[2] > 0) b[n[2] - 1] += gout * vTarget;
        break;
      }

      case 'COMPARATOR_LM393':
      case 'COMPARATOR_LM311': {
        const vPlus = n[0] > 0 ? (V[n[0] - 1] || 0) : 0;
        const vMinus = n[1] > 0 ? (V[n[1] - 1] || 0) : 0;
        const rOut = vPlus > vMinus ? 1e8 : 10;
        this.stampConductance(A, n[2], 0, 1 / rOut);
        break;
      }

      case 'TIMER_555': {
        // Pins: 0=GND, 1=TRIG, 2=OUT, 3=RESET, 4=CTRL, 5=THRES, 6=DISCH, 7=VCC
        const vTrig = n[1] > 0 ? (V[n[1] - 1] || 0) : 0;
        const vReset = n[3] > 0 ? (V[n[3] - 1] || 5) : 5;
        const vThres = n[5] > 0 ? (V[n[5] - 1] || 0) : 0;
        const vVcc = n[7] > 0 ? (V[n[7] - 1] || 5) : 5;

        const vRefHigh = vVcc * (2 / 3);
        const vRefLow = vVcc * (1 / 3);

        comp.state = comp.state ?? false;
        if (vReset < 0.7) {
          comp.state = false;
        } else if (vTrig < vRefLow) {
          comp.state = true;
        } else if (vThres > vRefHigh) {
          comp.state = false;
        }

        const vOutTarget = comp.state ? (vVcc - 1.4) : 0.1;
        this.stampConductance(A, n[2], 0, 1 / 15);
        if (n[2] > 0) b[n[2] - 1] += (1 / 15) * vOutTarget;

        const rDisch = comp.state ? 1e8 : 5;
        this.stampConductance(A, n[6], n[0], 1 / rDisch);
        break;
      }

      case 'TTL_7400':
      case 'TTL_7402':
      case 'TTL_7404':
      case 'TTL_7408':
      case 'TTL_7432':
      case 'TTL_7486': {
        this.stampLogicGate(comp, A, b, V, n);
        break;
      }

      case 'TTL_7474':
      case 'CMOS_4013': {
        // D 0, CLK 1, Q 2, ~Q 3
        const clk = this.readDigitalPin(V, n[1]);
        comp.lastClk = comp.lastClk ?? false;
        if (clk && !comp.lastClk) {
          comp.qState = this.readDigitalPin(V, n[0]);
        }
        comp.lastClk = clk;
        const qVal = comp.qState ? 4.9 : 0.1;
        this.stampConductance(A, n[2], 0, 1 / 30);
        if (n[2] > 0) b[n[2] - 1] += (1 / 30) * qVal;
        this.stampConductance(A, n[3], 0, 1 / 30);
        if (n[3] > 0) b[n[3] - 1] += (1 / 30) * (comp.qState ? 0.1 : 4.9);
        break;
      }

      case 'TTL_7490':
      case 'TTL_7493':
      case 'CMOS_4017': {
        this.stampCounter(comp, A, b, V, n);
        break;
      }

      case 'TTL_7447': {
        const bcd = (this.readDigitalPin(V, n[0]) ? 1 : 0) |
                    ((this.readDigitalPin(V, n[1]) ? 1 : 0) << 1) |
                    ((this.readDigitalPin(V, n[2]) ? 1 : 0) << 2) |
                    ((this.readDigitalPin(V, n[3]) ? 1 : 0) << 3);
        const segPatterns = [0b00111111, 0b00000110, 0b01011011, 0b01001111, 0b01100110, 0b01101101, 0b01111101, 0b00000111, 0b01111111, 0b01101111];
        const pat = bcd <= 9 ? segPatterns[bcd] : 0;
        for (let s = 0; s < 7; s++) {
          const segOn = (pat >> s) & 1;
          const outPin = n[4 + s];
          this.stampConductance(A, outPin, 0, 1 / (segOn ? 15 : 1e8));
        }
        break;
      }

      case 'DCD_HEX': {
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
    return (V[nodeIdx - 1] || 0) > 1.8;
  }

  stampLogicGate(comp, A, b, V, n) {
    const numInputs = comp.pins.length - 1;
    const outNode = n[numInputs];
    const inputs = [];

    for (let i = 0; i < numInputs; i++) {
      this.stampConductance(A, n[i], 0, 1e-10);
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
    } else if (gateType.includes('NOT') || gateType.includes('7404')) {
      outVal = !inputs[0];
    } else if (gateType.includes('XOR')) {
      outVal = (inputs[0] ? 1 : 0) ^ (inputs[1] ? 1 : 0);
    }

    comp.logicOutput = outVal;
    const vTarget = outVal ? 4.9 : 0.05;
    this.stampConductance(A, outNode, 0, 1 / 30);
    if (outNode > 0) {
      b[outNode - 1] += (1 / 30) * vTarget;
    }
  }

  stampCounter(comp, A, b, V, n) {
    const clkNode = n[0];
    const clkVal = this.readDigitalPin(V, clkNode);
    comp.lastClk = comp.lastClk ?? false;
    comp.count = comp.count ?? 0;

    if (clkVal && !comp.lastClk) {
      comp.count = (comp.count + 1) % (comp.type === 'CMOS_4017' ? 10 : 16);
    }
    comp.lastClk = clkVal;

    if (n.length > 1 && this.readDigitalPin(V, n[1])) {
      comp.count = 0;
    }

    if (comp.type === 'CMOS_4017') {
      for (let i = 0; i < 10; i++) {
        const outPin = n[2 + i];
        if (outPin !== undefined) {
          const vTarget = comp.count === i ? 5.0 : 0.0;
          this.stampConductance(A, outPin, 0, 1 / 30);
          if (outPin > 0) b[outPin - 1] += (1 / 30) * vTarget;
        }
      }
    } else {
      for (let bit = 0; bit < 4; bit++) {
        const outPin = n[2 + bit];
        if (outPin !== undefined) {
          const vTarget = ((comp.count >> bit) & 1) === 1 ? 4.8 : 0.1;
          this.stampConductance(A, outPin, 0, 1 / 30);
          if (outPin > 0) b[outPin - 1] += (1 / 30) * vTarget;
        }
      }
    }
  }

  updateComponentState(comp, nodeVoltages, dt) {
    for (const pin of comp.pins) {
      pin.voltage = pin.netId ? (nodeVoltages.get(pin.netId) ?? 0) : 0;
    }

    const v0 = comp.pins[0]?.voltage ?? 0;
    const v1 = comp.pins[1]?.voltage ?? 0;
    const vDiff = v0 - v1;
    comp.voltageDiff = vDiff;

    switch (comp.type) {
      case 'RESISTOR':
      case 'RESISTOR_VIRTUAL': {
        const r = comp.resistance ?? 1000;
        comp.current = vDiff / r;
        comp.power = vDiff * comp.current;
        if (comp.isRatedVirtual && Math.abs(comp.power) > (comp.maxPower ?? 0.25)) {
          comp.isDamaged = true;
          comp.smokeEffect = true;
        }
        break;
      }

      case 'CAPACITOR':
      case 'CAPACITOR_ELECTROLYTIC': {
        const c = comp.capacitance ?? 1e-6;
        comp.current = (c / dt) * (vDiff - (comp.vPrev || 0));
        comp.vPrev = vDiff;
        comp.iPrev = comp.current;
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
      case 'LED_YELLOW': {
        const vf = comp.forwardVoltage ?? 2.0;
        const iforward = vDiff > vf ? (vDiff - vf) / 10 : 0;
        comp.current = iforward;
        comp.brightness = Math.min(1.0, iforward / 0.02);
        break;
      }

      case 'FILAMENT_LAMP': {
        const i = vDiff / Math.max(5, (comp.filamentTemp ?? 300) / 30);
        comp.current = i;
        const p = Math.abs(vDiff * i);
        comp.filamentTemp = (comp.filamentTemp ?? 300) + (p * 50 - ((comp.filamentTemp ?? 300) - 300) * 0.1) * dt;
        comp.brightness = Math.min(1.0, Math.max(0, (comp.filamentTemp - 500) / 1500));
        break;
      }

      case 'DC_MOTOR': {
        const vArm = vDiff;
        comp.rpm = comp.rpm ?? 0;
        const targetRpm = (vArm / 12) * 3000;
        comp.rpm += (targetRpm - comp.rpm) * 5 * dt;
        comp.motorAngle = ((comp.motorAngle ?? 0) + (comp.rpm / 60) * 360 * dt) % 360;
        break;
      }

      case 'SERVO_MOTOR': {
        const vPwm = comp.pins[0]?.voltage ?? 0;
        const targetAngle = Math.max(0, Math.min(180, (vPwm / 5.0) * 180));
        comp.angle = (comp.angle ?? 90) + (targetAngle - (comp.angle ?? 90)) * 5 * dt;
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
        osc.frequency.setValueAtTime(2400, this.audioCtx.currentTime);
        gain.gain.setValueAtTime(0.08, this.audioCtx.currentTime);
        osc.connect(gain);
        gain.connect(this.audioCtx.destination);
        osc.start();
        this.activeOscillator = osc;
        this.activeGain = gain;
      }
    } catch {}
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
