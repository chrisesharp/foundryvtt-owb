import { OWBActor } from "./entity.js";
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
    return mergeObject(super.defaultOptions, {
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
  getData() {
    const data = super.getData();

    data.config.ascendingAC = game.settings.get("owb", "ascendingAC");
    data.config.initiative = game.settings.get("owb", "initiative") != "group";
    data.config.encumbrance = game.settings.get("owb", "encumbranceOption");

    data.isNew = this.actor.isNew();
    return data;
  }


  async _chooseLang() {
    let choices = CONFIG.OWB.languages;
    let templateData = { choices: choices },
      dlg = await renderTemplate(
        "/systems/owb/templates/actors/dialogs/lang-create.html",
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

  _pushLang(header) {
    const data = this.actor.data.data;
    const type = header.dataset.type;
    const table = header.dataset.array;
    let update = duplicate(data[table]);
    this._chooseLang().then((dialogInput) => {
      const name = CONFIG.OWB.languages[dialogInput.choice].name;
      const fluency = dialogInput.fluency;
      const img = CONFIG.OWB.languages[dialogInput.choice].img;
      if (update.value) {
        update.value.push({name:name, fluency:fluency});
      } else {
        update = { value: [{name:name, fluency:fluency}] };
      }
      let newData = {};
      newData[table] = update;
      const itemData = {
        name: name,
        type: type,
        img:img,
        data: duplicate(header.dataset),
      };
      delete itemData.data["type"];
      itemData.data["name"] = name;
      itemData.data["fluency"] = fluency;
      itemData.data["save"] = "save";
      this.actor.update({ data: newData });
      return this.actor.createOwnedItem(itemData);
    });
  }

  _popLang(table, lang) {
    const data = this.actor.data.data;
    let update = data[table].value.filter((el) => el.name != lang);
    let newData = {};
    newData[table] = { value: update };
    return this.actor.update({ data: newData });
  }

  /* -------------------------------------------- */

  async _onQtChange(event) {
    event.preventDefault();
    const itemId = event.currentTarget.closest(".item").dataset.itemId;
    const item = this.actor.getOwnedItem(itemId);
    return item.update({ "data.quantity.value": parseInt(event.target.value) });
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
      let actorObject = this.actor;
      let element = event.currentTarget;
      let score = element.parentElement.parentElement.dataset.score;
      let stat = element.parentElement.parentElement.dataset.stat;
      if (!score) {
        if (stat == "lr") {
          actorObject.rollLoyalty(score, { event: event });
        }
      } else {
        actorObject.rollCheck(score, { event: event });
      }
    });

    html.find(".exploration .attribute-name a").click((event) => {
      let actorObject = this.actor;
      let element = event.currentTarget;
      let expl = element.parentElement.parentElement.dataset.exploration;
      actorObject.rollExploration(expl, { event: event });
    });

    html.find(".inventory .item-titles .item-caret").click((event) => {
      let items = $(event.currentTarget.parentElement.parentElement).children(
        ".item-list"
      );
      if (items.css("display") == "none") {
        let el = $(event.currentTarget).find(".fas.fa-caret-right");
        el.removeClass("fa-caret-right");
        el.addClass("fa-caret-down");
        items.slideDown(200);
      } else {
        let el = $(event.currentTarget).find(".fas.fa-caret-down");
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
      const item = this.actor.getOwnedItem(li.data("itemId"));
      item.sheet.render(true);
    });

    // Delete Inventory Item
    html.find(".item-delete").click((ev) => {
      const li = $(ev.currentTarget).parents(".item");
      this.actor.deleteOwnedItem(li.data("itemId"));
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
        data: duplicate(header.dataset),
      };
      delete itemData.data["type"];
      return this.actor.createOwnedItem(itemData);
    });

    //Toggle Equipment
    html.find(".item-toggle").click(async (ev) => {
      const li = $(ev.currentTarget).parents(".item");
      const item = this.actor.getOwnedItem(li.data("itemId"));
      await this.actor.updateOwnedItem({
        _id: li.data("itemId"),
        data: {
          equipped: !item.data.data.equipped,
        },
      });
    });

    html
      .find(".quantity input")
      .click((ev) => ev.target.select())
      .change(this._onQtChange.bind(this));

    html.find("a[data-action='generate-scores']").click((ev) => {
      this.generateScores(ev);
    });
  }
}
