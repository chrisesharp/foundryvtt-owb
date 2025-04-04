import { OWBActorSheet } from "./actor-sheet.js";
import { OWBCharacterModifiers } from "../dialog/character-modifiers.js";
import { OWBCharacterCreator } from "../dialog/character-creation.js";
const { renderTemplate } = foundry.applications.handlebars;

/**
 * Extend the basic ActorSheet with some very simple modifications
 */
export class OWBActorSheetCharacter extends OWBActorSheet {
  static DEFAULT_OPTIONS = {
    classes: ['owb', 'sheet', 'actor', 'character'],
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
    },
    // Custom property that's merged into `this.options`
    dragDrop: [{ dragSelector: '[data-drag]', dropSelector: null }],
    form: {
      submitOnChange: true,
    },
  };

  /** @override */
  static PARTS = {
    header: {
      template: 'systems/owb/templates/actors/partials/character-header.hbs',
    },
    tabs: {
      template: 'systems/owb/templates/actors/partials/character-nav.hbs',
    },
    abilities: {
      template: 'systems/owb/templates/actors/partials/character-abilities.hbs',
    },
    attributes: {
      template: 'systems/owb/templates/actors/partials/character-attributes.hbs',
    },
    inventory: {
      template: 'systems/owb/templates/actors/partials/character-inventory.hbs',
    },
    notes: {
      template: 'systems/owb/templates/actors/partials/actor-notes.hbs',
    },
  };

  /** @override */
  _configureRenderOptions(options) {
    super._configureRenderOptions(options);
    // Not all parts always render
    options.parts = ['header', 'tabs', 'abilities', 'attributes', 'inventory', 'notes'];
  }

  /**
  * Prepare data for rendering the Actor sheet
  * The prepared data object contains both the actor data as well as additional sheet options
  */
  async _prepareContext(options) {
    const data = await super._prepareContext(options);
    return this._prepareItems(data);
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
  async _preparePartContext(partId, context) {
    switch (partId) {
      case 'notes':
        context.tab = context.tabs[partId];
        context.enrichedBio = await TextEditor.enrichHTML(this.actor.system.details.biography, {
          secrets: this.document.isOwner,
          rollData: this.actor.getRollData(),
          // Relative UUID resolution
          relativeTo: this.actor,
        });
        context.enrichedNotes = await TextEditor.enrichHTML(this.actor.system.details.notes, {
          secrets: this.document.isOwner,
          rollData: this.actor.getRollData(),
          // Relative UUID resolution
          relativeTo: this.actor,
        });
        break;
      default:
        context.tab = context.tabs[partId];
        break;
    }
    return context;
  }

  generateScores() {
    new OWBCharacterCreator(this.actor, {
      top: this.position.top + 40,
      left: this.position.left + (this.position.width - 400) / 2,
    }).render(true);
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
    return this.actor.update({ system: newData });
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
        system: foundry.utils.duplicate(header.dataset),
      };
      //delete itemData.system["type"];
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
