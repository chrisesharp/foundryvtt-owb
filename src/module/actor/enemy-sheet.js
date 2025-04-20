import { OWBActorSheetVehicle } from "./vehicle-sheet.js";
const { renderTemplate } = foundry.applications.handlebars;
const { DialogV2 } = foundry.applications.api;

/**
 * Extend the basic ActorSheet with some very simple modifications
 */
export class OWBActorSheetEnemy extends OWBActorSheetVehicle {
  static DEFAULT_OPTIONS = {
    classes: ['owb', 'sheet', 'actor', 'enemy'],
    position: {
      width: 450,
      height: 560,
    },
    actions: {
      generateSaves: this.generateSave,
      moraleCheck: this.moraleCheck,
      reactionCheck: this.reactionCheck
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
      template: 'systems/owb/templates/actors/partials/enemy-header.hbs',
    },
    tabs: {
      template: 'systems/owb/templates/actors/partials/actor-nav.hbs',
    },
    attributes: {
      template: 'systems/owb/templates/actors/partials/enemy-attributes.hbs',
    },
    notes: {
      template: 'systems/owb/templates/actors/partials/vehicle-notes.hbs',
    },
  };

  /**
   * Enemy creation helpers
   */
  static async generateSave() {
    const choices = CONFIG.OWB.enemy_saves;
    const templateData = { choices: choices };
    const dlg = await renderTemplate("systems/owb/templates/actors/dialogs/enemy-saves.html", templateData);
    const buttons = [
      {
        action: 'ok',
        label: 'OWB.Ok',
        icon: 'fas fa-check',
        callback: (html) => {
          const hd = html.currentTarget.querySelector('select[name="choice"]').value;
          this.actor.generateSave(hd);
        },
      },
      {
        action: 'cancel',
        icon: 'fas fa-times',
        label: 'OWB.Cancel',
      },
    ];
    return DialogV2.wait({
      classes: ['owb'],
      window: {
        title: 'Choose Language',
      },
      modal: false,
      content: dlg,
      buttons: buttons,
      rejectClose: false,
      submit: (result) => {
        return result;
      },
    });
  }

  static async moraleCheck(event) {
    this.actor.rollMorale({ event: event });
  }

  static async reactionCheck(event) {
    this.actor.rollReaction({ event: event });
  }
}
