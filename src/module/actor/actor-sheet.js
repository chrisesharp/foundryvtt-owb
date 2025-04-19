import { OWBEntityTweaks } from "../dialog/entity-tweaks.js";
const { HandlebarsApplicationMixin } = foundry.applications.api;
const { ActorSheetV2 } = foundry.applications.sheets;
const { DragDrop, TextEditor } = foundry.applications.ux;
import { slideToggle } from '../utils/slide.js';

export class OWBActorSheet extends HandlebarsApplicationMixin(ActorSheetV2) {
  #dragDrop;
  constructor(options = {}) {
    super(options);
    this.#dragDrop = this.#createDragDropHandlers();
  }

  #createDragDropHandlers() {
    return this.options.dragDrop.map((d) => {
      d.permissions = {
        dragstart: this._canDragStart.bind(this),
        drop: this._canDragDrop.bind(this),
      };
      d.callbacks = {
        dragstart: this._onDragStart.bind(this),
        dragover: this._onDragOver.bind(this),
        drop: this._onDrop.bind(this),
      };
      return new DragDrop(d);
    });
  }
  
  static DEFAULT_OPTIONS = {
    classes: ['owb', 'sheet', 'actor'],
    position: {
      width: 450,
      height: 530,
    },
    actions: {
      attack: this._onAttack,
      itemEdit: this._itemEdit,
      itemDelete: this._itemDelete,
      createDoc: this._createDoc,
      onEditImage: this._onEditImage,
      itemSummary: this._onItemSummary,
      itemShow: this._onItemShow,
      onRollSave: this._onRollSave,
      onRollItem: this._onRollItem,
      onRollHitDice: this._onRollHitDice,
      incConsumable: this._onConsumable,
      decConsumable: this._onConsumable,
      configureActor: this._onConfigureActor,
    },
    window: {
      resizable: true,
      controls: [OWBActorSheet._getHeaderButtons()]
    },
    // Custom property that's merged into `this.options`
    dragDrop: [{ dragSelector: '[data-drag]', dropSelector: null }],
    form: {
      submitOnChange: true,
    },
  };

  async _prepareContext(options) {
    const config = CONFIG.OWB;
    config.ascendingAC = game.settings.get("owb", "ascendingAC");
    config.encumbrance = game.settings.get("owb", "encumbranceOption");
    return {
      options: options,
      owner: this.actor.isOwner,
      actor: this.actor,
      editable: this.actor.sheet.isEditable,
      config: config,
      isNew: this.actor.isNew(),
      data: this.actor.system,
      tabs: this._getTabs(options.parts),
    }
  }

  /**
   * Organize and classify Owned Items for Character sheets
   * @private
   */
  _prepareItems(data) {
    // Assign and return
    data.owned = {
      items: this.actor.itemTypes['item'],
      weapons: this.actor.itemTypes['weapon'],
      armors:this.actor.itemTypes['armor'],
    };
    data.abilities = this.actor.itemTypes['ability'];
    data.languages = this.actor.itemTypes['language'];
    return data;
  }

  _getTabs(parts) {
    // If you have sub-tabs this is necessary to change
    const tabGroup = 'primary';
    // Default tab for first time it's rendered this session
    if (!this.tabGroups[tabGroup]) this.tabGroups[tabGroup] = 'attributes';
    return parts.reduce((tabs, partId) => {
      const tab = {
        cssClass: '',
        group: tabGroup,
        // Matches tab property to
        id: '',
        // FontAwesome Icon, if you so choose
        icon: '',
        // Run through localization
        label: 'HV.tabs.',
      };
      switch (partId) {
        case 'header':
        case 'tabs':
          return tabs;
        default:
          tab.id = partId;
          tab.label += partId;
          break;
      }
      if (this.tabGroups[tabGroup] === tab.id) tab.cssClass = 'active';
      tabs[partId] = tab;
      return tabs;
    }, {});
  }

  /** @override */
  _onRender(_context, _options) {
    this.#dragDrop.forEach((d) => d.bind(this.element));
    const html = this.element;
  }

  static async  _itemEdit(_event, element) {
    const li = element.parentNode.parentNode;
    const item = this.actor.items.get(li.dataset.itemId);
    item?.sheet?.render(true);
  }

  static async _itemDelete(_event, element) {
    const li = element.parentNode.parentNode;
    const itemID = li.dataset.itemId;
    const item = this.actor.items.get(itemID);
    await item.delete();
  }

  static async _onEditImage(_event, target) {
    const attr = target.dataset.edit;
    const current = foundry.utils.getProperty(this.document, attr);
    const { img } = this.document.constructor.getDefaultArtwork?.(this.document.toObject()) ?? {};
    const fp = new FilePicker({
      current,
      type: 'image',
      redirectToRoot: img ? [img] : [],
      callback: (path) => {
        this.document.update({ [attr]: path });
      },
      top: this.position.top + 40,
      left: this.position.left + 10,
    });
    return fp.browse();
  }

  static async _onItemSummary(event, target) {
    event.preventDefault();
    const entry = target.parentNode.parentNode;
    const itemId = entry.dataset.itemId;
    const li = entry.parentNode;
    const item = await this.actor.items.get(itemId);
    if (!item) return;
    if (!li.querySelector('.item-summary')) {
      const description = await TextEditor.enrichHTML(item.system.description, { async: true });
      // Add item tags
      let section = `
      <div class="item-summary" style='display:none;'><ol class="tag-list">`;
      section += await item.getTags();
      section += `</ol>
          <div>
              ${description}
          </div>
      </div>`;
      li.innerHTML += section;
    }
    slideToggle(li.querySelector('.item-summary'));
  }

  static async _onItemShow(event, target) {
    const li = target.closest(".item");
    const item = this.actor.items.get(li.dataset.itemId);
    item.show();
  }

  static async _createDoc(event, target) {
    // Retrieve the configured document class for Item or ActiveEffect
    const docCls = getDocumentClass(target.dataset.documentClass);
    // Prepare the document creation data by initializing it a default name.
    const docData = {
      name: docCls.defaultName({
        // defaultName handles an undefined type gracefully
        type: target.dataset.type,
        parent: this.actor,
      }),
    };
    // Loop through the dataset and add it to our docData
    for (const [dataKey, value] of Object.entries(target.dataset)) {
      // These data attributes are reserved for the action handling
      if (['action', 'documentClass'].includes(dataKey)) continue;
      // Nested properties require dot notation in the HTML, e.g. anything with `system`
      // An example exists in spells.hbs, with `data-system.spell-level`
      // which turns into the dataKey 'system.spellLevel'
      foundry.utils.setProperty(docData, dataKey, value);
    }

    // Finally, create the embedded document!
    await docCls.create(docData, { parent: this.actor });
  }

  static async _onRollSave(event, target) {
    const actorObject = this.actor;
    const save = target.dataset.save;
    actorObject.rollSave(save, { event: event });
  }

  static async _onRollItem(event, target) {
    const li = target.closest(".item");
    const item = this.actor.items.get(li.dataset.itemId);
    if (item.type == "weapon") {
      if (this.actor.type === "enemy" || this.actor.type === "vehicle") {
        item.update({
          system: { counter: { value: item.system.counter.value - 1 } },
        });
      }
      item.rollWeapon({ skipDialog: event.ctrlKey });
    } else if (item.type == "language") {
      let actorObject = this.actor;
      let language = item.system;
      actorObject.rollLanguageSave(language, { event: event });
    } else {
      item.rollFormula({ skipDialog: event.ctrlKey });
    }
  }

  static async _onAttack(event, target) {
      const attack = target.parentElement.parentElement.dataset.attack;
      const rollData = {
        actor: this.system,
        roll: {},
      };
      this.actor.targetAttack(rollData, attack, {
        type: attack,
        skipDialog: event.ctrlKey,
      });
  }

  static async _onRollHitDice(event) {
    this.actor.rollHitDice({ event: event })
  }

  static async _onConsumable(event, target) {
    const delta = (target.dataset.action === 'incConsumable' )? 1 : -1 ;
    const id = target.parentElement.dataset.itemId;
    const item = this.actor.items.get(id);
    const quantity = Math.min(item.system.quantity.max, Math.max(0, item.system.quantity.value + delta));
    item.update({system:{"quantity.value": quantity}});
  }

  static async _onConfigureActor(event) {
    event.preventDefault();
    new OWBEntityTweaks(this.actor, {
      top: this.position.top + 40,
      left: this.position.left + (this.position.width - 400) / 2,
    }).render(true);
  }

  /**
   * Extend and override the sheet header buttons
   * @override
   */
  static _getHeaderButtons() {
    return {
        label: 'OWB.dialog.tweaks',
        class: "configure-actor",
        icon: "fas fa-code",
        action: 'configureActor',
      };
  }

  /** The following pieces set up drag handling and are unlikely to need modification  */

  /**
   * Returns an array of DragDrop instances
   * @type {DragDrop[]}
   */
  get dragDrop() {
    return this.#dragDrop;
  }
}
