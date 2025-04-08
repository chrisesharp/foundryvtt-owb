import { OWBActorSheet } from "./actor-sheet.js";
import { OWBCharacterModifiers } from "../dialog/character-modifiers.js";
import { OWBCharacterCreator } from "../dialog/character-creation.js";
const { renderTemplate } = foundry.applications.handlebars;
import { slideToggle } from '../utils/slide.js';

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
      generateScores: this.generateScores,
      modifiers: this._onShowModifiers,
      rollCheck: this._onRollCheck,
      rollExplore: this._onRollExploration,
      onCaret: this._onCaret,
      addLang: this._pushLang,
      removeLang: this._popLang,
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

  static async generateScores() {
    new OWBCharacterCreator(this.actor, {
      top: this.position.top + 40,
      left: this.position.left + (this.position.width - 400) / 2,
    }).render(true);
  }

  static async _onRollCheck(event, target) {
    const score = target.dataset.score;
    this.actor.rollCheck(score, { event: event });
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

  static async _pushLang(event, header) {
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

  static async _popLang(event, target) {
    event.preventDefault();
    const header = target.parentElement.parentElement;
    const table = target.dataset.array;
    const lang = header.dataset.lang;
    const itemID = header.dataset.itemId;
    const data = this.actor.system;
    let update = data[table].value.filter((el) => el.name != lang);
    let newData = {};
    newData[table] = { value: update };
    const item = this.actor.items.get(itemID);
    await item.delete();
    return this.actor.update({ system: newData });
  }

  /* -------------------------------------------- */

  async _onQtChange(event) {
    event.preventDefault();
    const itemId = event.currentTarget.closest(".item").dataset.itemId;
    const item = this.actor.items.get(itemId);
    return item.update({ "system.quantity.value": parseInt(event.target.value) });
  }

  static async _onShowModifiers(event) {
    event.preventDefault();
    new OWBCharacterModifiers(this.actor, {
      top: this.position.top + 40,
      left: this.position.left + (this.position.width - 400) / 2,
    }).render(true);
  }

  static async _onRollExploration(event, target) {
    const expl = target.dataset.exploration;
    this.actor.rollExploration(expl, { event: event });
  }

  static async _onCaret(event, target) {
    const items = target.parentElement.parentElement.querySelector(".item-list");
    if (items.style.display == "none") {
      const el = target.querySelector(".fas.fa-caret-right");
      el.classList.remove("fa-caret-right");
      el.classList.add("fa-caret-down");
      slideToggle(items);
    } else {
      const el = target.querySelector(".fas.fa-caret-down");
      el.classList.remove("fa-caret-down");
      el.classList.add("fa-caret-right");
      slideToggle(items);
    }
  }
  /**
   * Activate event listeners using the prepared sheet HTML
   * @param html {HTML}   The prepared HTML object ready to be rendered into the DOM
   */
  activateListeners(html) {
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
  }
}
