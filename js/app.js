/**
 * Multisim Web - Main Application Controller
 * Handles schematic interactions, circuit file save/load, high-res image export,
 * SPICE netlist export, real-time MNA simulation, and instruments.
 */

import { MNACircuitSolver } from './engine/mna-solver.js';
import { SchematicRenderer } from './renderer/schematic-renderer.js';
import { Oscilloscope } from './instruments/oscilloscope.js';
import { DigitalMultimeter } from './instruments/multimeter.js';
import { COMPONENT_CATEGORIES, COMPONENT_CATALOG } from './components/component-definitions.js';
import { SAMPLE_CIRCUITS } from './examples/sample-circuits.js';

class MultisimApp {
  constructor() {
    this.solver = new MNACircuitSolver();
    this.canvas = document.getElementById('schematicCanvas');
    this.renderer = new SchematicRenderer(this.canvas, this.solver);

    this.scopeCanvas = document.getElementById('scopeCanvas');
    this.oscilloscope = new Oscilloscope(this.scopeCanvas, this.solver);
    this.multimeter = new DigitalMultimeter(this.solver);

    this.currentMode = 'select';
    this.nextNetId = 1;
    this.isDraggingComp = false;
    this.dragStartPos = { x: 0, y: 0 };
    this.compStartPos = { x: 0, y: 0 };
    this.isPanning = false;
    this.panStart = { x: 0, y: 0 };

    this.fpsCounter = 0;
    this.lastFpsTime = performance.now();
    this.actualFps = 60;

    this.initUI();
    this.initCanvasEvents();
    this.initInstruments();
    this.resizeCanvas();

    // Start with a clean, blank canvas
    this.solver.setComponents([]);
    this.updateProbeDropdowns();

    // Start simulation & render loop
    this.solver.isRunning = true;
    this.startSimulationLoop();
  }

  resizeCanvas() {
    const viewport = document.getElementById('viewport');
    this.canvas.width = viewport.clientWidth;
    this.canvas.height = viewport.clientHeight;
    this.renderer.render();
  }

  initUI() {
    window.addEventListener('resize', () => this.resizeCanvas());

    this.renderCatalog();

    // File Management
    const btnNew = document.getElementById('btnNew');
    const btnOpen = document.getElementById('btnOpen');
    const fileInput = document.getElementById('fileInput');
    const btnSave = document.getElementById('btnSave');
    const btnExportImage = document.getElementById('btnExportImage');
    const btnExportNetlist = document.getElementById('btnExportNetlist');
    const btnTemplates = document.getElementById('btnTemplates');
    const templatesModal = document.getElementById('templatesModal');
    const modalCloseBtn = document.getElementById('modalCloseBtn');

    btnNew.addEventListener('click', () => {
      if (this.solver.components.length === 0 || confirm('Create new blank circuit? Current unsaved work will be cleared.')) {
        this.solver.setComponents([]);
        this.renderer.selectedComponent = null;
        this.updateInspector(null);
        this.updateProbeDropdowns();
        this.renderer.render();
      }
    });

    btnOpen.addEventListener('click', () => {
      fileInput.click();
    });

    fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const comps = JSON.parse(event.target.result);
          if (Array.isArray(comps)) {
            this.solver.setComponents(comps);
            this.updateProbeDropdowns();
            this.updateInspector(null);
            this.renderer.render();
          } else {
            alert('Invalid circuit file format.');
          }
        } catch (err) {
          alert('Error parsing circuit file: ' + err.message);
        }
      };
      reader.readAsText(file);
      fileInput.value = '';
    });

    btnSave.addEventListener('click', () => {
      this.downloadCircuitFile();
    });

    btnExportImage.addEventListener('click', () => {
      this.renderer.exportAsImage();
    });

    btnExportNetlist.addEventListener('click', () => {
      this.downloadSpiceNetlist();
    });

    // Templates Modal
    this.renderTemplatesModal();
    btnTemplates.addEventListener('click', () => {
      templatesModal.style.display = 'flex';
    });
    modalCloseBtn.addEventListener('click', () => {
      templatesModal.style.display = 'none';
    });
    templatesModal.addEventListener('click', (e) => {
      if (e.target === templatesModal) templatesModal.style.display = 'none';
    });

    // Simulation Buttons
    const btnRun = document.getElementById('btnRun');
    const btnPause = document.getElementById('btnPause');
    const btnStep = document.getElementById('btnStep');
    const btnStop = document.getElementById('btnStop');

    btnRun.addEventListener('click', () => {
      this.solver.isRunning = true;
      btnRun.classList.add('running');
      document.getElementById('simStatusLight').classList.add('active');
      document.getElementById('simStatusText').textContent = 'Simulation Running';
    });

    btnPause.addEventListener('click', () => {
      this.solver.isRunning = false;
      btnRun.classList.remove('running');
      document.getElementById('simStatusLight').classList.remove('active');
      document.getElementById('simStatusText').textContent = 'Simulation Paused';
    });

    btnStep.addEventListener('click', () => {
      this.solver.step(this.solver.dt);
      this.renderer.render();
    });

    btnStop.addEventListener('click', () => {
      this.solver.reset();
      this.renderer.render();
    });

    // Editing Tools
    const toolSelect = document.getElementById('toolSelect');
    const toolWire = document.getElementById('toolWire');

    toolSelect.addEventListener('click', () => {
      this.currentMode = 'select';
      toolSelect.classList.add('active');
      toolWire.classList.remove('active');
      this.renderer.isWiring = false;
      this.renderer.wireStartPin = null;
    });

    toolWire.addEventListener('click', () => {
      this.currentMode = 'wire';
      toolWire.classList.add('active');
      toolSelect.classList.remove('active');
    });

    document.getElementById('btnRotate').addEventListener('click', () => this.rotateSelected());
    document.getElementById('btnDelete').addEventListener('click', () => this.deleteSelected());

    // Theme Toggle
    const btnToggleTheme = document.getElementById('btnToggleTheme');
    const themeBtnText = document.getElementById('themeBtnText');
    btnToggleTheme.addEventListener('click', () => {
      const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
      const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', newTheme);
      themeBtnText.textContent = newTheme === 'dark' ? 'Light Theme' : 'Dark Theme';
      this.renderer.setTheme(newTheme);
      this.renderer.render();
    });

    // Animated Current Flow Toggle
    const btnToggleCurrent = document.getElementById('btnToggleCurrent');
    btnToggleCurrent.addEventListener('click', () => {
      this.renderer.showCurrentFlow = !this.renderer.showCurrentFlow;
      btnToggleCurrent.classList.toggle('active', this.renderer.showCurrentFlow);
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
    });
    document.getElementById('btnZoomOut').addEventListener('click', () => {
      this.renderer.zoom = Math.max(0.4, this.renderer.zoom / 1.2);
    });
    document.getElementById('btnZoomFit').addEventListener('click', () => {
      this.renderer.zoom = 1.0;
      this.renderer.panX = 60;
      this.renderer.panY = 60;
    });

    // Shortcuts
    window.addEventListener('keydown', (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;
      if (e.key === 'r' || e.key === 'R') this.rotateSelected();
      if (e.key === 'Delete' || e.key === 'Backspace') this.deleteSelected();
      if (e.key === 'w' || e.key === 'W') toolWire.click();
      if (e.key === 'Escape') toolSelect.click();
      if (e.key === 'F5') { e.preventDefault(); btnRun.click(); }
    });
  }

  renderTemplatesModal() {
    const list = document.getElementById('templatesList');
    list.innerHTML = '';

    SAMPLE_CIRCUITS.forEach(sample => {
      const card = document.createElement('div');
      card.className = 'template-card';
      card.innerHTML = `
        <div class="template-name">${sample.name}</div>
        <div class="template-desc">${sample.description}</div>
      `;
      card.addEventListener('click', () => {
        this.loadSampleCircuit(sample.id);
        document.getElementById('templatesModal').style.display = 'none';
      });
      list.appendChild(card);
    });
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
    let netlist = `* NI MULTISIM WEB SPICE NETLIST EXPORT\n* Generated: ${new Date().toISOString()}\n\n`;
    this.solver.components.forEach((c, idx) => {
      const p1 = c.pins[0]?.netId || '0';
      const p2 = c.pins[1]?.netId || '0';
      switch (c.type) {
        case 'RESISTOR':
          netlist += `R${idx + 1} ${p1} ${p2} ${c.resistance || 1000}\n`;
          break;
        case 'CAPACITOR':
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
      width: def.width,
      height: def.height,
      pins: def.pins.map(p => ({ ...p, netId: null, voltage: 0 })),
      ...JSON.parse(JSON.stringify(def.defaultProps || {}))
    };

    if (comp.type === 'GROUND' || comp.type === 'DIGITAL_GROUND') {
      comp.pins[0].netId = 'GND';
    }

    this.solver.components.push(comp);
    this.renderer.selectedComponent = comp;
    this.updateInspector(comp);
    this.updateProbeDropdowns();
    this.renderer.render();
  }

  rotateSelected() {
    const comp = this.renderer.selectedComponent;
    if (!comp) return;
    const cx = comp.width / 2;
    const cy = comp.height / 2;
    for (const pin of comp.pins) {
      const dx = pin.x - cx;
      const dy = pin.y - cy;
      pin.x = Math.round(cx - dy);
      pin.y = Math.round(cy + dx);
    }
    const temp = comp.width;
    comp.width = comp.height;
    comp.height = temp;
    this.renderer.render();
  }

  deleteSelected() {
    const comp = this.renderer.selectedComponent;
    if (!comp) return;
    const idx = this.solver.components.indexOf(comp);
    if (idx >= 0) {
      this.solver.components.splice(idx, 1);
      this.renderer.selectedComponent = null;
      this.updateInspector(null);
      this.updateProbeDropdowns();
      this.renderer.render();
    }
  }

  initCanvasEvents() {
    const canvas = this.canvas;

    canvas.addEventListener('mousedown', (e) => {
      const rect = canvas.getBoundingClientRect();
      const sx = e.clientX - rect.left;
      const sy = e.clientY - rect.top;
      const wpos = this.renderer.screenToWorld(sx, sy);

      if (e.button === 1 || e.shiftKey) {
        this.isPanning = true;
        this.panStart = { x: sx - this.renderer.panX, y: sy - this.renderer.panY };
        return;
      }

      const pinInfo = this.renderer.findPinAt(wpos.x, wpos.y);
      if (pinInfo) {
        if (!this.renderer.isWiring) {
          this.renderer.isWiring = true;
          this.renderer.wireStartPin = pinInfo;
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

      const comp = this.renderer.findComponentAt(wpos.x, wpos.y);
      if (comp) {
        if (comp.type === 'SWITCH_SPST' || comp.type === 'PUSH_BUTTON_NO' || comp.type === 'PUSH_BUTTON_NC') {
          comp.isOpen = !comp.isOpen;
        } else if (comp.type === 'SWITCH_SPDT') {
          comp.isPosA = !comp.isPosA;
        }

        if ((comp.type === 'POTENTIOMETER' || comp.type === 'LDR' || comp.type === 'THERMISTOR_NTC') &&
            wpos.y > comp.y + comp.height - 4) {
          const frac = Math.max(0.01, Math.min(0.99, (wpos.x - comp.x) / comp.width));
          if (comp.type === 'POTENTIOMETER') comp.sliderValue = frac;
          if (comp.type === 'LDR') comp.lux = Math.round(frac * 1000);
          if (comp.type === 'THERMISTOR_NTC') comp.temperature = Math.round(frac * 100 - 10);
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

      this.renderer.hoveredPin = this.renderer.findPinAt(wpos.x, wpos.y);
    });

    window.addEventListener('mouseup', () => {
      this.isDraggingComp = false;
      this.isPanning = false;
    });

    canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
      this.renderer.zoom = Math.max(0.4, Math.min(2.5, this.renderer.zoom * zoomFactor));
    });
  }

  connectPins(pinInfo1, pinInfo2) {
    if (!pinInfo1 || !pinInfo2) return;
    if (pinInfo1.comp.id === pinInfo2.comp.id && pinInfo1.pIdx === pinInfo2.pIdx) return;

    let targetNet = pinInfo1.pin.netId || pinInfo2.pin.netId;
    if (!targetNet) {
      targetNet = `NET_${this.nextNetId++}`;
    }

    const oldNet = pinInfo2.pin.netId;
    pinInfo1.pin.netId = targetNet;
    pinInfo2.pin.netId = targetNet;

    if (oldNet && oldNet !== targetNet) {
      for (const comp of this.solver.components) {
        for (const pin of comp.pins) {
          if (pin.netId === oldNet) {
            pin.netId = targetNet;
          }
        }
      }
    }

    this.updateProbeDropdowns();
  }

  updateInspector(comp) {
    const container = document.getElementById('inspectorContent');
    if (!comp) {
      container.innerHTML = `
        <div style="color: var(--text-muted); font-size: 12px; text-align: center; margin-top: 40px;">
          Select any component on the schematic canvas to inspect and edit its parameters.
        </div>
      `;
      return;
    }

    let rows = `
      <div style="font-weight: 700; font-size: 14px; margin-bottom: 8px; color: var(--accent-cyan);">${comp.name || comp.type}</div>
      <table class="inspector-table">
        <tr><td>Part Number</td><td><strong>${comp.partNumber || '-'}</strong></td></tr>
        <tr><td>Type</td><td>${comp.type}</td></tr>
        <tr><td>Label</td><td><input type="text" class="inspector-input" id="propLabel" value="${comp.label || ''}"></td></tr>
    `;

    if (comp.resistance !== undefined) {
      rows += `<tr><td>Resistance (Ω)</td><td><input type="number" class="inspector-input" id="propResistance" value="${comp.resistance}"></td></tr>`;
    }
    if (comp.capacitance !== undefined) {
      rows += `<tr><td>Capacitance (F)</td><td><input type="number" class="inspector-input" id="propCapacitance" step="1e-9" value="${comp.capacitance}"></td></tr>`;
    }
    if (comp.inductance !== undefined) {
      rows += `<tr><td>Inductance (H)</td><td><input type="number" class="inspector-input" id="propInductance" step="1e-3" value="${comp.inductance}"></td></tr>`;
    }
    if (comp.voltage !== undefined) {
      rows += `<tr><td>Voltage (V)</td><td><input type="number" class="inspector-input" id="propVoltage" value="${comp.voltage}"></td></tr>`;
    }
    if (comp.frequency !== undefined) {
      rows += `<tr><td>Frequency (Hz)</td><td><input type="number" class="inspector-input" id="propFrequency" value="${comp.frequency}"></td></tr>`;
    }
    if (comp.ratedCurrent !== undefined) {
      rows += `<tr><td>Rated Current (A)</td><td><input type="number" class="inspector-input" id="propRatedCurrent" value="${comp.ratedCurrent}"></td></tr>`;
      rows += `<tr><td>Blown State</td><td><button id="propResetFuse" class="ribbon-btn" style="padding: 2px 6px;">${comp.isBlown ? 'Blown (Reset)' : 'OK'}</button></td></tr>`;
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
    if (propR) propR.addEventListener('change', (e) => { comp.resistance = parseFloat(e.target.value) || 1000; });

    const propC = document.getElementById('propCapacitance');
    if (propC) propC.addEventListener('change', (e) => { comp.capacitance = parseFloat(e.target.value) || 1e-6; });

    const propV = document.getElementById('propVoltage');
    if (propV) propV.addEventListener('change', (e) => { comp.voltage = parseFloat(e.target.value) || 5; });

    const propF = document.getElementById('propFrequency');
    if (propF) propF.addEventListener('change', (e) => { comp.frequency = parseFloat(e.target.value) || 1000; });

    const propResetFuse = document.getElementById('propResetFuse');
    if (propResetFuse) propResetFuse.addEventListener('click', () => {
      comp.isBlown = false;
      comp.smokeEffect = false;
      comp.smokeInitialized = false;
      comp.i2t = 0;
      this.updateInspector(comp);
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
    });
    document.getElementById('scopeProbeChB').addEventListener('change', (e) => {
      const parts = e.target.value.split(':');
      if (parts.length === 2) {
        this.oscilloscope.setProbe(1, parts[0], parseInt(parts[1], 10));
      } else {
        this.oscilloscope.channels[1].probePin = null;
      }
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

  loadSampleCircuit(sampleId) {
    const sample = SAMPLE_CIRCUITS.find(s => s.id === sampleId);
    if (!sample) return;

    const clonedComps = JSON.parse(JSON.stringify(sample.components));
    this.solver.setComponents(clonedComps);
    this.renderer.selectedComponent = null;

    if (sample.oscilloscopeSetup) {
      const os = sample.oscilloscopeSetup;
      if (os.chA) {
        this.oscilloscope.setProbe(0, os.chA.componentId, os.chA.pinIndex);
        this.oscilloscope.channels[0].voltsPerDiv = os.chA.voltsPerDiv || 2.0;
        document.getElementById('scopeVoltsChA').value = String(this.oscilloscope.channels[0].voltsPerDiv);
      }
      if (os.chB) {
        this.oscilloscope.setProbe(1, os.chB.componentId, os.chB.pinIndex);
        this.oscilloscope.channels[1].voltsPerDiv = os.chB.voltsPerDiv || 2.0;
        document.getElementById('scopeVoltsChB').value = String(this.oscilloscope.channels[1].voltsPerDiv);
      }
      if (os.timePerDiv) {
        this.oscilloscope.timePerDiv = os.timePerDiv;
        document.getElementById('scopeTimebase').value = String(os.timePerDiv);
      }
    }

    this.updateProbeDropdowns();
    this.updateInspector(null);
    this.renderer.render();
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
