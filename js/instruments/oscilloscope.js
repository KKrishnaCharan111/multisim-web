/**
 * Multisim Web Studio - 4-Channel Digital Storage Oscilloscope (Agilent/Tektronix Style)
 * High-speed waveform rendering, Volts/Div, Timebase, Triggering, Auto-Scaling,
 * and Live Signal Metrics (Vpp, Vrms, Freq, Vmax, Vmin).
 */

export class Oscilloscope {
  constructor(canvas, solver) {
    this.canvas = canvas;
    this.ctx = canvas ? canvas.getContext('2d') : null;
    this.solver = solver;

    // Channels
    this.channels = [
      { id: 'chA', label: 'CH A', color: '#00f0ff', enabled: true, voltsPerDiv: 2.0, yOffset: 0, probePin: null, vMin: 0, vMax: 0, vpp: 0, vRms: 0, freq: 0 },
      { id: 'chB', label: 'CH B', color: '#ffb700', enabled: true, voltsPerDiv: 2.0, yOffset: 0, probePin: null, vMin: 0, vMax: 0, vpp: 0, vRms: 0, freq: 0 }
    ];

    // Timebase: seconds per division
    this.timePerDiv = 0.002; // 2 ms/div default
    this.numDivsX = 10;
    this.numDivsY = 8;

    // Trigger settings
    this.triggerSource = 'chA';
    this.triggerLevel = 0.0;
    this.triggerSlope = 'rising'; // 'rising' or 'falling'
    this.triggerMode = 'auto'; // 'auto', 'normal'
    this.isTriggered = false;

    // Cursors
    this.showCursors = false;
    this.cursorX1 = 0.3;
    this.cursorX2 = 0.7;

    this.isPaused = false;
  }

  setProbe(chIndex, componentId, pinIndex) {
    if (this.channels[chIndex]) {
      this.channels[chIndex].probePin = `${componentId}_p${pinIndex}`;
      this.channels[chIndex].compRefId = componentId;
      this.channels[chIndex].pIdx = pinIndex;
    }
  }

  getMetrics(chIndex) {
    return this.channels[chIndex] || { vpp: 0, vRms: 0, freq: 0, vMax: 0, vMin: 0 };
  }

  /**
   * Magic Auto-Scale: Automatically adjusts Volts/Div and Timebase
   * so the waveform fits on screen with 2-3 full periods!
   */
  autoScale(chIndex = 0) {
    const ch = this.channels[chIndex];
    if (!ch || !ch.probePin) return;

    const history = this.solver.probeHistories.get(ch.probePin);
    if (!history || history.length < 5) return;

    // 1. Scale Volts/Div to fit amplitude
    const vpp = ch.vpp || 1.0;
    const targetVPerDiv = Math.max(0.05, vpp / 4.5);
    const standardVolts = [0.05, 0.1, 0.2, 0.5, 1.0, 2.0, 5.0, 10.0, 20.0];
    ch.voltsPerDiv = standardVolts.reduce((prev, curr) =>
      Math.abs(curr - targetVPerDiv) < Math.abs(prev - targetVPerDiv) ? curr : prev
    );

    // 2. Scale Timebase to show ~2 to 3 cycles
    if (ch.freq > 0) {
      const period = 1 / ch.freq;
      const targetTimePerDiv = (period * 2.5) / 10;
      const standardTimes = [0.0001, 0.0002, 0.0005, 0.001, 0.002, 0.005, 0.01, 0.02, 0.05, 0.1, 0.2, 0.5];
      this.timePerDiv = standardTimes.reduce((prev, curr) =>
        Math.abs(curr - targetTimePerDiv) < Math.abs(prev - targetTimePerDiv) ? curr : prev
      );
    }
  }

  render(targetCanvas = null) {
    const canvas = targetCanvas || this.canvas;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;

    // High-tech Phosphor CRT background
    ctx.fillStyle = '#080e15';
    ctx.fillRect(0, 0, w, h);

    // CRT graticule grid
    ctx.strokeStyle = '#182433';
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
    ctx.strokeStyle = '#27384d';
    ctx.beginPath();
    ctx.moveTo(w / 2, 0);
    ctx.lineTo(w / 2, h);
    ctx.moveTo(0, h / 2);
    ctx.lineTo(w, h / 2);
    ctx.stroke();

    // Subdivision tick marks
    ctx.fillStyle = '#3e526a';
    for (let i = 0; i <= this.numDivsX * 5; i++) {
      const x = (i * w) / (this.numDivsX * 5);
      ctx.fillRect(x - 0.5, h / 2 - 3, 1, 6);
    }
    for (let j = 0; j <= this.numDivsY * 5; j++) {
      const y = (j * h) / (this.numDivsY * 5);
      ctx.fillRect(w / 2 - 3, y - 0.5, 6, 1);
    }

    // Trigger level dashed line
    if (this.triggerMode !== 'none') {
      const trigCh = this.channels.find(c => c.id === this.triggerSource) || this.channels[0];
      const trigY = h / 2 - (this.triggerLevel / trigCh.voltsPerDiv) * dy - trigCh.yOffset * dy;
      ctx.save();
      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = 'rgba(255, 183, 0, 0.4)';
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

      // Trace line with vibrant phosphor bloom
      ctx.save();
      ctx.shadowColor = ch.color;
      ctx.shadowBlur = 8;
      ctx.strokeStyle = ch.color;
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();

      let hasStarted = false;
      let vMin = Infinity;
      let vMax = -Infinity;
      let sumSq = 0;
      let count = 0;
      const zeroCrossings = [];

      for (let i = 0; i < history.length; i++) {
        const pt = history[i];
        if (pt.t < tStart || pt.t > tEnd) continue;

        const x = ((pt.t - tStart) / totalTimeWindow) * w;
        const y = h / 2 - (pt.v / ch.voltsPerDiv) * dy - ch.yOffset * dy;

        if (pt.v < vMin) vMin = pt.v;
        if (pt.v > vMax) vMax = pt.v;
        sumSq += pt.v * pt.v;
        count++;

        if (i > 0) {
          const prevV = history[i - 1].v;
          if ((prevV <= 0 && pt.v > 0) || (prevV >= 0 && pt.v < 0)) {
            zeroCrossings.push(pt.t);
          }
        }

        if (!hasStarted) {
          ctx.moveTo(x, y);
          hasStarted = true;
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.stroke();
      ctx.restore();

      // Store calculated stats
      ch.vMin = vMin === Infinity ? 0 : vMin;
      ch.vMax = vMax === -Infinity ? 0 : vMax;
      ch.vpp = Math.max(0, ch.vMax - ch.vMin);
      ch.vRms = count > 0 ? Math.sqrt(sumSq / count) : 0;

      // Calculate frequency from zero crossings
      if (zeroCrossings.length >= 3) {
        const halfPeriods = [];
        for (let k = 1; k < zeroCrossings.length; k++) {
          halfPeriods.push(zeroCrossings[k] - zeroCrossings[k - 1]);
        }
        const avgHalfPeriod = halfPeriods.reduce((a, b) => a + b, 0) / halfPeriods.length;
        const period = avgHalfPeriod * 2;
        ch.freq = period > 0 ? 1 / period : 0;
      } else {
        ch.freq = 0;
      }
    }

    // Render Cursors if active
    if (this.showCursors) {
      const x1 = this.cursorX1 * w;
      const x2 = this.cursorX2 * w;
      ctx.strokeStyle = '#ef4444';
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

      ctx.fillStyle = '#ef4444';
      ctx.font = '11px "JetBrains Mono", monospace';
      ctx.fillText(`ΔT: ${(deltaT * 1000).toFixed(3)} ms | f: ${freq >= 1000 ? (freq / 1000).toFixed(2) + ' kHz' : freq.toFixed(1) + ' Hz'}`, x1 + 8, 20);
    }

    // Top status indicators
    ctx.font = '11px "Inter", sans-serif';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText(`Timebase: ${this.formatTime(this.timePerDiv)}/div | Grid: 10×8`, 10, 16);
  }

  formatTime(sec) {
    if (sec >= 1) return `${sec.toFixed(1)}s`;
    if (sec >= 1e-3) return `${(sec * 1e3).toFixed(1)}ms`;
    if (sec >= 1e-6) return `${(sec * 1e6).toFixed(1)}µs`;
    return `${(sec * 1e9).toFixed(1)}ns`;
  }
}
