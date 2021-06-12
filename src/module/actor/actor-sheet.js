import { OWBEntityTweaks } from "../dialog/entity-tweaks.js";

export class OWBActorSheet extends ActorSheet {
  constructor(...args) {
    super(...args);
  }
  /* -------------------------------------------- */

  getData() {
    // const data = super.getData();
    const data = foundry.utils.deepClone(super.getData().data);
    data.owner = this.actor.isOwner;
    data.editable = this.actor.sheet.isEditable;

    data.config = CONFIG.OWB;
    // Settings
    data.config.ascendingAC = game.settings.get("owb", "ascendingAC");
    data.config.encumbrance = game.settings.get("owb", "encumbranceOption");

    data.isNew = this.actor.isNew();
    // // Prepare owned items
    // this._prepareItems(data);
    return data;
  }

  /**
   * Organize and classify Owned Items for Character sheets
   * @private
   */
  _prepareItems(data) {
    // Partition items by category
    let [items, weapons, armors, abilities, languages] = this.actor.data.items.reduce(
      (arr, item) => {
        // Classify items into types
        if (item.type === "item") arr[0].push(item);
        else if (item.type === "weapon") arr[1].push(item);
        else if (item.type === "armor") arr[2].push(item);
        else if (item.type === "ability") arr[3].push(item);
        else if (item.type === "language") arr[4].push(item);
        return arr;
      },
      [[], [], [], [], []]
    );

    // Assign and return
    data.owned = {
      items: items,
      weapons: weapons,
      armors: armors,
    };
    data.abilities = abilities;
    data.languages = languages;
  }

  activateEditor(target, editorOptions, initialContent) {
    // remove some controls to the editor as the space is lacking
    if (target == "data.details.description") {
      editorOptions.toolbar = "styleselect bullist hr table removeFormat save";
    }
    super.activateEditor(target, editorOptions, initialContent);
  }

  _onItemSummary(event) {
    event.preventDefault();
    let li = $(event.currentTarget).parents(".item"),
      item = this.actor.items.get(li.data("item-id")),
      description = TextEditor.enrichHTML(item.data.data.description);
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
    html
      .find(".item .item-name h4")
      .click((event) => this._onItemSummary(event));

    html.find(".item .item-controls .item-show").click(async (ev) => {
      const li = $(ev.currentTarget).parents(".item");
      const item = this.actor.items.get(li.data("itemId"));
      item.show();
    });

    html.find(".saving-throw .attribute-name a").click((event) => {
      let actorObject = this.actor;
      let element = event.currentTarget;
      let save = element.parentElement.parentElement.dataset.save;
      actorObject.rollSave(save, { event: event });
    });

    html.find(".item .item-rollable .item-image").click(async (ev) => {
      const li = $(ev.currentTarget).parents(".item");
      const item = this.actor.items.get(li.data("itemId"));
      if (item.type == "weapon") {
        if (this.actor.data.type === "enemy") {
          item.update({
            data: { counter: { value: item.data.data.counter.value - 1 } },
          });
        }
        item.rollWeapon({ skipDialog: ev.ctrlKey });
      } else if (item.type == "language") {
        let actorObject = this.actor;
        let language = item.data.data;
        actorObject.rollLanguageSave(language, { event: ev });
      } else {
        item.rollFormula({ skipDialog: ev.ctrlKey });
      }
    });

    html.find(".item-entry .consumable-counter .empty-mark").click(ev => {
      const el = ev.currentTarget.parentElement.parentElement.children[0];
      const id = el.dataset.itemId;
      const item = this.actor.items.get(id);
      item.update({"data.quantity.value": item.data.data.quantity.value + 1});
    });

    html.find(".item-entry .consumable-counter .full-mark").click(ev => {
      const el = ev.currentTarget.parentElement.parentElement.children[0];
      const id = el.dataset.itemId;
      const item = this.actor.items.get(id);
      item.update({"data.quantity.value": item.data.data.quantity.value - 1});
    });


    html.find(".attack a").click((ev) => {
      let actorObject = this.actor;
      let element = ev.currentTarget;
      let attack = element.parentElement.parentElement.dataset.attack;
      const rollData = {
        actor: this.data,
        roll: {},
      };
      actorObject.targetAttack(rollData, attack, {
        type: attack,
        skipDialog: ev.ctrlKey,
      });
    });
    
    html.find(".hit-dice .attribute-name a").click((event) => {
      let actorObject = this.actor;
      actorObject.rollHitDice({ event: event });
    });

    // Everything below here is only needed if the sheet is editable
    if (!this.options.editable) return;
  }

  // Override to set resizable initial size
  async _renderInner(...args) {
    const html = await super._renderInner(...args);
    this.form = html[0];

    // Resize resizable classes
    let resizable = html.find(".resizable");
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

    let html = $(this.form);
    let resizable = html.find(".resizable");
    if (resizable.length == 0) {
      return;
    }
    // Resize divs
    resizable.each((_, el) => {
      let heightDelta = this.position.height - this.options.height;
      el.style.height = `${heightDelta + parseInt(el.dataset.baseSize)}px`;
    });
    // Resize editors
    let editors = html.find(".editor");
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
}
