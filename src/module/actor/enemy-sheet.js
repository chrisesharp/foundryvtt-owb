import { OWBActorSheetVehicle } from "./vehicle-sheet.js";
const { renderTemplate } = foundry.applications.handlebars;

/**
 * Extend the basic ActorSheet with some very simple modifications
 */
export class OWBActorSheetEnemy extends OWBActorSheetVehicle {
  /**
   * Extend and override the default options used by the 5e Actor Sheet
   * @returns {Object}
   */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["owb", "sheet", "enemy", "actor"],
      template: "systems/owb/templates/actors/enemy-sheet.html",
      width: 450,
      height: 560,
      resizable: true,
      tabs: [
        {
          navSelector: ".tabs",
          contentSelector: ".sheet-body",
          initial: "attributes",
        },
      ],
    });
  }

  /**
   * Enemy creation helpers
   */
  async generateSave() {
    const choices = CONFIG.OWB.enemy_saves;
    const templateData = { choices: choices };
    const dlg = await renderTemplate("systems/owb/templates/actors/dialogs/enemy-saves.html", templateData);
    //Create Dialog window
    new Dialog({
      title: game.i18n.localize("OWB.dialog.generateSaves"),
      content: dlg,
      buttons: {
        ok: {
          label: game.i18n.localize("OWB.Ok"),
          icon: '<i class="fas fa-check"></i>',
          callback: (html) => {
            let hd = html.find('select[name="choice"]').val();
            this.actor.generateSave(hd);
          },
        },
        cancel: {
          icon: '<i class="fas fa-times"></i>',
          label: game.i18n.localize("OWB.Cancel"),
        },
      },
      default: "ok",
    }, {
      width: 250
    }).render(true);
  }

  /**
   * Activate event listeners using the prepared sheet HTML
   * @param html {HTML}   The prepared HTML object ready to be rendered into the DOM
   */
  activateListeners(html) {
    super.activateListeners(html);

    html.find(".morale-check a").click((ev) => {
      let actorObject = this.actor;
      actorObject.rollMorale({ event: ev });
    });

    html.find(".reaction-check a").click((ev) => {
      let actorObject = this.actor;
      actorObject.rollReaction({ event: ev });
    });

    // Everything below here is only needed if the sheet is editable
    if (!this.options.editable) return;

    html.find('button[data-action="generate-saves"]').click(() => this.generateSave());
  }
}
