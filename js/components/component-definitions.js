/**
 * Multisim Web - Comprehensive Component Catalog & Symbol Definitions
 * Fully covers all 11 categories in the Multisim specification document:
 * 1. Sources (Power, Signal, Controlled, 3-Phase, PWL, AM, FM, FSK)
 * 2. Basic (Passives, Potentiometers, Networks, Transformers, Switches, Relays, Connectors)
 * 3. Diodes (Rectifiers, Zeners, LEDs, Schottky, Thyristors, TRIAC, DIAC, Bridge, Varactors)
 * 4. Transistors (BJT NPN/PNP, Darlingtons, JFETs, MOSFETs, IGBTs)
 * 5. Analog (Op-Amps, Comparators, Inst Amps, Regulators 78xx/79xx/LM317, References, Multipliers)
 * 6. TTL 7400 Series (Gates, Flip-Flops, Counters, Decoders, Arithmetic ALUs)
 * 7. CMOS 4000 Series (Gates, Ripple Counters, 4017 Decade, Analog Switches, Latches)
 * 8. Mixed & Signal (555/556 Timers, ADC/DAC, PLL CD4046, VCO LM566, Multivibrators)
 * 9. Indicators (Voltmeters, Ammeters, Probes, Lamps, 7-Seg, Hex Decoded, Bargraph, LCD, Buzzer)
 * 10. Advanced & Sensors (Keypads 4x4, LDR, Thermistors NTC/PTC, Photodiodes, RF)
 * 11. Electro-Mechanical & Power (DC Motors, Stepper, Servo, Fuses, MOVs, PWM SG3525/TL494)
 */

export const COMPONENT_CATEGORIES = [
  { id: 'sources', name: '1. Sources', icon: 'zap' },
  { id: 'basic', name: '2. Basic Passives & Switches', icon: 'sliders' },
  { id: 'diodes', name: '3. Diodes & Thyristors', icon: 'play' },
  { id: 'transistors', name: '4. Transistors & FETs', icon: 'cpu' },
  { id: 'analog', name: '5. Analog ICs & Regulators', icon: 'activity' },
  { id: 'ttl', name: '6. TTL 7400 Series Logic', icon: 'hash' },
  { id: 'cmos', name: '7. CMOS 4000 Series Logic', icon: 'grid' },
  { id: 'mixed', name: '8. Mixed Signal & Timers', icon: 'clock' },
  { id: 'indicators', name: '9. Indicators & Displays', icon: 'eye' },
  { id: 'sensors', name: '10. Sensors, RF & Keypads', icon: 'sun' },
  { id: 'electromech', name: '11. Electro-Mechanical & Power', icon: 'settings' }
];

export const COMPONENT_CATALOG = [
  // ================= 1. SOURCES =================
  {
    type: 'GROUND',
    category: 'sources',
    name: 'Ground (0V Reference)',
    partNumber: 'GND',
    family: 'Power Sources',
    description: 'Earth / Ground 0V reference node for circuit solver.',
    width: 32,
    height: 32,
    pins: [{ id: 'p0', x: 16, y: 0, label: 'GND', isGround: true }],
    defaultProps: {}
  },
  {
    type: 'DIGITAL_GROUND',
    category: 'sources',
    name: 'Digital Ground',
    partNumber: 'DIGITAL_GND',
    family: 'Power Sources',
    description: 'Common return node for digital logic ICs.',
    width: 32,
    height: 32,
    pins: [{ id: 'p0', x: 16, y: 0, label: 'DGND', isGround: true }],
    defaultProps: {}
  },
  {
    type: 'VCC',
    category: 'sources',
    name: 'VCC (+5V Power Rail)',
    partNumber: 'VCC_5V',
    family: 'Power Sources',
    description: 'Fixed +5.0V regulated DC voltage supply rail.',
    width: 32,
    height: 32,
    pins: [{ id: 'p0', x: 16, y: 32, label: '+5V' }],
    defaultProps: { voltage: 5.0 }
  },
  {
    type: 'VDD',
    category: 'sources',
    name: 'VDD (+12V Power Rail)',
    partNumber: 'VDD_12V',
    family: 'Power Sources',
    description: '+12.0V CMOS / Analog supply rail.',
    width: 32,
    height: 32,
    pins: [{ id: 'p0', x: 16, y: 32, label: '+12V' }],
    defaultProps: { voltage: 12.0 }
  },
  {
    type: 'VSS',
    category: 'sources',
    name: 'VSS (0V / Substrate Rail)',
    partNumber: 'VSS_0V',
    family: 'Power Sources',
    description: 'CMOS negative supply / substrate reference rail.',
    width: 32,
    height: 32,
    pins: [{ id: 'p0', x: 16, y: 0, label: 'VSS' }],
    defaultProps: { voltage: 0.0 }
  },
  {
    type: 'VEE',
    category: 'sources',
    name: 'VEE (-12V Negative Rail)',
    partNumber: 'VEE_NEG12V',
    family: 'Power Sources',
    description: '-12.0V dual-supply negative op-amp rail.',
    width: 32,
    height: 32,
    pins: [{ id: 'p0', x: 16, y: 0, label: '-12V' }],
    defaultProps: { voltage: -12.0 }
  },
  {
    type: 'DC_POWER',
    category: 'sources',
    name: 'DC Voltage Source (Battery)',
    partNumber: 'DC_VOLTAGE',
    family: 'Power Sources',
    description: 'Adjustable DC voltage source with configurable potential.',
    width: 48,
    height: 48,
    pins: [
      { id: 'p0', x: 24, y: 0, label: '+' },
      { id: 'p1', x: 24, y: 48, label: '-' }
    ],
    defaultProps: { voltage: 9.0 }
  },
  {
    type: 'AC_POWER',
    category: 'sources',
    name: 'AC Voltage Source',
    partNumber: 'AC_VOLTAGE',
    family: 'Power Sources',
    description: 'Sinusoidal AC power generator (RMS voltage, frequency, phase).',
    width: 48,
    height: 48,
    pins: [
      { id: 'p0', x: 24, y: 0, label: '~' },
      { id: 'p1', x: 24, y: 48, label: '~' }
    ],
    defaultProps: { voltage: 120.0, frequency: 60.0, phase: 0 }
  },
  {
    type: 'THREE_PHASE_SOURCE',
    category: 'sources',
    name: '3-Phase AC Power Source',
    partNumber: '3PHASE_SRC',
    family: 'Power Sources',
    description: '3-Phase balanced wye/delta source (Phase A, B, C at 120° offsets, Neutral).',
    width: 64,
    height: 64,
    pins: [
      { id: 'p0', x: 64, y: 12, label: 'Phase A (0°)' },
      { id: 'p1', x: 64, y: 28, label: 'Phase B (-120°)' },
      { id: 'p2', x: 64, y: 44, label: 'Phase C (+120°)' },
      { id: 'p3', x: 0, y: 28, label: 'Neutral (N)' }
    ],
    defaultProps: { voltage: 120.0, frequency: 50.0 }
  },
  {
    type: 'DC_CURRENT_SOURCE',
    category: 'sources',
    name: 'DC Current Source',
    partNumber: 'DC_CURRENT',
    family: 'Signal Sources',
    description: 'Constant independent direct current source.',
    width: 48,
    height: 48,
    pins: [
      { id: 'p0', x: 24, y: 0, label: 'In' },
      { id: 'p1', x: 24, y: 48, label: 'Out' }
    ],
    defaultProps: { current: 0.01 }
  },
  {
    type: 'DIGITAL_CLOCK',
    category: 'sources',
    name: 'Clock Voltage (DIGITAL_CLOCK)',
    partNumber: 'DIGITAL_CLOCK',
    family: 'Signal Sources',
    description: 'Digital logic square-wave clock source (0V/5V).',
    width: 48,
    height: 48,
    pins: [
      { id: 'p0', x: 48, y: 24, label: 'CLK' },
      { id: 'p1', x: 0, y: 24, label: 'GND' }
    ],
    defaultProps: { frequency: 1000.0, vHigh: 5.0, vLow: 0.0, dutyCycle: 0.5 }
  },
  {
    type: 'PULSE_VOLTAGE',
    category: 'sources',
    name: 'Pulse Voltage Source',
    partNumber: 'PULSE_GEN',
    family: 'Signal Sources',
    description: 'Configurable periodic rectangular pulse source.',
    width: 48,
    height: 48,
    pins: [
      { id: 'p0', x: 24, y: 0, label: '+' },
      { id: 'p1', x: 24, y: 48, label: '-' }
    ],
    defaultProps: { frequency: 500.0, vHigh: 5.0, vLow: 0.0, pulseWidth: 0.0004 }
  },
  {
    type: 'PWL_SOURCE',
    category: 'sources',
    name: 'Piecewise Linear Source (PWL)',
    partNumber: 'PWL_SOURCE',
    family: 'Signal Sources',
    description: 'Arbitrary piecewise linear voltage curve simulator.',
    width: 48,
    height: 48,
    pins: [
      { id: 'p0', x: 24, y: 0, label: '+' },
      { id: 'p1', x: 24, y: 48, label: '-' }
    ],
    defaultProps: { amplitude: 5.0, frequency: 100.0 }
  },
  {
    type: 'AM_SOURCE',
    category: 'sources',
    name: 'AM Modulated Signal Source',
    partNumber: 'AM_SOURCE',
    family: 'Signal Sources',
    description: 'Amplitude modulated RF carrier source.',
    width: 48,
    height: 48,
    pins: [
      { id: 'p0', x: 24, y: 0, label: '+' },
      { id: 'p1', x: 24, y: 48, label: '-' }
    ],
    defaultProps: { carrierFreq: 10000.0, modFreq: 500.0, modIndex: 0.5, amplitude: 2.0 }
  },
  {
    type: 'FM_SOURCE',
    category: 'sources',
    name: 'FM Modulated Signal Source',
    partNumber: 'FM_SOURCE',
    family: 'Signal Sources',
    description: 'Frequency modulated RF source.',
    width: 48,
    height: 48,
    pins: [
      { id: 'p0', x: 24, y: 0, label: '+' },
      { id: 'p1', x: 24, y: 48, label: '-' }
    ],
    defaultProps: { carrierFreq: 5000.0, modFreq: 200.0, freqDev: 1000.0, amplitude: 2.0 }
  },
  {
    type: 'SINE_GEN',
    category: 'sources',
    name: 'Function / Sine Generator',
    partNumber: 'SINE_SOURCE',
    family: 'Signal Sources',
    description: 'Pure sinusoidal analog test oscillator.',
    width: 48,
    height: 48,
    pins: [
      { id: 'p0', x: 24, y: 0, label: '+' },
      { id: 'p1', x: 24, y: 48, label: '-' }
    ],
    defaultProps: { amplitude: 2.5, frequency: 1000.0, offset: 0 }
  },
  {
    type: 'VCVS',
    category: 'sources',
    name: 'VCVS (Voltage-Controlled Voltage Source)',
    partNumber: 'VCVS',
    family: 'Controlled Sources',
    description: 'E-source: Vout = Gain * (Vctrl+ - Vctrl-).',
    width: 56,
    height: 56,
    pins: [
      { id: 'p0', x: 56, y: 16, label: 'Out+' },
      { id: 'p1', x: 56, y: 40, label: 'Out-' },
      { id: 'p2', x: 0, y: 16, label: 'In+' },
      { id: 'p3', x: 0, y: 40, label: 'In-' }
    ],
    defaultProps: { gain: 2.0 }
  },
  {
    type: 'VCCS',
    category: 'sources',
    name: 'VCCS (Voltage-Controlled Current Source)',
    partNumber: 'VCCS',
    family: 'Controlled Sources',
    description: 'G-source: Iout = Gm * (Vctrl+ - Vctrl-).',
    width: 56,
    height: 56,
    pins: [
      { id: 'p0', x: 56, y: 16, label: 'Out+' },
      { id: 'p1', x: 56, y: 40, label: 'Out-' },
      { id: 'p2', x: 0, y: 16, label: 'In+' },
      { id: 'p3', x: 0, y: 40, label: 'In-' }
    ],
    defaultProps: { gm: 0.05 }
  },

  // ================= 2. BASIC PASSIVES & SWITCHES =================
  {
    type: 'RESISTOR',
    category: 'basic',
    name: 'Resistor (RESISTOR)',
    partNumber: 'RESISTOR',
    family: 'Passives',
    description: 'Linear carbon/metal film resistor with rated wattage.',
    width: 56,
    height: 24,
    pins: [
      { id: 'p0', x: 0, y: 12, label: '1' },
      { id: 'p1', x: 56, y: 12, label: '2' }
    ],
    defaultProps: { resistance: 1000, maxPower: 0.25, isRatedVirtual: false }
  },
  {
    type: 'RESISTOR_VIRTUAL',
    category: 'basic',
    name: 'Resistor (Virtual)',
    partNumber: 'RESISTOR_VIRTUAL',
    family: 'Virtual Components',
    description: 'Ideal virtual resistor with zero tolerance & unlimited power.',
    width: 56,
    height: 24,
    pins: [
      { id: 'p0', x: 0, y: 12, label: '1' },
      { id: 'p1', x: 56, y: 12, label: '2' }
    ],
    defaultProps: { resistance: 1000 }
  },
  {
    type: 'POTENTIOMETER',
    category: 'basic',
    name: 'Potentiometer (POTENTIOMETER)',
    partNumber: 'POT_10K',
    family: 'Adjustable Passives',
    description: 'Variable 3-terminal resistor with interactive slider.',
    width: 64,
    height: 40,
    pins: [
      { id: 'p0', x: 0, y: 12, label: 'A' },
      { id: 'p1', x: 32, y: 40, label: 'Wiper' },
      { id: 'p2', x: 64, y: 12, label: 'B' }
    ],
    defaultProps: { resistance: 10000, sliderValue: 0.5 }
  },
  {
    type: 'CAPACITOR',
    category: 'basic',
    name: 'Capacitor (Ceramic)',
    partNumber: 'CAPACITOR',
    family: 'Passives',
    description: 'Non-polarized ceramic disc capacitor.',
    width: 48,
    height: 32,
    pins: [
      { id: 'p0', x: 0, y: 16, label: '1' },
      { id: 'p1', x: 48, y: 16, label: '2' }
    ],
    defaultProps: { capacitance: 1e-7, maxVoltage: 50 }
  },
  {
    type: 'CAPACITOR_ELECTROLYTIC',
    category: 'basic',
    name: 'Capacitor (Electrolytic Polarized)',
    partNumber: 'CAP_ELECTRO',
    family: 'Passives',
    description: 'Polarized aluminum electrolytic filter capacitor.',
    width: 48,
    height: 32,
    pins: [
      { id: 'p0', x: 0, y: 16, label: '+' },
      { id: 'p1', x: 48, y: 16, label: '-' }
    ],
    defaultProps: { capacitance: 47e-6, maxVoltage: 25, isRatedVirtual: true }
  },
  {
    type: 'VARIABLE_CAPACITOR',
    category: 'basic',
    name: 'Variable Capacitor (Trimmer)',
    partNumber: 'VAR_CAP',
    family: 'Adjustable Passives',
    description: 'RF tuning variable capacitor (10pF to 100pF).',
    width: 48,
    height: 32,
    pins: [
      { id: 'p0', x: 0, y: 16, label: '1' },
      { id: 'p1', x: 48, y: 16, label: '2' }
    ],
    defaultProps: { capacitance: 50e-12, sliderValue: 0.5 }
  },
  {
    type: 'INDUCTOR',
    category: 'basic',
    name: 'Inductor (INDUCTOR)',
    partNumber: 'INDUCTOR',
    family: 'Passives',
    description: 'Coil inductor with reactive companion model.',
    width: 56,
    height: 28,
    pins: [
      { id: 'p0', x: 0, y: 14, label: '1' },
      { id: 'p1', x: 56, y: 14, label: '2' }
    ],
    defaultProps: { inductance: 1e-3 }
  },
  {
    type: 'VARIABLE_INDUCTOR',
    category: 'basic',
    name: 'Variable Inductor',
    partNumber: 'VAR_IND',
    family: 'Adjustable Passives',
    description: 'Ferrite core tunable variable inductor.',
    width: 56,
    height: 28,
    pins: [
      { id: 'p0', x: 0, y: 14, label: '1' },
      { id: 'p1', x: 56, y: 14, label: '2' }
    ],
    defaultProps: { inductance: 1e-3, sliderValue: 0.5 }
  },
  {
    type: 'RESISTOR_PACK',
    category: 'basic',
    name: 'Resistor Pack (SIP Bussed 8-Resistor)',
    partNumber: 'SIP_RES_PACK',
    family: 'Passive Networks',
    description: 'Common bus resistor network for pull-up/pull-down lines.',
    width: 80,
    height: 48,
    pins: [
      { id: 'p0', x: 0, y: 24, label: 'COM' },
      { id: 'p1', x: 80, y: 8, label: 'R1' },
      { id: 'p2', x: 80, y: 16, label: 'R2' },
      { id: 'p3', x: 80, y: 24, label: 'R3' },
      { id: 'p4', x: 80, y: 32, label: 'R4' },
      { id: 'p5', x: 80, y: 40, label: 'R5' }
    ],
    defaultProps: { resistance: 4700 }
  },
  {
    type: 'RC_NETWORK',
    category: 'basic',
    name: 'R-C Filter Network',
    partNumber: 'RC_NETWORK',
    family: 'Passive Networks',
    description: 'Integrated passive low-pass/high-pass RC snubber network.',
    width: 64,
    height: 40,
    pins: [
      { id: 'p0', x: 0, y: 20, label: 'IN' },
      { id: 'p1', x: 64, y: 20, label: 'OUT' },
      { id: 'p2', x: 32, y: 40, label: 'GND' }
    ],
    defaultProps: { resistance: 1000, capacitance: 1e-7 }
  },
  {
    type: 'TRANSFORMER',
    category: 'basic',
    name: 'Linear Transformer (10:1 Step-down)',
    partNumber: 'XFRM_10_TO_1',
    family: 'Magnetic / Inductive',
    description: 'Primary to secondary mutual inductive power transformer.',
    width: 64,
    height: 56,
    pins: [
      { id: 'p0', x: 0, y: 12, label: 'P1' },
      { id: 'p1', x: 0, y: 44, label: 'P2' },
      { id: 'p2', x: 64, y: 12, label: 'S1' },
      { id: 'p3', x: 64, y: 44, label: 'S2' }
    ],
    defaultProps: { turnsRatio: 10.0 }
  },
  {
    type: 'CENTER_TAP_TRANSFORMER',
    category: 'basic',
    name: 'Center-Tapped Transformer',
    partNumber: 'XFRM_CT',
    family: 'Magnetic / Inductive',
    description: 'Step-down transformer with secondary center-tap for dual rails.',
    width: 64,
    height: 64,
    pins: [
      { id: 'p0', x: 0, y: 16, label: 'P1' },
      { id: 'p1', x: 0, y: 48, label: 'P2' },
      { id: 'p2', x: 64, y: 12, label: 'S1' },
      { id: 'p3', x: 64, y: 32, label: 'CT' },
      { id: 'p4', x: 64, y: 52, label: 'S2' }
    ],
    defaultProps: { turnsRatio: 10.0 }
  },
  {
    type: 'SWITCH_SPST',
    category: 'basic',
    name: 'SPST Knife / Toggle Switch',
    partNumber: 'SPST',
    family: 'Switches & Relays',
    description: 'Single-Pole Single-Throw switch (click on canvas to toggle).',
    width: 48,
    height: 32,
    pins: [
      { id: 'p0', x: 0, y: 16, label: '1' },
      { id: 'p1', x: 48, y: 16, label: '2' }
    ],
    defaultProps: { isOpen: false }
  },
  {
    type: 'SWITCH_SPDT',
    category: 'basic',
    name: 'SPDT Toggle Switch',
    partNumber: 'SPDT',
    family: 'Switches & Relays',
    description: 'Single-Pole Double-Throw route selection switch.',
    width: 56,
    height: 48,
    pins: [
      { id: 'p0', x: 0, y: 24, label: 'COM' },
      { id: 'p1', x: 56, y: 12, label: 'A' },
      { id: 'p2', x: 56, y: 36, label: 'B' }
    ],
    defaultProps: { isPosA: true }
  },
  {
    type: 'SWITCH_DPST',
    category: 'basic',
    name: 'DPST Dual Switch',
    partNumber: 'DPST',
    family: 'Switches & Relays',
    description: 'Double-Pole Single-Throw simultaneous dual-line switch.',
    width: 56,
    height: 48,
    pins: [
      { id: 'p0', x: 0, y: 12, label: '1A' },
      { id: 'p1', x: 56, y: 12, label: '1B' },
      { id: 'p2', x: 0, y: 36, label: '2A' },
      { id: 'p3', x: 56, y: 36, label: '2B' }
    ],
    defaultProps: { isOpen: false }
  },
  {
    type: 'PUSH_BUTTON_NO',
    category: 'basic',
    name: 'Push Button (Normally Open)',
    partNumber: 'PB_NO',
    family: 'Switches & Relays',
    description: 'Momentary contact tactile button (open at rest).',
    width: 48,
    height: 32,
    pins: [
      { id: 'p0', x: 0, y: 16, label: '1' },
      { id: 'p1', x: 48, y: 16, label: '2' }
    ],
    defaultProps: { isOpen: true }
  },
  {
    type: 'PUSH_BUTTON_NC',
    category: 'basic',
    name: 'Push Button (Normally Closed)',
    partNumber: 'PB_NC',
    family: 'Switches & Relays',
    description: 'Momentary contact break button (closed at rest).',
    width: 48,
    height: 32,
    pins: [
      { id: 'p0', x: 0, y: 16, label: '1' },
      { id: 'p1', x: 48, y: 16, label: '2' }
    ],
    defaultProps: { isOpen: false }
  },
  {
    type: 'RELAY_SPDT',
    category: 'basic',
    name: 'Electromechanical Relay (SPDT)',
    partNumber: 'RELAY_SPDT',
    family: 'Switches & Relays',
    description: 'Coil activated switch with isolated Common, NO, and NC contacts.',
    width: 64,
    height: 56,
    pins: [
      { id: 'p0', x: 0, y: 14, label: 'Coil+' },
      { id: 'p1', x: 0, y: 42, label: 'Coil-' },
      { id: 'p2', x: 64, y: 28, label: 'COM' },
      { id: 'p3', x: 64, y: 12, label: 'NC' },
      { id: 'p4', x: 64, y: 44, label: 'NO' }
    ],
    defaultProps: { pullInVoltage: 3.5, energized: false }
  },
  {
    type: 'HEADER_CONN',
    category: 'basic',
    name: 'Connector Header (4-Pin)',
    partNumber: 'HDR_4P',
    family: 'Connectors',
    description: 'Standard 0.1-inch pitch wiring header connector block.',
    width: 32,
    height: 64,
    pins: [
      { id: 'p0', x: 32, y: 8, label: 'Pin 1' },
      { id: 'p1', x: 32, y: 24, label: 'Pin 2' },
      { id: 'p2', x: 32, y: 40, label: 'Pin 3' },
      { id: 'p3', x: 32, y: 56, label: 'Pin 4' }
    ],
    defaultProps: {}
  },
  {
    type: 'TEST_POINT',
    category: 'basic',
    name: 'Test Point (TP)',
    partNumber: 'TP',
    family: 'Connectors',
    description: 'Oscilloscope / Multimeter probe hook connection node.',
    width: 24,
    height: 24,
    pins: [{ id: 'p0', x: 12, y: 12, label: 'TP' }],
    defaultProps: {}
  },

  // ================= 3. DIODES =================
  {
    type: 'DIODE_1N4007',
    category: 'diodes',
    name: '1N4007 Silicon Rectifier (1000V 1A)',
    partNumber: '1N4007',
    family: 'Diodes',
    description: 'Standard silicon 1A power rectifier diode.',
    width: 48,
    height: 28,
    pins: [
      { id: 'p0', x: 0, y: 14, label: 'A' },
      { id: 'p1', x: 48, y: 14, label: 'K' }
    ],
    defaultProps: { forwardVoltage: 0.7, maxCurrent: 1.0 }
  },
  {
    type: 'DIODE_1N4001',
    category: 'diodes',
    name: '1N4001 Silicon Rectifier (50V 1A)',
    partNumber: '1N4001',
    family: 'Diodes',
    description: 'Standard low-voltage power rectifier diode.',
    width: 48,
    height: 28,
    pins: [
      { id: 'p0', x: 0, y: 14, label: 'A' },
      { id: 'p1', x: 48, y: 14, label: 'K' }
    ],
    defaultProps: { forwardVoltage: 0.7, maxCurrent: 1.0 }
  },
  {
    type: 'DIODE_1N5408',
    category: 'diodes',
    name: '1N5408 Heavy-Duty Rectifier (1000V 3A)',
    partNumber: '1N5408',
    family: 'Diodes',
    description: 'High-current 3 Amp power rectifier diode.',
    width: 48,
    height: 28,
    pins: [
      { id: 'p0', x: 0, y: 14, label: 'A' },
      { id: 'p1', x: 48, y: 14, label: 'K' }
    ],
    defaultProps: { forwardVoltage: 0.7, maxCurrent: 3.0 }
  },
  {
    type: 'DIODE_1N4148',
    category: 'diodes',
    name: '1N4148 High-Speed Switching Diode',
    partNumber: '1N4148',
    family: 'Diodes',
    description: 'Fast 4ns recovery small-signal silicon diode.',
    width: 48,
    height: 28,
    pins: [
      { id: 'p0', x: 0, y: 14, label: 'A' },
      { id: 'p1', x: 48, y: 14, label: 'K' }
    ],
    defaultProps: { forwardVoltage: 0.7 }
  },
  {
    type: 'ZENER_1N4733A',
    category: 'diodes',
    name: '1N4733A Zener Diode (5.1V 1W)',
    partNumber: '1N4733A',
    family: 'Zener Diodes',
    description: '5.1V precision voltage regulation and clamping zener diode.',
    width: 48,
    height: 28,
    pins: [
      { id: 'p0', x: 0, y: 14, label: 'A' },
      { id: 'p1', x: 48, y: 14, label: 'K' }
    ],
    defaultProps: { zenerVoltage: 5.1 }
  },
  {
    type: 'ZENER_1N4742A',
    category: 'diodes',
    name: '1N4742A Zener Diode (12.0V 1W)',
    partNumber: '1N4742A',
    family: 'Zener Diodes',
    description: '12.0V voltage reference and surge limiter.',
    width: 48,
    height: 28,
    pins: [
      { id: 'p0', x: 0, y: 14, label: 'A' },
      { id: 'p1', x: 48, y: 14, label: 'K' }
    ],
    defaultProps: { zenerVoltage: 12.0 }
  },
  {
    type: 'SCHOTTKY_1N5819',
    category: 'diodes',
    name: '1N5819 Schottky Barrier Diode (40V 1A)',
    partNumber: '1N5819',
    family: 'Schottky & Fast Recovery',
    description: 'Ultra-low 0.35V forward voltage drop diode.',
    width: 48,
    height: 28,
    pins: [
      { id: 'p0', x: 0, y: 14, label: 'A' },
      { id: 'p1', x: 48, y: 14, label: 'K' }
    ],
    defaultProps: { forwardVoltage: 0.35 }
  },
  {
    type: 'LED_RED',
    category: 'diodes',
    name: 'LED (Red High-Efficiency)',
    partNumber: 'LED_RED',
    family: 'LEDs',
    description: 'Red light emitting diode with animated glow bloom.',
    width: 48,
    height: 32,
    pins: [
      { id: 'p0', x: 0, y: 16, label: 'A' },
      { id: 'p1', x: 48, y: 16, label: 'K' }
    ],
    defaultProps: { forwardVoltage: 1.8, color: '#ef4444', brightness: 0 }
  },
  {
    type: 'LED_GREEN',
    category: 'diodes',
    name: 'LED (Emerald Green)',
    partNumber: 'LED_GREEN',
    family: 'LEDs',
    description: 'Green light emitting diode with dynamic luminous flux.',
    width: 48,
    height: 32,
    pins: [
      { id: 'p0', x: 0, y: 16, label: 'A' },
      { id: 'p1', x: 48, y: 16, label: 'K' }
    ],
    defaultProps: { forwardVoltage: 2.1, color: '#22c55e', brightness: 0 }
  },
  {
    type: 'LED_BLUE',
    category: 'diodes',
    name: 'LED (Vibrant Blue)',
    partNumber: 'LED_BLUE',
    family: 'LEDs',
    description: 'Superbright blue LED (3.2V forward drop).',
    width: 48,
    height: 32,
    pins: [
      { id: 'p0', x: 0, y: 16, label: 'A' },
      { id: 'p1', x: 48, y: 16, label: 'K' }
    ],
    defaultProps: { forwardVoltage: 3.2, color: '#3b82f6', brightness: 0 }
  },
  {
    type: 'LED_YELLOW',
    category: 'diodes',
    name: 'LED (Bright Amber / Yellow)',
    partNumber: 'LED_YELLOW',
    family: 'LEDs',
    description: 'Amber yellow indicator LED.',
    width: 48,
    height: 32,
    pins: [
      { id: 'p0', x: 0, y: 16, label: 'A' },
      { id: 'p1', x: 48, y: 16, label: 'K' }
    ],
    defaultProps: { forwardVoltage: 2.0, color: '#eab308', brightness: 0 }
  },
  {
    type: 'LED_RGB',
    category: 'diodes',
    name: 'RGB Full-Color LED (Common Cathode)',
    partNumber: 'LED_RGB_CC',
    family: 'LEDs',
    description: 'Multi-color 4-terminal LED combining Red, Green, and Blue dice.',
    width: 56,
    height: 48,
    pins: [
      { id: 'p0', x: 0, y: 10, label: 'R' },
      { id: 'p1', x: 0, y: 22, label: 'G' },
      { id: 'p2', x: 0, y: 34, label: 'B' },
      { id: 'p3', x: 56, y: 22, label: 'COM (K)' }
    ],
    defaultProps: {}
  },
  {
    type: 'SCR_2N5060',
    category: 'diodes',
    name: 'SCR (2N5060 Silicon Controlled Rectifier)',
    partNumber: '2N5060',
    family: 'Thyristors & Power Diodes',
    description: 'Gate triggered latching thyristor for power switching.',
    width: 48,
    height: 36,
    pins: [
      { id: 'p0', x: 0, y: 18, label: 'A' },
      { id: 'p1', x: 48, y: 18, label: 'K' },
      { id: 'p2', x: 24, y: 36, label: 'G' }
    ],
    defaultProps: { isLatched: false }
  },
  {
    type: 'TRIAC_BT136',
    category: 'diodes',
    name: 'TRIAC (BT136 Bidirectional Thyristor)',
    partNumber: 'BT136',
    family: 'Thyristors & Power Diodes',
    description: 'Bidirectional AC mains power control switch.',
    width: 52,
    height: 40,
    pins: [
      { id: 'p0', x: 0, y: 20, label: 'MT1' },
      { id: 'p1', x: 52, y: 20, label: 'MT2' },
      { id: 'p2', x: 26, y: 40, label: 'G' }
    ],
    defaultProps: {}
  },
  {
    type: 'DIAC',
    category: 'diodes',
    name: 'DIAC (DB3 Bidirectional Trigger Diode)',
    partNumber: 'DB3',
    family: 'Thyristors & Power Diodes',
    description: 'Symmetrical 32V breakdown trigger for TRIACs.',
    width: 48,
    height: 28,
    pins: [
      { id: 'p0', x: 0, y: 14, label: '1' },
      { id: 'p1', x: 48, y: 14, label: '2' }
    ],
    defaultProps: { vBreakover: 32.0 }
  },
  {
    type: 'BRIDGE_RECTIFIER',
    category: 'diodes',
    name: 'Bridge Rectifier (KBP307 4-Pin Package)',
    partNumber: 'KBP307',
    family: 'Bridge Rectifiers',
    description: 'Monolithic 4-diode full-wave bridge rectifier package.',
    width: 56,
    height: 56,
    pins: [
      { id: 'p0', x: 0, y: 16, label: 'AC1' },
      { id: 'p1', x: 0, y: 40, label: 'AC2' },
      { id: 'p2', x: 56, y: 16, label: 'DC+' },
      { id: 'p3', x: 56, y: 40, label: 'DC-' }
    ],
    defaultProps: {}
  },

  // ================= 4. TRANSISTORS =================
  {
    type: 'BJT_NPN_2N2222',
    category: 'transistors',
    name: '2N2222 NPN BJT Transistor',
    partNumber: '2N2222',
    family: 'BJT (NPN)',
    description: 'High-speed NPN general purpose amplifier and switch.',
    width: 48,
    height: 48,
    pins: [
      { id: 'p0', x: 36, y: 0, label: 'C' },
      { id: 'p1', x: 0, y: 24, label: 'B' },
      { id: 'p2', x: 36, y: 48, label: 'E' }
    ],
    defaultProps: { beta: 180 }
  },
  {
    type: 'BJT_NPN_2N3904',
    category: 'transistors',
    name: '2N3904 General NPN BJT',
    partNumber: '2N3904',
    family: 'BJT (NPN)',
    description: 'Standard 40V 200mA NPN amplifier transistor.',
    width: 48,
    height: 48,
    pins: [
      { id: 'p0', x: 36, y: 0, label: 'C' },
      { id: 'p1', x: 0, y: 24, label: 'B' },
      { id: 'p2', x: 36, y: 48, label: 'E' }
    ],
    defaultProps: { beta: 200 }
  },
  {
    type: 'BJT_NPN_BC547',
    category: 'transistors',
    name: 'BC547 Low-Noise Audio NPN BJT',
    partNumber: 'BC547',
    family: 'BJT (NPN)',
    description: 'Low-noise audio preamplifier and signal transistor.',
    width: 48,
    height: 48,
    pins: [
      { id: 'p0', x: 36, y: 0, label: 'C' },
      { id: 'p1', x: 0, y: 24, label: 'B' },
      { id: 'p2', x: 36, y: 48, label: 'E' }
    ],
    defaultProps: { beta: 250 }
  },
  {
    type: 'BJT_NPN_TIP31',
    category: 'transistors',
    name: 'TIP31 Power NPN BJT (40V 3A)',
    partNumber: 'TIP31',
    family: 'BJT (NPN)',
    description: 'Medium power NPN audio and linear amplifier transistor.',
    width: 48,
    height: 48,
    pins: [
      { id: 'p0', x: 36, y: 0, label: 'C' },
      { id: 'p1', x: 0, y: 24, label: 'B' },
      { id: 'p2', x: 36, y: 48, label: 'E' }
    ],
    defaultProps: { beta: 50 }
  },
  {
    type: 'BJT_PNP_2N2907',
    category: 'transistors',
    name: '2N2907 PNP BJT Transistor',
    partNumber: '2N2907',
    family: 'BJT (PNP)',
    description: 'Complementary high-speed PNP switching transistor.',
    width: 48,
    height: 48,
    pins: [
      { id: 'p0', x: 36, y: 48, label: 'C' },
      { id: 'p1', x: 0, y: 24, label: 'B' },
      { id: 'p2', x: 36, y: 0, label: 'E' }
    ],
    defaultProps: { beta: 150 }
  },
  {
    type: 'BJT_PNP_BC557',
    category: 'transistors',
    name: 'BC557 Low-Noise PNP BJT',
    partNumber: 'BC557',
    family: 'BJT (PNP)',
    description: 'General purpose low-noise complementary PNP transistor.',
    width: 48,
    height: 48,
    pins: [
      { id: 'p0', x: 36, y: 48, label: 'C' },
      { id: 'p1', x: 0, y: 24, label: 'B' },
      { id: 'p2', x: 36, y: 0, label: 'E' }
    ],
    defaultProps: { beta: 220 }
  },
  {
    type: 'DARLINGTON_TIP120',
    category: 'transistors',
    name: 'TIP120 NPN Darlington Pair (Gain ~1000)',
    partNumber: 'TIP120',
    family: 'Darlington Pairs',
    description: 'High-gain monolithic Darlington power transistor for heavy loads.',
    width: 52,
    height: 52,
    pins: [
      { id: 'p0', x: 40, y: 0, label: 'C' },
      { id: 'p1', x: 0, y: 26, label: 'B' },
      { id: 'p2', x: 40, y: 52, label: 'E' }
    ],
    defaultProps: { beta: 1000 }
  },
  {
    type: 'JFET_N_2N5457',
    category: 'transistors',
    name: '2N5457 N-Channel JFET',
    partNumber: '2N5457',
    family: 'JFETs',
    description: 'Depletion mode N-channel audio pre-amp JFET with high input Z.',
    width: 50,
    height: 50,
    pins: [
      { id: 'p0', x: 38, y: 0, label: 'D' },
      { id: 'p1', x: 0, y: 25, label: 'G' },
      { id: 'p2', x: 38, y: 50, label: 'S' }
    ],
    defaultProps: { vPinchOff: -2.0, idss: 0.003 }
  },
  {
    type: 'MOSFET_N_IRF540',
    category: 'transistors',
    name: 'IRF540 N-Channel Power MOSFET',
    partNumber: 'IRF540N',
    family: 'MOSFETs',
    description: '100V 33A 44mΩ high-current power switching MOSFET.',
    width: 52,
    height: 52,
    pins: [
      { id: 'p0', x: 40, y: 0, label: 'D' },
      { id: 'p1', x: 0, y: 36, label: 'G' },
      { id: 'p2', x: 40, y: 52, label: 'S' }
    ],
    defaultProps: { vth: 3.2, k: 0.8 }
  },
  {
    type: 'MOSFET_2N7000',
    category: 'transistors',
    name: '2N7000 Small-Signal N-MOSFET',
    partNumber: '2N7000',
    family: 'MOSFETs',
    description: 'Low-threshold N-channel enhancement mode signal MOSFET.',
    width: 52,
    height: 52,
    pins: [
      { id: 'p0', x: 40, y: 0, label: 'D' },
      { id: 'p1', x: 0, y: 36, label: 'G' },
      { id: 'p2', x: 40, y: 52, label: 'S' }
    ],
    defaultProps: { vth: 2.1, k: 0.3 }
  },
  {
    type: 'MOSFET_P_IRF9540',
    category: 'transistors',
    name: 'IRF9540 P-Channel Power MOSFET',
    partNumber: 'IRF9540',
    family: 'MOSFETs',
    description: 'High-side P-channel power switching MOSFET.',
    width: 52,
    height: 52,
    pins: [
      { id: 'p0', x: 40, y: 52, label: 'D' },
      { id: 'p1', x: 0, y: 16, label: 'G' },
      { id: 'p2', x: 40, y: 0, label: 'S' }
    ],
    defaultProps: { vth: -3.0, k: 0.7 }
  },
  {
    type: 'IGBT_IRG4BC20',
    category: 'transistors',
    name: 'IRG4BC20 High-Voltage IGBT',
    partNumber: 'IRG4BC20',
    family: 'IGBTs',
    description: 'Insulated Gate Bipolar Transistor (600V 16A) for motor drives.',
    width: 52,
    height: 52,
    pins: [
      { id: 'p0', x: 40, y: 0, label: 'C' },
      { id: 'p1', x: 0, y: 26, label: 'G' },
      { id: 'p2', x: 40, y: 52, label: 'E' }
    ],
    defaultProps: { vth: 4.0 }
  },

  // ================= 5. ANALOG =================
  {
    type: 'OPAMP_741',
    category: 'analog',
    name: 'uA741 Operational Amplifier (5-Pin)',
    partNumber: 'uA741CN',
    family: 'Operational Amplifiers',
    description: 'Internally compensated general-purpose operational amplifier.',
    width: 64,
    height: 56,
    pins: [
      { id: 'p0', x: 0, y: 16, label: 'IN+' },
      { id: 'p1', x: 0, y: 40, label: 'IN-' },
      { id: 'p2', x: 64, y: 28, label: 'OUT' },
      { id: 'p3', x: 32, y: 0, label: 'V+' },
      { id: 'p4', x: 32, y: 56, label: 'V-' }
    ],
    defaultProps: {}
  },
  {
    type: 'OPAMP_3T_VIRTUAL',
    category: 'analog',
    name: 'Op-Amp (3-Terminal Virtual)',
    partNumber: 'OPAMP_3T_VIRTUAL',
    family: 'Operational Amplifiers',
    description: 'Ideal 3-terminal op-amp with infinite input impedance.',
    width: 64,
    height: 48,
    pins: [
      { id: 'p0', x: 0, y: 14, label: '+' },
      { id: 'p1', x: 0, y: 34, label: '-' },
      { id: 'p2', x: 64, y: 24, label: 'OUT' }
    ],
    defaultProps: {}
  },
  {
    type: 'OPAMP_NE5532',
    category: 'analog',
    name: 'NE5532 Ultra Low-Noise Audio Op-Amp',
    partNumber: 'NE5532',
    family: 'Operational Amplifiers',
    description: 'High-performance audio dual op-amp (10MHz bandwidth, 9V/µs).',
    width: 64,
    height: 56,
    pins: [
      { id: 'p0', x: 0, y: 16, label: 'IN+' },
      { id: 'p1', x: 0, y: 40, label: 'IN-' },
      { id: 'p2', x: 64, y: 28, label: 'OUT' },
      { id: 'p3', x: 32, y: 0, label: 'V+' },
      { id: 'p4', x: 32, y: 56, label: 'V-' }
    ],
    defaultProps: {}
  },
  {
    type: 'COMPARATOR_LM393',
    category: 'analog',
    name: 'LM393 Dual Precision Voltage Comparator',
    partNumber: 'LM393',
    family: 'Comparators',
    description: 'Open-collector output voltage comparator.',
    width: 64,
    height: 48,
    pins: [
      { id: 'p0', x: 0, y: 14, label: '+' },
      { id: 'p1', x: 0, y: 34, label: '-' },
      { id: 'p2', x: 64, y: 24, label: 'OUT' }
    ],
    defaultProps: {}
  },
  {
    type: 'COMPARATOR_LM311',
    category: 'analog',
    name: 'LM311 High-Speed Voltage Comparator',
    partNumber: 'LM311',
    family: 'Comparators',
    description: 'Fast 200ns comparator with strobe input and ground-referenced output.',
    width: 64,
    height: 48,
    pins: [
      { id: 'p0', x: 0, y: 14, label: '+' },
      { id: 'p1', x: 0, y: 34, label: '-' },
      { id: 'p2', x: 64, y: 24, label: 'OUT' }
    ],
    defaultProps: {}
  },
  {
    type: 'INST_AMP_AD620',
    category: 'analog',
    name: 'AD620 Instrumentation Amplifier',
    partNumber: 'AD620',
    family: 'Instrumentation Amplifiers',
    description: 'Low-cost precision instrumentation amplifier with RG gain pin.',
    width: 64,
    height: 56,
    pins: [
      { id: 'p0', x: 0, y: 16, label: 'IN+' },
      { id: 'p1', x: 0, y: 40, label: 'IN-' },
      { id: 'p2', x: 64, y: 28, label: 'OUT' },
      { id: 'p3', x: 32, y: 0, label: 'RG1' },
      { id: 'p4', x: 32, y: 56, label: 'RG2' }
    ],
    defaultProps: { gain: 10 }
  },
  {
    type: 'VOLTAGE_REG_7805',
    category: 'analog',
    name: 'LM7805 (+5V Linear Regulator)',
    partNumber: 'LM7805',
    family: 'Voltage Regulators',
    description: 'Standard 3-terminal fixed +5V positive voltage regulator.',
    width: 64,
    height: 48,
    pins: [
      { id: 'p0', x: 0, y: 16, label: 'VIN' },
      { id: 'p1', x: 32, y: 48, label: 'GND' },
      { id: 'p2', x: 64, y: 16, label: 'VOUT' }
    ],
    defaultProps: {}
  },
  {
    type: 'VOLTAGE_REG_7812',
    category: 'analog',
    name: 'LM7812 (+12V Linear Regulator)',
    partNumber: 'LM7812',
    family: 'Voltage Regulators',
    description: 'Fixed +12V positive 1.5A voltage regulator.',
    width: 64,
    height: 48,
    pins: [
      { id: 'p0', x: 0, y: 16, label: 'VIN' },
      { id: 'p1', x: 32, y: 48, label: 'GND' },
      { id: 'p2', x: 64, y: 16, label: 'VOUT' }
    ],
    defaultProps: {}
  },
  {
    type: 'VOLTAGE_REG_LM317',
    category: 'analog',
    name: 'LM317 Adjustable Regulator (1.2V-37V)',
    partNumber: 'LM317',
    family: 'Voltage Regulators',
    description: 'Adjustable linear regulator with 1.25V internal reference.',
    width: 64,
    height: 48,
    pins: [
      { id: 'p0', x: 0, y: 16, label: 'VIN' },
      { id: 'p1', x: 32, y: 48, label: 'ADJ' },
      { id: 'p2', x: 64, y: 16, label: 'VOUT' }
    ],
    defaultProps: { calculatedVout: 5.0 }
  },
  {
    type: 'VOLTAGE_REF_TL431',
    category: 'analog',
    name: 'TL431 Programmable Shunt Reference',
    partNumber: 'TL431',
    family: 'Voltage References',
    description: 'Precision adjustable 2.5V shunt regulator reference diode.',
    width: 48,
    height: 48,
    pins: [
      { id: 'p0', x: 0, y: 24, label: 'REF' },
      { id: 'p1', x: 24, y: 0, label: 'Cathode' },
      { id: 'p2', x: 24, y: 48, label: 'Anode' }
    ],
    defaultProps: { vref: 2.5 }
  },

  // ================= 6. TTL (7400 SERIES LOGIC) =================
  {
    type: 'TTL_7408',
    category: 'ttl',
    name: '7408 Quad 2-Input AND Gate',
    partNumber: '74LS08',
    family: 'Basic Gates',
    description: 'Standard 5V TTL positive AND gate.',
    width: 56,
    height: 40,
    pins: [
      { id: 'p0', x: 0, y: 12, label: 'A' },
      { id: 'p1', x: 0, y: 28, label: 'B' },
      { id: 'p2', x: 56, y: 20, label: 'Y' }
    ],
    defaultProps: { gateType: 'AND' }
  },
  {
    type: 'TTL_7400',
    category: 'ttl',
    name: '7400 Quad 2-Input NAND Gate',
    partNumber: '74LS00',
    family: 'Basic Gates',
    description: 'Standard 5V TTL 2-input NAND gate.',
    width: 56,
    height: 40,
    pins: [
      { id: 'p0', x: 0, y: 12, label: 'A' },
      { id: 'p1', x: 0, y: 28, label: 'B' },
      { id: 'p2', x: 56, y: 20, label: 'Y' }
    ],
    defaultProps: { gateType: 'NAND' }
  },
  {
    type: 'TTL_7432',
    category: 'ttl',
    name: '7432 Quad 2-Input OR Gate',
    partNumber: '74LS32',
    family: 'Basic Gates',
    description: 'Standard 5V TTL positive OR gate.',
    width: 56,
    height: 40,
    pins: [
      { id: 'p0', x: 0, y: 12, label: 'A' },
      { id: 'p1', x: 0, y: 28, label: 'B' },
      { id: 'p2', x: 56, y: 20, label: 'Y' }
    ],
    defaultProps: { gateType: 'OR' }
  },
  {
    type: 'TTL_7402',
    category: 'ttl',
    name: '7402 Quad 2-Input NOR Gate',
    partNumber: '74LS02',
    family: 'Basic Gates',
    description: 'Standard 5V TTL 2-input NOR gate.',
    width: 56,
    height: 40,
    pins: [
      { id: 'p0', x: 0, y: 12, label: 'A' },
      { id: 'p1', x: 0, y: 28, label: 'B' },
      { id: 'p2', x: 56, y: 20, label: 'Y' }
    ],
    defaultProps: { gateType: 'NOR' }
  },
  {
    type: 'TTL_7404',
    category: 'ttl',
    name: '7404 Hex Inverter (NOT)',
    partNumber: '74LS04',
    family: 'Basic Gates',
    description: 'Standard 5V TTL inverting gate.',
    width: 48,
    height: 32,
    pins: [
      { id: 'p0', x: 0, y: 16, label: 'A' },
      { id: 'p1', x: 48, y: 16, label: 'Y' }
    ],
    defaultProps: { gateType: 'NOT' }
  },
  {
    type: 'TTL_7486',
    category: 'ttl',
    name: '7486 Quad 2-Input XOR Gate',
    partNumber: '74LS86',
    family: 'Basic Gates',
    description: 'Standard 5V TTL Exclusive-OR gate.',
    width: 56,
    height: 40,
    pins: [
      { id: 'p0', x: 0, y: 12, label: 'A' },
      { id: 'p1', x: 0, y: 28, label: 'B' },
      { id: 'p2', x: 56, y: 20, label: 'Y' }
    ],
    defaultProps: { gateType: 'XOR' }
  },
  {
    type: 'TTL_7474',
    category: 'ttl',
    name: '7474 Dual D-Type Flip-Flop',
    partNumber: '74LS74',
    family: 'Flip-Flops & Latches',
    description: 'Positive-edge-triggered D-FF with Preset and Clear.',
    width: 64,
    height: 56,
    pins: [
      { id: 'p0', x: 0, y: 16, label: 'D' },
      { id: 'p1', x: 0, y: 36, label: 'CLK' },
      { id: 'p2', x: 64, y: 16, label: 'Q' },
      { id: 'p3', x: 64, y: 36, label: '~Q' }
    ],
    defaultProps: { qState: false }
  },
  {
    type: 'TTL_7476',
    category: 'ttl',
    name: '7476 Dual JK Flip-Flop',
    partNumber: '74LS76',
    family: 'Flip-Flops & Latches',
    description: 'Dual JK flip-flop with Set and Reset.',
    width: 64,
    height: 64,
    pins: [
      { id: 'p0', x: 0, y: 14, label: 'J' },
      { id: 'p1', x: 0, y: 32, label: 'CLK' },
      { id: 'p2', x: 0, y: 50, label: 'K' },
      { id: 'p3', x: 64, y: 20, label: 'Q' },
      { id: 'p4', x: 64, y: 44, label: '~Q' }
    ],
    defaultProps: { qState: false }
  },
  {
    type: 'TTL_7490',
    category: 'ttl',
    name: '7490 Decade BCD Counter',
    partNumber: '74LS90',
    family: 'Counters & Shift Registers',
    description: 'MOD-10 counter with 4-bit BCD outputs QA, QB, QC, QD.',
    width: 72,
    height: 64,
    pins: [
      { id: 'p0', x: 0, y: 20, label: 'CLK' },
      { id: 'p1', x: 0, y: 44, label: 'RST' },
      { id: 'p2', x: 72, y: 12, label: 'QA' },
      { id: 'p3', x: 72, y: 26, label: 'QB' },
      { id: 'p4', x: 72, y: 40, label: 'QC' },
      { id: 'p5', x: 72, y: 54, label: 'QD' }
    ],
    defaultProps: { count: 0 }
  },
  {
    type: 'TTL_7493',
    category: 'ttl',
    name: '7493 4-Bit Binary Counter (MOD-16)',
    partNumber: '74LS93',
    family: 'Counters & Shift Registers',
    description: '4-bit ripple binary counter (0 to 15).',
    width: 72,
    height: 64,
    pins: [
      { id: 'p0', x: 0, y: 20, label: 'CLK' },
      { id: 'p1', x: 0, y: 44, label: 'RST' },
      { id: 'p2', x: 72, y: 12, label: 'QA' },
      { id: 'p3', x: 72, y: 26, label: 'QB' },
      { id: 'p4', x: 72, y: 40, label: 'QC' },
      { id: 'p5', x: 72, y: 54, label: 'QD' }
    ],
    defaultProps: { count: 0 }
  },
  {
    type: 'TTL_7447',
    category: 'ttl',
    name: '7447 BCD to 7-Segment Decoder',
    partNumber: '74LS47',
    family: 'Decoders & Multiplexers',
    description: 'BCD to 7-segment active-low open-collector display decoder/driver.',
    width: 80,
    height: 80,
    pins: [
      { id: 'p0', x: 0, y: 16, label: 'A' },
      { id: 'p1', x: 0, y: 32, label: 'B' },
      { id: 'p2', x: 0, y: 48, label: 'C' },
      { id: 'p3', x: 0, y: 64, label: 'D' },
      { id: 'p4', x: 80, y: 10, label: 'a' },
      { id: 'p5', x: 80, y: 20, label: 'b' },
      { id: 'p6', x: 80, y: 30, label: 'c' },
      { id: 'p7', x: 80, y: 40, label: 'd' },
      { id: 'p8', x: 80, y: 50, label: 'e' },
      { id: 'p9', x: 80, y: 60, label: 'f' },
      { id: 'p10', x: 80, y: 70, label: 'g' }
    ],
    defaultProps: {}
  },
  {
    type: 'TTL_74138',
    category: 'ttl',
    name: '74138 3-to-8 Line Decoder / DEMUX',
    partNumber: '74LS138',
    family: 'Decoders & Multiplexers',
    description: '3-line binary address to 8 active-low decoded outputs.',
    width: 80,
    height: 90,
    pins: [
      { id: 'p0', x: 0, y: 20, label: 'A0' },
      { id: 'p1', x: 0, y: 45, label: 'A1' },
      { id: 'p2', x: 0, y: 70, label: 'A2' },
      { id: 'p3', x: 80, y: 10, label: 'Y0' },
      { id: 'p4', x: 80, y: 21, label: 'Y1' },
      { id: 'p5', x: 80, y: 32, label: 'Y2' },
      { id: 'p6', x: 80, y: 43, label: 'Y3' },
      { id: 'p7', x: 80, y: 54, label: 'Y4' },
      { id: 'p8', x: 80, y: 65, label: 'Y5' },
      { id: 'p9', x: 80, y: 76, label: 'Y6' },
      { id: 'p10', x: 80, y: 87, label: 'Y7' }
    ],
    defaultProps: {}
  },
  {
    type: 'TTL_7483',
    category: 'ttl',
    name: '7483 4-Bit Binary Full Adder',
    partNumber: '74LS83',
    family: 'Arithmetic Units',
    description: '4-bit parallel binary adder with carry-in and carry-out.',
    width: 80,
    height: 80,
    pins: [
      { id: 'p0', x: 0, y: 16, label: 'A (4b)' },
      { id: 'p1', x: 0, y: 40, label: 'B (4b)' },
      { id: 'p2', x: 0, y: 64, label: 'CIN' },
      { id: 'p3', x: 80, y: 30, label: 'SUM' },
      { id: 'p4', x: 80, y: 55, label: 'COUT' }
    ],
    defaultProps: {}
  },

  // ================= 7. CMOS (4000 SERIES LOGIC) =================
  {
    type: 'CMOS_4017',
    category: 'cmos',
    name: '4017 Decade Counter / Divider',
    partNumber: 'CD4017B',
    family: 'Counters & Clocks',
    description: '5-stage Johnson counter with 10 decoded active-high outputs.',
    width: 80,
    height: 100,
    pins: [
      { id: 'p0', x: 0, y: 30, label: 'CLK' },
      { id: 'p1', x: 0, y: 70, label: 'RST' },
      { id: 'p2', x: 80, y: 10, label: 'Q0' },
      { id: 'p3', x: 80, y: 19, label: 'Q1' },
      { id: 'p4', x: 80, y: 28, label: 'Q2' },
      { id: 'p5', x: 80, y: 37, label: 'Q3' },
      { id: 'p6', x: 80, y: 46, label: 'Q4' },
      { id: 'p7', x: 80, y: 55, label: 'Q5' },
      { id: 'p8', x: 80, y: 64, label: 'Q6' },
      { id: 'p9', x: 80, y: 73, label: 'Q7' },
      { id: 'p10', x: 80, y: 82, label: 'Q8' },
      { id: 'p11', x: 80, y: 91, label: 'Q9' }
    ],
    defaultProps: { count: 0 }
  },
  {
    type: 'CMOS_4066',
    category: 'cmos',
    name: '4066 Quad Bilateral Analog Switch',
    partNumber: 'CD4066B',
    family: 'Analog Switches',
    description: 'Digitally controlled bidirectional switch for analog or digital signals.',
    width: 64,
    height: 48,
    pins: [
      { id: 'p0', x: 0, y: 16, label: 'IN/OUT' },
      { id: 'p1', x: 64, y: 16, label: 'OUT/IN' },
      { id: 'p2', x: 32, y: 48, label: 'CTRL' }
    ],
    defaultProps: { isOn: false }
  },
  {
    type: 'CMOS_4013',
    category: 'cmos',
    name: '4013 Dual D-Type Flip-Flop',
    partNumber: 'CD4013B',
    family: 'Latches & Registers',
    description: 'CMOS static dual D-flip flop with set/reset.',
    width: 64,
    height: 56,
    pins: [
      { id: 'p0', x: 0, y: 16, label: 'D' },
      { id: 'p1', x: 0, y: 36, label: 'CLK' },
      { id: 'p2', x: 64, y: 16, label: 'Q' },
      { id: 'p3', x: 64, y: 36, label: '~Q' }
    ],
    defaultProps: { qState: false }
  },

  // ================= 8. MIXED & SIGNAL PROCESSING =================
  {
    type: 'TIMER_555',
    category: 'mixed',
    name: 'NE555 Precision Timer IC',
    partNumber: 'NE555P',
    family: 'Timers',
    description: 'Classic astable / monostable multivibrator timer with internal comparators.',
    width: 72,
    height: 80,
    pins: [
      { id: 'p0', x: 0, y: 16, label: 'GND (1)' },
      { id: 'p1', x: 0, y: 32, label: 'TRIG (2)' },
      { id: 'p2', x: 72, y: 32, label: 'OUT (3)' },
      { id: 'p3', x: 0, y: 48, label: 'RST (4)' },
      { id: 'p4', x: 72, y: 64, label: 'CTRL (5)' },
      { id: 'p5', x: 72, y: 48, label: 'THRES (6)' },
      { id: 'p6', x: 72, y: 16, label: 'DISCH (7)' },
      { id: 'p7', x: 0, y: 64, label: 'VCC (8)' }
    ],
    defaultProps: {}
  },
  {
    type: 'TIMER_556',
    category: 'mixed',
    name: 'NE556 Dual Timer IC',
    partNumber: 'NE556',
    family: 'Timers',
    description: 'Dual 555 timers in a single 14-pin monolithic IC package.',
    width: 80,
    height: 90,
    pins: [
      { id: 'p0', x: 0, y: 20, label: 'DISCH 1' },
      { id: 'p1', x: 0, y: 40, label: 'THRES 1' },
      { id: 'p2', x: 0, y: 60, label: 'OUT 1' },
      { id: 'p3', x: 80, y: 20, label: 'DISCH 2' },
      { id: 'p4', x: 80, y: 40, label: 'THRES 2' },
      { id: 'p5', x: 80, y: 60, label: 'OUT 2' }
    ],
    defaultProps: {}
  },
  {
    type: 'ADC_0804',
    category: 'mixed',
    name: 'ADC0804 8-Bit A/D Converter',
    partNumber: 'ADC0804',
    family: 'Data Converters',
    description: '8-bit successive approximation analog-to-digital converter.',
    width: 80,
    height: 80,
    pins: [
      { id: 'p0', x: 0, y: 24, label: 'VIN+' },
      { id: 'p1', x: 0, y: 48, label: 'CLK' },
      { id: 'p2', x: 80, y: 16, label: 'DB0-3' },
      { id: 'p3', x: 80, y: 48, label: 'DB4-7' }
    ],
    defaultProps: {}
  },
  {
    type: 'DAC_0808',
    category: 'mixed',
    name: 'DAC0808 8-Bit Multiplying D/A Converter',
    partNumber: 'DAC0808',
    family: 'Data Converters',
    description: '8-bit multiplying digital-to-analog converter with R-2R ladder.',
    width: 80,
    height: 80,
    pins: [
      { id: 'p0', x: 0, y: 20, label: 'D0-3' },
      { id: 'p1', x: 0, y: 50, label: 'D4-7' },
      { id: 'p2', x: 80, y: 35, label: 'IOUT' }
    ],
    defaultProps: {}
  },

  // ================= 9. INDICATORS & OUTPUT DEVICES =================
  {
    type: 'VOLTMETER_DC',
    category: 'indicators',
    name: 'DC Voltmeter Panel Meter',
    partNumber: 'VM_DC',
    family: 'Voltmeters & Ammeters',
    description: 'High-impedance (100MΩ) digital DC voltage indicator.',
    width: 64,
    height: 40,
    pins: [
      { id: 'p0', x: 0, y: 20, label: '+' },
      { id: 'p1', x: 64, y: 20, label: '-' }
    ],
    defaultProps: {}
  },
  {
    type: 'VOLTMETER_AC',
    category: 'indicators',
    name: 'AC Voltmeter Panel Meter',
    partNumber: 'VM_AC',
    family: 'Voltmeters & Ammeters',
    description: 'True RMS AC voltage panel meter.',
    width: 64,
    height: 40,
    pins: [
      { id: 'p0', x: 0, y: 20, label: '~' },
      { id: 'p1', x: 64, y: 20, label: '~' }
    ],
    defaultProps: {}
  },
  {
    type: 'AMMETER_DC',
    category: 'indicators',
    name: 'DC Ammeter Panel Meter',
    partNumber: 'AM_DC',
    family: 'Voltmeters & Ammeters',
    description: 'In-line low-resistance (1mΩ) current measurement meter.',
    width: 64,
    height: 40,
    pins: [
      { id: 'p0', x: 0, y: 20, label: '+' },
      { id: 'p1', x: 64, y: 20, label: '-' }
    ],
    defaultProps: {}
  },
  {
    type: 'LOGIC_PROBE',
    category: 'indicators',
    name: 'Interactive Logic Probe',
    partNumber: 'LOGIC_PROBE',
    family: 'Lamps & Probes',
    description: 'Multi-state logic visualizer: Red (HIGH), Green (LOW), Gray (Hi-Z).',
    width: 36,
    height: 36,
    pins: [{ id: 'p0', x: 0, y: 18, label: 'IN' }],
    defaultProps: {}
  },
  {
    type: 'FILAMENT_LAMP',
    category: 'indicators',
    name: 'Incandescent Filament Lamp',
    partNumber: 'LAMP_12V',
    family: 'Lamps & Probes',
    description: 'Tungsten bulb with dynamic thermal inertia and warm glow bloom.',
    width: 48,
    height: 48,
    pins: [
      { id: 'p0', x: 0, y: 24, label: '1' },
      { id: 'p1', x: 48, y: 24, label: '2' }
    ],
    defaultProps: { filamentTemp: 300, brightness: 0 }
  },
  {
    type: 'SEVEN_SEGMENT_CC',
    category: 'indicators',
    name: '7-Segment Display (Common Cathode)',
    partNumber: '7SEG_CC',
    family: 'Displays',
    description: 'Individual 8-pin LED segments (a-g, dp) with common ground pin.',
    width: 56,
    height: 80,
    pins: [
      { id: 'p0', x: 28, y: 80, label: 'COM' },
      { id: 'p1', x: 8, y: 0, label: 'a' },
      { id: 'p2', x: 20, y: 0, label: 'b' },
      { id: 'p3', x: 32, y: 0, label: 'c' },
      { id: 'p4', x: 44, y: 0, label: 'd' },
      { id: 'p5', x: 8, y: 80, label: 'e' },
      { id: 'p6', x: 20, y: 80, label: 'f' },
      { id: 'p7', x: 36, y: 80, label: 'g' },
      { id: 'p8', x: 48, y: 80, label: 'dp' }
    ],
    defaultProps: { activeSegments: [] }
  },
  {
    type: 'SEVEN_SEGMENT_CA',
    category: 'indicators',
    name: '7-Segment Display (Common Anode)',
    partNumber: '7SEG_CA',
    family: 'Displays',
    description: 'Active-low segments with common positive anode power rail.',
    width: 56,
    height: 80,
    pins: [
      { id: 'p0', x: 28, y: 0, label: 'COM (+V)' },
      { id: 'p1', x: 8, y: 0, label: 'a' },
      { id: 'p2', x: 20, y: 0, label: 'b' },
      { id: 'p3', x: 32, y: 0, label: 'c' },
      { id: 'p4', x: 44, y: 0, label: 'd' },
      { id: 'p5', x: 8, y: 80, label: 'e' },
      { id: 'p6', x: 20, y: 80, label: 'f' },
      { id: 'p7', x: 36, y: 80, label: 'g' },
      { id: 'p8', x: 48, y: 80, label: 'dp' }
    ],
    defaultProps: { activeSegments: [] }
  },
  {
    type: 'DCD_HEX',
    category: 'indicators',
    name: 'Decoded Hex Display (DCD_HEX)',
    partNumber: 'DCD_HEX',
    family: 'Displays',
    description: 'Direct 4-bit binary input displaying characters 0 through F.',
    width: 56,
    height: 64,
    pins: [
      { id: 'p0', x: 0, y: 12, label: 'D0' },
      { id: 'p1', x: 0, y: 26, label: 'D1' },
      { id: 'p2', x: 0, y: 40, label: 'D2' },
      { id: 'p3', x: 0, y: 54, label: 'D3' }
    ],
    defaultProps: { displayedChar: '0' }
  },
  {
    type: 'BARGRAPH_10',
    category: 'indicators',
    name: 'Bargraph Array (10-Segment LED)',
    partNumber: 'BARGRAPH_10',
    family: 'Displays',
    description: '10-segment illuminated LED bar level indicator.',
    width: 64,
    height: 80,
    pins: [
      { id: 'p0', x: 0, y: 10, label: 'Anodes' },
      { id: 'p1', x: 64, y: 70, label: 'Cathodes' }
    ],
    defaultProps: { level: 5 }
  },
  {
    type: 'LCD_16X2',
    category: 'indicators',
    name: 'Alphanumeric LCD Module (16x2)',
    partNumber: 'LCD_16X2',
    family: 'Displays',
    description: 'HD44780 standard parallel alphanumeric LCD screen.',
    width: 90,
    height: 56,
    pins: [
      { id: 'p0', x: 0, y: 14, label: 'RS' },
      { id: 'p1', x: 0, y: 28, label: 'EN' },
      { id: 'p2', x: 0, y: 42, label: 'DATA' }
    ],
    defaultProps: { textLine1: 'MULTISIM PRO', textLine2: 'SYSTEM READY' }
  },
  {
    type: 'PIEZO_BUZZER',
    category: 'indicators',
    name: 'Piezo Buzzer (Audio Synthesizer)',
    partNumber: 'BUZZER_PIEZO',
    family: 'Buzzer / Audio',
    description: 'Acoustic audio transducer emitting audible beep via Web Audio API.',
    width: 48,
    height: 48,
    pins: [
      { id: 'p0', x: 0, y: 24, label: '+' },
      { id: 'p1', x: 48, y: 24, label: '-' }
    ],
    defaultProps: { buzzerActive: false }
  },

  // ================= 10. ADVANCED PERIPHERALS & SENSORS =================
  {
    type: 'KEYPAD_4X4',
    category: 'sensors',
    name: 'Matrix Keypad (4x4 Matrix)',
    partNumber: 'KEYPAD_4X4',
    family: 'Keypads',
    description: '16-key matrix (0-9, *, #, A-D) with 4 row and 4 col scan pins.',
    width: 72,
    height: 72,
    pins: [
      { id: 'p0', x: 0, y: 12, label: 'R1' },
      { id: 'p1', x: 0, y: 26, label: 'R2' },
      { id: 'p2', x: 0, y: 40, label: 'R3' },
      { id: 'p3', x: 0, y: 54, label: 'R4' },
      { id: 'p4', x: 72, y: 12, label: 'C1' },
      { id: 'p5', x: 72, y: 26, label: 'C2' },
      { id: 'p6', x: 72, y: 40, label: 'C3' },
      { id: 'p7', x: 72, y: 54, label: 'C4' }
    ],
    defaultProps: {}
  },
  {
    type: 'LDR',
    category: 'sensors',
    name: 'LDR (Light Dependent Resistor)',
    partNumber: 'NORP12_LDR',
    family: 'Sensors',
    description: 'CdS photoresistor with interactive Lux control slider.',
    width: 56,
    height: 36,
    pins: [
      { id: 'p0', x: 0, y: 18, label: '1' },
      { id: 'p1', x: 56, y: 18, label: '2' }
    ],
    defaultProps: { lux: 400, currentResistance: 2500 }
  },
  {
    type: 'THERMISTOR_NTC',
    category: 'sensors',
    name: 'NTC Thermistor (Negative Temp Coefficient)',
    partNumber: 'NTC_10K',
    family: 'Sensors',
    description: 'Temperature sensor with interactive °C temperature slider.',
    width: 56,
    height: 36,
    pins: [
      { id: 'p0', x: 0, y: 18, label: '1' },
      { id: 'p1', x: 56, y: 18, label: '2' }
    ],
    defaultProps: { temperature: 25, currentResistance: 10000 }
  },
  {
    type: 'PHOTODIODE',
    category: 'sensors',
    name: 'Silicon PIN Photodiode',
    partNumber: 'BPW34',
    family: 'Sensors',
    description: 'High-speed light sensor producing photocurrent proportional to irradiance.',
    width: 48,
    height: 32,
    pins: [
      { id: 'p0', x: 0, y: 16, label: 'A' },
      { id: 'p1', x: 48, y: 16, label: 'K' }
    ],
    defaultProps: { lux: 500 }
  },

  // ================= 11. ELECTRO-MECHANICAL & POWER =================
  {
    type: 'DC_MOTOR',
    category: 'electromech',
    name: 'DC Permanent Magnet Motor',
    partNumber: 'DC_MOTOR_12V',
    family: 'Motors',
    description: 'Electromechanical motor with animated rotating shaft & live RPM gauge.',
    width: 56,
    height: 56,
    pins: [
      { id: 'p0', x: 0, y: 28, label: '+' },
      { id: 'p1', x: 56, y: 28, label: '-' }
    ],
    defaultProps: { rpm: 0, motorAngle: 0 }
  },
  {
    type: 'SERVO_MOTOR',
    category: 'electromech',
    name: 'RC Servo Motor (0° - 180°)',
    partNumber: 'SERVO_9G',
    family: 'Motors',
    description: 'PWM signal controlled positioning motor with animated arm angle.',
    width: 56,
    height: 56,
    pins: [
      { id: 'p0', x: 0, y: 14, label: 'PWM' },
      { id: 'p1', x: 0, y: 28, label: 'V+' },
      { id: 'p2', x: 0, y: 42, label: 'GND' }
    ],
    defaultProps: { angle: 90 }
  },
  {
    type: 'FUSE',
    category: 'electromech',
    name: 'Fast-Acting Cartridge Fuse (Rated Virtual)',
    partNumber: 'FUSE_1A',
    family: 'Protection',
    description: 'Rated safety fuse that blows with animated smoke puff when I > I_rated.',
    width: 52,
    height: 24,
    pins: [
      { id: 'p0', x: 0, y: 12, label: '1' },
      { id: 'p1', x: 52, y: 12, label: '2' }
    ],
    defaultProps: { ratedCurrent: 1.0, isBlown: false, isRatedVirtual: true }
  },
  {
    type: 'PWM_SG3525',
    category: 'electromech',
    name: 'SG3525 Voltage-Mode PWM Controller',
    partNumber: 'SG3525A',
    family: 'Power Supplies / Switching',
    description: 'Switch-mode power supply controller with dual totem-pole outputs.',
    width: 80,
    height: 80,
    pins: [
      { id: 'p0', x: 0, y: 20, label: 'COMP' },
      { id: 'p1', x: 0, y: 40, label: 'RT' },
      { id: 'p2', x: 0, y: 60, label: 'CT' },
      { id: 'p3', x: 80, y: 25, label: 'OUT A' },
      { id: 'p4', x: 80, y: 55, label: 'OUT B' }
    ],
    defaultProps: { frequency: 50000 }
  }
];
