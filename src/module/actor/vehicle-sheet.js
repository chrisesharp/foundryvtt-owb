import { OWBActorSheet } from "./actor-sheet.js";
const { renderTemplate } = foundry.applications.handlebars;
const { DialogV2 } = foundry.applications.api;
const { TextEditor } = foundry.applications.ux;

/**
 * Extend the basic ActorSheet with some very simple modifications
 */
export class OWBActorSheetVehicle extends OWBActorSheet {
  static DEFAULT_OPTIONS = {
    classes: ['owb', 'sheet', 'actor', 'vehicle'],
    position: {
      width: 450,
      height: 530,
    },
    actions: {
      reset: this._resetCounters,
      rollHP: this._onRollHitPoints,
      createItem: this._createItem
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
      template: 'systems/owb/templates/actors/partials/vehicle-header.hbs',
    },
    tabs: {
      template: 'systems/owb/templates/actors/partials/actor-nav.hbs',
    },
    attributes: {
      template: 'systems/owb/templates/actors/partials/vehicle-attributes.hbs',
    },
    notes: {
      template: 'systems/owb/templates/actors/partials/vehicle-notes.hbs',
    },
  };

  /** @override */
  _configureRenderOptions(options) {
    super._configureRenderOptions(options);
    // Not all parts always render
    options.parts = ['header', 'tabs', 'attributes', 'notes'];
  }


  async _prepareContext(options) {
    const data = await super._prepareContext(options);
    data.config.morale = game.settings.get("owb", "morale");
    data.isNew = this.actor.isNew();
    data.isVehicle = true
    return this._prepareItems(data);
  };

  async _chooseItemType(choices = ["weapon", "armor", "gear"]) {
    const templateData = { types: choices };
    const buttons = [
      {
        action: 'ok',
        label: 'OWB.Ok',
        icon: 'fas fa-check',
        callback: (html) => {
          return {
            type: html.currentTarget.querySelector('select[name="type"]').value,
            name: html.currentTarget.querySelector('input[name="name"]').value,
          };
        },
      },
      {
        action: 'cancel',
        icon: 'fas fa-times',
        label: 'OWB.Cancel',
      },
    ];
    const dlg = await renderTemplate("systems/owb/templates/items/entity-create.html", templateData);
    return new Promise((resolve) => {
      DialogV2.wait({
        classes: ['owb'],
        window: {
          title: 'OWB.dialog.createItem',
        },
        modal: false,
        content: dlg,
        buttons: buttons,
        rejectClose: false,
        submit: (result) => {
          resolve(result);
        },
      });
    });
  }

  static async _resetCounters() {
    const weapons = this.actor.items.filter(i => i.type === 'weapon');
    for (let wp of weapons) {
      const item = this.actor.items.get(wp.id);
      await item.update({
        system: {
          counter: {
            value: parseInt(wp.system.counter.max),
          },
        },
      });
    }
  }

  static async _createItem(event, target) {
    const header = target;
    const type = header.dataset.type;

    // item creation helper func
    let createItem = function (type, name = `New ${type.capitalize()}`) {
      const itemData = {
        name: name ? name : `New ${type.capitalize()}`,
        type: type,
        system: foundry.utils.duplicate(header.dataset),
      };
      delete itemData.system["type"];
      return itemData;
    };

    // Getting back to main logic
    if (type == "choice") {
      const choices = {};
      header.dataset.choices.split(",").forEach((i)=> choices[i] = i);
      this._chooseItemType(choices).then((dialogInput) => {
        const itemData = createItem(dialogInput.type, dialogInput.name);
        this.actor.createEmbeddedDocuments("Item",[itemData], {});
      });
      return;
    }
    const itemData = createItem(type);
    return this.actor.createEmbeddedDocuments("Item",[itemData], {});
  }

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

  static async _onRollHitPoints(event) {
    this.actor.rollHP({ event: event });
  }
}
