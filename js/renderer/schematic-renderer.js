/**
 * Multisim Web - Schematic Canvas Renderer & Interactive Wiring System
 * Renders ANSI/IEEE standard electronic symbols, live current particle flow,
 * interactive switches/sliders, component glow shaders, and smoke particle effects.
 */

export class SchematicRenderer {
  constructor(canvas, solver) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.solver = solver;

    // View transform
    this.zoom = 1.0;
    this.panX = 40;
    this.panY = 40;
    this.gridSize = 20;

    // Selections and interaction state
    this.selectedComponent = null;
    this.hoveredPin = null;
    this.isWiring = false;
    this.wireStartPin = null;
    this.mouseWorldPos = { x: 0, y: 0 };
    this.wires = []; // array of { id, fromPinKey, toPinKey, points }

    // Visual options
    this.showCurrentFlow = true;
    this.currentDotOffset = 0;
    this.theme = 'dark'; // 'dark' or 'light'

    // Particle system for blown fuses and smoke
    this.smokeParticles = [];

    // Animation frame timer
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

  render() {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;
    const now = performance.now();
    const dt = (now - this.lastFrameTime) / 1000;
    this.lastFrameTime = now;

    // Update current dots animation
    this.currentDotOffset = (this.currentDotOffset + dt * 40) % 20;

    // Background
    if (this.theme === 'dark') {
      ctx.fillStyle = '#0f172a'; // Deep slate
    } else {
      ctx.fillStyle = '#ffffff'; // Classic Multisim white/ivory
    }
    ctx.fillRect(0, 0, w, h);

    // Save transform for zoom & pan
    ctx.save();
    ctx.translate(this.panX, this.panY);
    ctx.scale(this.zoom, this.zoom);

    // Draw grid dots
    this.drawGrid(w, h);

    // Auto-discover wires based on netId match between pins
    this.syncWiresFromNets();

    // Draw Wires with live voltage colors & moving current particles
    this.drawWires();

    // Draw In-progress wiring line
    if (this.isWiring && this.wireStartPin) {
      this.drawActiveWire();
    }

    // Draw all Components
    for (const comp of this.solver.components) {
      this.drawComponent(comp);
    }

    // Draw smoke particles for blown components
    this.updateAndDrawSmoke(dt);

    // Restore transform
    ctx.restore();

    // Draw Hover & Snap Indicators in screen space or world space
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

    ctx.fillStyle = this.theme === 'dark' ? '#334155' : '#cbd5e1';
    for (let x = startX; x <= endX; x += this.gridSize) {
      for (let y = startY; y <= endY; y += this.gridSize) {
        ctx.fillRect(x - 0.75, y - 0.75, 1.5, 1.5);
      }
    }
  }

  syncWiresFromNets() {
    // Generate wire segments between pins sharing the same netId
    const netGroups = new Map();
    for (const comp of this.solver.components) {
      for (let pIdx = 0; pIdx < comp.pins.length; pIdx++) {
        const pin = comp.pins[pIdx];
        if (pin.netId) {
          if (!netGroups.has(pin.netId)) netGroups.set(pin.netId, []);
          netGroups.get(pin.netId).push({ comp, pin, pIdx, x: comp.x + pin.x, y: comp.y + pin.y });
        }
      }
    }

    this.wireSegments = [];
    for (const [netId, pinList] of netGroups.entries()) {
      if (pinList.length < 2) continue;
      // Connect pin list sequentially or through a common trunk
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
      // Orthogonal dogleg routing
      const midX = (wire.x1 + wire.x2) / 2;
      
      // Wire color based on voltage
      const v = (wire.v1 + wire.v2) / 2;
      let wireColor = '#22c55e'; // Green for ~0V / ground
      if (v > 0.5) {
        wireColor = '#ef4444'; // Red for positive voltage
      } else if (v < -0.5) {
        wireColor = '#3b82f6'; // Blue for negative voltage
      } else if (this.theme === 'light') {
        wireColor = '#1e293b'; // Classic crisp dark trace
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

      // Live moving current charge particles
      if (this.showCurrentFlow && this.solver.isRunning) {
        const branchCurrent = Math.abs((wire.comp1?.current || wire.comp2?.current || 0));
        if (branchCurrent > 1e-4) {
          const speedFactor = Math.min(1.0, branchCurrent / 0.05);
          ctx.fillStyle = '#facc15'; // Glowing yellow electrons
          ctx.shadowColor = '#facc15';
          ctx.shadowBlur = 4;

          // Points along orthogonal segments
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
      ctx.arc(px, py, 2.2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  drawActiveWire() {
    const ctx = this.ctx;
    const p1 = {
      x: this.wireStartPin.comp.x + this.wireStartPin.pin.x,
      y: this.wireStartPin.comp.y + this.wireStartPin.pin.y
    };
    const p2 = this.mouseWorldPos;
    const midX = (p1.x + p2.x) / 2;

    ctx.save();
    ctx.setLineDash([5, 4]);
    ctx.strokeStyle = '#38bdf8';
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
    const x = comp.x;
    const y = comp.y;
    const isSelected = this.selectedComponent?.id === comp.id;

    ctx.save();
    ctx.translate(x, y);

    // Selection glow halo
    if (isSelected) {
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1.8;
      ctx.setLineDash([4, 3]);
      ctx.strokeRect(-6, -6, (comp.width || 48) + 12, (comp.height || 36) + 12);
      ctx.setLineDash([]);
    }

    // Symbol stroke & fill colors
    ctx.strokeStyle = this.theme === 'dark' ? '#f1f5f9' : '#0f172a';
    ctx.fillStyle = this.theme === 'dark' ? '#f1f5f9' : '#0f172a';
    ctx.lineWidth = 1.8;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Draw specific component symbol
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
        // Arrow pointing up
        ctx.beginPath();
        ctx.moveTo(10, 14);
        ctx.lineTo(16, 4);
        ctx.lineTo(22, 14);
        ctx.closePath();
        ctx.fill();
        ctx.font = 'bold 9px "Segoe UI", sans-serif';
        ctx.fillText(comp.type === 'VCC' ? '+5V' : '+12V', 22, 12);
        break;
      }

      case 'VEE': {
        ctx.beginPath();
        ctx.moveTo(16, 0);
        ctx.lineTo(16, 18);
        ctx.stroke();
        // Arrow pointing down
        ctx.beginPath();
        ctx.moveTo(10, 18);
        ctx.lineTo(16, 28);
        ctx.lineTo(22, 18);
        ctx.closePath();
        ctx.fill();
        ctx.font = 'bold 9px "Segoe UI", sans-serif';
        ctx.fillText('-12V', 22, 26);
        break;
      }

      case 'DC_POWER': {
        // Battery plates
        ctx.beginPath();
        ctx.moveTo(24, 0);
        ctx.lineTo(24, 18);
        ctx.moveTo(8, 18);
        ctx.lineTo(40, 18); // Long positive plate
        ctx.moveTo(14, 28);
        ctx.lineTo(34, 28); // Short negative plate
        ctx.moveTo(24, 28);
        ctx.lineTo(24, 48);
        ctx.stroke();
        ctx.font = 'bold 11px sans-serif';
        ctx.fillStyle = '#ef4444';
        ctx.fillText('+', 42, 18);
        ctx.fillStyle = '#38bdf8';
        ctx.fillText('-', 38, 30);
        break;
      }

      case 'AC_POWER': {
        // Circle with sine wave inside
        ctx.beginPath();
        ctx.arc(24, 24, 16, 0, Math.PI * 2);
        ctx.stroke();
        // Leads
        ctx.beginPath();
        ctx.moveTo(24, 0);
        ctx.lineTo(24, 8);
        ctx.moveTo(24, 40);
        ctx.lineTo(24, 48);
        // Sine wave
        ctx.moveTo(14, 24);
        ctx.bezierCurveTo(17, 16, 21, 16, 24, 24);
        ctx.bezierCurveTo(27, 32, 31, 32, 34, 24);
        ctx.stroke();
        break;
      }

      case 'DIGITAL_CLOCK':
      case 'PULSE_VOLTAGE': {
        ctx.strokeRect(6, 6, 36, 36);
        ctx.beginPath();
        ctx.moveTo(0, 24);
        ctx.lineTo(6, 24);
        ctx.moveTo(42, 24);
        ctx.lineTo(48, 24);
        // Square wave
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
        // ANSI Zig-zag symbol
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
        // Resistor with wiper arrow
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
        // Wiper lead & arrow
        ctx.moveTo(32, 40);
        ctx.lineTo(32, 24);
        ctx.stroke();
        // Arrow head
        ctx.beginPath();
        ctx.moveTo(28, 24);
        ctx.lineTo(32, 16);
        ctx.lineTo(36, 24);
        ctx.closePath();
        ctx.fill();
        break;
      }

      case 'LDR': {
        // Resistor inside circle with light arrows
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
        // Inward light arrows
        ctx.moveTo(8, 4);
        ctx.lineTo(16, 10);
        ctx.moveTo(14, 2);
        ctx.lineTo(22, 8);
        ctx.stroke();
        break;
      }

      case 'THERMISTOR_NTC': {
        ctx.beginPath();
        ctx.strokeRect(14, 6, 28, 24);
        ctx.moveTo(0, 18);
        ctx.lineTo(14, 18);
        ctx.moveTo(42, 18);
        ctx.lineTo(56, 18);
        // Diagonal line with hockey stick
        ctx.moveTo(10, 32);
        ctx.lineTo(18, 32);
        ctx.lineTo(44, 4);
        ctx.stroke();
        ctx.font = '8px monospace';
        ctx.fillText('-t°', 36, 32);
        break;
      }

      case 'CAPACITOR': {
        // Non-polarized parallel plates
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
        // Flat positive plate and curved negative plate
        ctx.beginPath();
        ctx.moveTo(0, 16);
        ctx.lineTo(20, 16);
        ctx.moveTo(20, 4);
        ctx.lineTo(20, 28); // Positive
        // Curved negative
        ctx.moveTo(28, 4);
        ctx.quadraticCurveTo(24, 16, 28, 28);
        ctx.moveTo(26, 16);
        ctx.lineTo(48, 16);
        ctx.stroke();
        ctx.font = 'bold 9px sans-serif';
        ctx.fillStyle = '#ef4444';
        ctx.fillText('+', 12, 10);
        break;
      }

      case 'INDUCTOR': {
        // 4 curved coil loops
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

      case 'SWITCH_SPST':
      case 'PUSH_BUTTON_NO': {
        ctx.beginPath();
        ctx.moveTo(0, 16);
        ctx.lineTo(14, 16);
        ctx.moveTo(34, 16);
        ctx.lineTo(48, 16);
        ctx.stroke();
        // Terminals
        ctx.beginPath();
        ctx.arc(14, 16, 2.5, 0, Math.PI * 2);
        ctx.arc(34, 16, 2.5, 0, Math.PI * 2);
        ctx.stroke();
        // Knife arm
        ctx.beginPath();
        ctx.moveTo(14, 16);
        if (comp.isOpen) {
          ctx.lineTo(32, 4); // tilted open
        } else {
          ctx.lineTo(34, 16); // closed
        }
        ctx.stroke();
        break;
      }

      case 'RELAY_SPDT': {
        ctx.strokeRect(10, 6, 44, 44);
        // Coil symbol
        ctx.beginPath();
        ctx.moveTo(0, 14);
        ctx.lineTo(10, 14);
        ctx.moveTo(0, 42);
        ctx.lineTo(10, 42);
        ctx.stroke();
        // Moving contact
        ctx.beginPath();
        ctx.moveTo(54, 28);
        ctx.lineTo(64, 28);
        ctx.moveTo(54, 12);
        ctx.lineTo(64, 12);
        ctx.moveTo(54, 44);
        ctx.lineTo(64, 44);
        // Contact blade
        ctx.moveTo(32, 28);
        ctx.lineTo(48, comp.energized ? 44 : 12);
        ctx.stroke();
        break;
      }

      case 'DIODE_1N4007':
      case 'DIODE_1N4148':
      case 'SCHOTTKY_1N5819': {
        ctx.beginPath();
        ctx.moveTo(0, 14);
        ctx.lineTo(16, 14);
        ctx.moveTo(32, 14);
        ctx.lineTo(48, 14);
        // Triangle anode
        ctx.moveTo(16, 4);
        ctx.lineTo(32, 14);
        ctx.lineTo(16, 24);
        ctx.closePath();
        ctx.stroke();
        // Cathode bar
        ctx.beginPath();
        ctx.moveTo(32, 4);
        ctx.lineTo(32, 24);
        if (comp.type === 'SCHOTTKY_1N5819') {
          // S-shape tabs for Schottky
          ctx.moveTo(28, 4);
          ctx.lineTo(32, 4);
          ctx.moveTo(32, 24);
          ctx.lineTo(36, 24);
        }
        ctx.stroke();
        break;
      }

      case 'ZENER_1N4733A':
      case 'ZENER_1N4742A': {
        ctx.beginPath();
        ctx.moveTo(0, 14);
        ctx.lineTo(16, 14);
        ctx.moveTo(32, 14);
        ctx.lineTo(48, 14);
        // Triangle
        ctx.moveTo(16, 4);
        ctx.lineTo(32, 14);
        ctx.lineTo(16, 24);
        ctx.closePath();
        ctx.stroke();
        // Zener bent cathode bar
        ctx.beginPath();
        ctx.moveTo(28, 4);
        ctx.lineTo(32, 4);
        ctx.lineTo(32, 24);
        ctx.lineTo(36, 24);
        ctx.stroke();
        break;
      }

      case 'LED_RED':
      case 'LED_GREEN':
      case 'LED_BLUE':
      case 'LED_YELLOW':
      case 'LED_RGB': {
        // Glowing bloom circle when forward biased
        if (comp.brightness > 0.05) {
          ctx.save();
          const ledColor = comp.color || '#ef4444';
          ctx.shadowColor = ledColor;
          ctx.shadowBlur = 18 * comp.brightness;
          ctx.fillStyle = ledColor;
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
        // Triangle
        ctx.moveTo(16, 6);
        ctx.lineTo(32, 16);
        ctx.lineTo(16, 26);
        ctx.closePath();
        ctx.stroke();
        // Cathode bar
        ctx.beginPath();
        ctx.moveTo(32, 6);
        ctx.lineTo(32, 26);
        // Emitting light rays
        ctx.moveTo(22, 4);
        ctx.lineTo(28, -2);
        ctx.moveTo(28, 6);
        ctx.lineTo(34, 0);
        ctx.stroke();
        break;
      }

      case 'BRIDGE_RECTIFIER': {
        // Diamond shaped full wave bridge
        ctx.beginPath();
        ctx.moveTo(28, 8);
        ctx.lineTo(48, 28);
        ctx.lineTo(28, 48);
        ctx.lineTo(8, 28);
        ctx.closePath();
        ctx.stroke();
        // Terminal stubs
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
        ctx.font = '8px sans-serif';
        ctx.fillText('~', 10, 20);
        ctx.fillText('~', 10, 42);
        ctx.fillText('+', 44, 20);
        ctx.fillText('-', 44, 42);
        break;
      }

      case 'BJT_NPN_2N2222':
      case 'BJT_NPN_BC547': {
        // Transistor circle
        ctx.beginPath();
        ctx.arc(26, 24, 18, 0, Math.PI * 2);
        ctx.stroke();
        // Base bar
        ctx.beginPath();
        ctx.moveTo(16, 12);
        ctx.lineTo(16, 36);
        ctx.stroke();
        // Base lead
        ctx.beginPath();
        ctx.moveTo(0, 24);
        ctx.lineTo(16, 24);
        // Collector lead
        ctx.moveTo(16, 16);
        ctx.lineTo(36, 4);
        ctx.lineTo(36, 0);
        // Emitter lead with outward arrow
        ctx.moveTo(16, 32);
        ctx.lineTo(36, 44);
        ctx.lineTo(36, 48);
        ctx.stroke();
        // Outward arrow on Emitter
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
        // Emitter at top with inward arrow
        ctx.moveTo(16, 16);
        ctx.lineTo(36, 4);
        ctx.lineTo(36, 0);
        ctx.moveTo(16, 32);
        ctx.lineTo(36, 44);
        ctx.lineTo(36, 48);
        ctx.stroke();
        // Inward arrow
        ctx.beginPath();
        ctx.moveTo(22, 12);
        ctx.lineTo(17, 16);
        ctx.lineTo(24, 18);
        ctx.closePath();
        ctx.fill();
        break;
      }

      case 'MOSFET_N_IRF540':
      case 'MOSFET_2N7000': {
        // Gate, Drain, Source
        ctx.beginPath();
        ctx.moveTo(0, 36);
        ctx.lineTo(14, 36); // Gate
        ctx.moveTo(14, 14);
        ctx.lineTo(14, 40); // Gate bar
        // Channel gaps
        ctx.moveTo(22, 8);
        ctx.lineTo(22, 18);
        ctx.moveTo(22, 21);
        ctx.lineTo(22, 31);
        ctx.moveTo(22, 34);
        ctx.lineTo(22, 44);
        // Drain lead
        ctx.moveTo(22, 13);
        ctx.lineTo(40, 13);
        ctx.lineTo(40, 0);
        // Source lead
        ctx.moveTo(22, 39);
        ctx.lineTo(40, 39);
        ctx.lineTo(40, 52);
        // Center bulk arrow pointing in (N-channel)
        ctx.moveTo(22, 26);
        ctx.lineTo(40, 39);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(28, 28);
        ctx.lineTo(22, 26);
        ctx.lineTo(26, 33);
        ctx.closePath();
        ctx.fill();
        break;
      }

      case 'OPAMP_741':
      case 'OPAMP_3T_VIRTUAL': {
        // Standard large triangular op-amp
        ctx.beginPath();
        ctx.moveTo(12, 4);
        ctx.lineTo(54, 28);
        ctx.lineTo(12, 52);
        ctx.closePath();
        ctx.stroke();
        // Leads
        ctx.beginPath();
        ctx.moveTo(0, 16);
        ctx.lineTo(12, 16); // In+
        ctx.moveTo(0, 40);
        ctx.lineTo(12, 40); // In-
        ctx.moveTo(54, 28);
        ctx.lineTo(64, 28); // Out
        if (comp.type === 'OPAMP_741') {
          ctx.moveTo(32, 0);
          ctx.lineTo(32, 15); // V+
          ctx.moveTo(32, 56);
          ctx.lineTo(32, 41); // V-
        }
        ctx.stroke();
        ctx.font = 'bold 11px monospace';
        ctx.fillText('+', 16, 20);
        ctx.fillText('–', 16, 44);
        break;
      }

      case 'TIMER_555': {
        // IC Body
        ctx.strokeRect(10, 8, 52, 64);
        // Semi-circle notch at top
        ctx.beginPath();
        ctx.arc(36, 8, 6, 0, Math.PI);
        ctx.stroke();
        // Leads
        for (let i = 0; i < 4; i++) {
          const ly = 16 + i * 16;
          ctx.beginPath();
          ctx.moveTo(0, ly);
          ctx.lineTo(10, ly);
          ctx.moveTo(62, ly);
          ctx.lineTo(72, ly);
          ctx.stroke();
        }
        ctx.font = 'bold 10px sans-serif';
        ctx.fillText('NE555', 18, 44);
        break;
      }

      case 'TTL_7408':
      case 'TTL_7400': {
        // AND / NAND
        ctx.beginPath();
        ctx.moveTo(12, 6);
        ctx.lineTo(28, 6);
        ctx.arc(28, 20, 14, -Math.PI / 2, Math.PI / 2);
        ctx.lineTo(12, 34);
        ctx.closePath();
        ctx.stroke();
        // Leads
        ctx.beginPath();
        ctx.moveTo(0, 12);
        ctx.lineTo(12, 12);
        ctx.moveTo(0, 28);
        ctx.lineTo(12, 28);
        if (comp.type === 'TTL_7400') {
          // Bubble
          ctx.moveTo(42, 20);
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

      case 'TTL_7432':
      case 'TTL_7402': {
        // OR / NOR
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
        if (comp.type === 'TTL_7402') {
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

      case 'TTL_7404': {
        // Inverter NOT
        ctx.beginPath();
        ctx.moveTo(12, 6);
        ctx.lineTo(34, 16);
        ctx.lineTo(12, 26);
        ctx.closePath();
        ctx.stroke();
        // Bubble
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

      case 'TTL_7490':
      case 'CMOS_4017': {
        // IC Box
        ctx.strokeRect(10, 6, comp.width - 20, comp.height - 12);
        ctx.font = 'bold 10px sans-serif';
        ctx.fillText(comp.partNumber || comp.name, 14, 30);
        // Pin stubs
        for (const pin of comp.pins) {
          ctx.beginPath();
          if (pin.x === 0) {
            ctx.moveTo(0, pin.y);
            ctx.lineTo(10, pin.y);
          } else if (pin.x === comp.width) {
            ctx.moveTo(comp.width - 10, pin.y);
            ctx.lineTo(comp.width, pin.y);
          }
          ctx.stroke();
        }
        break;
      }

      case 'DCD_HEX': {
        // Decoded Hex Display
        ctx.strokeRect(8, 4, 40, 56);
        // Big phosphor LED character
        ctx.save();
        ctx.fillStyle = '#ef4444';
        ctx.shadowColor = '#ef4444';
        ctx.shadowBlur = 10;
        ctx.font = 'bold 32px "Courier New", monospace';
        ctx.textAlign = 'center';
        ctx.fillText(comp.displayedChar || '0', 28, 44);
        ctx.restore();
        // Pin stubs
        for (let i = 0; i < 4; i++) {
          const py = 12 + i * 14;
          ctx.beginPath();
          ctx.moveTo(0, py);
          ctx.lineTo(8, py);
          ctx.stroke();
        }
        break;
      }

      case 'DC_MOTOR': {
        // Motor circular housing
        ctx.beginPath();
        ctx.arc(28, 28, 22, 0, Math.PI * 2);
        ctx.stroke();
        // Terminals
        ctx.beginPath();
        ctx.moveTo(0, 28);
        ctx.lineTo(6, 28);
        ctx.moveTo(50, 28);
        ctx.lineTo(56, 28);
        ctx.stroke();
        // Rotating 3-blade shaft animation
        ctx.save();
        ctx.translate(28, 28);
        ctx.rotate((comp.motorAngle || 0) * (Math.PI / 180));
        ctx.fillStyle = '#38bdf8';
        for (let blade = 0; blade < 3; blade++) {
          ctx.rotate((2 * Math.PI) / 3);
          ctx.beginPath();
          ctx.ellipse(0, 10, 4, 10, 0, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
        ctx.font = '9px monospace';
        ctx.fillText(`${Math.round(comp.rpm || 0)} RPM`, 12, 54);
        break;
      }

      case 'FUSE': {
        // Fuse cylinder
        if (comp.isBlown) {
          ctx.strokeStyle = '#64748b'; // Gray/broken
        }
        ctx.strokeRect(10, 6, 32, 12);
        ctx.beginPath();
        ctx.moveTo(0, 12);
        ctx.lineTo(10, 12);
        ctx.moveTo(42, 12);
        ctx.lineTo(52, 12);
        // Fuse wire inside
        if (!comp.isBlown) {
          ctx.moveTo(10, 12);
          ctx.quadraticCurveTo(26, 16, 42, 12);
        } else {
          // Melted wire
          ctx.moveTo(10, 12);
          ctx.lineTo(20, 12);
          ctx.moveTo(32, 12);
          ctx.lineTo(42, 12);
        }
        ctx.stroke();
        break;
      }

      case 'FILAMENT_LAMP': {
        // Circle with X filament
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
        // Leads & filament
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

      case 'VOLTMETER_DC':
      case 'AMMETER_DC': {
        ctx.strokeRect(8, 4, 48, 32);
        ctx.beginPath();
        ctx.moveTo(0, 20);
        ctx.lineTo(8, 20);
        ctx.moveTo(56, 20);
        ctx.lineTo(64, 20);
        ctx.stroke();
        // LCD readout display
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(12, 8, 40, 24);
        ctx.fillStyle = '#4ade80'; // Digital phosphor green
        ctx.font = 'bold 9px monospace';
        const val = comp.type === 'VOLTMETER_DC' ? `${(comp.voltageDiff || 0).toFixed(2)}V` : `${((comp.current || 0) * 1000).toFixed(1)}mA`;
        ctx.fillText(val, 16, 24);
        break;
      }

      case 'LOGIC_PROBE': {
        const v = comp.pins[0]?.voltage ?? 0;
        let color = '#64748b'; // Hi-Z / indeterminate
        let text = '?';
        if (v > 2.0) {
          color = '#ef4444'; // Logic HIGH
          text = 'H';
        } else if (v < 0.8) {
          color = '#22c55e'; // Logic LOW
          text = 'L';
        }
        ctx.save();
        ctx.fillStyle = color;
        ctx.shadowColor = color;
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(18, 18, 12, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 11px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(text, 18, 22);
        break;
      }

      case 'PIEZO_BUZZER': {
        ctx.beginPath();
        ctx.arc(24, 24, 18, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, 24);
        ctx.lineTo(6, 24);
        ctx.moveTo(42, 24);
        ctx.lineTo(48, 24);
        ctx.stroke();
        // Sound waves when active
        if (comp.buzzerActive) {
          ctx.strokeStyle = '#f59e0b';
          ctx.beginPath();
          ctx.arc(24, 24, 24, -Math.PI / 4, Math.PI / 4);
          ctx.stroke();
        }
        ctx.font = 'bold 9px sans-serif';
        ctx.fillText('BEEP', 14, 27);
        break;
      }

      default: {
        // Generic rectangular IC fallback
        ctx.strokeRect(6, 6, comp.width - 12, comp.height - 12);
        ctx.font = '9px sans-serif';
        ctx.fillText(comp.partNumber || comp.type, 10, 20);
        break;
      }
    }

    // Component Label & Value text
    ctx.font = '10px "Segoe UI", sans-serif';
    ctx.fillStyle = this.theme === 'dark' ? '#94a3b8' : '#475569';
    if (comp.label) {
      ctx.fillText(comp.label, 0, -6);
    }

    // Interactive slider handle for Potentiometer / LDR / Thermistor
    if (comp.type === 'POTENTIOMETER' || comp.type === 'LDR' || comp.type === 'THERMISTOR_NTC') {
      this.drawInteractiveSlider(comp);
    }

    // Draw component pins
    for (const pin of comp.pins) {
      this.drawPin(pin);
    }

    // Blown smoke animation trigger
    if (comp.smokeEffect && !comp.smokeInitialized) {
      comp.smokeInitialized = true;
      this.triggerSmoke(comp.x + comp.width / 2, comp.y + comp.height / 2);
    }

    ctx.restore();
  }

  drawInteractiveSlider(comp) {
    const ctx = this.ctx;
    const w = comp.width;
    const y = comp.height + 4;
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(4, y);
    ctx.lineTo(w - 4, y);
    ctx.stroke();

    // Slider knob position
    let frac = 0.5;
    if (comp.type === 'POTENTIOMETER') frac = comp.sliderValue ?? 0.5;
    if (comp.type === 'LDR') frac = (comp.lux ?? 400) / 1000;
    if (comp.type === 'THERMISTOR_NTC') frac = ((comp.temperature ?? 25) + 10) / 100;

    const knobX = 4 + frac * (w - 8);
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.arc(knobX, y, 5, 0, Math.PI * 2);
    ctx.fill();
  }

  drawPin(pin) {
    const ctx = this.ctx;
    // Tiny terminal solder ring
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(pin.x, pin.y, 2.5, 0, Math.PI * 2);
    ctx.stroke();
  }

  drawPinSnap(pinInfo) {
    const ctx = this.ctx;
    const pos = this.worldToScreen(pinInfo.comp.x + pinInfo.pin.x, pinInfo.comp.y + pinInfo.pin.y);
    ctx.save();
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, 7, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
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

  // Hit testing for components, pins, switches, sliders
  findPinAt(wx, wy) {
    for (const comp of this.solver.components) {
      for (let pIdx = 0; pIdx < comp.pins.length; pIdx++) {
        const pin = comp.pins[pIdx];
        const px = comp.x + pin.x;
        const py = comp.y + pin.y;
        if (Math.hypot(wx - px, wy - py) < 12) {
          return { comp, pin, pIdx };
        }
      }
    }
    return null;
  }

  findComponentAt(wx, wy) {
    for (let i = this.solver.components.length - 1; i >= 0; i--) {
      const comp = this.solver.components[i];
      const w = comp.width || 48;
      const h = comp.height || 36;
      if (wx >= comp.x && wx <= comp.x + w && wy >= comp.y && wy <= comp.y + h) {
        return comp;
      }
    }
    return null;
  }
}
