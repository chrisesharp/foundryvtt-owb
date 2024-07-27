import { OWBActorSheet } from "./actor-sheet.js";
import { OWBCharacterModifiers } from "../dialog/character-modifiers.js";
import { OWBCharacterCreator } from "../dialog/character-creation.js";

/**
 * Extend the basic ActorSheet with some very simple modifications
 */
export class OWBActorSheetCharacter extends OWBActorSheet {
  constructor(...args) {
    super(...args);
  }

  /* -------------------------------------------- */

  /**
   * Extend and override the default options used by the 5e Actor Sheet
   * @returns {Object}
   */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["owb", "sheet", "actor", "character"],
      template: "systems/owb/templates/actors/character-sheet.html",
      width: 450,
      height: 530,
      resizable: true,
      tabs: [
        {
          navSelector: ".sheet-tabs",
          contentSelector: ".sheet-body",
          initial: "attributes",
        },
      ],
    });
  }

  generateScores() {
    new OWBCharacterCreator(this.actor, {
      top: this.position.top + 40,
      left: this.position.left + (this.position.width - 400) / 2,
    }).render(true);
  }

  /**
   * Prepare data for rendering the Actor sheet
   * The prepared data object contains both the actor data as well as additional sheet options
   */
  async getData() {
    const data = await super.getData();
    return this._prepareItems(data);
    // return data;
  }


  async _chooseLang() {
    let choices = CONFIG.OWB.languages;
    let templateData = { choices: choices },
      dlg = await renderTemplate(
        "systems/owb/templates/actors/dialogs/lang-create.html",
        templateData
      );
    //Create Dialog window
    return new Promise((resolve) => {
      new Dialog({
        title: "Choose Language",
        content: dlg,
        buttons: {
          ok: {
            label: game.i18n.localize("OWB.Ok"),
            icon: '<i class="fas fa-check"></i>',
            callback: (html) => {
              resolve({
                choice: html.find('select[name="choice"]').val(),
                fluency: html.find('select[name="fluency"]').val(),
              });
            },
          },
          cancel: {
            icon: '<i class="fas fa-times"></i>',
            label: game.i18n.localize("OWB.Cancel"),
          },
        },
        default: "ok",
      }).render(true);
    });
  }

  async _pushLang(header) {
    const type = header.dataset.type;
    this._chooseLang().then((dialogInput) => {
      const name = dialogInput.choice;
      const fluency = dialogInput.fluency;
      const img = CONFIG.OWB.languages[name].img;
      const itemData = {
        name: name,
        type: type,
        img:img,
        system: {}
      };
      itemData.system["name"] = name;
      itemData.system["fluency"] = fluency;
      itemData.system["save"] = "save";
      return this.actor.createEmbeddedDocuments("Item",[itemData]);
    });
  }

  _popLang(table, lang) {
    const data = this.actor.system;
    let update = data[table].value.filter((el) => el.name != lang);
    let newData = {};
    newData[table] = { value: update };
    return this.actor.update({ data: newData });
  }

  /* -------------------------------------------- */

  async _onQtChange(event) {
    event.preventDefault();
    const itemId = event.currentTarget.closest(".item").dataset.itemId;
    const item = this.actor.items.get(itemId);
    return item.update({ "system.quantity.value": parseInt(event.target.value) });
  }

  _onShowModifiers(event) {
    event.preventDefault();
    new OWBCharacterModifiers(this.actor, {
      top: this.position.top + 40,
      left: this.position.left + (this.position.width - 400) / 2,
    }).render(true);
  }

  /**
   * Activate event listeners using the prepared sheet HTML
   * @param html {HTML}   The prepared HTML object ready to be rendered into the DOM
   */
  activateListeners(html) {
    super.activateListeners(html);

    html.find(".ability-score .attribute-name a").click((event) => {
      const actorObject = this.actor;
      const element = event.currentTarget;
      const score = element.parentElement.parentElement.dataset.score;
      const stat = element.parentElement.parentElement.dataset.stat;
      if (!score) {
        if (stat === "lr") {
          actorObject.rollLoyalty(score, { event: event });
        }
      } else {
        actorObject.rollCheck(score, { event: event });
      }
    });

    html.find(".exploration .attribute-name a").click((event) => {
      const actorObject = this.actor;
      const element = event.currentTarget;
      const expl = element.parentElement.parentElement.dataset.exploration;
      actorObject.rollExploration(expl, { event: event });
    });

    html.find(".inventory .item-titles .item-caret").click((event) => {
      const items = $(event.currentTarget.parentElement.parentElement).children(".item-list");
      if (items.css("display") == "none") {
        const el = $(event.currentTarget).find(".fas.fa-caret-right");
        el.removeClass("fa-caret-right");
        el.addClass("fa-caret-down");
        items.slideDown(200);
      } else {
        const el = $(event.currentTarget).find(".fas.fa-caret-down");
        el.removeClass("fa-caret-down");
        el.addClass("fa-caret-right");
        items.slideUp(200);
      }
    });

    html.find("a[data-action='modifiers']").click((ev) => {
      this._onShowModifiers(ev);
    });

    // Everything below here is only needed if the sheet is editable
    if (!this.options.editable) return;

    // Update Inventory Item
    html.find(".item-edit").click((ev) => {
      const li = $(ev.currentTarget).parents(".item");
      const item = this.actor.items.get(li.data("itemId"));
      item.sheet.render(true);
    });

    // Delete Inventory Item
    html.find(".item-delete").click((ev) => {
      const li = $(ev.currentTarget).parents(".item");
      this.actor.deleteEmbeddedDocuments("Item",[li.data("itemId")]);
      li.slideUp(200, () => this.render(false));
    });

    html.find(".item-push").click((event) => {
      event.preventDefault();
      const header = event.currentTarget;
      return this._pushLang(header);
    });

    html.find(".item-pop").click((event) => {
      event.preventDefault();
      const header = event.currentTarget;
      const table = header.dataset.array;
      this._popLang(
        table,
        $(event.currentTarget).closest(".item").data("lang")
      );
    });

    html.find(".item-create").click((event) => {
      event.preventDefault();
      const header = event.currentTarget;
      const type = header.dataset.type;
      const itemData = {
        name: `New ${type.capitalize()}`,
        type: type,
        data: foundry.utils.duplicate(header.dataset),
      };
      delete itemData.data["type"];
      return this.actor.createEmbeddedDocuments("Item",[itemData]);
    });

    //Toggle Equipment
    html.find(".item-toggle").click(async (ev) => {
      const li = $(ev.currentTarget).parents(".item");
      const item = this.actor.items.get(li.data("itemId"));
      await item.update({
        system: {
          equipped: !item.system.equipped,
        },
      });
    });

    html.find(".quantity input")
        .click((ev) => ev.target.select())
        .change(this._onQtChange.bind(this));

    html.find("a[data-action='generate-scores']").click((ev) => {
      this.generateScores(ev);
    });
  }
}
