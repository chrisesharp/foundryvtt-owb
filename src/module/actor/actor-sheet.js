import { OWBEntityTweaks } from "../dialog/entity-tweaks.js";
const { DialogV2, HandlebarsApplicationMixin } = foundry.applications.api;
const { ActorSheetV2 } = foundry.applications.sheets;
const { renderTemplate } = foundry.applications.handlebars;
const { DragDrop } = foundry.applications.ux;

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
      rollHitDie: this._onRollHitPoints,
      itemSummary: this._onItemSummary,
      roll: this._onRoll,
      itemEdit: this._itemEdit,
      itemDelete: this._itemDelete,
    },
    window: {
      resizable: true,
      // controls: [HVPDF.getPDFButton()],
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

  /** @override */
  _onRender(_context, _options) {
    this.#dragDrop.forEach((d) => d.bind(this.element));
    const html = this.element;
  }

  static _itemEdit(_event, element) {
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

  async _onItemSummary(event) {
    event.preventDefault();
    const li = $(event.currentTarget).parents(".item");
    const item = this.actor.items.get(li.data("item-id"));
    const description = await TextEditor.enrichHTML(item.system.description,{ async: true});
    // Toggle summary
    if (li.hasClass("expanded")) {
      let summary = li.parents(".item-entry").children(".item-summary");
      summary.slideUp(200, () => summary.remove());
    } else {
      // Add item tags
      let div = $(
        `<div class="item-summary"><ol class="tag-list">${item.getTags()}</ol><div>${description}</div></div>`
      );
      li.parents(".item-entry").append(div.hide());
      div.slideDown(200);
    }
    li.toggleClass("expanded");
  }

  activateListeners(html) {
    super.activateListeners(html);
    
    // Item summaries
    html.find(".item .item-name h4")
        .click((event) => this._onItemSummary(event));

    html.find(".item .item-controls .item-show").click(async (ev) => {
      const li = $(ev.currentTarget).parents(".item");
      const item = this.actor.items.get(li.data("itemId"));
      item.show();
    });

    html.find(".saving-throw .attribute-name a").click((event) => {
      const actorObject = this.actor;
      const element = event.currentTarget;
      const save = element.parentElement.parentElement.dataset.save;
      actorObject.rollSave(save, { event: event });
    });

    html.find(".item .item-rollable .item-image").click(async (ev) => {
      const li = $(ev.currentTarget).parents(".item");
      const item = this.actor.items.get(li.data("itemId"));
      if (item.type == "weapon") {
        if (this.actor.type === "enemy" || this.actor.type === "vehicle") {
          item.update({
            system: { counter: { value: item.system.counter.value - 1 } },
          });
        }
        item.rollWeapon({ skipDialog: ev.ctrlKey });
      } else if (item.type == "language") {
        let actorObject = this.actor;
        let language = item.system;
        actorObject.rollLanguageSave(language, { event: ev });
      } else {
        item.rollFormula({ skipDialog: ev.ctrlKey });
      }
    });

    html.find(".item-entry .consumable-counter .empty-mark").click(ev => {
      const el = ev.currentTarget.parentElement.parentElement.children[0];
      const id = el.dataset.itemId;
      const item = this.actor.items.get(id);
      item.update({system:{"quantity.value": item.system.quantity.value + 1}});
    });

    html.find(".item-entry .consumable-counter .full-mark").click(ev => {
      const el = ev.currentTarget.parentElement.parentElement.children[0];
      const id = el.dataset.itemId;
      const item = this.actor.items.get(id);
      item.update({system:{"quantity.value": item.system.quantity.value - 1}});
    });


    html.find(".attack a").click((ev) => {
      const actorObject = this.actor;
      const element = ev.currentTarget;
      const attack = element.parentElement.parentElement.dataset.attack;
      const rollData = {
        actor: this.system,
        roll: {},
      };
      actorObject.targetAttack(rollData, attack, {
        type: attack,
        skipDialog: ev.ctrlKey,
      });
    });
    
    html.find(".hit-dice .attribute-name a").click((event) => {
      const actorObject = this.actor;
      actorObject.rollHitDice({ event: event });
    });
  }

  // Override to set resizable initial size
  async _renderInner(...args) {
    const html = await super._renderInner(...args);
    this.form = html[0];

    // Resize resizable classes
    const resizable = html.find(".resizable");
    if (resizable.length == 0) {
      return;
    }
    resizable.each((_, el) => {
      let heightDelta = this.position.height - this.options.height;
      el.style.height = `${heightDelta + parseInt(el.dataset.baseSize)}px`;
    });
    return html;
  }

  async _onResize(event) {
    super._onResize(event);

    const html = $(this.form);
    const resizable = html.find(".resizable");
    if (resizable.length == 0) {
      return;
    }
    // Resize divs
    resizable.each((_, el) => {
      let heightDelta = this.position.height - this.options.height;
      el.style.height = `${heightDelta + parseInt(el.dataset.baseSize)}px`;
    });
    // Resize editors
    const editors = html.find(".editor");
    editors.each((id, editor) => {
      let container = editor.closest(".resizable-editor");
      if (container) {
        let heightDelta = this.position.height - this.options.height;
        editor.style.height = `${heightDelta + parseInt(container.dataset.editorSize)}px`;
      }
    });
  }

  _onConfigureActor(event) {
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
  _getHeaderButtons() {
    let buttons = super._getHeaderButtons();

    // Token Configuration
    const canConfigure = game.user.isGM || this.actor.owner;
    if (this.options.editable && canConfigure) {
      buttons = [
        {
          label: game.i18n.localize("OWB.dialog.tweaks"),
          class: "configure-actor",
          icon: "fas fa-code",
          onclick: (ev) => this._onConfigureActor(ev),
        },
      ].concat(buttons);
    }
    return buttons;
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
