const { ItemSheetV2 } = foundry.applications.sheets;
const { HandlebarsApplicationMixin } = foundry.applications.api;
const { TextEditor } = foundry.applications.ux;

/**
 * Extend the basic ItemSheet with some very simple modifications
 */
export class OWBItemSheet extends HandlebarsApplicationMixin(ItemSheetV2) {

  static DEFAULT_OPTIONS = {
    classes: ['owb', 'sheet', 'item'],
    position: {
      width: 520,
      height: 390,
    },
    actions: {
      addTag: this._onAddTag,
      delTag: this._onDeleteTag,
      meleeToggle: this._onToggleMelee,
      rangedToggle: this._onToggleRanged,
    },
    window: {
      resizable: true,
    },
    // dragDrop: [{ dragSelector: '[data-drag]', dropSelector: null }],
    form: {
      submitOnChange: true,
    },
  };

  static PARTS = {
    header: {
      template: 'systems/owb/templates/items/partials/item-header.hbs',
    },
    body: {
      template: 'systems/owb/templates/items/partials/item-body.hbs',
    },
  }

  _prepareContext(options) {
    const context = super._prepareContext(options);
    context.system = this.item.system;
    context.data = this.item.system;
    context.item = this.item;
    context.config = CONFIG.OWB;
    context.isWeapon = this.item.type === 'weapon';
    context.isAbility = this.item.type === 'ability';
    context.editable = this.isEditable;
    context.enrichedNotes = TextEditor.enrichHTML(this.item.system.description, {
      secrets: this.document.isOwner,
      rollData: this.actor?.getRollData(),
      // Relative UUID resolution
      relativeTo: this.item,
    });
    return context;
  }

  async _preparePartContext(partId, context) {
    context = await super._preparePartContext(partId, context);
    context.system = this.item.system;
    context.data = this.item.system;
    context.item = this.item;
    context.config = CONFIG.OWB;
    context.isWeapon = this.item.type === 'weapon';
    context.isAbility = this.item.type === 'ability';
    context.editable = this.isEditable;
    context.enrichedNotes = await TextEditor.enrichHTML(this.item.system.description, {
      secrets: this.document.isOwner,
      rollData: this.actor?.getRollData(),
      // Relative UUID resolution
      relativeTo: this.item,
    });
    return context;
  }

  _onRender(_context, _options) {
    const html = this.element;
    const field = html.querySelector('input[data-action="addTag"]');
    field?.addEventListener('keyup', (ev) => {
      if (ev.key === 'Enter') {
        let value = ev.currentTarget.value;
        let values = value.split(',').filter((i) => i.length > 0);
        this.item.pushTag(values);
      }
    });
  }

  static async _onAddTag(event, target) {
    if (event.type === 'change') {
      let value = target.value;
      let values = value.split(',');
      this.item.pushTag(values);
    }
  }

  static async _onDeleteTag(_event, target) {
    const value = target.parentElement.dataset.tag;
    this.item.popTag(value);
  }

  static async _onToggleMelee(event, target) {
    this.item.update({system: {melee: !this.item.system.melee}});
  }

  static async _onToggleRanged(event, target) {
    this.item.update({system: {missile: !this.item.system.missile}});
  }
}
