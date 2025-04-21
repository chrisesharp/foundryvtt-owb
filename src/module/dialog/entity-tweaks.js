// eslint-disable-next-line no-unused-vars
const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

export class OWBEntityTweaks extends HandlebarsApplicationMixin(ApplicationV2) {
  static DEFAULT_OPTIONS = {
    id: 'sheet-tweaks',
    form: {
      handler: OWBEntityTweaks._onSubmitForm,
      closeOnSubmit: true,
    },
    tag: 'form',
    position: {
      width: 380,
    },
    window: {
      title: 'OWB.dialog.tweaks',
      resizable: false,
      contentClasses: ['standard-form', 'owb', 'dialog'],
    },
  };

  static PARTS = {
    body: {
      template: 'systems/owb/templates/actors/dialogs/tweaks-dialog.html',
    },
    footer: {
      template: "templates/generic/form-footer.hbs",
    },
  };
  /**
   * Construct and return the data object used to render the HTML template for this form application.
   * @return {Object}
   */
  async _prepareContext(options) {
    let data = {};
    data.system = this.options.system;
    data.isCharacter = (this.options.prototypeToken.actor.type === 'character');
    data.user = game.user;
    data.config = CONFIG.OWB;
    data.actorId = this.options.prototypeToken.actor.id;
    data.buttons= [
      { type: "submit", icon: "fa-solid fa-save", label: "SETTINGS.Save" }
    ]
    return data;
  }

  static async _onSubmitForm(event, form, formData) {
    event.preventDefault();
    // const settings = foundry.utils.expandObject(formData.object);
    const actorId = form.querySelector('div[data-actor-id').dataset.actorId;
    const actor = game.actors.get(actorId);
    await actor?.update(formData.object);
  }
}
