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

  async _prepareContext(options) {
    let data = await super._prepareContext(options);
    data.data = this.item.system;
    data.item = this.item;
    data.config = CONFIG.OWB;
    data.isWeapon = this.item.type === 'weapon';
    data.isAbility = this.item.type === 'ability';
    data.enrichedNotes = await TextEditor.enrichHTML(this.item.system.description, {
      secrets: this.document.isOwner,
      rollData: this.actor?.getRollData(),
      // Relative UUID resolution
      relativeTo: this.item,
    });
    return data;
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

  static async _onToggleMelee() {
    this.item.update({system: {melee: !this.item.system.melee}});
  }

  static async  _onToggleRanged() {
    this.item.update({system: {missile: !this.item.system.missile}});
  }
}
