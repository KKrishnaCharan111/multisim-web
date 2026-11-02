/**
 * Multisim Web Studio - Command Pattern History Manager (Undo / Redo)
 * Maintains deep execution stacks (limit: 50) and updates toolbar button availability and dirty status.
 */

export class HistoryManager {
  constructor(app) {
    this.app = app;
    this.undoStack = [];
    this.redoStack = [];
    this.maxHistory = 50;
    this.isDirty = false;
    this.onStateChange = null;
  }

  execute(command) {
    command.execute();
    this.undoStack.push(command);
    if (this.undoStack.length > this.maxHistory) {
      this.undoStack.shift();
    }
    this.redoStack = [];
    this.isDirty = true;
    this.notifyState();
  }

  undo() {
    if (this.undoStack.length === 0) return;
    const command = this.undoStack.pop();
    command.undo();
    this.redoStack.push(command);
    this.notifyState();
  }

  redo() {
    if (this.redoStack.length === 0) return;
    const command = this.redoStack.pop();
    command.execute();
    this.undoStack.push(command);
    this.notifyState();
  }

  canUndo() {
    return this.undoStack.length > 0;
  }

  canRedo() {
    return this.redoStack.length > 0;
  }

  markSaved() {
    this.isDirty = false;
    this.notifyState();
  }

  notifyState() {
    if (this.onStateChange) {
      this.onStateChange({
        canUndo: this.canUndo(),
        canRedo: this.canRedo(),
        isDirty: this.isDirty
      });
    }
  }

  clear() {
    this.undoStack = [];
    this.redoStack = [];
    this.isDirty = false;
    this.notifyState();
  }
}

/**
 * Command: Add Entity (Component)
 */
export class AddEntityCommand {
  constructor(app, comp) {
    this.app = app;
    this.comp = comp;
  }

  execute() {
    if (!this.app.solver.components.includes(this.comp)) {
      this.app.solver.components.push(this.comp);
    }
    this.app.renderer.selectedComponent = this.comp;
    this.app.updateInspector(this.comp);
    this.app.updateProbeDropdowns();
    this.app.renderer.render();
  }

  undo() {
    const idx = this.app.solver.components.indexOf(this.comp);
    if (idx >= 0) {
      this.app.solver.components.splice(idx, 1);
    }
    if (this.app.renderer.selectedComponent === this.comp) {
      this.app.renderer.selectedComponent = null;
      this.app.updateInspector(null);
    }
    this.app.updateProbeDropdowns();
    this.app.renderer.render();
  }
}

/**
 * Command: Delete Entity (Component & connected net references)
 */
export class DeleteEntityCommand {
  constructor(app, comp) {
    this.app = app;
    this.comp = comp;
    this.index = this.app.solver.components.indexOf(comp);
  }

  execute() {
    const idx = this.app.solver.components.indexOf(this.comp);
    if (idx >= 0) {
      this.app.solver.components.splice(idx, 1);
    }
    if (this.app.renderer.selectedComponent === this.comp) {
      this.app.renderer.selectedComponent = null;
      this.app.updateInspector(null);
    }
    this.app.updateProbeDropdowns();
    this.app.renderer.render();
  }

  undo() {
    if (this.index >= 0 && this.index <= this.app.solver.components.length) {
      this.app.solver.components.splice(this.index, 0, this.comp);
    } else {
      this.app.solver.components.push(this.comp);
    }
    this.app.renderer.selectedComponent = this.comp;
    this.app.updateInspector(this.comp);
    this.app.updateProbeDropdowns();
    this.app.renderer.render();
  }
}

/**
 * Command: Move Entity (Drag)
 */
export class MoveEntityCommand {
  constructor(app, comp, oldPos, newPos) {
    this.app = app;
    this.comp = comp;
    this.oldPos = { ...oldPos };
    this.newPos = { ...newPos };
  }

  execute() {
    this.comp.x = this.newPos.x;
    this.comp.y = this.newPos.y;
    this.app.renderer.render();
  }

  undo() {
    this.comp.x = this.oldPos.x;
    this.comp.y = this.oldPos.y;
    this.app.renderer.render();
  }
}

/**
 * Command: Rotate Entity
 */
export class RotateCommand {
  constructor(app, comp, oldRotation, newRotation) {
    this.app = app;
    this.comp = comp;
    this.oldRotation = oldRotation;
    this.newRotation = newRotation;
  }

  execute() {
    this.comp.rotation = this.newRotation;
    this.app.renderer.render();
  }

  undo() {
    this.comp.rotation = this.oldRotation;
    this.app.renderer.render();
  }
}

/**
 * Command: Add Wire / Connect Net
 */
export class AddWireCommand {
  constructor(app, pin1Info, pin2Info, assignedNet, oldNet1, oldNet2) {
    this.app = app;
    this.comp1Id = pin1Info.comp.id;
    this.pIdx1 = pin1Info.pIdx;
    this.comp2Id = pin2Info.comp.id;
    this.pIdx2 = pin2Info.pIdx;
    this.assignedNet = assignedNet;
    this.oldNet1 = oldNet1;
    this.oldNet2 = oldNet2;
  }

  execute() {
    const comp1 = this.app.solver.components.find(c => c.id === this.comp1Id);
    const comp2 = this.app.solver.components.find(c => c.id === this.comp2Id);
    if (comp1 && comp1.pins[this.pIdx1]) comp1.pins[this.pIdx1].netId = this.assignedNet;
    if (comp2 && comp2.pins[this.pIdx2]) comp2.pins[this.pIdx2].netId = this.assignedNet;
    this.app.updateProbeDropdowns();
    this.app.renderer.render();
  }

  undo() {
    const comp1 = this.app.solver.components.find(c => c.id === this.comp1Id);
    const comp2 = this.app.solver.components.find(c => c.id === this.comp2Id);
    if (comp1 && comp1.pins[this.pIdx1]) comp1.pins[this.pIdx1].netId = this.oldNet1;
    if (comp2 && comp2.pins[this.pIdx2]) comp2.pins[this.pIdx2].netId = this.oldNet2;
    this.app.updateProbeDropdowns();
    this.app.renderer.render();
  }
}

/**
 * Command: Change Parameter
 */
export class ChangeParamCommand {
  constructor(app, comp, paramKey, oldValue, newValue) {
    this.app = app;
    this.comp = comp;
    this.paramKey = paramKey;
    this.oldValue = oldValue;
    this.newValue = newValue;
  }

  execute() {
    this.comp[this.paramKey] = this.newValue;
    this.app.updateInspector(this.comp);
    this.app.renderer.render();
  }

  undo() {
    this.comp[this.paramKey] = this.oldValue;
    this.app.updateInspector(this.comp);
    this.app.renderer.render();
  }
}
