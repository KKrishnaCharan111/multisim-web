/**
 * Multisim Web Studio - Academic & Professional Circuit Lab Controller
 * Features:
 * - Single File Dropdown & Simulation Controls on One Side
 * - Big Studio Oscilloscope & Live Signal Analyzer Modal with Auto-Scale
 * - Flawless Dual-Theme (Classic NI Multisim Light & Dark-Slate)
 * - Rock-Solid Magnetic Terminal Snapping (Click-to-wire in any mode)
 * - Explicit Wire Routing & Netlist Solver Integration
 * - Procedural Web Audio Laboratory Sound Engine
 */

import { MNACircuitSolver } from './engine/mna-solver.js';
import { SchematicRenderer } from './renderer/schematic-renderer.js';
import { Oscilloscope } from './instruments/oscilloscope.js';
import { DigitalMultimeter } from './instruments/multimeter.js';
import { COMPONENT_CATEGORIES, COMPONENT_CATALOG } from './components/component-definitions.js';
import { AudioManager } from './audio/audio-manager.js';
import { 
  HistoryManager, 
  AddEntityCommand, 
  DeleteEntityCommand, 
  MoveEntityCommand, 
  RotateCommand, 
  AddWireCommand, 
  ChangeParamCommand 
} from './history/history-manager.js';

class MultisimApp {
  constructor() {
    this.solver = new MNACircuitSolver();
    this.canvas = document.getElementById('schematicCanvas');
    this.renderer = new SchematicRenderer(this.canvas, this.solver);

    this.scopeCanvas = document.getElementById('scopeCanvas');
    this.bigScopeCanvas = document.getElementById('bigScopeCanvas');
    this.oscilloscope = new Oscilloscope(this.scopeCanvas, this.solver);
    this.multimeter = new DigitalMultimeter(this.solver);

    this.audio = new AudioManager();
    this.history = new HistoryManager(this);

    this.currentMode = 'select'; // 'select', 'wire', 'probe'
    this.activeProbeChannel = 0; // 0 for CH A, 1 for CH B
    this.nextNetId = 1;
    this.wires = []; // Explicit wires: { id, fromCompId, fromPinIdx, toCompId, toPinIdx, netId }
    this.renderer.wires = this.wires;

    // Interaction states
    this.isDraggingComp = false;
    this.dragStartPos = { x: 0, y: 0 };
    this.compStartPos = { x: 0, y: 0 };
    this.isPanning = false;
    this.panStart = { x: 0, y: 0 };
    this.isSpacePressed = false;
    this.clipboardComponent = null;

    // UI stats
    this.fpsCounter = 0;
    this.lastFpsTime = performance.now();
    this.actualFps = 60;
    this.isBigScopeOpen = false;

    this.initUI();
    this.initCanvasEvents();
    this.initInstruments();
    this.resizeCanvas();

    // Check saved theme and circuit
    this.initTheme();
    this.loadSavedCircuit();

    this.renderer.scopeChannels = this.oscilloscope.channels;
    this.solver.isRunning = true;
    this.startSimulationLoop();
  }

  initTheme() {
    const savedTheme = localStorage.getItem('multisim_studio_theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
    this.renderer.setTheme(savedTheme);
    const themeBtnText = document.getElementById('themeBtnText');
    if (themeBtnText) {
      themeBtnText.textContent = savedTheme === 'light' ? 'Dark Theme' : 'Light Theme';
    }
  }

  toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme') || 'dark';
    const nextTheme = current === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', nextTheme);
    localStorage.setItem('multisim_studio_theme', nextTheme);
    this.renderer.setTheme(nextTheme);

    const themeBtnText = document.getElementById('themeBtnText');
    if (themeBtnText) {
      themeBtnText.textContent = nextTheme === 'light' ? 'Dark Theme' : 'Light Theme';
    }
    this.audio.playTerminalSnap();
  }

  resizeCanvas() {
    const viewport = document.getElementById('viewport');
    if (!viewport) return;
    this.canvas.width = viewport.clientWidth;
    this.canvas.height = viewport.clientHeight;
    this.renderer.render();
  }

  parseEngValue(input) {
    if (typeof input === 'number') return input;
    if (!input || typeof input !== 'string') return 1000;
    const clean = input.trim().replace(/Ω|ohm|F|H|V|A|Hz/gi, '').trim();
    const match = clean.match(/^([+-]?\d*(?:\.\d+)?)\s*([a-zA-Zµ]?)$/);
    if (!match) return parseFloat(clean) || 1000;
    const num = parseFloat(match[1]);
    const unit = match[2];
    if (isNaN(num)) return 1000;

    switch (unit) {
      case 'p': case 'P': return num * 1e-12;
      case 'n': case 'N': return num * 1e-9;
      case 'u': case 'U': case 'µ': return num * 1e-6;
      case 'm': return num * 1e-3;
      case 'k': case 'K': return num * 1e3;
      case 'M': return num * 1e6;
      case 'G': return num * 1e9;
      default: return num;
    }
  }

  formatEngValue(val, unit = '') {
    if (val === undefined || val === null || isNaN(val)) return '0 ' + unit;
    const abs = Math.abs(val);
    if (abs >= 1e6) return (val / 1e6).toFixed(2).replace(/\.00$/, '') + ' M' + unit;
    if (abs >= 1e3) return (val / 1e3).toFixed(2).replace(/\.00$/, '') + ' k' + unit;
    if (abs >= 1) return val.toFixed(2).replace(/\.00$/, '') + ' ' + unit;
    if (abs >= 1e-3) return (val * 1e3).toFixed(2).replace(/\.00$/, '') + ' m' + unit;
    if (abs >= 1e-6) return (val * 1e6).toFixed(2).replace(/\.00$/, '') + ' µ' + unit;
    if (abs >= 1e-9) return (val * 1e9).toFixed(2).replace(/\.00$/, '') + ' n' + unit;
    return (val * 1e12).toFixed(2).replace(/\.00$/, '') + ' p' + unit;
  }

  initUI() {
    window.addEventListener('resize', () => this.resizeCanvas());

    this.renderCatalog();

    // 1. Single File Dropdown Menu
    const btnFileMenu = document.getElementById('btnFileMenu');
    const fileDropdown = document.getElementById('fileDropdown');

    btnFileMenu.addEventListener('click', (e) => {
      e.stopPropagation();
      fileDropdown.classList.toggle('show');
    });

    window.addEventListener('click', () => {
      fileDropdown.classList.remove('show');
    });

    const btnNew = document.getElementById('btnNew');
    const btnOpen = document.getElementById('btnOpen');
    const fileInput = document.getElementById('fileInput');
    const btnSaveCircuit = document.getElementById('btnSaveCircuit');
    const btnSave = document.getElementById('btnSave');
    const btnExportImage = document.getElementById('btnExportImage');
    const btnExportNetlist = document.getElementById('btnExportNetlist');

    btnNew.addEventListener('click', () => {
      if (confirm('Create a new blank circuit? Current canvas will be cleared.')) {
        this.solver.setComponents([]);
        this.wires = [];
        this.renderer.wires = this.wires;
        this.renderer.selectedComponent = null;
        this.history.clear();
        this.updateInspector(null);
        this.updateProbeDropdowns();
        this.audio.playDelete();
        this.renderer.render();
      }
    });

    btnOpen.addEventListener('click', () => fileInput.click());

    fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target.result);
          if (Array.isArray(parsed)) {
            this.solver.setComponents(parsed);
            this.wires = [];
          } else if (parsed && parsed.components) {
            this.solver.setComponents(parsed.components);
            this.wires = parsed.wires || [];
          }
          this.renderer.wires = this.wires;
          this.history.clear();
          this.saveCircuit(false);
          this.updateProbeDropdowns();
          this.updateInspector(null);
          this.audio.playComponentPlacement();
          this.renderer.render();
        } catch (err) {
          alert('Error opening circuit file: ' + err.message);
        }
      };
      reader.readAsText(file);
      fileInput.value = '';
    });

    btnSaveCircuit.addEventListener('click', () => this.saveCircuit(true));
    btnSave.addEventListener('click', () => this.downloadCircuitFile());
    btnExportImage.addEventListener('click', () => this.renderer.exportAsImage());
    btnExportNetlist.addEventListener('click', () => this.downloadSpiceNetlist());

    // 2. Center Tools
    const toolSelect = document.getElementById('toolSelect');
    const toolWire = document.getElementById('toolWire');
    const toolProbe = document.getElementById('toolProbe');
    const btnRotate = document.getElementById('btnRotate');
    const btnDelete = document.getElementById('btnDelete');
    const btnToggleTheme = document.getElementById('btnToggleTheme');
    const btnToggleCurrent = document.getElementById('btnToggleCurrent');
    const btnToggleAudio = document.getElementById('btnToggleAudio');

    toolSelect.addEventListener('click', () => {
      this.currentMode = 'select';
      toolSelect.classList.add('active');
      toolWire.classList.remove('active');
      toolProbe.classList.remove('active');
      this.renderer.isWiring = false;
      this.renderer.wireStartPin = null;
    });

    toolWire.addEventListener('click', () => {
      this.currentMode = 'wire';
      toolWire.classList.add('active');
      toolSelect.classList.remove('active');
      toolProbe.classList.remove('active');
    });

    toolProbe.addEventListener('click', () => {
      this.currentMode = 'probe';
      toolProbe.classList.add('active');
      toolSelect.classList.remove('active');
      toolWire.classList.remove('active');
    });

    btnRotate.addEventListener('click', () => this.rotateSelected());
    btnDelete.addEventListener('click', () => this.deleteSelected());
    btnToggleTheme.addEventListener('click', () => this.toggleTheme());

    btnToggleCurrent.addEventListener('click', () => {
      this.renderer.showCurrentFlow = !this.renderer.showCurrentFlow;
      btnToggleCurrent.classList.toggle('active', this.renderer.showCurrentFlow);
    });

    btnToggleAudio.addEventListener('click', () => {
      const active = this.audio.toggle();
      btnToggleAudio.classList.toggle('active', active);
    });

    // 3. Big Live Output & Oscilloscope Modal
    const btnOpenBigScope = document.getElementById('btnOpenBigScope');
    const btnExpandScopeSmall = document.getElementById('btnExpandScopeSmall');
    const bigScopeModal = document.getElementById('bigScopeModal');
    const btnCloseBigScope = document.getElementById('btnCloseBigScope');
    const btnBigAutoScale = document.getElementById('btnBigAutoScale');
    const scopeAutoSet = document.getElementById('scopeAutoSet');

    const openBigScope = () => {
      this.autoProbeIfNeeded();
      this.isBigScopeOpen = true;
      bigScopeModal.classList.add('show');
      this.oscilloscope.autoScale(0);
    };

    const closeBigScope = () => {
      this.isBigScopeOpen = false;
      bigScopeModal.classList.remove('show');
    };

    btnOpenBigScope.addEventListener('click', openBigScope);
    if (btnExpandScopeSmall) btnExpandScopeSmall.addEventListener('click', openBigScope);
    btnCloseBigScope.addEventListener('click', closeBigScope);

    btnBigAutoScale.addEventListener('click', () => {
      this.oscilloscope.autoScale(0);
      this.audio.playTerminalSnap();
    });

    if (scopeAutoSet) {
      scopeAutoSet.addEventListener('click', () => {
        this.oscilloscope.autoScale(0);
        this.audio.playTerminalSnap();
      });
    }

    // 4. Simulation Controls (Grouped on Right)
    const btnRun = document.getElementById('btnRun');
    const btnPause = document.getElementById('btnPause');
    const btnStep = document.getElementById('btnStep');
    const btnStop = document.getElementById('btnStop');

    btnRun.addEventListener('click', () => {
      this.solver.isRunning = true;
      btnRun.classList.add('running');
      document.getElementById('simStatusLight').classList.add('active');
      document.getElementById('simStatusText').textContent = 'Simulation Running';
      this.autoProbeIfNeeded();
      this.audio.playRelayToggle(true);
    });

    btnPause.addEventListener('click', () => {
      this.solver.isRunning = false;
      btnRun.classList.remove('running');
      document.getElementById('simStatusLight').classList.remove('active');
      document.getElementById('simStatusText').textContent = 'Simulation Paused';
      this.audio.playRelayToggle(false);
    });

    btnStep.addEventListener('click', () => {
      this.solver.step(this.solver.dt);
      this.renderer.render();
    });

    btnStop.addEventListener('click', () => {
      this.solver.reset();
      this.renderer.render();
      this.audio.playRelayToggle(false);
    });

    // Search filter
    document.getElementById('componentSearch').addEventListener('input', (e) => {
      const query = e.target.value.toLowerCase().trim();
      this.filterCatalog(query);
    });

    // Drawer Tabs
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const tab = btn.dataset.tab;
        document.getElementById('tabContentOscilloscope').style.display = tab === 'oscilloscope' ? 'flex' : 'none';
        document.getElementById('tabContentMultimeter').style.display = tab === 'multimeter' ? 'flex' : 'none';
        document.getElementById('tabContentInspector').style.display = tab === 'inspector' ? 'flex' : 'none';
      });
    });

    // Zoom Controls
    document.getElementById('btnZoomIn').addEventListener('click', () => {
      this.renderer.zoom = Math.min(2.5, this.renderer.zoom * 1.2);
      this.renderer.render();
    });
    document.getElementById('btnZoomOut').addEventListener('click', () => {
      this.renderer.zoom = Math.max(0.4, this.renderer.zoom / 1.2);
      this.renderer.render();
    });
    document.getElementById('btnZoomFit').addEventListener('click', () => {
      this.renderer.zoom = 1.0;
      this.renderer.panX = 60;
      this.renderer.panY = 60;
      this.renderer.render();
    });

    // Shortcuts
    window.addEventListener('keydown', (e) => {
      const activeTag = document.activeElement ? document.activeElement.tagName : '';
      if (activeTag === 'INPUT' || activeTag === 'TEXTAREA' || activeTag === 'SELECT') return;

      if ((e.ctrlKey || e.metaKey) && (e.key === 'z' || e.key === 'Z')) {
        e.preventDefault();
        if (e.shiftKey) this.history.redo();
        else this.history.undo();
        return;
      }
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || e.key === 'Y')) {
        e.preventDefault();
        this.history.redo();
        return;
      }
      if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S')) {
        e.preventDefault();
        this.saveCircuit(true);
        return;
      }
      if (e.key === 'r' || e.key === 'R') this.rotateSelected();
      if (e.key === 'Delete' || e.key === 'Backspace') this.deleteSelected();
      if (e.key === 'w' || e.key === 'W') toolWire.click();
      if (e.key === 's' || e.key === 'S' || e.key === 'Escape') {
        if (this.isBigScopeOpen) closeBigScope();
        else toolSelect.click();
      }
      if (e.key === 'p' || e.key === 'P') toolProbe.click();
      if (e.key === 'F5') { e.preventDefault(); btnRun.click(); }
      if (e.key === 'F10') { e.preventDefault(); btnStep.click(); }
    });
  }

  // Auto-probe first active source if user hasn't probed yet
  autoProbeIfNeeded() {
    if (this.oscilloscope.channels[0].probePin) return;

    for (const comp of this.solver.components) {
      if (['SINE_GEN', 'DIGITAL_CLOCK', 'AC_POWER', 'DC_POWER', 'OPAMP_741', 'OPAMP_LM358'].includes(comp.type)) {
        this.attachScopeProbe(comp, 0);
        break;
      }
    }
  }

  saveCircuit(notifyUser = true) {
    try {
      const circuitData = {
        version: 2,
        components: this.solver.components,
        wires: this.wires
      };
      localStorage.setItem('multisim_studio_saved_circuit', JSON.stringify(circuitData));
      this.history.markSaved();
      this.audio.playTerminalSnap();
      if (notifyUser) {
        alert('Circuit configuration and wires saved successfully!');
      }
    } catch (err) {
      alert('Error saving circuit: ' + err.message);
    }
  }

  loadSavedCircuit() {
    try {
      const saved = localStorage.getItem('multisim_studio_saved_circuit');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          this.solver.setComponents(parsed);
          this.wires = [];
        } else if (parsed && parsed.components) {
          this.solver.setComponents(parsed.components);
          this.wires = parsed.wires || [];
        }
        this.renderer.wires = this.wires;
        this.history.clear();
        this.updateProbeDropdowns();
        return;
      }
    } catch (_) {}
    this.solver.setComponents([]);
    this.wires = [];
    this.renderer.wires = this.wires;
    this.history.clear();
    this.updateProbeDropdowns();
  }

  downloadCircuitFile() {
    const data = JSON.stringify({
      version: 2,
      components: this.solver.components,
      wires: this.wires
    }, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `multisim_circuit_${Date.now()}.ms14`;
    a.click();
  }

  downloadSpiceNetlist() {
    let netlist = `* MULTISIM WEB STUDIO SPICE NETLIST EXPORT\n* Generated: ${new Date().toISOString()}\n\n`;
    this.solver.components.forEach((c, idx) => {
      const p1 = c.pins[0]?.netId || '0';
      const p2 = c.pins[1]?.netId || '0';
      switch (c.type) {
        case 'RESISTOR':
          netlist += `R${idx + 1} ${p1} ${p2} ${c.resistance || 1000}\n`;
          break;
        case 'CAPACITOR':
        case 'CAPACITOR_ELECTROLYTIC':
          netlist += `C${idx + 1} ${p1} ${p2} ${c.capacitance || 1e-6}\n`;
          break;
        case 'INDUCTOR':
          netlist += `L${idx + 1} ${p1} ${p2} ${c.inductance || 1e-3}\n`;
          break;
        case 'DC_POWER':
          netlist += `V${idx + 1} ${p1} ${p2} DC ${c.voltage || 5}\n`;
          break;
        case 'DIODE_1N4007':
          netlist += `D${idx + 1} ${p1} ${p2} 1N4007\n`;
          break;
        default:
          netlist += `* ${c.type} ${c.label || ''} [${c.pins.map(p => p.netId || 'NC').join(' ')}]\n`;
          break;
      }
    });
    netlist += '\n.tran 100u 100m\n.end\n';

    const blob = new Blob([netlist], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `circuit_netlist_${Date.now()}.cir`;
    a.click();
  }

  renderCatalog() {
    const container = document.getElementById('catalogContainer');
    container.innerHTML = '';

    COMPONENT_CATEGORIES.forEach(cat => {
      const groupHeader = document.createElement('div');
      groupHeader.className = 'category-group-header';
      groupHeader.innerHTML = `<span>${cat.name}</span><span>▾</span>`;

      const listDiv = document.createElement('div');
      listDiv.className = 'component-list-items';

      const items = COMPONENT_CATALOG.filter(c => c.category === cat.id);
      items.forEach(item => {
        const btn = document.createElement('button');
        btn.className = 'catalog-item-btn';
        btn.innerHTML = `
          <span>${item.name}</span>
          <span class="catalog-item-part">${item.partNumber || ''}</span>
        `;
        btn.title = item.description;
        btn.addEventListener('click', () => {
          this.placeNewComponent(item);
        });
        listDiv.appendChild(btn);
      });

      groupHeader.addEventListener('click', () => {
        listDiv.style.display = listDiv.style.display === 'none' ? 'flex' : 'none';
      });

      container.appendChild(groupHeader);
      container.appendChild(listDiv);
    });
  }

  filterCatalog(query) {
    document.querySelectorAll('.catalog-item-btn').forEach(btn => {
      const text = btn.innerText.toLowerCase();
      btn.style.display = (!query || text.includes(query)) ? 'flex' : 'none';
    });
  }

  placeNewComponent(def) {
    const wx = this.renderer.snapToGrid(-this.renderer.panX / this.renderer.zoom + 220);
    const wy = this.renderer.snapToGrid(-this.renderer.panY / this.renderer.zoom + 180);

    const comp = {
      id: `comp_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      type: def.type,
      name: def.name,
      partNumber: def.partNumber,
      category: def.category,
      x: wx,
      y: wy,
      rotation: 0,
      width: def.width,
      height: def.height,
      pins: def.pins.map(p => ({ ...p, netId: null, voltage: 0 })),
      ...JSON.parse(JSON.stringify(def.defaultProps || {}))
    };

    if (comp.type === 'GROUND' || comp.type === 'DIGITAL_GROUND') {
      comp.pins[0].netId = 'GND';
    }

    this.history.execute(new AddEntityCommand(this, comp));
    this.audio.playComponentPlacement();
  }

  rotateSelected() {
    const comp = this.renderer.selectedComponent;
    if (!comp) return;
    const oldRot = comp.rotation || 0;
    const newRot = (oldRot + 90) % 360;
    this.history.execute(new RotateCommand(this, comp, oldRot, newRot));
    this.audio.playRotate();
  }

  deleteSelected() {
    const comp = this.renderer.selectedComponent;
    if (!comp) return;

    // Remove connected explicit wires
    this.wires = this.wires.filter(w => w.fromCompId !== comp.id && w.toCompId !== comp.id);
    this.renderer.wires = this.wires;

    this.history.execute(new DeleteEntityCommand(this, comp));
    this.audio.playDelete();
  }

  initCanvasEvents() {
    const canvas = this.canvas;

    canvas.addEventListener('dblclick', (e) => {
      const rect = canvas.getBoundingClientRect();
      const sx = e.clientX - rect.left;
      const sy = e.clientY - rect.top;
      const wpos = this.renderer.screenToWorld(sx, sy);
      const comp = this.renderer.findComponentAt(wpos.x, wpos.y);
      if (comp) {
        this.promptEditValue(comp);
      }
    });

    canvas.addEventListener('mousedown', (e) => {
      const rect = canvas.getBoundingClientRect();
      const sx = e.clientX - rect.left;
      const sy = e.clientY - rect.top;
      const wpos = this.renderer.screenToWorld(sx, sy);

      // Panning
      if (e.button === 1 || e.shiftKey || this.isSpacePressed) {
        this.isPanning = true;
        this.panStart = { x: sx - this.renderer.panX, y: sy - this.renderer.panY };
        return;
      }

      // Check pin click for instant wiring or probe
      const pinInfo = this.renderer.findPinAt(wpos.x, wpos.y);

      if (this.currentMode === 'probe' && pinInfo) {
        this.attachScopeProbe(pinInfo.comp, pinInfo.pIdx);
        return;
      }

      // Direct magnetic wiring from any pin in ANY mode!
      if (pinInfo) {
        if (!this.renderer.isWiring) {
          this.renderer.isWiring = true;
          this.renderer.wireStartPin = pinInfo;
          this.audio.playTerminalSnap();
        } else {
          this.connectPins(this.renderer.wireStartPin, pinInfo);
          this.renderer.isWiring = false;
          this.renderer.wireStartPin = null;
        }
        return;
      }

      if (this.renderer.isWiring) {
        this.renderer.isWiring = false;
        this.renderer.wireStartPin = null;
        return;
      }

      // Component Selection / Drag
      const comp = this.renderer.findComponentAt(wpos.x, wpos.y);
      if (comp) {
        if (comp.type === 'SWITCH_SPST' || comp.type === 'PUSH_BUTTON_NO' || comp.type === 'PUSH_BUTTON_NC') {
          comp.isOpen = !comp.isOpen;
          this.audio.playRelayToggle(true);
        }
        if (comp.type === 'POTENTIOMETER' || comp.type === 'LDR') {
          const frac = Math.max(0.01, Math.min(0.99, (wpos.x - comp.x) / comp.width));
          if (comp.type === 'POTENTIOMETER') comp.sliderValue = frac;
          if (comp.type === 'LDR') comp.lux = Math.round(frac * 1000);
        }
        this.renderer.selectedComponent = comp;
        this.updateInspector(comp);
        this.isDraggingComp = true;
        this.dragStartPos = { x: wpos.x, y: wpos.y };
        this.compStartPos = { x: comp.x, y: comp.y };
      } else {
        this.renderer.selectedComponent = null;
        this.updateInspector(null);
        this.isPanning = true;
        this.panStart = { x: sx - this.renderer.panX, y: sy - this.renderer.panY };
      }
    });

    canvas.addEventListener('mousemove', (e) => {
      const rect = canvas.getBoundingClientRect();
      const sx = e.clientX - rect.left;
      const sy = e.clientY - rect.top;
      const wpos = this.renderer.screenToWorld(sx, sy);
      this.renderer.mouseWorldPos = wpos;

      if (this.isPanning) {
        this.renderer.panX = sx - this.panStart.x;
        this.renderer.panY = sy - this.panStart.y;
        return;
      }

      if (this.isDraggingComp && this.renderer.selectedComponent) {
        const comp = this.renderer.selectedComponent;
        const dx = wpos.x - this.dragStartPos.x;
        const dy = wpos.y - this.dragStartPos.y;
        comp.x = this.renderer.snapToGrid(this.compStartPos.x + dx);
        comp.y = this.renderer.snapToGrid(this.compStartPos.y + dy);
        return;
      }

      // Magnetic hovered pin
      this.renderer.hoveredPin = this.renderer.findPinAt(wpos.x, wpos.y);
    });

    window.addEventListener('mouseup', () => {
      if (this.isDraggingComp && this.renderer.selectedComponent) {
        const comp = this.renderer.selectedComponent;
        if (comp.x !== this.compStartPos.x || comp.y !== this.compStartPos.y) {
          this.history.execute(new MoveEntityCommand(this, comp, this.compStartPos, { x: comp.x, y: comp.y }));
        }
      }
      this.isDraggingComp = false;
      this.isPanning = false;
    });

    canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      const rect = canvas.getBoundingClientRect();
      const sx = e.clientX - rect.left;
      const sy = e.clientY - rect.top;
      const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
      const newZoom = Math.max(0.4, Math.min(2.5, this.renderer.zoom * zoomFactor));

      this.renderer.panX = sx - (sx - this.renderer.panX) * (newZoom / this.renderer.zoom);
      this.renderer.panY = sy - (sy - this.renderer.panY) * (newZoom / this.renderer.zoom);
      this.renderer.zoom = newZoom;
      this.renderer.render();
    });
  }

  promptEditValue(comp) {
    if (comp.resistance !== undefined) {
      const valStr = prompt(`Resistor value for ${comp.label || comp.partNumber}:`, this.formatEngValue(comp.resistance, 'Ω'));
      if (valStr) {
        const oldR = comp.resistance;
        const newR = this.parseEngValue(valStr);
        this.history.execute(new ChangeParamCommand(this, comp, 'resistance', oldR, newR));
        comp.label = this.formatEngValue(newR, 'Ω');
      }
    } else if (comp.capacitance !== undefined) {
      const valStr = prompt(`Capacitor value for ${comp.label || comp.partNumber}:`, this.formatEngValue(comp.capacitance, 'F'));
      if (valStr) {
        const oldC = comp.capacitance;
        const newC = this.parseEngValue(valStr);
        this.history.execute(new ChangeParamCommand(this, comp, 'capacitance', oldC, newC));
        comp.label = this.formatEngValue(newC, 'F');
      }
    } else if (comp.inductance !== undefined) {
      const valStr = prompt(`Inductor value:`, this.formatEngValue(comp.inductance, 'H'));
      if (valStr) {
        const oldL = comp.inductance;
        const newL = this.parseEngValue(valStr);
        this.history.execute(new ChangeParamCommand(this, comp, 'inductance', oldL, newL));
        comp.label = this.formatEngValue(newL, 'H');
      }
    } else if (comp.voltage !== undefined) {
      const valStr = prompt(`Voltage value for ${comp.label || comp.partNumber}:`, comp.voltage + ' V');
      if (valStr) {
        const oldV = comp.voltage;
        const newV = parseFloat(valStr) || 5;
        this.history.execute(new ChangeParamCommand(this, comp, 'voltage', oldV, newV));
      }
    }
  }

  attachScopeProbe(comp, pIdx) {
    const ch = this.activeProbeChannel;
    this.oscilloscope.setProbe(ch, comp.id, pIdx);
    this.renderer.scopeChannels = this.oscilloscope.channels;

    if (ch === 0) {
      const scopeSelectA = document.getElementById('scopeProbeChA');
      if (scopeSelectA) scopeSelectA.value = `${comp.id}:${pIdx}`;
      this.activeProbeChannel = 1;
    } else {
      const scopeSelectB = document.getElementById('scopeProbeChB');
      if (scopeSelectB) scopeSelectB.value = `${comp.id}:${pIdx}`;
      this.activeProbeChannel = 0;
    }

    this.audio.playTerminalSnap();
    this.renderer.render();
  }

  connectPins(pinInfo1, pinInfo2) {
    if (!pinInfo1 || !pinInfo2) return;
    if (pinInfo1.comp.id === pinInfo2.comp.id && pinInfo1.pIdx === pinInfo2.pIdx) return;

    let targetNet = pinInfo1.pin.netId || pinInfo2.pin.netId;
    if (!targetNet) {
      targetNet = `NET_${this.nextNetId++}`;
    }

    // Merge nets across all components if pins had different existing nets
    const netToReplace = pinInfo2.pin.netId;
    if (netToReplace && netToReplace !== targetNet) {
      for (const comp of this.solver.components) {
        for (const pin of comp.pins) {
          if (pin.netId === netToReplace) pin.netId = targetNet;
        }
      }
      for (const w of this.wires) {
        if (w.netId === netToReplace) w.netId = targetNet;
      }
    }

    pinInfo1.pin.netId = targetNet;
    pinInfo2.pin.netId = targetNet;

    // Create explicit wire
    const wire = {
      id: `w_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      fromCompId: pinInfo1.comp.id,
      fromPinIdx: pinInfo1.pIdx,
      toCompId: pinInfo2.comp.id,
      toPinIdx: pinInfo2.pIdx,
      netId: targetNet
    };
    this.wires.push(wire);
    this.renderer.wires = this.wires;

    this.updateProbeDropdowns();
    this.audio.playTerminalSnap();
    this.renderer.render();
  }

  updateInspector(comp) {
    const container = document.getElementById('inspectorContent');
    if (!comp) {
      container.innerHTML = `
        <div style="color: var(--text-muted); font-size: 12px; text-align: center; margin-top: 40px;">
          Select or double-click any component on the schematic canvas to inspect and edit its value.
        </div>
      `;
      return;
    }

    let rows = `
      <div style="font-weight: 700; font-size: 14px; margin-bottom: 8px; color: var(--accent-cyan);">${comp.name || comp.type}</div>
      <table class="inspector-table">
        <tr><td>Part Number</td><td><strong>${comp.partNumber || '-'}</strong></td></tr>
        <tr><td>Label</td><td><input type="text" class="inspector-input" id="propLabel" value="${comp.label || ''}"></td></tr>
        <tr><td>Rotation</td><td><strong>${comp.rotation || 0}°</strong></td></tr>
    `;

    if (comp.resistance !== undefined) {
      rows += `<tr><td>Resistance</td><td><input type="text" class="inspector-input" id="propResistance" value="${this.formatEngValue(comp.resistance, 'Ω')}"></td></tr>`;
    }
    if (comp.capacitance !== undefined) {
      rows += `<tr><td>Capacitance</td><td><input type="text" class="inspector-input" id="propCapacitance" value="${this.formatEngValue(comp.capacitance, 'F')}"></td></tr>`;
    }
    if (comp.inductance !== undefined) {
      rows += `<tr><td>Inductance</td><td><input type="text" class="inspector-input" id="propInductance" value="${this.formatEngValue(comp.inductance, 'H')}"></td></tr>`;
    }
    if (comp.voltage !== undefined) {
      rows += `<tr><td>Voltage (V)</td><td><input type="number" class="inspector-input" id="propVoltage" value="${comp.voltage}"></td></tr>`;
    }

    rows += `
        <tr><td>Node Voltage</td><td>${(comp.pins[0]?.voltage ?? 0).toFixed(3)} V</td></tr>
        <tr><td>Branch Current</td><td>${((comp.current || 0) * 1000).toFixed(2)} mA</td></tr>
      </table>
    `;

    container.innerHTML = rows;

    const propLabel = document.getElementById('propLabel');
    if (propLabel) propLabel.addEventListener('input', (e) => { comp.label = e.target.value; });

    const propR = document.getElementById('propResistance');
    if (propR) propR.addEventListener('change', (e) => {
      comp.resistance = this.parseEngValue(e.target.value);
      comp.label = this.formatEngValue(comp.resistance, 'Ω');
      this.renderer.render();
    });

    const propC = document.getElementById('propCapacitance');
    if (propC) propC.addEventListener('change', (e) => {
      comp.capacitance = this.parseEngValue(e.target.value);
      comp.label = this.formatEngValue(comp.capacitance, 'F');
      this.renderer.render();
    });

    const propL = document.getElementById('propInductance');
    if (propL) propL.addEventListener('change', (e) => {
      comp.inductance = this.parseEngValue(e.target.value);
      comp.label = this.formatEngValue(comp.inductance, 'H');
      this.renderer.render();
    });

    const propV = document.getElementById('propVoltage');
    if (propV) propV.addEventListener('change', (e) => {
      comp.voltage = parseFloat(e.target.value) || 5;
      this.renderer.render();
    });
  }

  updateProbeDropdowns() {
    const scopeA = document.getElementById('scopeProbeChA');
    const scopeB = document.getElementById('scopeProbeChB');
    const dmmRed = document.getElementById('dmmRedProbe');

    const options = ['<option value="">(None)</option>'];
    const netOptions = ['<option value="">(Unconnected)</option>'];

    for (const comp of this.solver.components) {
      for (let pIdx = 0; pIdx < comp.pins.length; pIdx++) {
        const pin = comp.pins[pIdx];
        const val = `${comp.id}:${pIdx}`;
        const label = `${comp.label || comp.partNumber || comp.type} [${pin.label || pIdx}]`;
        options.push(`<option value="${val}">${label}</option>`);

        if (pin.netId) {
          netOptions.push(`<option value="${pin.netId}">${pin.netId} (${label})</option>`);
        }
      }
    }

    if (scopeA) scopeA.innerHTML = options.join('');
    if (scopeB) scopeB.innerHTML = options.join('');
    if (dmmRed) dmmRed.innerHTML = netOptions.join('');
  }

  initInstruments() {
    document.getElementById('scopeTimebase').addEventListener('change', (e) => {
      this.oscilloscope.timePerDiv = parseFloat(e.target.value);
    });
    document.getElementById('scopeVoltsChA').addEventListener('change', (e) => {
      this.oscilloscope.channels[0].voltsPerDiv = parseFloat(e.target.value);
    });
    document.getElementById('scopeVoltsChB').addEventListener('change', (e) => {
      this.oscilloscope.channels[1].voltsPerDiv = parseFloat(e.target.value);
    });
    document.getElementById('scopeProbeChA').addEventListener('change', (e) => {
      const parts = e.target.value.split(':');
      if (parts.length === 2) {
        this.oscilloscope.setProbe(0, parts[0], parseInt(parts[1], 10));
      } else {
        this.oscilloscope.channels[0].probePin = null;
      }
      this.renderer.scopeChannels = this.oscilloscope.channels;
    });
    document.getElementById('scopeProbeChB').addEventListener('change', (e) => {
      const parts = e.target.value.split(':');
      if (parts.length === 2) {
        this.oscilloscope.setProbe(1, parts[0], parseInt(parts[1], 10));
      } else {
        this.oscilloscope.channels[1].probePin = null;
      }
      this.renderer.scopeChannels = this.oscilloscope.channels;
    });

    document.querySelectorAll('.dmm-mode-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.dmm-mode-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.multimeter.mode = btn.dataset.mode;
        document.getElementById('dmmBadge').textContent = btn.textContent;
      });
    });

    document.getElementById('dmmRedProbe').addEventListener('change', (e) => {
      this.multimeter.redProbeNet = e.target.value || null;
    });
  }

  startSimulationLoop() {
    const loop = () => {
      if (this.solver.isRunning) {
        for (let i = 0; i < 20; i++) {
          this.solver.step(this.solver.dt);
        }
      }

      this.renderer.render();
      this.oscilloscope.render(this.scopeCanvas);

      if (this.isBigScopeOpen && this.bigScopeCanvas) {
        this.oscilloscope.render(this.bigScopeCanvas);
      }

      this.multimeter.update();

      // Live metrics readout
      const chAMetrics = this.oscilloscope.getMetrics(0);
      const chBMetrics = this.oscilloscope.getMetrics(1);

      const elChAVpp = document.getElementById('metricChAVpp');
      const elChAFreq = document.getElementById('metricChAFreq');
      if (elChAVpp) elChAVpp.textContent = `Vpp: ${chAMetrics.vpp.toFixed(2)} V`;
      if (elChAFreq) elChAFreq.textContent = `Freq: ${chAMetrics.freq >= 1000 ? (chAMetrics.freq / 1000).toFixed(2) + ' kHz' : chAMetrics.freq.toFixed(1) + ' Hz'}`;

      const elChBVpp = document.getElementById('metricChBVpp');
      const elChBFreq = document.getElementById('metricChBFreq');
      if (elChBVpp) elChBVpp.textContent = `Vpp: ${chBMetrics.vpp.toFixed(2)} V`;
      if (elChBFreq) elChBFreq.textContent = `Freq: ${chBMetrics.freq >= 1000 ? (chBMetrics.freq / 1000).toFixed(2) + ' kHz' : chBMetrics.freq.toFixed(1) + ' Hz'}`;

      // Big Modal Stats
      const bigStatChA = document.getElementById('bigStatChA');
      const bigStatChB = document.getElementById('bigStatChB');
      if (bigStatChA) {
        bigStatChA.textContent = `CH A: Vpp = ${chAMetrics.vpp.toFixed(2)}V | Freq = ${chAMetrics.freq >= 1000 ? (chAMetrics.freq / 1000).toFixed(2) + ' kHz' : chAMetrics.freq.toFixed(1) + ' Hz'} | RMS = ${chAMetrics.vRms.toFixed(2)}V`;
      }
      if (bigStatChB) {
        bigStatChB.textContent = `CH B: Vpp = ${chBMetrics.vpp.toFixed(2)}V | Freq = ${chBMetrics.freq >= 1000 ? (chBMetrics.freq / 1000).toFixed(2) + ' kHz' : chBMetrics.freq.toFixed(1) + ' Hz'} | RMS = ${chBMetrics.vRms.toFixed(2)}V`;
      }

      const dmmEl = document.getElementById('dmmDisplay');
      if (dmmEl) dmmEl.textContent = this.multimeter.displayValue;

      const simTimeMs = (this.solver.time * 1000).toFixed(1);
      document.getElementById('simTimeLabel').textContent = `${simTimeMs} ms`;
      document.getElementById('activeNodesLabel').textContent = `Nodes: ${this.solver.numNodes || 0}`;

      this.fpsCounter++;
      const now = performance.now();
      if (now - this.lastFpsTime >= 1000) {
        this.actualFps = this.fpsCounter;
        this.fpsCounter = 0;
        this.lastFpsTime = now;
        document.getElementById('fpsLabel').textContent = `${this.actualFps} FPS`;
      }

      requestAnimationFrame(loop);
    };

    requestAnimationFrame(loop);
  }
}

window.addEventListener('DOMContentLoaded', () => {
  window.multisim = new MultisimApp();
});
