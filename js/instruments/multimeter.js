/**
 * Multisim Web - Digital Multimeter (Fluke Style)
 * Precision DC/AC Volts, Current, Ohms, Continuity, and Diode Testing.
 */

export class DigitalMultimeter {
  constructor(solver) {
    this.solver = solver;
    this.mode = 'VDC'; // 'VDC', 'VAC', 'IDC', 'IAC', 'OHM', 'DIODE', 'CONT'
    this.redProbeNet = null;
    this.blackProbeNet = null;
    this.displayValue = '0.000 V';
    this.isBeeping = false;
  }

  setProbes(redNet, blackNet) {
    this.redProbeNet = redNet;
    this.blackProbeNet = blackNet;
  }

  update() {
    if (!this.redProbeNet) {
      this.displayValue = '0.000 V';
      return;
    }

    const vRed = this.getNodeVoltage(this.redProbeNet);
    const vBlack = this.blackProbeNet ? this.getNodeVoltage(this.blackProbeNet) : 0;
    const vDiff = vRed - vBlack;

    switch (this.mode) {
      case 'VDC': {
        this.displayValue = `${vDiff >= 0 ? '+' : ''}${vDiff.toFixed(3)} V`;
        break;
      }
      case 'VAC': {
        // Approximate RMS
        const vRms = Math.abs(vDiff) / Math.SQRT2;
        this.displayValue = `${vRms.toFixed(3)} V~`;
        break;
      }
      case 'IDC': {
        // Measure current through probe branch
        const iApprox = vDiff / 1e-3; // through 1mOhm shunt
        this.displayValue = `${(iApprox * 1000).toFixed(2)} mA`;
        break;
      }
      case 'OHM': {
        if (Math.abs(vDiff) < 1e-4) {
          this.displayValue = 'O.L MΩ';
        } else {
          const r = Math.abs(vDiff / 1e-4); // 100uA test current
          if (r >= 1e6) {
            this.displayValue = `${(r / 1e6).toFixed(2)} MΩ`;
          } else if (r >= 1e3) {
            this.displayValue = `${(r / 1e3).toFixed(2)} kΩ`;
          } else {
            this.displayValue = `${r.toFixed(1)} Ω`;
          }
        }
        break;
      }
      case 'DIODE': {
        if (vDiff > 0.1 && vDiff < 3.5) {
          this.displayValue = `${vDiff.toFixed(3)} V`;
        } else {
          this.displayValue = 'O.L';
        }
        break;
      }
      case 'CONT': {
        const isShort = Math.abs(vDiff) < 0.05;
        this.displayValue = isShort ? '0.0 Ω (BEEP)' : 'O.L';
        if (isShort && !this.isBeeping) {
          this.solver.startBeepTone();
          this.isBeeping = true;
        } else if (!isShort && this.isBeeping) {
          this.solver.stopBeepTone();
          this.isBeeping = false;
        }
        break;
      }
      default:
        this.displayValue = '---';
    }
  }

  getNodeVoltage(netId) {
    if (!netId || netId === 'GND') return 0;
    for (const comp of this.solver.components) {
      for (const pin of comp.pins) {
        if (pin.netId === netId && pin.voltage !== undefined) {
          return pin.voltage;
        }
      }
    }
    return 0;
  }
}
