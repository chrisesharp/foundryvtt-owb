import { OWBDice } from "../dice.js";
const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

export class OWBCharacterCreator  extends HandlebarsApplicationMixin(ApplicationV2) {
  #counters = {
    str: 0,
    wis: 0,
    dex: 0,
    int: 0,
    cha: 0,
    con: 0,
    gold: 0
  };

  #stats = {
    sum: 0,
    avg: 0,
    std: 0
  };

  static DEFAULT_OPTIONS = {
    id: 'character-creator',
    classes: ['owb', 'dialog', 'creator'],
    actions: {
      submit: OWBCharacterCreator._onSubmit,
      scoreRoll: OWBCharacterCreator._scoreRoll,
      goldRoll: OWBCharacterCreator._goldRoll,
    },
    form: {
      closeOnSubmit: true,
    },
    tag: 'form',
    position: {
      width: 235,
    },
    window: {
      resizable: false,
      contentClasses: ['owb', 'dialog', 'creator'],
    },
  };

  static PARTS = {
    body: {
      template: 'systems/owb/templates/actors/dialogs/character-creation.html',
    },
  };


  /* -------------------------------------------- */

  /**
   * Add the Entity name into the window title
   * @type {String}
   */
  get title() {
    return `${this.options.prototypeToken.actor.name}: ${game.i18n.localize('OWB.dialog.generator')}`;
  }

  async _prepareContext(options) {
    let data = {};
    data.user = game.user;
    data.actor = this.options.prototypeToken.actor;
    data.system = this.options.system;
    data.config = CONFIG.OWB;
    data.counters = this.#counters;
    data.stats = this.#stats;
    return data;
  }

  /* -------------------------------------------- */

  async doStats(_ev, target) {
    const list = target.closest('.attribute-list');
    const values = [];
    list.querySelectorAll('.score-value').forEach( (s) => {
      if (s.value != 0) {
        values.push(parseInt(s.value));
      }
    })

    const n = values.length;
    const sum = values.reduce((a, b) => a + b);
    const mean = parseFloat(sum) / n;
    const std = Math.sqrt(values.map(x => Math.pow(x - mean, 2)).reduce((a, b) => a + b) / n);

    const stats = list.parentElement.querySelector('.roll-stats');
    stats.querySelector('.sum').textContent = sum;
    stats.querySelector('.avg').textContent = Math.round(10 * sum / n) / 10;
    stats.querySelector('.std').textContent = Math.round(100 * std) / 100;

    if (n >= 6) {
      target.closest('form').querySelector('button[type="submit"]').removeAttribute('disabled');
    }

    this.updateStats(n, sum, std);
  }

  updateStats(n, sum, std) {
    this.#stats = {
      sum: sum,
      avg: Math.round(10 * sum / n) / 10,
      std: Math.round(100 * std) / 100
    }
  }

  rollScore(score, options = {}) {
    // Increase counter
    this.#counters[score]++;

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
      flavor: game.i18n.format('OWB.dialog.generateScore', { score: label, count: this.#counters[score] }),
      title: game.i18n.format('OWB.dialog.generateScore', { score: label, count: this.#counters[score] }),
    });
  }

  static async _scoreRoll(event, target) {
    const el = target.parentElement.parentElement;
    const score = el.dataset.score;
    const roll = await this.rollScore(score, { event: event });
    el.querySelector('input').value = roll.total;
    this.doStats(event, target);
  }

  static async _goldRoll(event, target) {
    const el = target.parentElement.parentElement.parentElement;
    const roll = await this.rollScore("gold", { event: event });
    el.querySelector('.gold-value').value = roll.total;
  }

  static async _onSubmit(_event, target) {
    const actorId = target.dataset.actorId;
    const gold = target.parentElement.parentElement.querySelector('#gold').value;
    const scores = {
      str: { value: 0},
      int: { value: 0},
      wis: { value: 0},
      dex: { value: 0},
      con: { value: 0},
      cha: { value: 0},
    };
    const list = target.parentElement.parentElement.querySelector('.attribute-list');
    list.querySelectorAll('.score-value').forEach( (s) => {
      scores[s.name].value = s.value;
    })
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
    const actor = game.actors.get(actorId);
    await actor.update({system:{scores: scores}});
    await actor.createEmbeddedDocuments("Item",[itemData]);
    this.close();
  }
}
