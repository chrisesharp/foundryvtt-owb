const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

export class OWBCharacterModifiers extends HandlebarsApplicationMixin(ApplicationV2) {
  static DEFAULT_OPTIONS = {
    id: 'sheet-modifiers',
    classes: ['owb', 'dialog', 'modifiers'],
    form: {
      closeOnSubmit: true,
    },
    tag: 'form',
    position: {
      width: 240,
    },
    window: {
      title: 'Modifiers',
      resizable: false,
      contentClasses: ['owb', 'dialog', 'modifiers'],
    },
  };
  static PARTS = {
    body: {
      template: 'systems/owb/templates/actors/dialogs/modifiers-dialog.html',
    },
  };

  async _prepareContext(options) {
    let data = {};
    data.user = game.user;
    data.system = this.options.prototypeToken.actor.system;
    return data;
  }
}
