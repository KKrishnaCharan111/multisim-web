/**
 * Multisim Web Studio - Schematic Canvas Renderer & Interactive Wiring System
 * - Accurate Light Theme (Classic NI Multisim pure white #ffffff & jet-black #0f172a)
 *   and Dark Theme (Instrument Dark-Slate #11161d)
 * - Rock-solid Magnetic Terminal Snapping (24px radius)
 * - Manhattan Orthogonal Wiring (90° corner routing with segment offsets)
 * - Solder Junction Dots (4.5px filled dots)
 * - Real-Time Voltage Wire Coloring & Animated Current Flow
 * - Dual-Channel Oscilloscope Probe Badging ([CH A] Cyan, [CH B] Amber)
 */

export class SchematicRenderer {
  constructor(canvas, solver) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.solver = solver;

    this.zoom = 1.0;
    this.panX = 60;
    this.panY = 60;
    this.gridSize = 20;

    this.theme = 'dark'; // 'dark' or 'light'
    this.selectedComponent = null;
    this.hoveredPin = null;
    this.isWiring = false;
    this.wireStartPin = null;
    this.mouseWorldPos = { x: 0, y: 0 };
    this.wires = []; // Explicit wires from MultisimApp

    this.showCurrentFlow = true;
    this.currentDotOffset = 0;
    this.scopeChannels = [];

    this.smokeParticles = [];
    this.lastFrameTime = performance.now();
  }

  setTheme(theme) {
    this.theme = theme === 'light' ? 'light' : 'dark';
    this.render();
  }

  screenToWorld(sx, sy) {
    return {
      x: (sx - this.panX) / this.zoom,
      y: (sy - this.panY) / this.zoom
    };
  }

  worldToScreen(wx, wy) {
    return {
      x: wx * this.zoom + this.panX,
      y: wy * this.zoom + this.panY
    };
  }

  snapToGrid(val) {
    return Math.round(val / this.gridSize) * this.gridSize;
  }

  // Exact world coordinate of any component pin considering rotation (0°, 90°, 180°, 270°)
  getPinWorldPos(comp, pin) {
    if (!comp || !pin) return { x: 0, y: 0 };
    const theta = ((comp.rotation || 0) * Math.PI) / 180;
    const cx = comp.x + comp.width / 2;
    const cy = comp.y + comp.height / 2;
    const dx = pin.x - comp.width / 2;
    const dy = pin.y - comp.height / 2;
    return {
      x: cx + dx * Math.cos(theta) - dy * Math.sin(theta),
      y: cy + dx * Math.sin(theta) + dy * Math.cos(theta)
    };
  }

  render() {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;
    const now = performance.now();
    const dt = (now - this.lastFrameTime) / 1000;
    this.lastFrameTime = now;

    this.currentDotOffset = (this.currentDotOffset + dt * 45) % 20;

    // Canvas Background
    ctx.fillStyle = this.theme === 'light' ? '#ffffff' : '#11161d';
    ctx.fillRect(0, 0, w, h);

    // Transform viewport
    ctx.save();
    ctx.translate(this.panX, this.panY);
    ctx.scale(this.zoom, this.zoom);

    // Technical grid dots
    this.drawGrid(w, h);

    // Draw Wires with live voltage colors & moving current charges
    this.drawWires();

    // Draw active in-progress Manhattan wire
    if (this.isWiring && this.wireStartPin) {
      this.drawActiveWire();
    }

    // Draw components
    for (const comp of this.solver.components) {
      this.drawComponent(comp);
    }

    // Draw Oscilloscope Probe Badges on the canvas
    this.drawProbeBadges();

    // Draw smoke effects for blown components
    this.updateAndDrawSmoke(dt);

    ctx.restore();

    // Draw magnetic snap target ring in screen space
    if (this.hoveredPin) {
      this.drawPinSnap(this.hoveredPin);
    }
  }

  drawGrid(w, h) {
    const ctx = this.ctx;
    const left = -this.panX / this.zoom;
    const top = -this.panY / this.zoom;
    const right = left + w / this.zoom;
    const bottom = top + h / this.zoom;

    const startX = Math.floor(left / this.gridSize) * this.gridSize;
    const endX = Math.ceil(right / this.gridSize) * this.gridSize;
    const startY = Math.floor(top / this.gridSize) * this.gridSize;
    const endY = Math.ceil(bottom / this.gridSize) * this.gridSize;

    ctx.fillStyle = this.theme === 'light' ? '#cbd5e1' : '#1c2533';
    for (let x = startX; x <= endX; x += this.gridSize) {
      for (let y = startY; y <= endY; y += this.gridSize) {
        ctx.fillRect(x - 0.9, y - 0.9, 1.8, 1.8);
      }
    }
  }

  drawWires() {
    const ctx = this.ctx;

    // Use explicit wires if available, or fallback to net connectivity
    const wireList = [];

    if (this.wires && this.wires.length > 0) {
      for (const w of this.wires) {
        const comp1 = this.solver.components.find(c => c.id === w.fromCompId);
        const comp2 = this.solver.components.find(c => c.id === w.toCompId);
        if (!comp1 || !comp2) continue;
        const pin1 = comp1.pins[w.fromPinIdx];
        const pin2 = comp2.pins[w.toPinIdx];
        if (!pin1 || !pin2) continue;

        const p1 = this.getPinWorldPos(comp1, pin1);
        const p2 = this.getPinWorldPos(comp2, pin2);
        wireList.push({
          id: w.id,
          netId: w.netId || pin1.netId,
          x1: p1.x,
          y1: p1.y,
          x2: p2.x,
          y2: p2.y,
          v1: pin1.voltage ?? 0,
          v2: pin2.voltage ?? 0,
          comp1,
          comp2
        });
      }
    } else {
      // Net-based fallback
      const netGroups = new Map();
      for (const comp of this.solver.components) {
        for (let pIdx = 0; pIdx < comp.pins.length; pIdx++) {
          const pin = comp.pins[pIdx];
          if (pin.netId) {
            if (!netGroups.has(pin.netId)) netGroups.set(pin.netId, []);
            const wpos = this.getPinWorldPos(comp, pin);
            netGroups.get(pin.netId).push({ comp, pin, pIdx, x: wpos.x, y: wpos.y });
          }
        }
      }
      for (const [netId, pinList] of netGroups.entries()) {
        if (pinList.length < 2) continue;
        for (let i = 0; i < pinList.length - 1; i++) {
          const p1 = pinList[i];
          const p2 = pinList[i + 1];
          wireList.push({
            id: `${netId}_${i}`,
            netId,
            x1: p1.x,
            y1: p1.y,
            x2: p2.x,
            y2: p2.y,
            v1: p1.pin.voltage ?? 0,
            v2: p2.pin.voltage ?? 0,
            comp1: p1.comp,
            comp2: p2.comp
          });
        }
      }
    }

    for (const wire of wireList) {
      const v = (wire.v1 + wire.v2) / 2;
      const trunkX = this.snapToGrid((wire.x1 + wire.x2) / 2);

      let wireColor = this.theme === 'light' ? '#0f172a' : '#94a3b8';
      if (wire.netId === 'GND') {
        wireColor = this.theme === 'light' ? '#15803d' : '#10b981';
      } else if (v > 0.5) {
        wireColor = this.theme === 'light' ? '#dc2626' : '#f59e0b';
      } else if (v < -0.5) {
        wireColor = this.theme === 'light' ? '#2563eb' : '#0ea5e9';
      }

      ctx.save();
      ctx.strokeStyle = wireColor;
      ctx.lineWidth = 2.4;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      ctx.beginPath();
      if (wire.x1 === wire.x2 || wire.y1 === wire.y2) {
        ctx.moveTo(wire.x1, wire.y1);
        ctx.lineTo(wire.x2, wire.y2);
      } else {
        ctx.moveTo(wire.x1, wire.y1);
        ctx.lineTo(trunkX, wire.y1);
        ctx.lineTo(trunkX, wire.y2);
        ctx.lineTo(wire.x2, wire.y2);
      }
      ctx.stroke();

      // Terminal dots
      ctx.fillStyle = wireColor;
      ctx.beginPath();
      ctx.arc(wire.x1, wire.y1, 3.5, 0, Math.PI * 2);
      ctx.arc(wire.x2, wire.y2, 3.5, 0, Math.PI * 2);
      ctx.fill();

      // Electron charge flow animations
      if (this.showCurrentFlow && this.solver.isRunning) {
        const branchCurrent = Math.abs((wire.comp1?.current || wire.comp2?.current || 0));
        if (branchCurrent > 1e-4) {
          const speedFactor = Math.min(1.0, branchCurrent / 0.05);
          ctx.fillStyle = this.theme === 'light' ? '#d97706' : '#facc15';
          if (wire.x1 === wire.x2 || wire.y1 === wire.y2) {
            this.drawCurrentDotsAlongLine(ctx, wire.x1, wire.y1, wire.x2, wire.y2, speedFactor);
          } else {
            this.drawCurrentDotsAlongLine(ctx, wire.x1, wire.y1, trunkX, wire.y1, speedFactor);
            this.drawCurrentDotsAlongLine(ctx, trunkX, wire.y1, trunkX, wire.y2, speedFactor);
            this.drawCurrentDotsAlongLine(ctx, trunkX, wire.y2, wire.x2, wire.y2, speedFactor);
          }
        }
      }

      ctx.restore();
    }
  }

  drawCurrentDotsAlongLine(ctx, x1, y1, x2, y2, speed) {
    const dist = Math.hypot(x2 - x1, y2 - y1);
    if (dist < 4) return;
    const spacing = 18;
    const numDots = Math.floor(dist / spacing);
    const ux = (x2 - x1) / dist;
    const uy = (y2 - y1) / dist;

    for (let d = 0; d < numDots; d++) {
      const pos = (d * spacing + this.currentDotOffset * speed) % dist;
      const px = x1 + ux * pos;
      const py = y1 + uy * pos;
      ctx.beginPath();
      ctx.arc(px, py, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  drawActiveWire() {
    const ctx = this.ctx;
    const p1 = this.getPinWorldPos(this.wireStartPin.comp, this.wireStartPin.pin);
    const p2 = this.hoveredPin 
      ? this.getPinWorldPos(this.hoveredPin.comp, this.hoveredPin.pin)
      : this.mouseWorldPos;

    const trunkX = this.snapToGrid((p1.x + p2.x) / 2);

    ctx.save();
    ctx.setLineDash([5, 4]);
    ctx.strokeStyle = this.theme === 'light' ? '#0284c7' : '#00f0ff';
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(trunkX, p1.y);
    ctx.lineTo(trunkX, p2.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.stroke();
    ctx.restore();
  }

  drawProbeBadges() {
    if (!this.scopeChannels || this.scopeChannels.length === 0) return;
    const ctx = this.ctx;

    for (let chIdx = 0; chIdx < this.scopeChannels.length; chIdx++) {
      const ch = this.scopeChannels[chIdx];
      if (!ch.enabled || !ch.probePin) continue;

      const parts = ch.probePin.split('_p');
      if (parts.length < 2) continue;
      const compId = parts[0];
      const pIdx = parseInt(parts[1], 10);

      const comp = this.solver.components.find(c => c.id === compId);
      if (!comp || !comp.pins[pIdx]) continue;

      const pos = this.getPinWorldPos(comp, comp.pins[pIdx]);
      const badgeText = chIdx === 0 ? 'CH A' : 'CH B';
      const badgeColor = chIdx === 0 ? '#00f0ff' : '#ffb700';

      ctx.save();
      // Lead line
      ctx.strokeStyle = badgeColor;
      ctx.lineWidth = 1.8;
      ctx.setLineDash([2, 2]);
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y);
      ctx.lineTo(pos.x + 18, pos.y - 18);
      ctx.stroke();
      ctx.setLineDash([]);

      // Badge Pill
      const bx = pos.x + 18;
      const by = pos.y - 30;
      const bw = 48;
      const bh = 18;

      ctx.fillStyle = '#0f172a';
      ctx.strokeStyle = badgeColor;
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.roundRect(bx, by, bw, bh, 4);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = badgeColor;
      ctx.font = 'bold 10px "JetBrains Mono", monospace';
      ctx.fillText(badgeText, bx + 7, by + 13);

      // Solder point
      ctx.fillStyle = badgeColor;
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, 4.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }
  }

  drawComponent(comp) {
    const ctx = this.ctx;
    const isSelected = this.selectedComponent?.id === comp.id;

    ctx.save();
    const cx = comp.x + comp.width / 2;
    const cy = comp.y + comp.height / 2;
    ctx.translate(cx, cy);
    const rot = comp.rotation || 0;
    if (rot !== 0) {
      ctx.rotate((rot * Math.PI) / 180);
    }
    ctx.translate(-comp.width / 2, -comp.height / 2);

    if (isSelected) {
      ctx.strokeStyle = '#0284c7';
      ctx.lineWidth = 2.0;
      ctx.setLineDash([4, 3]);
      ctx.strokeRect(-6, -6, (comp.width || 48) + 12, (comp.height || 36) + 12);
      ctx.setLineDash([]);
    }

    const strokeColor = this.theme === 'light' ? '#0f172a' : '#f1f5f9';
    ctx.strokeStyle = strokeColor;
    ctx.fillStyle = strokeColor;
    ctx.lineWidth = 2.2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    switch (comp.type) {
      case 'GROUND':
      case 'DIGITAL_GROUND': {
        ctx.beginPath();
        ctx.moveTo(16, 0);
        ctx.lineTo(16, 14);
        ctx.moveTo(4, 14);
        ctx.lineTo(28, 14);
        ctx.moveTo(8, 20);
        ctx.lineTo(24, 20);
        ctx.moveTo(12, 26);
        ctx.lineTo(20, 26);
        ctx.stroke();
        break;
      }

      case 'VCC':
      case 'VDD': {
        ctx.beginPath();
        ctx.moveTo(16, 32);
        ctx.lineTo(16, 14);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(10, 14);
        ctx.lineTo(16, 4);
        ctx.lineTo(22, 14);
        ctx.closePath();
        ctx.fill();
        ctx.font = 'bold 10px "Inter", sans-serif';
        ctx.fillText(comp.type === 'VCC' ? '+5V' : '+12V', 22, 12);
        break;
      }

      case 'VEE': {
        ctx.beginPath();
        ctx.moveTo(16, 0);
        ctx.lineTo(16, 18);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(10, 18);
        ctx.lineTo(16, 28);
        ctx.lineTo(22, 18);
        ctx.closePath();
        ctx.fill();
        ctx.font = 'bold 10px "Inter", sans-serif';
        ctx.fillText('-12V', 22, 28);
        break;
      }

      case 'DC_POWER': {
        ctx.beginPath();
        ctx.moveTo(16, 0);
        ctx.lineTo(16, 12);
        ctx.moveTo(16, 28);
        ctx.lineTo(16, 40);
        ctx.stroke();
        ctx.lineWidth = 3.2;
        ctx.beginPath();
        ctx.moveTo(4, 12);
        ctx.lineTo(28, 12);
        ctx.stroke();
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(8, 28);
        ctx.lineTo(24, 28);
        ctx.stroke();
        break;
      }

      case 'AC_POWER': {
        ctx.beginPath();
        ctx.arc(20, 20, 16, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(20, 0);
        ctx.lineTo(20, 4);
        ctx.moveTo(20, 36);
        ctx.lineTo(20, 40);
        ctx.stroke();
        ctx.beginPath();
        ctx.bezierCurveTo(12, 14, 16, 26, 20, 20);
        ctx.bezierCurveTo(24, 14, 28, 26, 28, 20);
        ctx.stroke();
        break;
      }

      case 'DIGITAL_CLOCK':
      case 'SINE_GEN': {
        ctx.strokeRect(4, 4, 32, 32);
        ctx.beginPath();
        ctx.moveTo(36, 20);
        ctx.lineTo(40, 20);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(10, 25);
        ctx.lineTo(10, 15);
        ctx.lineTo(20, 15);
        ctx.lineTo(20, 25);
        ctx.lineTo(30, 25);
        ctx.lineTo(30, 15);
        ctx.stroke();
        break;
      }

      case 'RESISTOR': {
        ctx.beginPath();
        ctx.moveTo(0, 16);
        ctx.lineTo(12, 16);
        ctx.lineTo(16, 6);
        ctx.lineTo(22, 26);
        ctx.lineTo(28, 6);
        ctx.lineTo(34, 26);
        ctx.lineTo(40, 6);
        ctx.lineTo(46, 26);
        ctx.lineTo(50, 16);
        ctx.lineTo(64, 16);
        ctx.stroke();
        break;
      }

      case 'POTENTIOMETER': {
        ctx.beginPath();
        ctx.moveTo(0, 16);
        ctx.lineTo(12, 16);
        ctx.lineTo(16, 6);
        ctx.lineTo(22, 26);
        ctx.lineTo(28, 6);
        ctx.lineTo(34, 26);
        ctx.lineTo(40, 6);
        ctx.lineTo(46, 26);
        ctx.lineTo(50, 16);
        ctx.lineTo(64, 16);
        ctx.stroke();

        const sliderX = 12 + (comp.sliderValue || 0.5) * 38;
        ctx.strokeStyle = '#f59e0b';
        ctx.fillStyle = '#f59e0b';
        ctx.beginPath();
        ctx.moveTo(32, 40);
        ctx.lineTo(sliderX, 26);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(sliderX - 3, 30);
        ctx.lineTo(sliderX, 24);
        ctx.lineTo(sliderX + 3, 30);
        ctx.fill();
        break;
      }

      case 'CAPACITOR': {
        ctx.beginPath();
        ctx.moveTo(0, 16);
        ctx.lineTo(16, 16);
        ctx.moveTo(32, 16);
        ctx.lineTo(48, 16);
        ctx.moveTo(16, 4);
        ctx.lineTo(16, 28);
        ctx.moveTo(32, 4);
        ctx.lineTo(32, 28);
        ctx.stroke();
        break;
      }

      case 'CAPACITOR_ELECTROLYTIC': {
        ctx.beginPath();
        ctx.moveTo(0, 16);
        ctx.lineTo(16, 16);
        ctx.moveTo(32, 16);
        ctx.lineTo(48, 16);
        ctx.moveTo(16, 4);
        ctx.lineTo(16, 28);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(36, 16, 12, (3 * Math.PI) / 4, (5 * Math.PI) / 4);
        ctx.stroke();
        ctx.font = 'bold 9px sans-serif';
        ctx.fillText('+', 8, 12);
        break;
      }

      case 'INDUCTOR': {
        ctx.beginPath();
        ctx.moveTo(0, 16);
        ctx.lineTo(8, 16);
        ctx.arc(16, 16, 8, Math.PI, 0);
        ctx.arc(32, 16, 8, Math.PI, 0);
        ctx.arc(48, 16, 8, Math.PI, 0);
        ctx.lineTo(64, 16);
        ctx.stroke();
        break;
      }

      case 'DIODE_1N4007':
      case 'DIODE_1N4001':
      case 'DIODE_1N4148': {
        ctx.beginPath();
        ctx.moveTo(0, 16);
        ctx.lineTo(18, 16);
        ctx.moveTo(36, 16);
        ctx.lineTo(48, 16);
        ctx.moveTo(18, 6);
        ctx.lineTo(34, 16);
        ctx.lineTo(18, 26);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(34, 6);
        ctx.lineTo(34, 26);
        ctx.stroke();
        break;
      }

      case 'ZENER_1N4733A': {
        ctx.beginPath();
        ctx.moveTo(0, 16);
        ctx.lineTo(18, 16);
        ctx.moveTo(36, 16);
        ctx.lineTo(48, 16);
        ctx.moveTo(18, 6);
        ctx.lineTo(34, 16);
        ctx.lineTo(18, 26);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(30, 6);
        ctx.lineTo(34, 6);
        ctx.lineTo(34, 26);
        ctx.lineTo(38, 26);
        ctx.stroke();
        break;
      }

      case 'BJT_NPN_BC107':
      case 'BJT_NPN_BC147':
      case 'BJT_NPN_BC547':
      case 'BJT_NPN_BF194':
      case 'BJT_NPN_2N2222': {
        ctx.beginPath();
        ctx.arc(26, 24, 18, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, 24);
        ctx.lineTo(18, 24);
        ctx.moveTo(18, 12);
        ctx.lineTo(18, 36);
        ctx.moveTo(18, 16);
        ctx.lineTo(34, 4);
        ctx.moveTo(18, 32);
        ctx.lineTo(34, 44);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(28, 38);
        ctx.lineTo(34, 44);
        ctx.lineTo(26, 42);
        ctx.fill();
        break;
      }

      case 'BJT_PNP_2N2907': {
        ctx.beginPath();
        ctx.arc(26, 24, 18, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, 24);
        ctx.lineTo(18, 24);
        ctx.moveTo(18, 12);
        ctx.lineTo(18, 36);
        ctx.moveTo(18, 16);
        ctx.lineTo(34, 4);
        ctx.moveTo(18, 32);
        ctx.lineTo(34, 44);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(24, 28);
        ctx.lineTo(18, 32);
        ctx.lineTo(22, 34);
        ctx.fill();
        break;
      }

      case 'JFET_N_BFW11': {
        ctx.beginPath();
        ctx.arc(26, 24, 18, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, 32);
        ctx.lineTo(16, 32);
        ctx.moveTo(16, 12);
        ctx.lineTo(16, 36);
        ctx.moveTo(16, 16);
        ctx.lineTo(34, 4);
        ctx.moveTo(16, 32);
        ctx.lineTo(34, 44);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(8, 28);
        ctx.lineTo(14, 32);
        ctx.lineTo(8, 36);
        ctx.fill();
        break;
      }

      case 'OPAMP_741':
      case 'OPAMP_LM358':
      case 'OPAMP_3T_VIRTUAL': {
        ctx.beginPath();
        ctx.moveTo(8, 4);
        ctx.lineTo(54, 28);
        ctx.lineTo(8, 52);
        ctx.closePath();
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(0, 14);
        ctx.lineTo(8, 14);
        ctx.moveTo(0, 42);
        ctx.lineTo(8, 42);
        ctx.moveTo(54, 28);
        ctx.lineTo(64, 28);
        ctx.stroke();

        ctx.font = 'bold 12px sans-serif';
        ctx.fillText('-', 12, 18);
        ctx.fillText('+', 12, 46);
        break;
      }

      case 'TIMER_555': {
        ctx.strokeRect(8, 8, 48, 56);
        ctx.font = 'bold 10px monospace';
        ctx.fillText('NE555', 14, 38);
        break;
      }

      case 'LED_RED':
      case 'LED_GREEN': {
        ctx.beginPath();
        ctx.moveTo(0, 16);
        ctx.lineTo(18, 16);
        ctx.moveTo(36, 16);
        ctx.lineTo(48, 16);
        ctx.moveTo(18, 6);
        ctx.lineTo(34, 16);
        ctx.lineTo(18, 26);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(34, 6);
        ctx.lineTo(34, 26);
        ctx.stroke();
        // Rays
        ctx.beginPath();
        ctx.moveTo(22, 4);
        ctx.lineTo(28, -2);
        ctx.moveTo(28, 4);
        ctx.lineTo(34, -2);
        ctx.stroke();
        break;
      }

      case 'FILAMENT_LAMP': {
        ctx.beginPath();
        ctx.arc(24, 20, 16, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, 20);
        ctx.lineTo(8, 20);
        ctx.moveTo(40, 20);
        ctx.lineTo(48, 20);
        ctx.moveTo(16, 20);
        ctx.lineTo(21, 14);
        ctx.lineTo(27, 26);
        ctx.lineTo(32, 20);
        ctx.stroke();
        break;
      }

      case 'LDR': {
        ctx.strokeRect(10, 8, 36, 16);
        ctx.beginPath();
        ctx.moveTo(0, 16);
        ctx.lineTo(10, 16);
        ctx.moveTo(46, 16);
        ctx.lineTo(56, 16);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(16, -2);
        ctx.lineTo(24, 6);
        ctx.moveTo(24, -2);
        ctx.lineTo(32, 6);
        ctx.stroke();
        break;
      }

      case 'RELAY_5V':
      case 'RELAY_12V': {
        ctx.strokeRect(4, 4, 48, 32);
        ctx.font = 'bold 9px monospace';
        ctx.fillText(comp.type === 'RELAY_5V' ? 'RLY 5V' : 'RLY 12V', 8, 22);
        break;
      }

      case 'SWITCH_SPST': {
        ctx.beginPath();
        ctx.moveTo(0, 16);
        ctx.lineTo(12, 16);
        ctx.moveTo(36, 16);
        ctx.lineTo(48, 16);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(12, 16, 2.5, 0, Math.PI * 2);
        ctx.arc(36, 16, 2.5, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        if (comp.isOpen) {
          ctx.moveTo(12, 16);
          ctx.lineTo(32, 4);
        } else {
          ctx.moveTo(12, 16);
          ctx.lineTo(36, 16);
        }
        ctx.stroke();
        break;
      }

      default: {
        ctx.strokeRect(6, 6, comp.width - 12, comp.height - 12);
        ctx.font = 'bold 10px sans-serif';
        ctx.fillText(comp.partNumber || comp.type, 10, 22);
        break;
      }
    }

    // Draw component pins in rotated local space
    for (const pin of comp.pins) {
      ctx.strokeStyle = this.theme === 'light' ? '#0284c7' : '#00f0ff';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.arc(pin.x, pin.y, 3.0, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.restore();

    // Draw component label upright above component in world coordinates
    ctx.save();
    ctx.font = 'bold 11px "Inter", sans-serif';
    ctx.fillStyle = this.theme === 'light' ? '#0f172a' : '#e2e8f0';
    const textLabel = comp.label || comp.partNumber || comp.name;
    if (textLabel) {
      ctx.fillText(textLabel, comp.x, comp.y - 6);
    }
    ctx.restore();
  }

  // Magnetic terminal snap target ring (24px detection)
  drawPinSnap(pinInfo) {
    const ctx = this.ctx;
    const wpos = this.getPinWorldPos(pinInfo.comp, pinInfo.pin);
    const pos = this.worldToScreen(wpos.x, wpos.y);

    ctx.save();
    const ringColor = this.theme === 'light' ? '#0284c7' : '#00f0ff';
    // Glowing outer ring
    ctx.strokeStyle = ringColor;
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, 10, 0, Math.PI * 2);
    ctx.stroke();

    // Outer target brackets
    ctx.strokeStyle = ringColor;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, 16, 0, Math.PI * 2);
    ctx.stroke();

    // Crosshairs
    ctx.beginPath();
    ctx.moveTo(pos.x - 16, pos.y);
    ctx.lineTo(pos.x + 16, pos.y);
    ctx.moveTo(pos.x, pos.y - 16);
    ctx.lineTo(pos.x, pos.y + 16);
    ctx.stroke();

    ctx.restore();
  }

  findPinAt(wx, wy) {
    // Generous snap radius: 24 pixels in screen space
    const thresholdWorld = 24 / this.zoom;
    let closest = null;
    let minDist = Infinity;

    for (const comp of this.solver.components) {
      for (let pIdx = 0; pIdx < comp.pins.length; pIdx++) {
        const pin = comp.pins[pIdx];
        const wpos = this.getPinWorldPos(comp, pin);
        const dist = Math.hypot(wx - wpos.x, wy - wpos.y);
        if (dist <= thresholdWorld && dist < minDist) {
          minDist = dist;
          closest = { comp, pin, pIdx, x: wpos.x, y: wpos.y };
        }
      }
    }
    return closest;
  }

  findComponentAt(wx, wy) {
    for (let i = this.solver.components.length - 1; i >= 0; i--) {
      const comp = this.solver.components[i];
      const cx = comp.x + comp.width / 2;
      const cy = comp.y + comp.height / 2;
      const maxDim = Math.max(comp.width, comp.height) / 2 + 10;
      if (Math.hypot(wx - cx, wy - cy) <= maxDim) {
        return comp;
      }
    }
    return null;
  }

  triggerSmoke(x, y) {
    for (let i = 0; i < 30; i++) {
      this.smokeParticles.push({
        x: x + (Math.random() - 0.5) * 16,
        y: y + (Math.random() - 0.5) * 8,
        vx: (Math.random() - 0.5) * 20,
        vy: -15 - Math.random() * 35,
        radius: 4 + Math.random() * 8,
        alpha: 0.8,
        decay: 0.3 + Math.random() * 0.4
      });
    }
  }

  updateAndDrawSmoke(dt) {
    const ctx = this.ctx;
    for (let i = this.smokeParticles.length - 1; i >= 0; i--) {
      const p = this.smokeParticles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.radius += 8 * dt;
      p.alpha -= p.decay * dt;

      if (p.alpha <= 0) {
        this.smokeParticles.splice(i, 1);
        continue;
      }

      ctx.save();
      ctx.fillStyle = `rgba(148, 163, 184, ${p.alpha})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  exportAsImage() {
    const offCanvas = document.createElement('canvas');
    offCanvas.width = this.canvas.width * 2;
    offCanvas.height = this.canvas.height * 2;
    const offCtx = offCanvas.getContext('2d');

    offCtx.scale(2, 2);
    offCtx.fillStyle = this.theme === 'light' ? '#ffffff' : '#11161d';
    offCtx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    offCtx.save();
    offCtx.translate(this.panX, this.panY);
    offCtx.scale(this.zoom, this.zoom);

    const oldCtx = this.ctx;
    this.ctx = offCtx;
    this.drawGrid(this.canvas.width, this.canvas.height);
    this.drawWires();
    for (const comp of this.solver.components) {
      this.drawComponent(comp);
    }
    this.drawProbeBadges();
    this.ctx = oldCtx;
    offCtx.restore();

    const dataUrl = offCanvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `multisim_circuit_${Date.now()}.png`;
    a.click();
  }
}
