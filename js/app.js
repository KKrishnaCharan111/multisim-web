/**
 * Multisim Web Studio - Academic & Professional Circuit Lab Controller
 * Unified CAD/EDA Architecture:
 * - Grouped Toolbar & Functional LocalStorage / File Save System
 * - Command Pattern Undo / Redo Execution Stacks (limit: 50)
 * - Manhattan Orthogonal Wiring & Magnetic Terminal Snapping
 * - Live CRO Oscilloscope Signal Readouts (Vpp, Vrms, Freq) & Clip Probe Badges
 * - Procedural Web Audio Laboratory Sound Engine
 * - Global EDA Keyboard Shortcuts with Form Protection
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
    this.oscilloscope = new Oscilloscope(this.scopeCanvas, this.solver);
    this.multimeter = new DigitalMultimeter(this.solver);

    this.audio = new AudioManager();
    this.history = new HistoryManager(this);

    this.currentMode = 'select'; // 'select', 'wire', 'probe'
    this.activeProbeChannel = 0; // 0 for CH A, 1 for CH B
    this.nextNetId = 1;
    
    // Interaction states
    this.isDraggingComp = false;
    this.dragStartPos = { x: 0, y: 0 };
    this.compStartPos = { x: 0, y: 0 };
    this.isDraggingWireTrunk = false;
    this.draggedWire = null;
    this.isPanning = false;
    this.panStart = { x: 0, y: 0 };
    this.isSpacePressed = false;

    // Clipboard
    this.clipboardComponent = null;

    this.fpsCounter = 0;
    this.lastFpsTime = performance.now();
    this.actualFps = 60;

    this.initUI();
    this.initCanvasEvents();
    this.initInstruments();
    this.resizeCanvas();

    // Check for previously saved circuit in localStorage
    this.loadSavedCircuit();

    // Pass oscilloscope channels to renderer for canvas probe tags
    this.renderer.scopeChannels = this.oscilloscope.channels;

    // Simulation loop
    this.solver.isRunning = true;
    this.startSimulationLoop();
  }

  resizeCanvas() {
    const viewport = document.getElementById('viewport');
    if (!viewport) return;
    this.canvas.width = viewport.clientWidth;
    this.canvas.height = viewport.clientHeight;
    this.renderer.render();
  }

  // Parse engineering strings: e.g. "2.3k", "14k", "470", "28p", "10n", "0.47u", "2.2m"
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

    // History state change hook
    const btnUndo = document.getElementById('btnUndo');
    const btnRedo = document.getElementById('btnRedo');
    const saveIndicator = document.getElementById('saveStatusIndicator');

    this.history.onStateChange = (state) => {
      if (btnUndo) btnUndo.classList.toggle('disabled', !state.canUndo);
      if (btnRedo) btnRedo.classList.toggle('disabled', !state.canRedo);
      if (saveIndicator) {
        if (state.isDirty) {
          saveIndicator.textContent = '● Unsaved Changes';
          saveIndicator.className = 'save-indicator dirty';
        } else {
          saveIndicator.textContent = '● Circuit Saved';
          saveIndicator.className = 'save-indicator saved';
        }
      }
    };

    // 1. File Group
    const btnNew = document.getElementById('btnNew');
    const btnOpen = document.getElementById('btnOpen');
    const fileInput = document.getElementById('fileInput');
    const btnSaveCircuit = document.getElementById('btnSaveCircuit');
    const btnSave = document.getElementById('btnSave');

    btnNew.addEventListener('click', () => {
      if (!this.history.isDirty || confirm('Create a new blank circuit? Any unsaved changes will be cleared.')) {
        this.solver.setComponents([]);
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
          const comps = JSON.parse(event.target.result);
          if (Array.isArray(comps)) {
            this.solver.setComponents(comps);
            this.history.clear();
            this.saveCircuit(false); // quietly persist to localStorage
            this.updateProbeDropdowns();
            this.updateInspector(null);
            this.audio.playComponentPlacement();
            this.renderer.render();
          } else {
            alert('Invalid circuit file format.');
          }
        } catch (err) {
          alert('Error opening circuit file: ' + err.message);
        }
      };
      reader.readAsText(file);
      fileInput.value = '';
    });

    btnSaveCircuit.addEventListener('click', () => {
      this.saveCircuit(true);
    });

    btnSave.addEventListener('click', () => {
      this.downloadCircuitFile();
    });

    // 2. Export Group
    const btnExportImage = document.getElementById('btnExportImage');
    const btnExportNetlist = document.getElementById('btnExportNetlist');

    btnExportImage.addEventListener('click', () => this.renderer.exportAsImage());
    btnExportNetlist.addEventListener('click', () => this.downloadSpiceNetlist());

    // 3. Simulation Controls
    const btnRun = document.getElementById('btnRun');
    const btnPause = document.getElementById('btnPause');
    const btnStep = document.getElementById('btnStep');
    const btnStop = document.getElementById('btnStop');

    btnRun.addEventListener('click', () => {
      this.solver.isRunning = true;
      btnRun.classList.add('running');
      document.getElementById('simStatusLight').classList.add('active');
      document.getElementById('simStatusText').textContent = 'Simulation Running';
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

    // 4. Tools Group
    const toolSelect = document.getElementById('toolSelect');
    const toolWire = document.getElementById('toolWire');
    const toolProbe = document.getElementById('toolProbe');

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

    // 5. Edit Group
    btnUndo.addEventListener('click', () => this.history.undo());
    btnRedo.addEventListener('click', () => this.history.redo());

    const btnRotate = document.getElementById('btnRotate');
    const btnDelete = document.getElementById('btnDelete');
    const btnClear = document.getElementById('btnClear');

    btnRotate.addEventListener('click', () => this.rotateSelected());
    btnDelete.addEventListener('click', () => this.deleteSelected());
    btnClear.addEventListener('click', () => {
      if (confirm('Clear entire canvas?')) {
        this.solver.setComponents([]);
        this.renderer.selectedComponent = null;
        this.history.clear();
        this.updateInspector(null);
        this.updateProbeDropdowns();
        this.audio.playDelete();
        this.renderer.render();
      }
    });

    // 6. View & Audio Group
    const btnToggleCurrent = document.getElementById('btnToggleCurrent');
    btnToggleCurrent.addEventListener('click', () => {
      this.renderer.showCurrentFlow = !this.renderer.showCurrentFlow;
      btnToggleCurrent.classList.toggle('active', this.renderer.showCurrentFlow);
    });

    const btnToggleAudio = document.getElementById('btnToggleAudio');
    const audioBtnText = document.getElementById('audioBtnText');
    btnToggleAudio.addEventListener('click', () => {
      const active = this.audio.toggle();
      btnToggleAudio.classList.toggle('active', active);
      audioBtnText.textContent = active ? 'Audio ON' : 'Muted';
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

    // Global EDA Keyboard Shortcuts with Form Protection
    window.addEventListener('keydown', (e) => {
      const activeTag = document.activeElement ? document.activeElement.tagName : '';
      if (activeTag === 'INPUT' || activeTag === 'TEXTAREA' || activeTag === 'SELECT') {
        return; // Protection for text inputs
      }

      if ((e.ctrlKey || e.metaKey) && (e.key === 'z' || e.key === 'Z')) {
        e.preventDefault();
        if (e.shiftKey) {
          this.history.redo();
        } else {
          this.history.undo();
        }
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

      if ((e.ctrlKey || e.metaKey) && (e.key === 'c' || e.key === 'C')) {
        if (this.renderer.selectedComponent) {
          e.preventDefault();
          this.clipboardComponent = JSON.parse(JSON.stringify(this.renderer.selectedComponent));
        }
        return;
      }

      if ((e.ctrlKey || e.metaKey) && (e.key === 'v' || e.key === 'V')) {
        if (this.clipboardComponent) {
          e.preventDefault();
          this.pasteComponent();
        }
        return;
      }

      if (e.key === ' ') {
        this.isSpacePressed = true;
      }

      if (e.key === 'r' || e.key === 'R') this.rotateSelected();
      if (e.key === 'Delete' || e.key === 'Backspace') this.deleteSelected();
      if (e.key === 'w' || e.key === 'W') toolWire.click();
      if (e.key === 's' || e.key === 'S' || e.key === 'Escape') toolSelect.click();
      if (e.key === 'p' || e.key === 'P') toolProbe.click();
      if (e.key === 'F5') { e.preventDefault(); btnRun.click(); }
      if (e.key === 'F10') { e.preventDefault(); btnStep.click(); }
    });

    window.addEventListener('keyup', (e) => {
      if (e.key === ' ') {
        this.isSpacePressed = false;
      }
    });
  }

  saveCircuit(notifyUser = true) {
    try {
      const data = JSON.stringify(this.solver.components);
      localStorage.setItem('multisim_studio_saved_circuit', data);
      this.history.markSaved();
      this.audio.playTerminalSnap();
      if (notifyUser) {
        const btn = document.getElementById('btnSaveCircuit');
        const origText = btn.innerHTML;
        btn.innerHTML = `
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
          <span style="color: #10b981;">Saved!</span>
        `;
        setTimeout(() => {
          btn.innerHTML = origText;
        }, 1500);
      }
    } catch (err) {
      alert('Error saving circuit to local storage: ' + err.message);
    }
  }

  loadSavedCircuit() {
    try {
      const saved = localStorage.getItem('multisim_studio_saved_circuit');
      if (saved) {
        const comps = JSON.parse(saved);
        if (Array.isArray(comps) && comps.length > 0) {
          this.solver.setComponents(comps);
          this.history.clear();
          this.updateProbeDropdowns();
          return;
        }
      }
    } catch (_) {}
    this.solver.setComponents([]);
    this.history.clear();
    this.updateProbeDropdowns();
  }

  downloadCircuitFile() {
    const data = JSON.stringify(this.solver.components, null, 2);
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

  pasteComponent() {
    if (!this.clipboardComponent) return;
    const clone = JSON.parse(JSON.stringify(this.clipboardComponent));
    clone.id = `comp_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    clone.x = this.renderer.snapToGrid(clone.x + 40);
    clone.y = this.renderer.snapToGrid(clone.y + 40);
    clone.pins.forEach(p => { p.netId = null; p.voltage = 0; });
    if (clone.type === 'GROUND' || clone.type === 'DIGITAL_GROUND') {
      clone.pins[0].netId = 'GND';
    }
    this.history.execute(new AddEntityCommand(this, clone));
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

      // Panning with Middle Click, Shift, or Space+Drag
      if (e.button === 1 || e.shiftKey || this.isSpacePressed) {
        this.isPanning = true;
        this.panStart = { x: sx - this.renderer.panX, y: sy - this.renderer.panY };
        return;
      }

      // Probe Tool
      if (this.currentMode === 'probe') {
        const pinInfo = this.renderer.findPinAt(wpos.x, wpos.y);
        if (pinInfo) {
          this.attachScopeProbe(pinInfo.comp, pinInfo.pIdx);
          return;
        }
      }

      // Pin Click (Wiring mode or wiring start)
      const pinInfo = this.renderer.findPinAt(wpos.x, wpos.y);
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

      // Check if clicked on a wire segment for segment dragging or T-junction split
      if (this.renderer.isWiring && this.renderer.wireStartPin) {
        const hitSeg = this.renderer.findWireSegmentAt(wpos.x, wpos.y);
        if (hitSeg) {
          this.connectPinToWire(this.renderer.wireStartPin, hitSeg.wire);
          this.renderer.isWiring = false;
          this.renderer.wireStartPin = null;
          return;
        }
      }

      if (this.renderer.isWiring) {
        this.renderer.isWiring = false;
        this.renderer.wireStartPin = null;
        return;
      }

      // Check for wire trunk dragging
      const wireHit = this.renderer.findWireSegmentAt(wpos.x, wpos.y);
      if (wireHit && wireHit.segmentType === 'vertical_trunk') {
        this.isDraggingWireTrunk = true;
        this.draggedWire = wireHit.wire;
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

      if (this.isDraggingWireTrunk && this.draggedWire) {
        const netId = this.draggedWire.netId;
        const newTrunkX = this.renderer.snapToGrid(wpos.x);
        if (!this.draggedWire.comp1.wireTrunkX) this.draggedWire.comp1.wireTrunkX = {};
        this.draggedWire.comp1.wireTrunkX[netId] = newTrunkX;
        this.renderer.render();
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
      this.isDraggingWireTrunk = false;
      this.draggedWire = null;
      this.isPanning = false;
    });

    // Smooth zooming centered on mouse pointer
    canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      const rect = canvas.getBoundingClientRect();
      const sx = e.clientX - rect.left;
      const sy = e.clientY - rect.top;

      const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
      const newZoom = Math.max(0.4, Math.min(2.5, this.renderer.zoom * zoomFactor));

      // Adjust pan to center zoom on pointer
      this.renderer.panX = sx - (sx - this.renderer.panX) * (newZoom / this.renderer.zoom);
      this.renderer.panY = sy - (sy - this.renderer.panY) * (newZoom / this.renderer.zoom);
      this.renderer.zoom = newZoom;
      this.renderer.render();
    });
  }

  promptEditValue(comp) {
    if (comp.resistance !== undefined) {
      const valStr = prompt(`Enter Resistor value for ${comp.label || comp.partNumber} (e.g. 470, 1k, 1.1k, 2.3k, 14k, 82k, 100k, 470k):`, this.formatEngValue(comp.resistance, 'Ω'));
      if (valStr) {
        const oldR = comp.resistance;
        const newR = this.parseEngValue(valStr);
        this.history.execute(new ChangeParamCommand(this, comp, 'resistance', oldR, newR));
        comp.label = this.formatEngValue(newR, 'Ω');
      }
    } else if (comp.capacitance !== undefined) {
      const valStr = prompt(`Enter Capacitor value for ${comp.label || comp.partNumber} (e.g. 10p, 28p, 720p, 1n, 10n, 0.1u, 1u, 10u, 47u):`, this.formatEngValue(comp.capacitance, 'F'));
      if (valStr) {
        const oldC = comp.capacitance;
        const newC = this.parseEngValue(valStr);
        this.history.execute(new ChangeParamCommand(this, comp, 'capacitance', oldC, newC));
        comp.label = this.formatEngValue(newC, 'F');
      }
    } else if (comp.inductance !== undefined) {
      const valStr = prompt(`Enter Inductor value (e.g. 1m, 2.2m, 10m):`, this.formatEngValue(comp.inductance, 'H'));
      if (valStr) {
        const oldL = comp.inductance;
        const newL = this.parseEngValue(valStr);
        this.history.execute(new ChangeParamCommand(this, comp, 'inductance', oldL, newL));
        comp.label = this.formatEngValue(newL, 'H');
      }
    } else if (comp.voltage !== undefined) {
      const valStr = prompt(`Enter Voltage value for ${comp.label || comp.partNumber} (e.g. 5V, 9V, 12V):`, comp.voltage + ' V');
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
    document.querySelector('.tab-btn[data-tab="oscilloscope"]')?.click();
    this.renderer.render();
  }

  connectPins(pinInfo1, pinInfo2) {
    if (!pinInfo1 || !pinInfo2) return;
    if (pinInfo1.comp.id === pinInfo2.comp.id && pinInfo1.pIdx === pinInfo2.pIdx) return;

    let targetNet = pinInfo1.pin.netId || pinInfo2.pin.netId;
    if (!targetNet) {
      targetNet = `NET_${this.nextNetId++}`;
    }

    const oldNet1 = pinInfo1.pin.netId;
    const oldNet2 = pinInfo2.pin.netId;

    this.history.execute(new AddWireCommand(this, pinInfo1, pinInfo2, targetNet, oldNet1, oldNet2));
    this.audio.playTerminalSnap();
  }

  connectPinToWire(pinInfo, wire) {
    if (!pinInfo || !wire || !wire.netId) return;
    const oldNet = pinInfo.pin.netId;
    pinInfo.pin.netId = wire.netId;
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
    document.getElementById('scopeCursors').addEventListener('change', (e) => {
      this.oscilloscope.showCursors = e.target.checked;
    });
    document.getElementById('scopeVoltsChA').addEventListener('change', (e) => {
      this.oscilloscope.channels[0].voltsPerDiv = parseFloat(e.target.value);
    });
    document.getElementById('scopeVoltsChB').addEventListener('change', (e) => {
      this.oscilloscope.channels[1].voltsPerDiv = parseFloat(e.target.value);
    });
    document.getElementById('scopeTrigSource').addEventListener('change', (e) => {
      this.oscilloscope.triggerSource = e.target.value;
    });
    document.getElementById('scopeTrigSlope').addEventListener('change', (e) => {
      this.oscilloscope.triggerSlope = e.target.value;
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
      this.oscilloscope.render();
      this.multimeter.update();

      // Update Oscilloscope live metrics readout
      const chAMetrics = this.oscilloscope.getMetrics(0);
      const chBMetrics = this.oscilloscope.getMetrics(1);

      const elChAVpp = document.getElementById('metricChAVpp');
      const elChAFreq = document.getElementById('metricChAFreq');
      if (elChAVpp) elChAVpp.textContent = `Vpp: ${chAMetrics.vpp.toFixed(2)} V`;
      if (elChAFreq) elChAFreq.textContent = `Freq: ${chAMetrics.freq >= 1000 ? (chAMetrics.freq / 1000).toFixed(2) + ' kHz' : chAMetrics.freq.toFixed(1) + ' Hz'} | RMS: ${chAMetrics.vRms.toFixed(2)} V`;

      const elChBVpp = document.getElementById('metricChBVpp');
      const elChBFreq = document.getElementById('metricChBFreq');
      if (elChBVpp) elChBVpp.textContent = `Vpp: ${chBMetrics.vpp.toFixed(2)} V`;
      if (elChBFreq) elChBFreq.textContent = `Freq: ${chBMetrics.freq >= 1000 ? (chBMetrics.freq / 1000).toFixed(2) + ' kHz' : chBMetrics.freq.toFixed(1) + ' Hz'} | RMS: ${chBMetrics.vRms.toFixed(2)} V`;

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
