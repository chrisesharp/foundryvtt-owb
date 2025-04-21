import { OWBPartyXP } from "./party-xp.js";
const { renderTemplate } = foundry.applications.handlebars;
const { ApplicationV2, DialogV2, HandlebarsApplicationMixin } = foundry.applications.api;

export class OWBPartySheet extends HandlebarsApplicationMixin(ApplicationV2) {
  #party = [];

  static DEFAULT_OPTIONS = {
    id: 'party-sheet',
    actions: {
      selectActors: OWBPartySheet._selectActors,
      showActor: OWBPartySheet._showActor,
    },
    form: {
      closeOnSubmit: true,
    },
    tag: 'form',
    position: {
      width: 280,
      height: 400,
    },
    window: {
      title: 'OWB.dialog.partysheet',
      resizable: true,
      contentClasses: ['standard-form', 'owb', 'dialog', 'party-sheet'],
    },
  };

  static PARTS = {
    body: {
      template: 'systems/owb/templates/apps/party-sheet.html',
    },
    footer: {
      template: "templates/generic/form-footer.hbs",
    },
  };

  async _prepareContext(options) {
    this.#party = this._preparePartyData();
    const data = {
      party: this.#party,
      config: CONFIG.OWB,
      user: game.user,
      settings: settings
    };
    return data;
  }

  _preparePartyData() {
    const actors = game.actors?.filter((a) => { 
      const isMember = a.getFlag('owb', 'party');
      return isMember === true;
    }) ?? [];
    return actors;
  }

  static async _selectActors(event, target) {
    const actors = game.actors.filter((e)=> e).sort((a, b) => b.prototypeToken.disposition - a.prototypeToken.disposition);
    const template = "systems/owb/templates/apps/party-select.html";
    const templateData = {
      actors: actors
    }
    const content = await renderTemplate(template, templateData);
    await DialogV2.wait({
      classes: ["owb","dialog","party-select"],
      window: {
        title: 'OWB.dialog.selectActors',
      },
      content: content,
      buttons: [
        {
          icon: 'fas fa-save',
          label: 'OWB.Update',
          action: 'check',
          callback: async (html) => {
            const checks = Array.from(html.currentTarget.querySelectorAll("input[data-action='select-actor']"));
            await Promise.all(checks.map(async (c) => {
              const actorId = c.dataset.actorId;
              const actor = game.actors.get(actorId);
              const isChecked = c.checked;
              await actor.setFlag('owb', 'party', isChecked );
            }));
          },
        }
      ],
    });
    this.render(true);
  }

  static async _showActor(event, target) {
    const actorId = target.dataset.actorId;
    game.actors.get(actorId).sheet.render(true);
  }
}
