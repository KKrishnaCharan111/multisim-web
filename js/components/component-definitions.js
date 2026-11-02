/**
 * Multisim Web Studio - Comprehensive Component Catalog & Symbol Registry
 * Complete components for academic & professional electronic laboratory simulation.
 */

export const COMPONENT_CATEGORIES = [
  { id: 'sources', name: '1. Sources & Power', icon: 'zap' },
  { id: 'passives', name: '2. Passive Components (R, C, L)', icon: 'sliders' },
  { id: 'potentiometers', name: '3. Potentiometers (Variable R)', icon: 'disc' },
  { id: 'diodes', name: '4. Diodes & Rectifiers', icon: 'play' },
  { id: 'transistors', name: '5. Transistors & FETs', icon: 'cpu' },
  { id: 'opamps', name: '6. Operational Amplifiers (Op-Amps)', icon: 'activity' },
  { id: 'ttl', name: '7. TTL 7400 Series Logic', icon: 'hash' },
  { id: 'cmos', name: '8. CMOS 4000 Series Logic', icon: 'grid' },
  { id: 'mixed', name: '9. Mixed Signal & Timers', icon: 'clock' },
  { id: 'indicators', name: '10. Indicators & Optoelectronics', icon: 'eye' },
  { id: 'sensors_electromech', name: '11. Sensors & Electro-Mechanical', icon: 'settings' }
];

export const STANDARD_RESISTOR_VALUES = [
  { val: 470, label: '470 Ω' },
  { val: 1000, label: '1 kΩ' },
  { val: 1100, label: '1.1 kΩ' },
  { val: 1500, label: '1.5 kΩ' },
  { val: 2000, label: '2 kΩ' },
  { val: 2300, label: '2.3 kΩ' },
  { val: 3000, label: '3 kΩ' },
  { val: 3300, label: '3.3 kΩ' },
  { val: 3900, label: '3.9 kΩ' },
  { val: 5000, label: '5 kΩ' },
  { val: 6000, label: '6 kΩ' },
  { val: 6800, label: '6.8 kΩ' },
  { val: 10000, label: '10 kΩ' },
  { val: 14000, label: '14 kΩ' },
  { val: 15000, label: '15 kΩ' },
  { val: 16000, label: '16 kΩ' },
  { val: 18000, label: '18 kΩ' },
  { val: 22000, label: '22 kΩ' },
  { val: 82000, label: '82 kΩ' },
  { val: 100000, label: '100 kΩ' },
  { val: 470000, label: '470 kΩ' }
];

export const STANDARD_CAPACITOR_VALUES = [
  { val: 10e-12, label: '10 pF', type: 'CAPACITOR' },
  { val: 28e-12, label: '28 pF', type: 'CAPACITOR' },
  { val: 720e-12, label: '720 pF', type: 'CAPACITOR' },
  { val: 1e-9, label: '1000 pF (1 nF)', type: 'CAPACITOR' },
  { val: 2.2e-9, label: '2200 pF (2.2 nF)', type: 'CAPACITOR' },
  { val: 10e-9, label: '0.01 µF (10 nF)', type: 'CAPACITOR' },
  { val: 0.1e-6, label: '0.1 µF', type: 'CAPACITOR' },
  { val: 0.47e-6, label: '0.47 µF', type: 'CAPACITOR' },
  { val: 1e-6, label: '1 µF', type: 'CAPACITOR' },
  { val: 10e-6, label: '10 µF', type: 'CAPACITOR_ELECTROLYTIC' },
  { val: 28e-6, label: '28 µF', type: 'CAPACITOR_ELECTROLYTIC' },
  { val: 47e-6, label: '47 µF (Electrolytic)', type: 'CAPACITOR_ELECTROLYTIC' },
  { val: 720e-6, label: '720 µF', type: 'CAPACITOR_ELECTROLYTIC' }
];

export const STANDARD_INDUCTOR_VALUES = [
  { val: 1e-3, label: '1 mH' },
  { val: 2.2e-3, label: '2.2 mH' }
];

export const COMPONENT_CATALOG = [
  // ================= 1. SOURCES & POWER =================
  {
    type: 'GROUND',
    category: 'sources',
    name: 'Ground (0V Reference)',
    partNumber: 'GND',
    family: 'Power Sources',
    description: 'Earth / 0V reference node for MNA circuit solver.',
    width: 32,
    height: 32,
    pins: [{ id: 'p0', x: 16, y: 0, label: 'GND', isGround: true }],
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
    defaultProps: { voltage: 12.0, frequency: 50.0, phase: 0 }
  },
  {
    type: 'THREE_PHASE_SOURCE',
    category: 'sources',
    name: '3-Phase AC Power Source',
    partNumber: '3PHASE_SRC',
    family: 'Power Sources',
    description: '3-Phase source (Phase A, B, C at 120° offsets, Neutral).',
    width: 64,
    height: 64,
    pins: [
      { id: 'p0', x: 64, y: 12, label: 'Phase A' },
      { id: 'p1', x: 64, y: 28, label: 'Phase B' },
      { id: 'p2', x: 64, y: 44, label: 'Phase C' },
      { id: 'p3', x: 0, y: 28, label: 'N' }
    ],
    defaultProps: { voltage: 120.0, frequency: 50.0 }
  },
  {
    type: 'DIGITAL_CLOCK',
    category: 'sources',
    name: 'Clock Voltage (DIGITAL_CLOCK)',
    partNumber: 'DIGITAL_CLOCK',
    family: 'Signal Sources',
    description: 'Digital logic square-wave clock generator.',
    width: 48,
    height: 48,
    pins: [
      { id: 'p0', x: 48, y: 24, label: 'CLK' },
      { id: 'p1', x: 0, y: 24, label: 'GND' }
    ],
    defaultProps: { frequency: 1000.0, vHigh: 5.0, vLow: 0.0, dutyCycle: 0.5 }
  },
  {
    type: 'SINE_GEN',
    category: 'sources',
    name: 'Sine / Function Generator',
    partNumber: 'SINE_GEN',
    family: 'Signal Sources',
    description: 'Audio & RF precision sinusoidal function generator.',
    width: 48,
    height: 48,
    pins: [
      { id: 'p0', x: 24, y: 0, label: '+' },
      { id: 'p1', x: 24, y: 48, label: '-' }
    ],
    defaultProps: { amplitude: 2.5, frequency: 1000.0, offset: 0 }
  },

  // ================= 2. PASSIVE COMPONENTS (R, C, L) =================
  {
    type: 'RESISTOR',
    category: 'passives',
    name: 'Resistor (Custom Value)',
    partNumber: 'RESISTOR',
    family: 'Resistors',
    description: 'Linear resistor. Double-click on canvas to enter ANY value (e.g. 2.3k, 14k, 82k).',
    width: 56,
    height: 24,
    pins: [
      { id: 'p0', x: 0, y: 12, label: '1' },
      { id: 'p1', x: 56, y: 12, label: '2' }
    ],
    defaultProps: { resistance: 1000, label: 'R1' }
  },
  // Populate all user-requested standard resistor entries
  ...STANDARD_RESISTOR_VALUES.map((r, i) => ({
    type: 'RESISTOR',
    category: 'passives',
    name: `Resistor ${r.label}`,
    partNumber: `R_${r.label.replace(/\s+/g, '')}`,
    family: 'Standard Resistors',
    description: `Fixed ${r.label} film resistor. Fully adjustable.`,
    width: 56,
    height: 24,
    pins: [
      { id: 'p0', x: 0, y: 12, label: '1' },
      { id: 'p1', x: 56, y: 12, label: '2' }
    ],
    defaultProps: { resistance: r.val, label: `R_${r.label}` }
  })),

  // Capacitors
  {
    type: 'CAPACITOR',
    category: 'passives',
    name: 'Capacitor (Custom Value)',
    partNumber: 'CAPACITOR',
    family: 'Capacitors',
    description: 'Ceramic capacitor. Double-click on canvas to enter ANY value (e.g. 28pF, 10nF).',
    width: 48,
    height: 32,
    pins: [
      { id: 'p0', x: 0, y: 16, label: '1' },
      { id: 'p1', x: 48, y: 16, label: '2' }
    ],
    defaultProps: { capacitance: 1e-7, label: 'C1' }
  },
  ...STANDARD_CAPACITOR_VALUES.map((c, i) => ({
    type: c.type,
    category: 'passives',
    name: `Capacitor ${c.label}`,
    partNumber: `C_${c.label.replace(/[^a-zA-Z0-9]/g, '')}`,
    family: 'Standard Capacitors',
    description: `Standard ${c.label} capacitor.`,
    width: 48,
    height: 32,
    pins: [
      { id: 'p0', x: 0, y: 16, label: c.type === 'CAPACITOR_ELECTROLYTIC' ? '+' : '1' },
      { id: 'p1', x: 48, y: 16, label: c.type === 'CAPACITOR_ELECTROLYTIC' ? '-' : '2' }
    ],
    defaultProps: { capacitance: c.val, label: `C_${c.label}` }
  })),

  // Inductors
  {
    type: 'INDUCTOR',
    category: 'passives',
    name: 'Inductor (Custom Value)',
    partNumber: 'INDUCTOR',
    family: 'Inductors',
    description: 'Coil inductor with energy storage companion model.',
    width: 56,
    height: 28,
    pins: [
      { id: 'p0', x: 0, y: 14, label: '1' },
      { id: 'p1', x: 56, y: 14, label: '2' }
    ],
    defaultProps: { inductance: 1e-3, label: 'L1' }
  },
  ...STANDARD_INDUCTOR_VALUES.map((ind) => ({
    type: 'INDUCTOR',
    category: 'passives',
    name: `Inductor ${ind.label}`,
    partNumber: `L_${ind.label.replace(/\s+/g, '')}`,
    family: 'Standard Inductors',
    description: `Fixed ${ind.label} coil inductor.`,
    width: 56,
    height: 28,
    pins: [
      { id: 'p0', x: 0, y: 14, label: '1' },
      { id: 'p1', x: 56, y: 14, label: '2' }
    ],
    defaultProps: { inductance: ind.val, label: `L_${ind.label}` }
  })),

  // ================= 3. POTENTIOMETERS =================
  {
    type: 'POTENTIOMETER',
    category: 'potentiometers',
    name: '1k Potentiometer (Variable Resistor)',
    partNumber: 'POT_1K',
    family: 'Potentiometers',
    description: '1 kΩ 3-terminal variable resistor with draggable wiper slider.',
    width: 64,
    height: 40,
    pins: [
      { id: 'p0', x: 0, y: 12, label: 'A' },
      { id: 'p1', x: 32, y: 40, label: 'Wiper' },
      { id: 'p2', x: 64, y: 12, label: 'B' }
    ],
    defaultProps: { resistance: 1000, sliderValue: 0.5, label: 'POT 1k' }
  },
  {
    type: 'POTENTIOMETER',
    category: 'potentiometers',
    name: '10k Potentiometer (Variable Resistor)',
    partNumber: 'POT_10K',
    family: 'Potentiometers',
    description: '10 kΩ 3-terminal variable resistor with draggable wiper slider.',
    width: 64,
    height: 40,
    pins: [
      { id: 'p0', x: 0, y: 12, label: 'A' },
      { id: 'p1', x: 32, y: 40, label: 'Wiper' },
      { id: 'p2', x: 64, y: 12, label: 'B' }
    ],
    defaultProps: { resistance: 10000, sliderValue: 0.5, label: 'POT 10k' }
  },
  {
    type: 'POTENTIOMETER',
    category: 'potentiometers',
    name: '100k Potentiometer (Variable Resistor)',
    partNumber: 'POT_100K',
    family: 'Potentiometers',
    description: '100 kΩ 3-terminal variable resistor with draggable wiper slider.',
    width: 64,
    height: 40,
    pins: [
      { id: 'p0', x: 0, y: 12, label: 'A' },
      { id: 'p1', x: 32, y: 40, label: 'Wiper' },
      { id: 'p2', x: 64, y: 12, label: 'B' }
    ],
    defaultProps: { resistance: 100000, sliderValue: 0.5, label: 'POT 100k' }
  },

  // ================= 4. DIODES & RECTIFIERS =================
  {
    type: 'DIODE_1N4007',
    category: 'diodes',
    name: '1N4007 / 1N4007A Silicon Rectifier Diode',
    partNumber: '1N4007',
    family: 'Diodes',
    description: '1A 1000V Silicon power rectifier diode (exact requested part).',
    width: 48,
    height: 28,
    pins: [
      { id: 'p0', x: 0, y: 14, label: 'A' },
      { id: 'p1', x: 48, y: 14, label: 'K' }
    ],
    defaultProps: { forwardVoltage: 0.7, maxCurrent: 1.0, label: '1N4007' }
  },
  {
    type: 'DIODE_1N4001',
    category: 'diodes',
    name: '1N4001 Silicon Rectifier (50V 1A)',
    partNumber: '1N4001',
    family: 'Diodes',
    description: '50V 1A power rectifier diode.',
    width: 48,
    height: 28,
    pins: [
      { id: 'p0', x: 0, y: 14, label: 'A' },
      { id: 'p1', x: 48, y: 14, label: 'K' }
    ],
    defaultProps: { forwardVoltage: 0.7, label: '1N4001' }
  },
  {
    type: 'DIODE_1N4148',
    category: 'diodes',
    name: '1N4148 Fast Switching Diode',
    partNumber: '1N4148',
    family: 'Diodes',
    description: 'High-speed 4ns recovery signal diode.',
    width: 48,
    height: 28,
    pins: [
      { id: 'p0', x: 0, y: 14, label: 'A' },
      { id: 'p1', x: 48, y: 14, label: 'K' }
    ],
    defaultProps: { forwardVoltage: 0.7, label: '1N4148' }
  },
  {
    type: 'ZENER_1N4733A',
    category: 'diodes',
    name: '1N4733A Zener Diode (5.1V 1W)',
    partNumber: '1N4733A',
    family: 'Zener Diodes',
    description: '5.1V voltage regulator / clamp zener diode.',
    width: 48,
    height: 28,
    pins: [
      { id: 'p0', x: 0, y: 14, label: 'A' },
      { id: 'p1', x: 48, y: 14, label: 'K' }
    ],
    defaultProps: { zenerVoltage: 5.1, label: '5.1V Zener' }
  },
  {
    type: 'BRIDGE_RECTIFIER',
    category: 'diodes',
    name: 'Bridge Rectifier (KBP307 4-Pin Package)',
    partNumber: 'KBP307',
    family: 'Bridge Rectifiers',
    description: 'Full-wave monolithic bridge rectifier.',
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

  // ================= 5. TRANSISTORS & FETS =================
  {
    type: 'BJT_NPN_BC107',
    category: 'transistors',
    name: 'BC107 Low-Noise Audio NPN BJT',
    partNumber: 'BC107',
    family: 'BJT (NPN)',
    description: 'Metal-can TO-18 low-noise audio pre-amp transistor (Beta ~180).',
    width: 48,
    height: 48,
    pins: [
      { id: 'p0', x: 36, y: 0, label: 'C' },
      { id: 'p1', x: 0, y: 24, label: 'B' },
      { id: 'p2', x: 36, y: 48, label: 'E' }
    ],
    defaultProps: { beta: 180, label: 'BC107' }
  },
  {
    type: 'BJT_NPN_BC147',
    category: 'transistors',
    name: 'BC147 Small Signal NPN BJT',
    partNumber: 'BC147',
    family: 'BJT (NPN)',
    description: 'General purpose small-signal amplifier NPN transistor (Beta ~200).',
    width: 48,
    height: 48,
    pins: [
      { id: 'p0', x: 36, y: 0, label: 'C' },
      { id: 'p1', x: 0, y: 24, label: 'B' },
      { id: 'p2', x: 36, y: 48, label: 'E' }
    ],
    defaultProps: { beta: 200, label: 'BC147' }
  },
  {
    type: 'BJT_NPN_BC547',
    category: 'transistors',
    name: 'BC547 General Purpose NPN BJT',
    partNumber: 'BC547',
    family: 'BJT (NPN)',
    description: 'Industry-standard 45V 100mA NPN amplifier transistor (Beta ~250).',
    width: 48,
    height: 48,
    pins: [
      { id: 'p0', x: 36, y: 0, label: 'C' },
      { id: 'p1', x: 0, y: 24, label: 'B' },
      { id: 'p2', x: 36, y: 48, label: 'E' }
    ],
    defaultProps: { beta: 250, label: 'BC547' }
  },
  {
    type: 'BJT_NPN_BF194',
    category: 'transistors',
    name: 'BF194 / BF494 RF / IF Amplifier NPN BJT',
    partNumber: 'BF194',
    family: 'BJT (NPN)',
    description: 'High-frequency VHF/IF amplifier and oscillator transistor (260MHz).',
    width: 48,
    height: 48,
    pins: [
      { id: 'p0', x: 36, y: 0, label: 'C' },
      { id: 'p1', x: 0, y: 24, label: 'B' },
      { id: 'p2', x: 36, y: 48, label: 'E' }
    ],
    defaultProps: { beta: 120, label: 'BF194' }
  },
  {
    type: 'BJT_NPN_2N2222',
    category: 'transistors',
    name: '2N2222 High-Speed NPN BJT',
    partNumber: '2N2222',
    family: 'BJT (NPN)',
    description: 'High-speed switching and audio amplifier transistor.',
    width: 48,
    height: 48,
    pins: [
      { id: 'p0', x: 36, y: 0, label: 'C' },
      { id: 'p1', x: 0, y: 24, label: 'B' },
      { id: 'p2', x: 36, y: 48, label: 'E' }
    ],
    defaultProps: { beta: 180, label: '2N2222' }
  },
  {
    type: 'BJT_PNP_2N2907',
    category: 'transistors',
    name: '2N2907 PNP Transistor',
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
    defaultProps: { beta: 150, label: '2N2907' }
  },
  {
    type: 'JFET_N_BFW11',
    category: 'transistors',
    name: 'BFW11 N-Channel JFET',
    partNumber: 'BFW11',
    family: 'JFETs',
    description: 'Low-noise RF and audio amplifier N-channel JFET (Vp ~ -2.5V, Idss ~ 7mA).',
    width: 50,
    height: 50,
    pins: [
      { id: 'p0', x: 38, y: 0, label: 'D' },
      { id: 'p1', x: 0, y: 25, label: 'G' },
      { id: 'p2', x: 38, y: 50, label: 'S' }
    ],
    defaultProps: { vPinchOff: -2.5, idss: 0.007, label: 'BFW11' }
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
    defaultProps: { vth: 3.2, k: 0.8, label: 'IRF540' }
  },

  // ================= 6. OPERATIONAL AMPLIFIERS (OP-AMPS) =================
  {
    type: 'OPAMP_741',
    category: 'opamps',
    name: 'IC 741 / LM741 Operational Amplifier (5-Pin)',
    partNumber: 'LM741',
    family: 'Operational Amplifiers',
    description: 'Internally compensated general-purpose op-amp (exact requested IC).',
    width: 64,
    height: 56,
    pins: [
      { id: 'p0', x: 0, y: 16, label: 'IN+' },
      { id: 'p1', x: 0, y: 40, label: 'IN-' },
      { id: 'p2', x: 64, y: 28, label: 'OUT' },
      { id: 'p3', x: 32, y: 0, label: 'V+' },
      { id: 'p4', x: 32, y: 56, label: 'V-' }
    ],
    defaultProps: { label: 'LM741' }
  },
  {
    type: 'OPAMP_LM358',
    category: 'opamps',
    name: 'LM358 Dual Low-Power Operational Amplifier',
    partNumber: 'LM358',
    family: 'Operational Amplifiers',
    description: 'Industry-standard dual single-supply op-amp (exact requested IC).',
    width: 64,
    height: 56,
    pins: [
      { id: 'p0', x: 0, y: 16, label: 'IN+' },
      { id: 'p1', x: 0, y: 40, label: 'IN-' },
      { id: 'p2', x: 64, y: 28, label: 'OUT' },
      { id: 'p3', x: 32, y: 0, label: 'V+' },
      { id: 'p4', x: 32, y: 56, label: 'GND/V-' }
    ],
    defaultProps: { label: 'LM358' }
  },
  {
    type: 'OPAMP_3T_VIRTUAL',
    category: 'opamps',
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
    defaultProps: { label: 'OPAMP_VIRT' }
  },

  // ================= 7. TTL 7400 SERIES LOGIC =================
  {
    type: 'TTL_7408',
    category: 'ttl',
    name: '7408 Quad 2-Input AND Gate',
    partNumber: '74LS08',
    family: 'Basic Gates',
    description: 'Standard 5V TTL positive AND logic gate.',
    width: 56,
    height: 40,
    pins: [
      { id: 'p0', x: 0, y: 12, label: 'A' },
      { id: 'p1', x: 0, y: 28, label: 'B' },
      { id: 'p2', x: 56, y: 20, label: 'Y' }
    ],
    defaultProps: { gateType: 'AND', label: '7408' }
  },
  {
    type: 'TTL_7400',
    category: 'ttl',
    name: '7400 Quad 2-Input NAND Gate',
    partNumber: '74LS00',
    family: 'Basic Gates',
    description: 'Standard 5V TTL 2-input NAND logic gate.',
    width: 56,
    height: 40,
    pins: [
      { id: 'p0', x: 0, y: 12, label: 'A' },
      { id: 'p1', x: 0, y: 28, label: 'B' },
      { id: 'p2', x: 56, y: 20, label: 'Y' }
    ],
    defaultProps: { gateType: 'NAND', label: '7400' }
  },
  {
    type: 'TTL_7432',
    category: 'ttl',
    name: '7432 Quad 2-Input OR Gate',
    partNumber: '74LS32',
    family: 'Basic Gates',
    description: 'Standard 5V TTL positive OR logic gate.',
    width: 56,
    height: 40,
    pins: [
      { id: 'p0', x: 0, y: 12, label: 'A' },
      { id: 'p1', x: 0, y: 28, label: 'B' },
      { id: 'p2', x: 56, y: 20, label: 'Y' }
    ],
    defaultProps: { gateType: 'OR', label: '7432' }
  },
  {
    type: 'TTL_7404',
    category: 'ttl',
    name: '7404 Hex Inverter (NOT Gate)',
    partNumber: '74LS04',
    family: 'Basic Gates',
    description: 'Standard 5V TTL NOT logic gate.',
    width: 48,
    height: 32,
    pins: [
      { id: 'p0', x: 0, y: 16, label: 'A' },
      { id: 'p1', x: 48, y: 16, label: 'Y' }
    ],
    defaultProps: { gateType: 'NOT', label: '7404' }
  },
  {
    type: 'TTL_7486',
    category: 'ttl',
    name: '7486 Quad 2-Input XOR Gate',
    partNumber: '74LS86',
    family: 'Basic Gates',
    description: 'Standard 5V TTL Exclusive-OR logic gate.',
    width: 56,
    height: 40,
    pins: [
      { id: 'p0', x: 0, y: 12, label: 'A' },
      { id: 'p1', x: 0, y: 28, label: 'B' },
      { id: 'p2', x: 56, y: 20, label: 'Y' }
    ],
    defaultProps: { gateType: 'XOR', label: '7486' }
  },

  // ================= 8. CMOS 4000 SERIES LOGIC =================
  {
    type: 'CMOS_4017',
    category: 'cmos',
    name: '4017 Decade Counter / Divider',
    partNumber: 'CD4017B',
    family: 'Counters',
    description: 'Decade counter with 10 decoded active-high outputs.',
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
    defaultProps: { count: 0, label: '4017' }
  },

  // ================= 9. MIXED SIGNAL & TIMERS =================
  {
    type: 'TIMER_555',
    category: 'mixed',
    name: 'NE555 Precision Timer IC',
    partNumber: 'NE555P',
    family: 'Timers',
    description: 'Precision timer IC for astable & monostable multivibrators.',
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
    defaultProps: { label: 'NE555' }
  },

  // ================= 10. INDICATORS & OPTOELECTRONICS =================
  {
    type: 'LED_RED',
    category: 'indicators',
    name: 'LED (Light Emitting Diode - Red)',
    partNumber: 'LED_RED',
    family: 'Optoelectronics',
    description: 'Red indicator LED with dynamic luminous glow.',
    width: 48,
    height: 32,
    pins: [
      { id: 'p0', x: 0, y: 16, label: 'A' },
      { id: 'p1', x: 48, y: 16, label: 'K' }
    ],
    defaultProps: { forwardVoltage: 1.8, color: '#ef4444', brightness: 0, label: 'LED Red' }
  },
  {
    type: 'LED_GREEN',
    category: 'indicators',
    name: 'LED (Light Emitting Diode - Green)',
    partNumber: 'LED_GREEN',
    family: 'Optoelectronics',
    description: 'Emerald green indicator LED.',
    width: 48,
    height: 32,
    pins: [
      { id: 'p0', x: 0, y: 16, label: 'A' },
      { id: 'p1', x: 48, y: 16, label: 'K' }
    ],
    defaultProps: { forwardVoltage: 2.1, color: '#22c55e', brightness: 0, label: 'LED Green' }
  },
  {
    type: 'FILAMENT_LAMP',
    category: 'indicators',
    name: 'Lamp / Bulb (12V Incandescent)',
    partNumber: 'LAMP_12V',
    family: 'Indicators',
    description: '12V filament bulb with dynamic thermal inertia and warm glow.',
    width: 48,
    height: 48,
    pins: [
      { id: 'p0', x: 0, y: 24, label: '1' },
      { id: 'p1', x: 48, y: 24, label: '2' }
    ],
    defaultProps: { filamentTemp: 300, brightness: 0, label: '12V Bulb' }
  },
  {
    type: 'DCD_HEX',
    category: 'indicators',
    name: 'Decoded Hex Display (DCD_HEX)',
    partNumber: 'DCD_HEX',
    family: 'Displays',
    description: 'Decoded 4-bit display rendering 0 through F directly.',
    width: 56,
    height: 64,
    pins: [
      { id: 'p0', x: 0, y: 12, label: 'D0' },
      { id: 'p1', x: 0, y: 26, label: 'D1' },
      { id: 'p2', x: 0, y: 40, label: 'D2' },
      { id: 'p3', x: 0, y: 54, label: 'D3' }
    ],
    defaultProps: { displayedChar: '0', label: 'HEX' }
  },
  {
    type: 'VOLTMETER_DC',
    category: 'indicators',
    name: 'DC Voltmeter Panel Meter',
    partNumber: 'VM_DC',
    family: 'Meters',
    description: 'Digital DC voltmeter with high input impedance.',
    width: 64,
    height: 40,
    pins: [
      { id: 'p0', x: 0, y: 20, label: '+' },
      { id: 'p1', x: 64, y: 20, label: '-' }
    ],
    defaultProps: { label: 'DC Volts' }
  },
  {
    type: 'AMMETER_DC',
    category: 'indicators',
    name: 'DC Ammeter Panel Meter',
    partNumber: 'AM_DC',
    family: 'Meters',
    description: 'Low-impedance in-line current meter.',
    width: 64,
    height: 40,
    pins: [
      { id: 'p0', x: 0, y: 20, label: '+' },
      { id: 'p1', x: 64, y: 20, label: '-' }
    ],
    defaultProps: { label: 'DC Current' }
  },

  // ================= 11. SENSORS & ELECTRO-MECHANICAL =================
  {
    type: 'LDR',
    category: 'sensors_electromech',
    name: 'LDR (Light Dependent Resistor, 10–100k)',
    partNumber: 'LDR_10_100K',
    family: 'Sensors',
    description: 'CdS photoresistor (10kΩ bright to 100kΩ dark) with interactive lux slider.',
    width: 56,
    height: 36,
    pins: [
      { id: 'p0', x: 0, y: 18, label: '1' },
      { id: 'p1', x: 56, y: 18, label: '2' }
    ],
    defaultProps: { lux: 400, currentResistance: 25000, label: 'LDR' }
  },
  {
    type: 'RELAY_5V',
    category: 'sensors_electromech',
    name: 'Relay (5V Electromechanical SPDT)',
    partNumber: 'RELAY_5V',
    family: 'Relays',
    description: '5V coil activated switch with isolated Common, NO, and NC contacts.',
    width: 64,
    height: 56,
    pins: [
      { id: 'p0', x: 0, y: 14, label: 'Coil+' },
      { id: 'p1', x: 0, y: 42, label: 'Coil-' },
      { id: 'p2', x: 64, y: 28, label: 'COM' },
      { id: 'p3', x: 64, y: 12, label: 'NC' },
      { id: 'p4', x: 64, y: 44, label: 'NO' }
    ],
    defaultProps: { pullInVoltage: 3.5, energized: false, label: '5V Relay' }
  },
  {
    type: 'RELAY_12V',
    category: 'sensors_electromech',
    name: 'Relay (12V Electromechanical SPDT)',
    partNumber: 'RELAY_12V',
    family: 'Relays',
    description: '12V coil activated power relay.',
    width: 64,
    height: 56,
    pins: [
      { id: 'p0', x: 0, y: 14, label: 'Coil+' },
      { id: 'p1', x: 0, y: 42, label: 'Coil-' },
      { id: 'p2', x: 64, y: 28, label: 'COM' },
      { id: 'p3', x: 64, y: 12, label: 'NC' },
      { id: 'p4', x: 64, y: 44, label: 'NO' }
    ],
    defaultProps: { pullInVoltage: 8.5, energized: false, label: '12V Relay' }
  },
  {
    type: 'SWITCH_SPST',
    category: 'sensors_electromech',
    name: 'SPST Toggle Switch',
    partNumber: 'SPST',
    family: 'Switches',
    description: 'Single-Pole Single-Throw switch (click on canvas to toggle).',
    width: 48,
    height: 32,
    pins: [
      { id: 'p0', x: 0, y: 16, label: '1' },
      { id: 'p1', x: 48, y: 16, label: '2' }
    ],
    defaultProps: { isOpen: false, label: 'SW1' }
  },
  {
    type: 'DC_MOTOR',
    category: 'sensors_electromech',
    name: 'DC Permanent Magnet Motor (12V)',
    partNumber: 'DC_MOTOR_12V',
    family: 'Motors',
    description: 'Electromechanical motor with animated rotating shaft & live RPM gauge.',
    width: 56,
    height: 56,
    pins: [
      { id: 'p0', x: 0, y: 28, label: '+' },
      { id: 'p1', x: 56, y: 28, label: '-' }
    ],
    defaultProps: { rpm: 0, motorAngle: 0, label: 'Motor' }
  }
];
