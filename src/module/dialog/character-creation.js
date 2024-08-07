import { OWBActor } from '../actor/entity.js';
import { OWBDice } from "../dice.js";

export class OWBCharacterCreator extends FormApplication {
  static get defaultOptions() {
    const options = super.defaultOptions;
    options.classes = ["owb", "dialog", "creator"],
      options.id = 'character-creator';
    options.template = 'systems/owb/templates/actors/dialogs/character-creation.html';
    options.width = 235;
    return options;
  }

  /* -------------------------------------------- */

  /**
   * Add the Entity name into the window title
   * @type {String}
   */
  get title() {
    return `${this.object.name}: ${game.i18n.localize('OWB.dialog.generator')}`;
  }

  /* -------------------------------------------- */

  /**
   * Construct and return the data object used to render the HTML template for this form application.
   * @return {Object}
   */
  getData() {
    let data = this.object;
    data.user = game.user;
    data.config = CONFIG.OWB;
    data.counters = {
      str: 0,
      wis: 0,
      dex: 0,
      int: 0,
      cha: 0,
      con: 0,
      gold: 0
    }
    data.stats = {
      sum: 0,
      avg: 0,
      std: 0
    }
    return data;
  }

  /* -------------------------------------------- */

  doStats(ev) {
    const list = $(ev.currentTarget).closest('.attribute-list');
    const values = [];
    list.find('.score-value').each((i, s) => {
      if (s.value != 0) {
        values.push(parseInt(s.value));
      }
    })

    const n = values.length;
    const sum = values.reduce((a, b) => a + b);
    const mean = parseFloat(sum) / n;
    const std = Math.sqrt(values.map(x => Math.pow(x - mean, 2)).reduce((a, b) => a + b) / n);

    const stats = list.siblings('.roll-stats');
    stats.find('.sum').text(sum);
    stats.find('.avg').text(Math.round(10 * sum / n) / 10);
    stats.find('.std').text(Math.round(100 * std) / 100);

    if (n >= 6) {
      $(ev.currentTarget).closest('form').find('button[type="submit"]').removeAttr('disabled');
    }

    this.object.stats = {
      sum: sum,
      avg: Math.round(10 * sum / n) / 10,
      std: Math.round(100 * std) / 100
    }
  }

  rollScore(score, options = {}) {
    // Increase counter
    this.object.counters[score]++;

    const label = score != "gold" ? game.i18n.localize(`OWB.scores.${score}.long`) : "Gold";
    const rollParts = ["3d6"];
    const data = {
      roll: {
        type: "result"
      }
    };
    // Roll and return
    return OWBDice.Roll({
      event: options.event,
      parts: rollParts,
      data: data,
      skipDialog: true,
      speaker: ChatMessage.getSpeaker({ actor: this }),
      flavor: game.i18n.format('OWB.dialog.generateScore', { score: label, count: this.object.counters[score] }),
      title: game.i18n.format('OWB.dialog.generateScore', { score: label, count: this.object.counters[score] }),
    });
  }

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);
    html.find('a.score-roll').click((ev) => {
      const el = ev.currentTarget.parentElement.parentElement;
      const score = el.dataset.score;
      this.rollScore(score, { event: ev }).then(r => {
        $(el).find('input').val(r.total).trigger('change');
      });
    });

    html.find('a.gold-roll').click((ev) => {
      const el = ev.currentTarget.parentElement.parentElement.parentElement;
      this.rollScore("gold", { event: ev }).then(r => {
        $(el).find('.gold-value').val(r.total);
      });
    });

    html.find('input.score-value').change(ev => {
      this.doStats(ev);
    })
  }

  async _onSubmit(event, { updateData = null, preventClose = false, preventRender = false } = {}) {
    super._onSubmit(event, { updateData: updateData, preventClose: preventClose, preventRender: preventRender });
    // Generate gold
    const gold = event.target.elements.namedItem('gold').value;
    const itemData = {
      name: "money",
      type: "item",
      img: "systems/owb/assets/default/ability.png",
      system: {
        weight: 0,
        quantity: {
          value: gold
        }
      }
    };
    this.object.createEmbeddedDocuments("Item",[itemData]);
  }
  /**
   * This method is called upon form submission after form data is validated
   * @param event {Event}       The initial triggering submission event
   * @param formData {Object}   The object of validated form data with which to update the object
   * @private
   */
  async _updateObject(event, formData) {
    event.preventDefault();
    // Update the actor
    this.object.update(formData);
    // Re-draw the updated sheet
    this.object.sheet.render(true);
  }
}
