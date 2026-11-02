# Multisim Web - Interactive Electronics Circuit Simulator

[![Live Demo](https://img.shields.io/badge/Live_Demo-Open_Multisim_Web-0284c7?style=for-the-badge&logo=google-chrome&logoColor=white)](https://kkrishnacharan111.github.io/multisim-web/)
[![GitHub Pages](https://img.shields.io/badge/GitHub_Pages-Active-22c55e?style=for-the-badge&logo=github)](https://kkrishnacharan111.github.io/multisim-web/)

> 🚀 **Live Web Application**: [https://kkrishnacharan111.github.io/multisim-web/](https://kkrishnacharan111.github.io/multisim-web/)

A high-fidelity, interactive web application replica of **NI Multisim** featuring a complete electronics component catalog, Modified Nodal Analysis (MNA) & transient SPICE-like simulation engine, dynamic current flow animations, interactive controls, and an instrument rack (4-Channel Oscilloscope, Digital Multimeter, and Property Inspector).

---

## ⚡ Key Highlights & Features

### 1. Complete Electronic Components (All 11 Document Categories)
- **Sources**: Ground (GND), Digital Ground, VCC (+5V), VDD (+12V), VEE (-12V), DC Power (Battery), AC Power, Digital Clock, Pulse Voltage, Sine/Function Generator, VCVS (Voltage-Controlled Voltage Source).
- **Basic (Passives & Switches)**: ANSI Zig-zag Resistors, Ceramic & Polarized Electrolytic Capacitors, Inductors, Linear Transformers, Potentiometers with draggable wiper sliders, SPST/SPDT knife switches, Push Buttons (NO/NC), and SPDT Relays.
- **Diodes & Rectifiers**: 1N4007 standard rectifiers, 1N4148 fast switching diodes, 1N4733A (5.1V) & 1N4742A (12V) Zener reference diodes, 1N5819 Schottky diodes, Monolithic 4-Pin Bridge Rectifiers (KBP307), and Multi-color LEDs (Red, Green, Blue, Yellow) with real-time luminous bloom.
- **Transistors**: BJTs (2N2222 NPN, BC547 NPN, 2N2907 PNP), Power MOSFETs (IRF540 N-channel, IRF9540 P-channel, 2N7000 small signal), and Darlingtons.
- **Analog ICs**: uA741 General-Purpose Op-Amp (5-terminal), Virtual 3-Terminal Op-Amp, LM393 / LM311 Precision Comparators, LM7805 (+5V) and LM7812 (+12V) Linear Regulators, LM317 Adjustable Regulator.
- **TTL (7400 Series Logic)**: 7400 (NAND), 7402 (NOR), 7404 (NOT Hex Inverter), 7408 (AND), 7432 (OR), 7486 (XOR), 7490 (Decade BCD Counter), 7447 (BCD to 7-Segment Decoder/Driver).
- **CMOS (4000 Series)**: 4017 Decade Counter / Divider with 10 decoded outputs, 4001, 4011, 4069.
- **Mixed & Signal Processing**: NE555 Precision Timer IC (with internal comparators, flip-flop, discharge transistor, and reset pin).
- **Indicators & Output Devices**: DC & AC Voltmeters, DC & AC Ammeters, 3-state Logic Probes (Red=High, Green=Low, Gray=Hi-Z), Incandescent Filament Lamp (with dynamic thermal inertia and warm glow), Decoded Hex Display (`DCD_HEX` rendering 0–F), 7-Segment Common Cathode/Anode Displays, and Acoustic Piezo Buzzer (with real-time Web Audio API frequency synthesis!).
- **Sensors & Advanced Peripherals**: LDR (Light-Dependent Resistor with interactive Lux slider), NTC Thermistor (with interactive °C temperature slider), Photodiodes.
- **Electro-Mechanical & Power**: DC Permanent Magnet Motor (with dynamic rotating 3-blade rotor animation & live RPM readout), Fast-Acting Cartridge Fuse (rated virtual mode: blows with animated smoke particles when $I > I_{\text{rated}}$!).

---

## 🔬 Virtual Instruments Rack

### 1. 4-Channel Digital Storage Oscilloscope (Agilent / Tektronix Style)
- **Timebase**: 100 µs/div to 500 ms/div.
- **Channels**: CH A (Cyan) and CH B (Yellow) with selectable Volts/Div (50 mV to 10 V/div) and probe pin selectors.
- **Trigger**: Rising/Falling edge trigger, selectable source, and adjustable threshold.
- **Dual Cursors**: Live $\Delta T$ and frequency readout.

### 2. Digital Multimeter (Fluke Style DMM)
- Large 7-segment digital display.
- Selectable modes: **V DC**, **V AC** (RMS), **I DC** (mA), **$\Omega$ Ohms**, **Diode Test**, and **Audible Continuity Beeper**.

### 3. Component Property Inspector
- Real-time parameter editing: adjust resistance ($\Omega$), capacitance ($\mu\text{F}$), voltage ($V$), frequency ($\text{Hz}$), fuse ratings, and labels.

---

## 🚀 Pre-Wired Example Circuits
1. **555 Timer Astable LED Flasher & Pulse Gen**: Astable multivibrator flashing an LED while the oscilloscope displays the square wave output and capacitor charging ramp.
2. **Full-Wave Bridge Rectifier + Zener 5.1V Regulator**: Stepping down AC, converting with a 4-pin bridge, filtering with $100\mu\text{F}$, and clamping to $5.1\text{V}$ with a Zener diode.
3. **2N2222 BJT Common-Emitter Audio Amplifier**: Voltage-divider biased amplifier demonstrating $180^\circ$ phase inversion and voltage gain.
4. **Digital Logic: 7490 Decade Counter + Hex Display**: Clock-driven digital counter advancing numbers 0–9.
5. **Operational Amplifier (LM741) Inverting Amplifier**: Sine wave input with closed-loop gain $A_v = -4.7$.
6. **DC Motor + MOSFET Switch & Flyback Protection**: Interactive switch driving a DC motor with live rotor spinning animation.
7. **Rated Virtual Safety Fuse Overload & Blow Demonstration**: Overloading a 1A fuse to trigger animated smoke and circuit breaking.

---

## 💻 How to Run the Website

### Option 1: Double click or open in browser
Open [`index.html`](file:///C:/Users/K%20KRISHNA%20CHARAN/.gemini/antigravity/scratch/multisim-web/index.html) in Chrome, Edge, or Firefox.

### Option 2: Using the built-in Node server
From PowerShell / Terminal:
```powershell
cd "C:\Users\K KRISHNA CHARAN\.gemini\antigravity\scratch\multisim-web"
node server.js
```
Then navigate to: `http://localhost:3000`
