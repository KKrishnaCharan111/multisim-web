/**
 * Multisim Web Studio - Schematic Canvas Renderer & Interactive Wiring System
 * Professional academic & engineering schematic rendering with 360° component rotation,
 * real-time voltage wire coloring, electron charge flow animations, and image export.
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

    this.selectedComponent = null;
    this.hoveredPin = null;
    this.isWiring = false;
    this.wireStartPin = null;
    this.mouseWorldPos = { x: 0, y: 0 };
    this.wireSegments = [];

    this.showCurrentFlow = true;
    this.currentDotOffset = 0;
    this.theme = 'dark';

    this.smokeParticles = [];
    this.lastFrameTime = performance.now();
  }

  setTheme(theme) {
    this.theme = theme;
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

    // Background color
    ctx.fillStyle = this.theme === 'light' ? '#ffffff' : '#090e17';
    ctx.fillRect(0, 0, w, h);

    // Transform viewport
    ctx.save();
    ctx.translate(this.panX, this.panY);
    ctx.scale(this.zoom, this.zoom);

    // Grid dots
    this.drawGrid(w, h);

    // Synchronize wire paths from component net connections
    this.syncWiresFromNets();

    // Draw Wires with live voltage colors & moving current charges
    this.drawWires();

    // Draw active in-progress wiring wire
    if (this.isWiring && this.wireStartPin) {
      this.drawActiveWire();
    }

    // Draw components
    for (const comp of this.solver.components) {
      this.drawComponent(comp);
    }

    // Draw smoke effects for blown components
    this.updateAndDrawSmoke(dt);

    ctx.restore();

    // Draw hover pin snap in screen space
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

    ctx.fillStyle = this.theme === 'light' ? '#94a3b8' : '#334155';
    for (let x = startX; x <= endX; x += this.gridSize) {
      for (let y = startY; y <= endY; y += this.gridSize) {
        ctx.fillRect(x - 0.75, y - 0.75, 1.5, 1.5);
      }
    }
  }

  syncWiresFromNets() {
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

    this.wireSegments = [];
    for (const [netId, pinList] of netGroups.entries()) {
      if (pinList.length < 2) continue;
      for (let i = 0; i < pinList.length - 1; i++) {
        const p1 = pinList[i];
        const p2 = pinList[i + 1];
        this.wireSegments.push({
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

  drawWires() {
    const ctx = this.ctx;

    for (const wire of (this.wireSegments || [])) {
      const midX = (wire.x1 + wire.x2) / 2;
      const v = (wire.v1 + wire.v2) / 2;

      let wireColor = this.theme === 'light' ? '#0f172a' : '#94a3b8';
      if (wire.netId === 'GND') {
        wireColor = this.theme === 'light' ? '#15803d' : '#22c55e';
      } else if (v > 0.5) {
        wireColor = this.theme === 'light' ? '#dc2626' : '#ef4444';
      } else if (v < -0.5) {
        wireColor = this.theme === 'light' ? '#2563eb' : '#38bdf8';
      }

      ctx.save();
      ctx.strokeStyle = wireColor;
      ctx.lineWidth = 2.0;
      ctx.beginPath();
      ctx.moveTo(wire.x1, wire.y1);
      ctx.lineTo(midX, wire.y1);
      ctx.lineTo(midX, wire.y2);
      ctx.lineTo(wire.x2, wire.y2);
      ctx.stroke();

      // Solder junction dots
      ctx.fillStyle = wireColor;
      ctx.beginPath();
      ctx.arc(wire.x1, wire.y1, 3.5, 0, Math.PI * 2);
      ctx.arc(wire.x2, wire.y2, 3.5, 0, Math.PI * 2);
      ctx.fill();

      // Live animated electron charge dots
      if (this.showCurrentFlow && this.solver.isRunning) {
        const branchCurrent = Math.abs((wire.comp1?.current || wire.comp2?.current || 0));
        if (branchCurrent > 1e-4) {
          const speedFactor = Math.min(1.0, branchCurrent / 0.05);
          ctx.fillStyle = this.theme === 'light' ? '#d97706' : '#facc15';
          this.drawCurrentDotsAlongLine(ctx, wire.x1, wire.y1, midX, wire.y1, speedFactor);
          this.drawCurrentDotsAlongLine(ctx, midX, wire.y1, midX, wire.y2, speedFactor);
          this.drawCurrentDotsAlongLine(ctx, midX, wire.y2, wire.x2, wire.y2, speedFactor);
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
      ctx.arc(px, py, 2.4, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  drawActiveWire() {
    const ctx = this.ctx;
    const p1 = this.getPinWorldPos(this.wireStartPin.comp, this.wireStartPin.pin);
    const p2 = this.mouseWorldPos;
    const midX = (p1.x + p2.x) / 2;

    ctx.save();
    ctx.setLineDash([5, 4]);
    ctx.strokeStyle = this.theme === 'light' ? '#0284c7' : '#38bdf8';
    ctx.lineWidth = 2.0;
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(midX, p1.y);
    ctx.lineTo(midX, p2.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.stroke();
    ctx.restore();
  }

  drawComponent(comp) {
    const ctx = this.ctx;
    const isSelected = this.selectedComponent?.id === comp.id;

    ctx.save();
    // Translate to center and apply 360° rotation!
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

    ctx.strokeStyle = this.theme === 'light' ? '#0f172a' : '#f1f5f9';
    ctx.fillStyle = this.theme === 'light' ? '#0f172a' : '#f1f5f9';
    ctx.lineWidth = 2.0;
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
        ctx.font = 'bold 10px sans-serif';
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
        ctx.font = 'bold 10px sans-serif';
        ctx.fillText('-12V', 22, 26);
        break;
      }

      case 'DC_POWER': {
        ctx.beginPath();
        ctx.moveTo(24, 0);
        ctx.lineTo(24, 18);
        ctx.moveTo(6, 18);
        ctx.lineTo(42, 18);
        ctx.moveTo(12, 28);
        ctx.lineTo(36, 28);
        ctx.moveTo(24, 28);
        ctx.lineTo(24, 48);
        ctx.stroke();
        ctx.font = 'bold 12px sans-serif';
        ctx.fillStyle = '#dc2626';
        ctx.fillText('+', 44, 18);
        ctx.fillStyle = '#2563eb';
        ctx.fillText('–', 40, 30);
        break;
      }

      case 'AC_POWER': {
        ctx.beginPath();
        ctx.arc(24, 24, 16, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(24, 0);
        ctx.lineTo(24, 8);
        ctx.moveTo(24, 40);
        ctx.lineTo(24, 48);
        ctx.moveTo(14, 24);
        ctx.bezierCurveTo(17, 16, 21, 16, 24, 24);
        ctx.bezierCurveTo(27, 32, 31, 32, 34, 24);
        ctx.stroke();
        break;
      }

      case 'THREE_PHASE_SOURCE': {
        ctx.strokeRect(8, 4, 48, 56);
        ctx.font = 'bold 9px sans-serif';
        ctx.fillText('3-PHASE', 12, 22);
        ctx.fillText('~ 120V', 12, 36);
        break;
      }

      case 'DIGITAL_CLOCK': {
        ctx.strokeRect(6, 6, 36, 36);
        ctx.beginPath();
        ctx.moveTo(0, 24);
        ctx.lineTo(6, 24);
        ctx.moveTo(42, 24);
        ctx.lineTo(48, 24);
        ctx.moveTo(12, 30);
        ctx.lineTo(18, 30);
        ctx.lineTo(18, 18);
        ctx.lineTo(26, 18);
        ctx.lineTo(26, 30);
        ctx.lineTo(34, 30);
        ctx.stroke();
        break;
      }

      case 'SINE_GEN': {
        ctx.beginPath();
        ctx.arc(24, 24, 16, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(24, 0);
        ctx.lineTo(24, 8);
        ctx.moveTo(24, 40);
        ctx.lineTo(24, 48);
        ctx.moveTo(15, 24);
        ctx.quadraticCurveTo(19, 14, 24, 24);
        ctx.quadraticCurveTo(29, 34, 33, 24);
        ctx.stroke();
        break;
      }

      case 'RESISTOR': {
        ctx.beginPath();
        ctx.moveTo(0, 12);
        ctx.lineTo(10, 12);
        ctx.lineTo(14, 4);
        ctx.lineTo(20, 20);
        ctx.lineTo(26, 4);
        ctx.lineTo(32, 20);
        ctx.lineTo(38, 4);
        ctx.lineTo(44, 20);
        ctx.lineTo(47, 12);
        ctx.lineTo(56, 12);
        ctx.stroke();
        break;
      }

      case 'POTENTIOMETER': {
        ctx.beginPath();
        ctx.moveTo(0, 12);
        ctx.lineTo(12, 12);
        ctx.lineTo(16, 4);
        ctx.lineTo(22, 20);
        ctx.lineTo(28, 4);
        ctx.lineTo(34, 20);
        ctx.lineTo(40, 4);
        ctx.lineTo(46, 20);
        ctx.lineTo(50, 12);
        ctx.lineTo(64, 12);
        ctx.moveTo(32, 40);
        ctx.lineTo(32, 24);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(28, 24);
        ctx.lineTo(32, 16);
        ctx.lineTo(36, 24);
        ctx.closePath();
        ctx.fill();
        break;
      }

      case 'CAPACITOR': {
        ctx.beginPath();
        ctx.moveTo(0, 16);
        ctx.lineTo(20, 16);
        ctx.moveTo(20, 4);
        ctx.lineTo(20, 28);
        ctx.moveTo(28, 4);
        ctx.lineTo(28, 28);
        ctx.moveTo(28, 16);
        ctx.lineTo(48, 16);
        ctx.stroke();
        break;
      }

      case 'CAPACITOR_ELECTROLYTIC': {
        ctx.beginPath();
        ctx.moveTo(0, 16);
        ctx.lineTo(20, 16);
        ctx.moveTo(20, 4);
        ctx.lineTo(20, 28);
        ctx.moveTo(28, 4);
        ctx.quadraticCurveTo(24, 16, 28, 28);
        ctx.moveTo(26, 16);
        ctx.lineTo(48, 16);
        ctx.stroke();
        ctx.font = 'bold 10px sans-serif';
        ctx.fillStyle = '#dc2626';
        ctx.fillText('+', 12, 10);
        break;
      }

      case 'INDUCTOR': {
        ctx.beginPath();
        ctx.moveTo(0, 14);
        ctx.lineTo(12, 14);
        ctx.stroke();
        for (let i = 0; i < 4; i++) {
          ctx.beginPath();
          ctx.arc(16 + i * 8, 14, 4, Math.PI, 0, false);
          ctx.stroke();
        }
        ctx.beginPath();
        ctx.moveTo(44, 14);
        ctx.lineTo(56, 14);
        ctx.stroke();
        break;
      }

      case 'DIODE_1N4007':
      case 'DIODE_1N4001':
      case 'DIODE_1N4148': {
        ctx.beginPath();
        ctx.moveTo(0, 14);
        ctx.lineTo(16, 14);
        ctx.moveTo(32, 14);
        ctx.lineTo(48, 14);
        ctx.moveTo(16, 4);
        ctx.lineTo(32, 14);
        ctx.lineTo(16, 24);
        ctx.closePath();
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(32, 4);
        ctx.lineTo(32, 24);
        ctx.stroke();
        break;
      }

      case 'ZENER_1N4733A': {
        ctx.beginPath();
        ctx.moveTo(0, 14);
        ctx.lineTo(16, 14);
        ctx.moveTo(32, 14);
        ctx.lineTo(48, 14);
        ctx.moveTo(16, 4);
        ctx.lineTo(32, 14);
        ctx.lineTo(16, 24);
        ctx.closePath();
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(28, 4);
        ctx.lineTo(32, 4);
        ctx.lineTo(32, 24);
        ctx.lineTo(36, 24);
        ctx.stroke();
        break;
      }

      case 'BRIDGE_RECTIFIER': {
        ctx.beginPath();
        ctx.moveTo(28, 8);
        ctx.lineTo(48, 28);
        ctx.lineTo(28, 48);
        ctx.lineTo(8, 28);
        ctx.closePath();
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, 16);
        ctx.lineTo(14, 22);
        ctx.moveTo(0, 40);
        ctx.lineTo(14, 34);
        ctx.moveTo(56, 16);
        ctx.lineTo(42, 22);
        ctx.moveTo(56, 40);
        ctx.lineTo(42, 34);
        ctx.stroke();
        ctx.font = 'bold 9px sans-serif';
        ctx.fillText('~', 10, 20);
        ctx.fillText('~', 10, 42);
        ctx.fillText('+', 44, 20);
        ctx.fillText('–', 44, 42);
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
        ctx.moveTo(16, 12);
        ctx.lineTo(16, 36);
        ctx.moveTo(0, 24);
        ctx.lineTo(16, 24);
        ctx.moveTo(16, 16);
        ctx.lineTo(36, 4);
        ctx.lineTo(36, 0);
        ctx.moveTo(16, 32);
        ctx.lineTo(36, 44);
        ctx.lineTo(36, 48);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(33, 40);
        ctx.lineTo(38, 45);
        ctx.lineTo(31, 46);
        ctx.closePath();
        ctx.fill();
        break;
      }

      case 'BJT_PNP_2N2907': {
        ctx.beginPath();
        ctx.arc(26, 24, 18, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(16, 12);
        ctx.lineTo(16, 36);
        ctx.moveTo(0, 24);
        ctx.lineTo(16, 24);
        ctx.moveTo(16, 16);
        ctx.lineTo(36, 4);
        ctx.lineTo(36, 0);
        ctx.moveTo(16, 32);
        ctx.lineTo(36, 44);
        ctx.lineTo(36, 48);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(22, 12);
        ctx.lineTo(17, 16);
        ctx.lineTo(24, 18);
        ctx.closePath();
        ctx.fill();
        break;
      }

      case 'JFET_N_BFW11': {
        ctx.beginPath();
        ctx.arc(26, 25, 18, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, 25);
        ctx.lineTo(16, 25);
        ctx.moveTo(16, 10);
        ctx.lineTo(16, 40);
        ctx.moveTo(24, 12);
        ctx.lineTo(38, 12);
        ctx.lineTo(38, 0);
        ctx.moveTo(24, 38);
        ctx.lineTo(38, 38);
        ctx.lineTo(38, 50);
        ctx.moveTo(24, 10);
        ctx.lineTo(24, 40);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(16, 25);
        ctx.lineTo(24, 25);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(21, 22);
        ctx.lineTo(25, 25);
        ctx.lineTo(21, 28);
        ctx.closePath();
        ctx.fill();
        break;
      }

      case 'MOSFET_N_IRF540': {
        ctx.beginPath();
        ctx.moveTo(0, 36);
        ctx.lineTo(14, 36);
        ctx.moveTo(14, 14);
        ctx.lineTo(14, 40);
        ctx.moveTo(22, 8);
        ctx.lineTo(22, 18);
        ctx.moveTo(22, 21);
        ctx.lineTo(22, 31);
        ctx.moveTo(22, 34);
        ctx.lineTo(22, 44);
        ctx.moveTo(22, 13);
        ctx.lineTo(40, 13);
        ctx.lineTo(40, 0);
        ctx.moveTo(22, 39);
        ctx.lineTo(40, 39);
        ctx.lineTo(40, 52);
        ctx.moveTo(22, 26);
        ctx.lineTo(40, 39);
        ctx.stroke();
        break;
      }

      case 'OPAMP_741':
      case 'OPAMP_LM358':
      case 'OPAMP_3T_VIRTUAL': {
        ctx.beginPath();
        ctx.moveTo(12, 4);
        ctx.lineTo(54, 28);
        ctx.lineTo(12, 52);
        ctx.closePath();
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, 16);
        ctx.lineTo(12, 16);
        ctx.moveTo(0, 40);
        ctx.lineTo(12, 40);
        ctx.moveTo(54, 28);
        ctx.lineTo(64, 28);
        if (comp.type === 'OPAMP_741' || comp.type === 'OPAMP_LM358') {
          ctx.moveTo(32, 0);
          ctx.lineTo(32, 15);
          ctx.moveTo(32, 56);
          ctx.lineTo(32, 41);
        }
        ctx.stroke();
        ctx.font = 'bold 12px monospace';
        ctx.fillText('+', 16, 20);
        ctx.fillText('–', 16, 44);
        break;
      }

      case 'TIMER_555': {
        ctx.strokeRect(10, 8, 52, 64);
        ctx.beginPath();
        ctx.arc(36, 8, 6, 0, Math.PI);
        ctx.stroke();
        for (let i = 0; i < 4; i++) {
          const ly = 16 + i * 16;
          ctx.beginPath();
          ctx.moveTo(0, ly);
          ctx.lineTo(10, ly);
          ctx.moveTo(62, ly);
          ctx.lineTo(72, ly);
          ctx.stroke();
        }
        ctx.font = 'bold 11px sans-serif';
        ctx.fillText('NE555', 18, 44);
        break;
      }

      case 'TTL_7408':
      case 'TTL_7400': {
        ctx.beginPath();
        ctx.moveTo(12, 6);
        ctx.lineTo(28, 6);
        ctx.arc(28, 20, 14, -Math.PI / 2, Math.PI / 2);
        ctx.lineTo(12, 34);
        ctx.closePath();
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, 12);
        ctx.lineTo(12, 12);
        ctx.moveTo(0, 28);
        ctx.lineTo(12, 28);
        if (comp.type === 'TTL_7400') {
          ctx.arc(45, 20, 3, 0, Math.PI * 2);
          ctx.moveTo(48, 20);
          ctx.lineTo(56, 20);
        } else {
          ctx.moveTo(42, 20);
          ctx.lineTo(56, 20);
        }
        ctx.stroke();
        break;
      }

      case 'TTL_7432': {
        ctx.beginPath();
        ctx.moveTo(10, 6);
        ctx.quadraticCurveTo(18, 20, 10, 34);
        ctx.quadraticCurveTo(34, 34, 42, 20);
        ctx.quadraticCurveTo(34, 6, 10, 6);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, 12);
        ctx.lineTo(14, 12);
        ctx.moveTo(0, 28);
        ctx.lineTo(14, 28);
        ctx.moveTo(42, 20);
        ctx.lineTo(56, 20);
        ctx.stroke();
        break;
      }

      case 'TTL_7404': {
        ctx.beginPath();
        ctx.moveTo(12, 6);
        ctx.lineTo(34, 16);
        ctx.lineTo(12, 26);
        ctx.closePath();
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(38, 16, 3, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, 16);
        ctx.lineTo(12, 16);
        ctx.moveTo(41, 16);
        ctx.lineTo(48, 16);
        ctx.stroke();
        break;
      }

      case 'TTL_7486': {
        ctx.beginPath();
        ctx.moveTo(4, 6);
        ctx.quadraticCurveTo(12, 20, 4, 34);
        ctx.moveTo(10, 6);
        ctx.quadraticCurveTo(18, 20, 10, 34);
        ctx.quadraticCurveTo(34, 34, 42, 20);
        ctx.quadraticCurveTo(34, 6, 10, 6);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, 12);
        ctx.lineTo(14, 12);
        ctx.moveTo(0, 28);
        ctx.lineTo(14, 28);
        ctx.moveTo(42, 20);
        ctx.lineTo(56, 20);
        ctx.stroke();
        break;
      }

      case 'LED_RED':
      case 'LED_GREEN': {
        if (comp.brightness > 0.05) {
          ctx.save();
          ctx.fillStyle = comp.color || '#ef4444';
          ctx.shadowColor = comp.color || '#ef4444';
          ctx.shadowBlur = 18 * comp.brightness;
          ctx.globalAlpha = Math.min(0.85, comp.brightness);
          ctx.beginPath();
          ctx.arc(24, 16, 14, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
        ctx.beginPath();
        ctx.moveTo(0, 16);
        ctx.lineTo(16, 16);
        ctx.moveTo(32, 16);
        ctx.lineTo(48, 16);
        ctx.moveTo(16, 6);
        ctx.lineTo(32, 16);
        ctx.lineTo(16, 26);
        ctx.closePath();
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(32, 6);
        ctx.lineTo(32, 26);
        ctx.moveTo(22, 4);
        ctx.lineTo(28, -2);
        ctx.moveTo(28, 6);
        ctx.lineTo(34, 0);
        ctx.stroke();
        break;
      }

      case 'FILAMENT_LAMP': {
        ctx.beginPath();
        ctx.arc(24, 24, 16, 0, Math.PI * 2);
        ctx.stroke();
        if (comp.brightness > 0.05) {
          ctx.save();
          ctx.fillStyle = '#fbbf24';
          ctx.shadowColor = '#fbbf24';
          ctx.shadowBlur = 24 * comp.brightness;
          ctx.globalAlpha = Math.min(0.9, comp.brightness);
          ctx.beginPath();
          ctx.arc(24, 24, 15, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
        ctx.beginPath();
        ctx.moveTo(0, 24);
        ctx.lineTo(8, 24);
        ctx.moveTo(40, 24);
        ctx.lineTo(48, 24);
        ctx.moveTo(13, 13);
        ctx.lineTo(35, 35);
        ctx.moveTo(35, 13);
        ctx.lineTo(13, 35);
        ctx.stroke();
        break;
      }

      case 'LDR': {
        ctx.beginPath();
        ctx.arc(28, 18, 16, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, 18);
        ctx.lineTo(14, 18);
        ctx.lineTo(18, 12);
        ctx.lineTo(24, 24);
        ctx.lineTo(30, 12);
        ctx.lineTo(36, 24);
        ctx.lineTo(40, 18);
        ctx.lineTo(56, 18);
        ctx.moveTo(8, 4);
        ctx.lineTo(16, 10);
        ctx.moveTo(14, 2);
        ctx.lineTo(22, 8);
        ctx.stroke();
        break;
      }

      case 'RELAY_5V':
      case 'RELAY_12V': {
        ctx.strokeRect(10, 6, 44, 44);
        ctx.beginPath();
        ctx.moveTo(0, 14);
        ctx.lineTo(10, 14);
        ctx.moveTo(0, 42);
        ctx.lineTo(10, 42);
        ctx.moveTo(54, 28);
        ctx.lineTo(64, 28);
        ctx.moveTo(54, 12);
        ctx.lineTo(64, 12);
        ctx.moveTo(54, 44);
        ctx.lineTo(64, 44);
        ctx.moveTo(32, 28);
        ctx.lineTo(48, comp.energized ? 44 : 12);
        ctx.stroke();
        break;
      }

      case 'SWITCH_SPST': {
        ctx.beginPath();
        ctx.moveTo(0, 16);
        ctx.lineTo(14, 16);
        ctx.moveTo(34, 16);
        ctx.lineTo(48, 16);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(14, 16, 2.5, 0, Math.PI * 2);
        ctx.arc(34, 16, 2.5, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(14, 16);
        ctx.lineTo(comp.isOpen ? 32 : 34, comp.isOpen ? 4 : 16);
        ctx.stroke();
        break;
      }

      case 'DC_MOTOR': {
        ctx.beginPath();
        ctx.arc(28, 28, 22, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, 28);
        ctx.lineTo(6, 28);
        ctx.moveTo(50, 28);
        ctx.lineTo(56, 28);
        ctx.stroke();
        ctx.save();
        ctx.translate(28, 28);
        ctx.rotate((comp.motorAngle || 0) * (Math.PI / 180));
        ctx.fillStyle = this.theme === 'light' ? '#0284c7' : '#38bdf8';
        for (let blade = 0; blade < 3; blade++) {
          ctx.rotate((2 * Math.PI) / 3);
          ctx.beginPath();
          ctx.ellipse(0, 10, 4, 10, 0, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
        ctx.font = 'bold 9px monospace';
        ctx.fillText(`${Math.round(comp.rpm || 0)} RPM`, 10, 54);
        break;
      }

      case 'DCD_HEX': {
        ctx.strokeRect(8, 4, 40, 56);
        ctx.save();
        ctx.fillStyle = '#ef4444';
        ctx.shadowColor = '#ef4444';
        ctx.shadowBlur = 8;
        ctx.font = 'bold 32px "Courier New", monospace';
        ctx.textAlign = 'center';
        ctx.fillText(comp.displayedChar || '0', 28, 44);
        ctx.restore();
        break;
      }

      case 'VOLTMETER_DC':
      case 'AMMETER_DC': {
        ctx.strokeRect(8, 4, 48, 32);
        ctx.beginPath();
        ctx.moveTo(0, 20);
        ctx.lineTo(8, 20);
        ctx.moveTo(56, 20);
        ctx.lineTo(64, 20);
        ctx.stroke();
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(12, 8, 40, 24);
        ctx.fillStyle = '#4ade80';
        ctx.font = 'bold 9px monospace';
        const val = comp.type === 'VOLTMETER_DC' ? `${(comp.voltageDiff || 0).toFixed(2)}V` : `${((comp.current || 0) * 1000).toFixed(1)}mA`;
        ctx.fillText(val, 16, 24);
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
      ctx.strokeStyle = this.theme === 'light' ? '#0284c7' : '#38bdf8';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(pin.x, pin.y, 2.5, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.restore();

    // Draw component label upright above component in world coordinates
    ctx.save();
    ctx.font = 'bold 10px "Segoe UI", sans-serif';
    ctx.fillStyle = this.theme === 'light' ? '#0f172a' : '#cbd5e1';
    const textLabel = comp.label || comp.partNumber || comp.name;
    if (textLabel) {
      ctx.fillText(textLabel, comp.x, comp.y - 6);
    }
    ctx.restore();
  }

  drawPinSnap(pinInfo) {
    const ctx = this.ctx;
    const wpos = this.getPinWorldPos(pinInfo.comp, pinInfo.pin);
    const pos = this.worldToScreen(wpos.x, wpos.y);
    ctx.save();
    ctx.strokeStyle = '#0284c7';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, 7, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  findPinAt(wx, wy) {
    for (const comp of this.solver.components) {
      for (let pIdx = 0; pIdx < comp.pins.length; pIdx++) {
        const pin = comp.pins[pIdx];
        const wpos = this.getPinWorldPos(comp, pin);
        if (Math.hypot(wx - wpos.x, wy - wpos.y) < 14) {
          return { comp, pin, pIdx };
        }
      }
    }
    return null;
  }

  findComponentAt(wx, wy) {
    for (let i = this.solver.components.length - 1; i >= 0; i--) {
      const comp = this.solver.components[i];
      const cx = comp.x + comp.width / 2;
      const cy = comp.y + comp.height / 2;
      const maxDim = Math.max(comp.width, comp.height) / 2 + 8;
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
    offCtx.fillStyle = this.theme === 'light' ? '#ffffff' : '#090e17';
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
    this.ctx = oldCtx;
    offCtx.restore();

    const dataUrl = offCanvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `multisim_circuit_${Date.now()}.png`;
    a.click();
  }
}
