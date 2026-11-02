/**
 * Multisim Web - Pre-Built Sample Circuits
 * High-value interactive circuits demonstrating analog, digital, reactive, and power components.
 */

export const SAMPLE_CIRCUITS = [
  {
    id: 'sample_555_flasher',
    name: '555 Timer Astable LED Flasher & Pulse Gen',
    description: 'Classic NE555 astable multivibrator. Oscilloscope monitors pin 3 square output (CH A) and capacitor exponential charge curve (CH B). Red LED flashes in sync!',
    components: [
      { id: 'vcc1', type: 'DC_POWER', x: 80, y: 80, voltage: 9.0, pins: [{ id: 'p0', netId: 'NET_VCC' }, { id: 'p1', netId: 'GND' }] },
      { id: 'gnd1', type: 'GROUND', x: 80, y: 380, pins: [{ id: 'p0', netId: 'GND' }] },
      
      // Timing Resistors & Cap
      { id: 'r1', type: 'RESISTOR', x: 200, y: 80, resistance: 10000, label: 'R1 (10k)', pins: [{ id: 'p0', netId: 'NET_VCC' }, { id: 'p1', netId: 'NET_DISCH' }] },
      { id: 'r2', type: 'RESISTOR', x: 200, y: 160, resistance: 47000, label: 'R2 (47k)', pins: [{ id: 'p0', netId: 'NET_DISCH' }, { id: 'p1', netId: 'NET_TRIG' }] },
      { id: 'c1', type: 'CAPACITOR_ELECTROLYTIC', x: 200, y: 250, capacitance: 10e-6, label: 'C1 (10µF)', pins: [{ id: 'p0', netId: 'NET_TRIG' }, { id: 'p1', netId: 'GND' }] },

      // NE555 Timer IC
      { 
        id: 'u1', 
        type: 'TIMER_555', 
        x: 360, 
        y: 120, 
        pins: [
          { id: 'p0', netId: 'GND' },         // Pin 1 GND
          { id: 'p1', netId: 'NET_TRIG' },    // Pin 2 TRIG
          { id: 'p2', netId: 'NET_OUT' },     // Pin 3 OUT
          { id: 'p3', netId: 'NET_VCC' },     // Pin 4 RESET
          { id: 'p4', netId: 'NET_CTRL' },    // Pin 5 CTRL
          { id: 'p5', netId: 'NET_TRIG' },    // Pin 6 THRES (tied to TRIG)
          { id: 'p6', netId: 'NET_DISCH' },   // Pin 7 DISCH
          { id: 'p7', netId: 'NET_VCC' }      // Pin 8 VCC
        ] 
      },

      // LED & Current Limiting Resistor
      { id: 'r_led', type: 'RESISTOR', x: 500, y: 152, resistance: 330, label: 'R3 (330Ω)', pins: [{ id: 'p0', netId: 'NET_OUT' }, { id: 'p1', netId: 'NET_ANODE' }] },
      { id: 'led1', type: 'LED_RED', x: 600, y: 148, forwardVoltage: 1.8, label: 'LED (Output)', pins: [{ id: 'p0', netId: 'NET_ANODE' }, { id: 'p1', netId: 'GND' }] }
    ],
    oscilloscopeSetup: {
      chA: { componentId: 'u1', pinIndex: 2, voltsPerDiv: 5.0, label: 'Pin 3 OUT' },
      chB: { componentId: 'c1', pinIndex: 0, voltsPerDiv: 2.0, label: 'Capacitor Vc' },
      timePerDiv: 0.1
    }
  },

  {
    id: 'sample_bridge_rectifier',
    name: 'Full-Wave Bridge Rectifier + Zener 5.1V Regulator',
    description: '12V AC stepped down through a 4-pin monolithic diode bridge rectifier (KBP307), smoothed by a 100µF capacitor, and clamped to 5.1V DC by 1N4733A Zener diode.',
    components: [
      { id: 'ac1', type: 'AC_POWER', x: 80, y: 160, voltage: 12.0, frequency: 50.0, pins: [{ id: 'p0', netId: 'AC_L' }, { id: 'p1', netId: 'AC_N' }] },
      { id: 'gnd1', type: 'GROUND', x: 380, y: 340, pins: [{ id: 'p0', netId: 'GND' }] },

      // 4-Pin Diode Bridge
      { 
        id: 'br1', 
        type: 'BRIDGE_RECTIFIER', 
        x: 200, 
        y: 150, 
        pins: [
          { id: 'p0', netId: 'AC_L' },
          { id: 'p1', netId: 'AC_N' },
          { id: 'p2', netId: 'NET_DCPOS' },
          { id: 'p3', netId: 'GND' }
        ] 
      },

      // Filter Capacitor
      { id: 'c_filter', type: 'CAPACITOR_ELECTROLYTIC', x: 340, y: 220, capacitance: 100e-6, label: 'C_filter (100µF)', pins: [{ id: 'p0', netId: 'NET_DCPOS' }, { id: 'p1', netId: 'GND' }] },

      // Current Limit Resistor
      { id: 'r_limit', type: 'RESISTOR', x: 440, y: 166, resistance: 220, label: 'R_in (220Ω)', pins: [{ id: 'p0', netId: 'NET_DCPOS' }, { id: 'p1', netId: 'NET_ZENER' }] },

      // 5.1V Zener Diode
      { id: 'z1', type: 'ZENER_1N4733A', x: 560, y: 220, zenerVoltage: 5.1, label: '1N4733A (5.1V)', pins: [{ id: 'p0', netId: 'GND' }, { id: 'p1', netId: 'NET_ZENER' }] },

      // Load Resistor
      { id: 'r_load', type: 'RESISTOR', x: 660, y: 220, resistance: 1000, label: 'R_load (1kΩ)', pins: [{ id: 'p0', netId: 'NET_ZENER' }, { id: 'p1', netId: 'GND' }] },

      // Voltmeter reading DC
      { id: 'vm1', type: 'VOLTMETER_DC', x: 760, y: 210, label: 'V_out DC', pins: [{ id: 'p0', netId: 'NET_ZENER' }, { id: 'p1', netId: 'GND' }] }
    ],
    oscilloscopeSetup: {
      chA: { componentId: 'ac1', pinIndex: 0, voltsPerDiv: 10.0, label: 'AC Input' },
      chB: { componentId: 'z1', pinIndex: 1, voltsPerDiv: 2.0, label: 'Regulated 5.1V' },
      timePerDiv: 0.005
    }
  },

  {
    id: 'sample_bjt_amplifier',
    name: '2N2222 BJT Common-Emitter Audio Amplifier',
    description: 'Audio pre-amplifier with AC coupling capacitor, voltage divider bias, and 2N2222 NPN BJT. Demonstrates 180-degree phase shift and voltage gain on the oscilloscope.',
    components: [
      { id: 'vcc1', type: 'DC_POWER', x: 80, y: 60, voltage: 12.0, pins: [{ id: 'p0', netId: 'NET_VCC' }, { id: 'p1', netId: 'GND' }] },
      { id: 'gnd1', type: 'GROUND', x: 80, y: 400, pins: [{ id: 'p0', netId: 'GND' }] },

      // Signal Source (1kHz 50mV peak)
      { id: 'vin', type: 'SINE_GEN', x: 80, y: 220, amplitude: 0.05, frequency: 1000.0, label: 'Vin (50mV, 1kHz)', pins: [{ id: 'p0', netId: 'NET_SIGIN' }, { id: 'p1', netId: 'GND' }] },
      { id: 'cin', type: 'CAPACITOR', x: 180, y: 220, capacitance: 10e-6, label: 'Cin (10µF)', pins: [{ id: 'p0', netId: 'NET_SIGIN' }, { id: 'p1', netId: 'NET_BASE' }] },

      // Voltage Divider Bias
      { id: 'r1', type: 'RESISTOR', x: 260, y: 120, resistance: 68000, label: 'R1 (68k)', pins: [{ id: 'p0', netId: 'NET_VCC' }, { id: 'p1', netId: 'NET_BASE' }] },
      { id: 'r2', type: 'RESISTOR', x: 260, y: 320, resistance: 15000, label: 'R2 (15k)', pins: [{ id: 'p0', netId: 'NET_BASE' }, { id: 'p1', netId: 'GND' }] },

      // BJT Transistor
      { id: 'q1', type: 'BJT_NPN_2N2222', x: 380, y: 220, beta: 180, label: '2N2222', pins: [{ id: 'p0', netId: 'NET_COLL' }, { id: 'p1', netId: 'NET_BASE' }, { id: 'p2', netId: 'NET_EMIT' }] },

      // Collector and Emitter resistors
      { id: 'rc', type: 'RESISTOR', x: 420, y: 120, resistance: 3300, label: 'Rc (3.3k)', pins: [{ id: 'p0', netId: 'NET_VCC' }, { id: 'p1', netId: 'NET_COLL' }] },
      { id: 're', type: 'RESISTOR', x: 420, y: 320, resistance: 820, label: 'Re (820Ω)', pins: [{ id: 'p0', netId: 'NET_EMIT' }, { id: 'p1', netId: 'GND' }] },
      { id: 'ce', type: 'CAPACITOR_ELECTROLYTIC', x: 500, y: 320, capacitance: 47e-6, label: 'Ce (47µF)', pins: [{ id: 'p0', netId: 'NET_EMIT' }, { id: 'p1', netId: 'GND' }] },

      // Output Coupling
      { id: 'cout', type: 'CAPACITOR', x: 520, y: 180, capacitance: 10e-6, label: 'Cout (10µF)', pins: [{ id: 'p0', netId: 'NET_COLL' }, { id: 'p1', netId: 'NET_OUT' }] },
      { id: 'rload', type: 'RESISTOR', x: 620, y: 240, resistance: 10000, label: 'Rload (10k)', pins: [{ id: 'p0', netId: 'NET_OUT' }, { id: 'p1', netId: 'GND' }] }
    ],
    oscilloscopeSetup: {
      chA: { componentId: 'vin', pinIndex: 0, voltsPerDiv: 0.05, label: 'Input Signal' },
      chB: { componentId: 'cout', pinIndex: 1, voltsPerDiv: 0.5, label: 'Amplified Out' },
      timePerDiv: 0.0005
    }
  },

  {
    id: 'sample_7490_counter',
    name: 'Digital Logic: 7490 Decade Counter + 7-Segment Display',
    description: 'Digital clock pulses drive a 7490 decade counter. 4-bit BCD outputs feed into a Decoded Hex Display (DCD_HEX) counting 0 through 9 automatically with logic probes.',
    components: [
      { id: 'clk1', type: 'DIGITAL_CLOCK', x: 80, y: 180, frequency: 2.0, label: 'Clock (2 Hz)', pins: [{ id: 'p0', netId: 'NET_CLK' }, { id: 'p1', netId: 'GND' }] },
      { id: 'gnd1', type: 'GROUND', x: 80, y: 300, pins: [{ id: 'p0', netId: 'GND' }] },

      // 7490 Counter
      {
        id: 'u_counter',
        type: 'TTL_7490',
        x: 220,
        y: 160,
        label: '74LS90 Decade Counter',
        pins: [
          { id: 'p0', netId: 'NET_CLK' },
          { id: 'p1', netId: 'GND' }, // Reset to GND
          { id: 'p2', netId: 'BIT_QA' },
          { id: 'p3', netId: 'BIT_QB' },
          { id: 'p4', netId: 'BIT_QC' },
          { id: 'p5', netId: 'BIT_QD' }
        ]
      },

      // Decoded Hex Display
      {
        id: 'disp1',
        type: 'DCD_HEX',
        x: 420,
        y: 160,
        label: 'Hex Display (0-9)',
        pins: [
          { id: 'p0', netId: 'BIT_QA' },
          { id: 'p1', netId: 'BIT_QB' },
          { id: 'p2', netId: 'BIT_QC' },
          { id: 'p3', netId: 'BIT_QD' }
        ]
      },

      // Logic Probes
      { id: 'prb0', type: 'LOGIC_PROBE', x: 350, y: 120, label: 'QA', pins: [{ id: 'p0', netId: 'BIT_QA' }] },
      { id: 'prb1', type: 'LOGIC_PROBE', x: 350, y: 155, label: 'QB', pins: [{ id: 'p0', netId: 'BIT_QB' }] },
      { id: 'prb2', type: 'LOGIC_PROBE', x: 350, y: 190, label: 'QC', pins: [{ id: 'p0', netId: 'BIT_QC' }] },
      { id: 'prb3', type: 'LOGIC_PROBE', x: 350, y: 225, label: 'QD', pins: [{ id: 'p0', netId: 'BIT_QD' }] }
    ],
    oscilloscopeSetup: {
      chA: { componentId: 'clk1', pinIndex: 0, voltsPerDiv: 5.0, label: 'Clock' },
      chB: { componentId: 'u_counter', pinIndex: 2, voltsPerDiv: 5.0, label: 'Bit QA' },
      timePerDiv: 0.5
    }
  },

  {
    id: 'sample_opamp_inverting',
    name: 'Operational Amplifier (LM741) Inverting Amplifier',
    description: 'uA741 Op-Amp configured as an inverting amplifier with Gain = -Rf/Rin = -4.7. Dual ±12V rails with oscilloscope monitoring input vs inverted amplified output.',
    components: [
      { id: 'vcc1', type: 'VDD', x: 320, y: 40, voltage: 12.0, label: '+12V VDD', pins: [{ id: 'p0', netId: 'VCC_P' }] },
      { id: 'vee1', type: 'VEE', x: 320, y: 340, voltage: 12.0, label: '-12V VEE', pins: [{ id: 'p0', netId: 'VEE_N' }] },
      { id: 'gnd1', type: 'GROUND', x: 80, y: 260, pins: [{ id: 'p0', netId: 'GND' }] },

      { id: 'vin', type: 'SINE_GEN', x: 80, y: 180, amplitude: 1.0, frequency: 1000.0, label: 'Vin (1V pk)', pins: [{ id: 'p0', netId: 'NET_IN' }, { id: 'p1', netId: 'GND' }] },
      { id: 'rin', type: 'RESISTOR', x: 180, y: 180, resistance: 10000, label: 'R_in (10k)', pins: [{ id: 'p0', netId: 'NET_IN' }, { id: 'p1', netId: 'NET_INV' }] },
      { id: 'rf', type: 'RESISTOR', x: 320, y: 110, resistance: 47000, label: 'Rf (47k)', pins: [{ id: 'p0', netId: 'NET_INV' }, { id: 'p1', netId: 'NET_OUT' }] },

      // Op-Amp
      {
        id: 'u1',
        type: 'OPAMP_741',
        x: 320,
        y: 170,
        label: 'uA741 Op-Amp',
        pins: [
          { id: 'p0', netId: 'GND' },     // Non-inverting to ground
          { id: 'p1', netId: 'NET_INV' }, // Inverting
          { id: 'p2', netId: 'NET_OUT' }, // Output
          { id: 'p3', netId: 'VCC_P' },   // V+
          { id: 'p4', netId: 'VEE_N' }    // V-
        ]
      },

      { id: 'rload', type: 'RESISTOR', x: 500, y: 230, resistance: 10000, label: 'R_load (10k)', pins: [{ id: 'p0', netId: 'NET_OUT' }, { id: 'p1', netId: 'GND' }] }
    ],
    oscilloscopeSetup: {
      chA: { componentId: 'vin', pinIndex: 0, voltsPerDiv: 1.0, label: 'Vin (1V)' },
      chB: { componentId: 'u1', pinIndex: 2, voltsPerDiv: 5.0, label: 'Vout (-4.7V)' },
      timePerDiv: 0.0005
    }
  },

  {
    id: 'sample_motor_driver',
    name: 'DC Motor + MOSFET Switch & Flyback Protection',
    description: '12V DC Motor with rotating shaft animation & RPM readout driven by IRF540 Power MOSFET with interactive toggle switch and 1N4007 flyback diode protection.',
    components: [
      { id: 'vcc1', type: 'DC_POWER', x: 80, y: 60, voltage: 12.0, label: '12V Battery', pins: [{ id: 'p0', netId: 'NET_12V' }, { id: 'p1', netId: 'GND' }] },
      { id: 'gnd1', type: 'GROUND', x: 80, y: 380, pins: [{ id: 'p0', netId: 'GND' }] },

      // Interactive Toggle Switch
      { id: 'sw1', type: 'SWITCH_SPST', x: 140, y: 220, isOpen: false, label: 'Motor Switch', pins: [{ id: 'p0', netId: 'NET_12V' }, { id: 'p1', netId: 'NET_GATE' }] },
      { id: 'rg', type: 'RESISTOR', x: 240, y: 300, resistance: 10000, label: 'Pull-down (10k)', pins: [{ id: 'p0', netId: 'NET_GATE' }, { id: 'p1', netId: 'GND' }] },

      // Power MOSFET
      { id: 'q1', type: 'MOSFET_N_IRF540', x: 340, y: 240, label: 'IRF540 MOSFET', pins: [{ id: 'p0', netId: 'NET_DRAIN' }, { id: 'p1', netId: 'NET_GATE' }, { id: 'p2', netId: 'GND' }] },

      // DC Motor with rotating rotor animation
      { id: 'm1', type: 'DC_MOTOR', x: 340, y: 100, label: '12V DC Motor', pins: [{ id: 'p0', netId: 'NET_12V' }, { id: 'p1', netId: 'NET_DRAIN' }] },

      // Flyback Diode
      { id: 'd1', type: 'DIODE_1N4007', x: 440, y: 100, label: '1N4007 Flyback', pins: [{ id: 'p0', netId: 'NET_DRAIN' }, { id: 'p1', netId: 'NET_12V' }] }
    ],
    oscilloscopeSetup: {
      chA: { componentId: 'sw1', pinIndex: 1, voltsPerDiv: 5.0, label: 'Gate Drive' },
      chB: { componentId: 'q1', pinIndex: 0, voltsPerDiv: 5.0, label: 'Drain Voltage' },
      timePerDiv: 0.05
    }
  },

  {
    id: 'sample_fuse_blow',
    name: 'Rated Virtual Safety Fuse Overload & Blow Demonstration',
    description: 'Demonstrates Multisim Rated Virtual safety features. Closing the knife switch passes 4 Amperes through a 1A rated cartridge fuse; within seconds, the fuse element blows with smoke animation!',
    components: [
      { id: 'vcc1', type: 'DC_POWER', x: 80, y: 140, voltage: 12.0, label: '12V Power Supply', pins: [{ id: 'p0', netId: 'NET_BAT' }, { id: 'p1', netId: 'GND' }] },
      { id: 'gnd1', type: 'GROUND', x: 80, y: 300, pins: [{ id: 'p0', netId: 'GND' }] },

      // Switch
      { id: 'sw1', type: 'SWITCH_SPST', x: 200, y: 140, isOpen: true, label: 'Overload Switch', pins: [{ id: 'p0', netId: 'NET_BAT' }, { id: 'p1', netId: 'NET_FUSEIN' }] },

      // Rated 1A Fuse
      { id: 'fuse1', type: 'FUSE', x: 320, y: 140, ratedCurrent: 1.0, isBlown: false, isRatedVirtual: true, label: 'Fuse (1A Rated)', pins: [{ id: 'p0', netId: 'NET_FUSEIN' }, { id: 'p1', netId: 'NET_LOAD' }] },

      // Overload Heavy Load (3 ohms -> draws 4A at 12V!)
      { id: 'rload', type: 'RESISTOR', x: 460, y: 200, resistance: 3.0, label: 'Heavy Load (3Ω, 48W)', pins: [{ id: 'p0', netId: 'NET_LOAD' }, { id: 'p1', netId: 'GND' }] },

      // Lamp & Ammeter
      { id: 'amm1', type: 'AMMETER_DC', x: 560, y: 200, label: 'Current Meter', pins: [{ id: 'p0', netId: 'NET_LOAD' }, { id: 'p1', netId: 'GND' }] }
    ],
    oscilloscopeSetup: {
      chA: { componentId: 'sw1', pinIndex: 1, voltsPerDiv: 5.0, label: 'Switch V' },
      chB: { componentId: 'fuse1', pinIndex: 1, voltsPerDiv: 5.0, label: 'Load V' },
      timePerDiv: 0.2
    }
  }
];
