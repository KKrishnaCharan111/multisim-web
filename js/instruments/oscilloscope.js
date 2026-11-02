/**
 * Multisim Web - 4-Channel Digital Storage Oscilloscope (Agilent/Tektronix Style)
 * High-speed waveform rendering, Volts/Div, Timebase, Triggering, and Cursors.
 */

export class Oscilloscope {
  constructor(canvas, solver) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.solver = solver;

    // Channels
    this.channels = [
      { id: 'chA', label: 'CH A', color: '#38bdf8', enabled: true, voltsPerDiv: 2.0, yOffset: 0, probePin: null, coupling: 'DC' },
      { id: 'chB', label: 'CH B', color: '#facc15', enabled: true, voltsPerDiv: 2.0, yOffset: 0, probePin: null, coupling: 'DC' },
      { id: 'chC', label: 'CH C', color: '#4ade80', enabled: false, voltsPerDiv: 5.0, yOffset: 0, probePin: null, coupling: 'DC' },
      { id: 'chD', label: 'CH D', color: '#f43f5e', enabled: false, voltsPerDiv: 5.0, yOffset: 0, probePin: null, coupling: 'DC' }
    ];

    // Timebase: seconds per division
    this.timePerDiv = 0.002; // 2 ms/div default
    this.numDivsX = 10;
    this.numDivsY = 8;

    // Trigger settings
    this.triggerSource = 'chA';
    this.triggerLevel = 0.0;
    this.triggerSlope = 'rising'; // 'rising' or 'falling'
    this.triggerMode = 'auto'; // 'auto', 'normal', 'single'
    this.isTriggered = false;

    // Cursors
    this.showCursors = false;
    this.cursorX1 = 0.3; // 0..1 normalized
    this.cursorX2 = 0.7;

    this.isPaused = false;
  }

  setProbe(chIndex, componentId, pinIndex) {
    if (this.channels[chIndex]) {
      this.channels[chIndex].probePin = `${componentId}_p${pinIndex}`;
    }
  }

  render() {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    // Dark phosphor CRT background
    ctx.fillStyle = '#0a1017';
    ctx.fillRect(0, 0, w, h);

    // Draw CRT graticule grid
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    const dx = w / this.numDivsX;
    const dy = h / this.numDivsY;

    ctx.beginPath();
    for (let x = 0; x <= w; x += dx) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
    }
    for (let y = 0; y <= h; y += dy) {
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
    }
    ctx.stroke();

    // Center crosshairs with subdivision ticks
    ctx.strokeStyle = '#334155';
    ctx.beginPath();
    ctx.moveTo(w / 2, 0);
    ctx.lineTo(w / 2, h);
    ctx.moveTo(0, h / 2);
    ctx.lineTo(w, h / 2);
    ctx.stroke();

    // Subdivision tick marks
    ctx.fillStyle = '#475569';
    for (let i = 0; i <= this.numDivsX * 5; i++) {
      const x = (i * w) / (this.numDivsX * 5);
      ctx.fillRect(x - 0.5, h / 2 - 3, 1, 6);
    }
    for (let j = 0; j <= this.numDivsY * 5; j++) {
      const y = (j * h) / (this.numDivsY * 5);
      ctx.fillRect(w / 2 - 3, y - 0.5, 6, 1);
    }

    // Trigger level dashed marker
    if (this.triggerMode !== 'none') {
      const trigCh = this.channels.find(c => c.id === this.triggerSource) || this.channels[0];
      const trigY = h / 2 - (this.triggerLevel / trigCh.voltsPerDiv) * dy - trigCh.yOffset * dy;
      ctx.save();
      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = 'rgba(250, 204, 21, 0.4)';
      ctx.beginPath();
      ctx.moveTo(0, trigY);
      ctx.lineTo(w, trigY);
      ctx.stroke();
      ctx.restore();
    }

    // Total display time window
    const totalTimeWindow = this.timePerDiv * this.numDivsX;

    // Render enabled channels
    for (const ch of this.channels) {
      if (!ch.enabled || !ch.probePin) continue;

      const history = this.solver.probeHistories.get(ch.probePin);
      if (!history || history.length < 2) continue;

      // Find trigger point if enabled
      let triggerIndex = -1;
      const targetLevel = this.triggerLevel;

      for (let i = history.length - 2; i >= 1; i--) {
        const vCurr = history[i].v;
        const vPrev = history[i - 1].v;
        if (this.triggerSlope === 'rising' && vPrev <= targetLevel && vCurr > targetLevel) {
          triggerIndex = i;
          break;
        } else if (this.triggerSlope === 'falling' && vPrev >= targetLevel && vCurr < targetLevel) {
          triggerIndex = i;
          break;
        }
      }

      const tRef = triggerIndex >= 0 ? history[triggerIndex].t : history[history.length - 1].t - totalTimeWindow / 2;
      const tStart = tRef - totalTimeWindow / 2;
      const tEnd = tRef + totalTimeWindow / 2;

      // Trace line with glowing phosphor bloom
      ctx.save();
      ctx.shadowColor = ch.color;
      ctx.shadowBlur = 8;
      ctx.strokeStyle = ch.color;
      ctx.lineWidth = 2.2;
      ctx.beginPath();

      let hasStarted = false;
      let vMin = Infinity;
      let vMax = -Infinity;

      for (let i = 0; i < history.length; i++) {
        const pt = history[i];
        if (pt.t < tStart || pt.t > tEnd) continue;

        const x = ((pt.t - tStart) / totalTimeWindow) * w;
        // Y mapping: center is 0V
        const y = h / 2 - (pt.v / ch.voltsPerDiv) * dy - ch.yOffset * dy;

        if (pt.v < vMin) vMin = pt.v;
        if (pt.v > vMax) vMax = pt.v;

        if (!hasStarted) {
          ctx.moveTo(x, y);
          hasStarted = true;
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.stroke();
      ctx.restore();

      // Store stats
      ch.vMin = vMin === Infinity ? 0 : vMin;
      ch.vMax = vMax === -Infinity ? 0 : vMax;
      ch.vpp = ch.vMax - ch.vMin;
    }

    // Render Cursors if active
    if (this.showCursors) {
      const x1 = this.cursorX1 * w;
      const x2 = this.cursorX2 * w;
      ctx.strokeStyle = '#f43f5e';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([6, 3]);

      ctx.beginPath();
      ctx.moveTo(x1, 0);
      ctx.lineTo(x1, h);
      ctx.moveTo(x2, 0);
      ctx.lineTo(x2, h);
      ctx.stroke();
      ctx.setLineDash([]);

      const deltaT = Math.abs(this.cursorX2 - this.cursorX1) * totalTimeWindow;
      const freq = deltaT > 0 ? 1 / deltaT : 0;

      ctx.fillStyle = '#f43f5e';
      ctx.font = '11px monospace';
      ctx.fillText(`ΔT: ${(deltaT * 1000).toFixed(3)} ms | f: ${freq >= 1000 ? (freq / 1000).toFixed(2) + ' kHz' : freq.toFixed(1) + ' Hz'}`, x1 + 8, 20);
    }

    // Top status indicators
    ctx.font = '11px "Segoe UI", sans-serif';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText(`Timebase: ${this.formatTime(this.timePerDiv)}/div | Grid: 10x8`, 10, 16);
  }

  formatTime(sec) {
    if (sec >= 1) return `${sec.toFixed(1)}s`;
    if (sec >= 1e-3) return `${(sec * 1e3).toFixed(1)}ms`;
    if (sec >= 1e-6) return `${(sec * 1e6).toFixed(1)}µs`;
    return `${(sec * 1e9).toFixed(1)}ns`;
  }
}
