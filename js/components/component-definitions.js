/**
 * Multisim Web - Component Catalog & Symbol Definitions
 * Covers all 11 document categories plus Virtual, Real, Rated Virtual, and 3D modes.
 */

export const COMPONENT_CATEGORIES = [
  { id: 'sources', name: '1. Sources', icon: 'zap' },
  { id: 'basic', name: '2. Basic (Passives & Switches)', icon: 'sliders' },
  { id: 'diodes', name: '3. Diodes & Rectifiers', icon: 'play' },
  { id: 'transistors', name: '4. Transistors (BJT/FET/MOS)', icon: 'cpu' },
  { id: 'analog', name: '5. Analog (Op-Amps & Regs)', icon: 'activity' },
  { id: 'ttl', name: '6. TTL Logic (7400 Series)', icon: 'hash' },
  { id: 'cmos', name: '7. CMOS Logic (4000 Series)', icon: 'grid' },
  { id: 'mixed', name: '8. Mixed & Signal (555, ADC)', icon: 'clock' },
  { id: 'indicators', name: '9. Indicators & Displays', icon: 'eye' },
  { id: 'sensors', name: '10. Sensors & Peripherals', icon: 'sun' },
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
    spiceModel: '0V Ref',
    description: 'Universal 0V reference node for MNA circuit solver.',
    width: 32,
    height: 32,
    pins: [{ id: 'p0', x: 16, y: 0, label: 'GND', isGround: true }],
    defaultProps: {}
  },
  {
    type: 'DIGITAL_GROUND',
    category: 'sources',
    name: 'Digital Ground',
    partNumber: 'DGND',
    family: 'Power Sources',
    description: 'Isolated digital logic ground plane.',
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
    description: 'Standard +5.0V regulated DC voltage source.',
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
    description: 'Adjustable DC voltage source with internal resistance.',
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
    description: 'Sinusoidal AC power generator with RMS voltage and frequency.',
    width: 48,
    height: 48,
    pins: [
      { id: 'p0', x: 24, y: 0, label: '~' },
      { id: 'p1', x: 24, y: 48, label: '~' }
    ],
    defaultProps: { voltage: 120.0, frequency: 60.0, phase: 0 }
  },
  {
    type: 'DIGITAL_CLOCK',
    category: 'sources',
    name: 'Digital Clock Voltage',
    partNumber: 'DIGITAL_CLOCK',
    family: 'Signal Sources',
    description: 'High-speed square-wave digital clock generator.',
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
    description: 'Adjustable pulse wave generator (pulse width, rise time).',
    width: 48,
    height: 48,
    pins: [
      { id: 'p0', x: 24, y: 0, label: '+' },
      { id: 'p1', x: 24, y: 48, label: '-' }
    ],
    defaultProps: { frequency: 500.0, vHigh: 5.0, vLow: 0.0, pulseWidth: 0.0004 }
  },
  {
    type: 'SINE_GEN',
    category: 'sources',
    name: 'Function / Sine Generator',
    partNumber: 'SINE_SOURCE',
    family: 'Signal Sources',
    description: 'Precision sinusoidal audio and RF signal generator.',
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
    partNumber: 'VCVS_GEN',
    family: 'Controlled Sources',
    description: 'Dependent voltage source: Vout = Gain * (Vctrl+ - Vctrl-).',
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

  // ================= 2. BASIC =================
  {
    type: 'RESISTOR',
    category: 'basic',
    name: 'Resistor',
    partNumber: 'RESISTOR',
    family: 'Passives',
    description: 'Linear resistor with rated power dissipation.',
    width: 56,
    height: 24,
    pins: [
      { id: 'p0', x: 0, y: 12, label: '1' },
      { id: 'p1', x: 56, y: 12, label: '2' }
    ],
    defaultProps: { resistance: 1000, maxPower: 0.25, isRatedVirtual: false }
  },
  {
    type: 'POTENTIOMETER',
    category: 'basic',
    name: 'Potentiometer (Interactive)',
    partNumber: 'POTENTIOMETER',
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
    description: 'Ideal / rated non-polarized ceramic capacitor.',
    width: 48,
    height: 32,
    pins: [
      { id: 'p0', x: 0, y: 16, label: '1' },
      { id: 'p1', x: 48, y: 16, label: '2' }
    ],
    defaultProps: { capacitance: 1e-7, maxVoltage: 50, isRatedVirtual: false }
  },
  {
    type: 'CAPACITOR_ELECTROLYTIC',
    category: 'basic',
    name: 'Capacitor (Electrolytic Polarized)',
    partNumber: 'CAP_ELECTRO',
    family: 'Passives',
    description: 'High-value polarized electrolytic smoothing capacitor.',
    width: 48,
    height: 32,
    pins: [
      { id: 'p0', x: 0, y: 16, label: '+' },
      { id: 'p1', x: 48, y: 16, label: '-' }
    ],
    defaultProps: { capacitance: 4.7e-5, maxVoltage: 25, isRatedVirtual: true }
  },
  {
    type: 'INDUCTOR',
    category: 'basic',
    name: 'Inductor',
    partNumber: 'INDUCTOR',
    family: 'Passives',
    description: 'Coil inductor with energy storage companion model.',
    width: 56,
    height: 28,
    pins: [
      { id: 'p0', x: 0, y: 14, label: '1' },
      { id: 'p1', x: 56, y: 14, label: '2' }
    ],
    defaultProps: { inductance: 1e-3 }
  },
  {
    type: 'TRANSFORMER',
    category: 'basic',
    name: 'Linear Transformer',
    partNumber: 'XFRM_LINEAR',
    family: 'Magnetic / Inductive',
    description: 'Primary to secondary linear mutual inductive transformer.',
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
    type: 'SWITCH_SPST',
    category: 'basic',
    name: 'SPST Toggle Switch',
    partNumber: 'SPST_SWITCH',
    family: 'Switches & Relays',
    description: 'Single-Pole Single-Throw toggle switch (clickable).',
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
    partNumber: 'SPDT_SWITCH',
    family: 'Switches & Relays',
    description: 'Single-Pole Double-Throw switch with selectable branch.',
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
    type: 'PUSH_BUTTON_NO',
    category: 'basic',
    name: 'Push Button (Normally Open)',
    partNumber: 'PB_NO',
    family: 'Switches & Relays',
    description: 'Momentary tactile push button (press to close).',
    width: 48,
    height: 32,
    pins: [
      { id: 'p0', x: 0, y: 16, label: '1' },
      { id: 'p1', x: 48, y: 16, label: '2' }
    ],
    defaultProps: { isOpen: true }
  },
  {
    type: 'RELAY_SPDT',
    category: 'basic',
    name: 'Electromechanical Relay SPDT',
    partNumber: 'RELAY_12V',
    family: 'Switches & Relays',
    description: 'Magnetic coil activated switch with NO and NC contacts.',
    width: 64,
    height: 56,
    pins: [
      { id: 'p0', x: 0, y: 14, label: 'Coil1' },
      { id: 'p1', x: 0, y: 42, label: 'Coil2' },
      { id: 'p2', x: 64, y: 28, label: 'COM' },
      { id: 'p3', x: 64, y: 12, label: 'NC' },
      { id: 'p4', x: 64, y: 44, label: 'NO' }
    ],
    defaultProps: { pullInVoltage: 3.5, energized: false }
  },

  // ================= 3. DIODES =================
  {
    type: 'DIODE_1N4007',
    category: 'diodes',
    name: '1N4007 Standard Rectifier',
    partNumber: '1N4007',
    family: 'Diodes',
    description: '1A 1000V Silicon power rectifier diode.',
    width: 48,
    height: 28,
    pins: [
      { id: 'p0', x: 0, y: 14, label: 'A' },
      { id: 'p1', x: 48, y: 14, label: 'K' }
    ],
    defaultProps: { forwardVoltage: 0.7, maxCurrent: 1.0 }
  },
  {
    type: 'DIODE_1N4148',
    category: 'diodes',
    name: '1N4148 Fast Switching Diode',
    partNumber: '1N4148',
    family: 'Diodes',
    description: 'High-speed small signal diode (4ns recovery).',
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
    name: '1N4733A Zener Diode (5.1V)',
    partNumber: '1N4733A',
    family: 'Zener Diodes',
    description: '5.1V 1W precision voltage reference zener diode.',
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
    name: '1N4742A Zener Diode (12.0V)',
    partNumber: '1N4742A',
    family: 'Zener Diodes',
    description: '12V 1W voltage regulator zener diode.',
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
    name: '1N5819 Schottky Diode',
    partNumber: '1N5819',
    family: 'Schottky & Fast Recovery',
    description: 'Low forward drop (0.35V) high-efficiency Schottky diode.',
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
    description: 'Red light-emitting diode with animated brightness bloom.',
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
    name: 'LED (Green High-Efficiency)',
    partNumber: 'LED_GREEN',
    family: 'LEDs',
    description: 'Emerald green LED with animated luminous flux.',
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
    name: 'LED (Blue Superbright)',
    partNumber: 'LED_BLUE',
    family: 'LEDs',
    description: 'Vibrant blue LED (3.2V forward drop).',
    width: 48,
    height: 32,
    pins: [
      { id: 'p0', x: 0, y: 16, label: 'A' },
      { id: 'p1', x: 48, y: 16, label: 'K' }
    ],
    defaultProps: { forwardVoltage: 3.2, color: '#3b82f6', brightness: 0 }
  },
  {
    type: 'BRIDGE_RECTIFIER',
    category: 'diodes',
    name: 'Bridge Rectifier (4-Pin)',
    partNumber: 'KBP307',
    family: 'Bridge Rectifiers',
    description: 'Monolithic full-wave 4-pin diode bridge package.',
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
    description: 'High-speed NPN switching and small-signal amplifier transistor.',
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
    type: 'BJT_NPN_BC547',
    category: 'transistors',
    name: 'BC547 Low-Noise NPN BJT',
    partNumber: 'BC547',
    family: 'BJT (NPN)',
    description: 'General purpose low-noise audio pre-amp transistor.',
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
    type: 'BJT_PNP_2N2907',
    category: 'transistors',
    name: '2N2907 PNP BJT Transistor',
    partNumber: '2N2907',
    family: 'BJT (PNP)',
    description: 'Complementary PNP transistor for push-pull stages.',
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
    type: 'MOSFET_N_IRF540',
    category: 'transistors',
    name: 'IRF540 N-Channel Power MOSFET',
    partNumber: 'IRF540N',
    family: 'MOSFETs',
    description: '100V 33A 44mOhm power switching MOSFET.',
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
    description: 'Small signal N-channel enhancement mode MOSFET.',
    width: 52,
    height: 52,
    pins: [
      { id: 'p0', x: 40, y: 0, label: 'D' },
      { id: 'p1', x: 0, y: 36, label: 'G' },
      { id: 'p2', x: 40, y: 52, label: 'S' }
    ],
    defaultProps: { vth: 2.1, k: 0.3 }
  },

  // ================= 5. ANALOG =================
  {
    type: 'OPAMP_741',
    category: 'analog',
    name: 'uA741 Operational Amplifier (5-Pin)',
    partNumber: 'uA741CN',
    family: 'Operational Amplifiers',
    description: 'Industry standard internally compensated general op-amp.',
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
    name: 'Virtual Op-Amp (3-Terminal)',
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
    type: 'COMPARATOR_LM393',
    category: 'analog',
    name: 'LM393 Dual Precision Comparator',
    partNumber: 'LM393',
    family: 'Comparators',
    description: 'Open-collector high-speed voltage comparator.',
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
    type: 'VOLTAGE_REG_7805',
    category: 'analog',
    name: 'LM7805 +5V Linear Regulator',
    partNumber: 'LM7805',
    family: 'Voltage Regulators',
    description: 'Positive 3-terminal fixed +5V 1.5A voltage regulator.',
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
    name: 'LM317 Adjustable Regulator',
    partNumber: 'LM317',
    family: 'Voltage Regulators',
    description: '1.2V to 37V adjustable positive voltage regulator.',
    width: 64,
    height: 48,
    pins: [
      { id: 'p0', x: 0, y: 16, label: 'VIN' },
      { id: 'p1', x: 32, y: 48, label: 'ADJ' },
      { id: 'p2', x: 64, y: 16, label: 'VOUT' }
    ],
    defaultProps: { calculatedVout: 5.0 }
  },

  // ================= 6. TTL (7400 SERIES) =================
  {
    type: 'TTL_7408',
    category: 'ttl',
    name: '7408 Quad 2-Input AND Gate',
    partNumber: '74LS08',
    family: 'Basic Gates',
    description: 'Standard 5V TTL 2-input positive AND logic gate.',
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
    description: 'Standard 5V TTL 2-input NAND logic gate with bubble invert.',
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
    description: 'Standard 5V TTL 2-input positive OR logic gate.',
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
    description: 'Standard 5V TTL 2-input NOR logic gate.',
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
    description: 'Standard 5V TTL single-input NOT inverter gate.',
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
    description: 'Exclusive-OR logic gate for binary arithmetic.',
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
    type: 'TTL_7490',
    category: 'ttl',
    name: '7490 Decade BCD Counter',
    partNumber: '74LS90',
    family: 'Counters & Shift Registers',
    description: '4-bit decade counter (MOD-10) with BCD outputs QA, QB, QC, QD.',
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
    description: 'BCD to 7-segment active-low open-collector display decoder.',
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

  // ================= 7. CMOS (4000 SERIES) =================
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

  // ================= 8. MIXED & SIGNAL =================
  {
    type: 'TIMER_555',
    category: 'mixed',
    name: 'NE555 Precision Timer IC',
    partNumber: 'NE555P',
    family: 'Timers',
    description: 'Monostable & Astable multivibrator timer with comparator triggers.',
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

  // ================= 9. INDICATORS & DISPLAYS =================
  {
    type: 'VOLTMETER_DC',
    category: 'indicators',
    name: 'DC Voltmeter Panel Meter',
    partNumber: 'VM_DC',
    family: 'Voltmeters & Ammeters',
    description: 'High-impedance (100MΩ) DC voltage digital readout meter.',
    width: 64,
    height: 40,
    pins: [
      { id: 'p0', x: 0, y: 20, label: '+' },
      { id: 'p1', x: 64, y: 20, label: '-' }
    ],
    defaultProps: {}
  },
  {
    type: 'AMMETER_DC',
    category: 'indicators',
    name: 'DC Ammeter Panel Meter',
    partNumber: 'AM_DC',
    family: 'Voltmeters & Ammeters',
    description: 'In-line ultra low-resistance (1mΩ) current readout meter.',
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
    partNumber: 'PROBE_LOGIC',
    family: 'Lamps & Probes',
    description: '3-state logic visualizer: Red (HIGH), Green (LOW), Gray (Hi-Z).',
    width: 36,
    height: 36,
    pins: [
      { id: 'p0', x: 0, y: 18, label: 'IN' }
    ],
    defaultProps: {}
  },
  {
    type: 'FILAMENT_LAMP',
    category: 'indicators',
    name: 'Filament Incandescent Lamp',
    partNumber: 'LAMP_12V',
    family: 'Lamps & Probes',
    description: 'Incandescent tungsten bulb with realistic thermal filament glow.',
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
    description: 'Individual 8-pin segment LED display with common ground.',
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
    type: 'DCD_HEX',
    category: 'indicators',
    name: 'Decoded Hex Display (DCD_HEX)',
    partNumber: 'DCD_HEX',
    family: 'Displays',
    description: 'Decoded 4-bit binary input display rendering 0 through F directly.',
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
    type: 'PIEZO_BUZZER',
    category: 'indicators',
    name: 'Piezo Buzzer (Audio Synthesizer)',
    partNumber: 'BUZZER_PIEZO',
    family: 'Buzzer / Audio',
    description: 'Acoustic transducer emitting real 2.4kHz sound via Web Audio API.',
    width: 48,
    height: 48,
    pins: [
      { id: 'p0', x: 0, y: 24, label: '+' },
      { id: 'p1', x: 48, y: 24, label: '-' }
    ],
    defaultProps: { buzzerActive: false }
  },

  // ================= 10. SENSORS & PERIPHERALS =================
  {
    type: 'LDR',
    category: 'sensors',
    name: 'LDR (Light Dependent Resistor)',
    partNumber: 'NORP12_LDR',
    family: 'Sensors',
    description: 'Cadmium-Sulfide (CdS) photoresistor with interactive Lux slider.',
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
    name: 'NTC Thermistor (Temperature Sensor)',
    partNumber: 'NTC_10K',
    family: 'Sensors',
    description: 'Negative Temperature Coefficient resistor with interactive °C slider.',
    width: 56,
    height: 36,
    pins: [
      { id: 'p0', x: 0, y: 18, label: '1' },
      { id: 'p1', x: 56, y: 18, label: '2' }
    ],
    defaultProps: { temperature: 25, currentResistance: 10000 }
  },

  // ================= 11. ELECTRO-MECHANICAL =================
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
    type: 'FUSE',
    category: 'electromech',
    name: 'Fast-Acting Cartridge Fuse',
    partNumber: 'FUSE_1A',
    family: 'Protection',
    description: 'Rated safety fuse that blows with smoke animation when I > I_rated.',
    width: 52,
    height: 24,
    pins: [
      { id: 'p0', x: 0, y: 12, label: '1' },
      { id: 'p1', x: 52, y: 12, label: '2' }
    ],
    defaultProps: { ratedCurrent: 1.0, isBlown: false, isRatedVirtual: true }
  }
];
