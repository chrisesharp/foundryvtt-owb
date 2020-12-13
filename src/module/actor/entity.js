import { OWBDice } from "../dice.js";

export class OWBActor extends Actor {
  /**
   * Extends data from base Actor class
   */

  prepareData() {
    super.prepareData();
    const data = this.data.data;

    // Compute modifiers from actor scores
    this.computeModifiers();
    this._isSlow();
    this.computeAC();
    this.computeEncumbrance();

    // Determine Initiative
    if (game.settings.get("owb", "initiative") != "group") {
      data.initiative.value = data.initiative.mod;
      if (this.data.type == "character") {
        data.initiative.value += data.scores.dex.mod;
      }
    } else {
      data.initiative.value = 0;
    }
    data.movement.encounter = data.movement.base / 3;
  }
  /* -------------------------------------------- */
  /*  Socket Listeners and Handlers
    /* -------------------------------------------- */
  getExperience(value, options = {}) {
    if (this.data.type != "character") {
      return;
    }
    let modified = Math.floor(
      value + (this.data.data.details.xp.bonus * value) / 100
    );
    return this.update({
      "data.details.xp.value": modified + this.data.data.details.xp.value,
    }).then(() => {
      const speaker = ChatMessage.getSpeaker({ actor: this });
      ChatMessage.create({
        content: game.i18n.format("OWB.messages.GetExperience", {
          name: this.name,
          value: modified,
        }),
        speaker,
      });
    });
  }

  isNew() {
    const data = this.data.data;
    if (this.data.type == "character") {
      let ct = 0;
      Object.values(data.scores).forEach((el) => {
        ct += el.value;
      });
      return ct == 0 ? true : false;
    } else if (this.data.type == "enemy") {
      let ct = 0;
      Object.values(data.saves).forEach((el) => {
        ct += el.value;
      });
      return ct == 0 ? true : false;
    }
  }

  generateSave(hd) {
    let saves = {};
    for (let i = 0; i <= hd; i++) {
      let tmp = CONFIG.OWB.enemy_saves[i];
      if (tmp) {
        saves = tmp;
      }
    }
    this.update({
      "data.saves": {
        save: {
          value: saves.st,
        }
      },
    });
  }

  /* -------------------------------------------- */
  /*  Rolls                                       */
  /* -------------------------------------------- */

  rollHP(options = {}) {
    let roll = new Roll(this.data.data.hp.hd).roll();
    return this.update({
      data: {
        hp: {
          max: roll.total,
          value: roll.total,
        },
      },
    });
  }

  rollSave(save, options = {}) {
    const label = game.i18n.localize(`OWB.saves.${save}.long`);
    const rollParts = ["1d20"];

    const data = {
      actor: this.data,
      roll: {
        type: "above",
        target: this.data.data.saves[save].value,
        magic: this.data.type === "character" ? this.data.data.scores.wis.mod : 0,
      },
      details: game.i18n.format("OWB.roll.details.save", { save: label }),
    };

    let skip = options.event && options.event.ctrlKey;

    const rollMethod = this.data.type == "character" ? OWBDice.RollSave : OWBDice.Roll;

    // Roll and return
    return rollMethod({
      event: options.event,
      parts: rollParts,
      data: data,
      skipDialog: skip,
      speaker: ChatMessage.getSpeaker({ actor: this }),
      flavor: game.i18n.format("OWB.roll.save", { save: label }),
      title: game.i18n.format("OWB.roll.save", { save: label }),
    });
  }

  rollMorale(options = {}) {
    const rollParts = ["2d6"];

    const data = {
      actor: this.data,
      roll: {
        type: "below",
        target: this.data.data.details.morale,
      },
    };

    // Roll and return
    return OWBDice.Roll({
      event: options.event,
      parts: rollParts,
      data: data,
      skipDialog: true,
      speaker: ChatMessage.getSpeaker({ actor: this }),
      flavor: game.i18n.localize("OWB.roll.morale"),
      title: game.i18n.localize("OWB.roll.morale"),
    });
  }

  rollLoyalty(options = {}) {
    const label = game.i18n.localize("OWB.roll.loyalty");
    const rollParts = ["2d6"];

    const data = {
      actor: this.data,
      roll: {
        type: "below",
        target: this.data.data.retainer.loyalty,
      },
    };

    // Roll and return
    return OWBDice.Roll({
      event: options.event,
      parts: rollParts,
      data: data,
      skipDialog: true,
      speaker: ChatMessage.getSpeaker({ actor: this }),
      flavor: label,
      title: label,
    });
  }

  rollReaction(options = {}) {
    const rollParts = ["2d6"];

    const data = {
      actor: this.data,
      roll: {
        type: "table",
        table: {
          2: game.i18n.format("OWB.reaction.Hostile", {
            name: this.data.name,
          }),
          3: game.i18n.format("OWB.reaction.Unfriendly", {
            name: this.data.name,
          }),
          6: game.i18n.format("OWB.reaction.Neutral", {
            name: this.data.name,
          }),
          9: game.i18n.format("OWB.reaction.Indifferent", {
            name: this.data.name,
          }),
          12: game.i18n.format("OWB.reaction.Friendly", {
            name: this.data.name,
          }),
        },
      },
    };

    let skip = options.event && options.event.ctrlKey;

    // Roll and return
    return OWBDice.Roll({
      event: options.event,
      parts: rollParts,
      data: data,
      skipDialog: skip,
      speaker: ChatMessage.getSpeaker({ actor: this }),
      flavor: game.i18n.localize("OWB.reaction.check"),
      title: game.i18n.localize("OWB.reaction.check"),
    });
  }

  rollCheck(score, options = {}) {
    const label = game.i18n.localize(`OWB.scores.${score}.long`);
    const rollParts = ["1d20"];

    const data = {
      actor: this.data,
      roll: {
        type: "check",
        target: this.data.data.scores[score].value,
      },

      details: game.i18n.format("OWB.roll.details.attribute", {
        score: label,
      }),
    };

    let skip = options.event && options.event.ctrlKey;

    // Roll and return
    return OWBDice.Roll({
      event: options.event,
      parts: rollParts,
      data: data,
      skipDialog: skip,
      speaker: ChatMessage.getSpeaker({ actor: this }),
      flavor: game.i18n.format("OWB.roll.attribute", { attribute: label }),
      title: game.i18n.format("OWB.roll.attribute", { attribute: label }),
    });
  }

  rollHitDice(options = {}) {
    const label = game.i18n.localize(`OWB.roll.hd`);
    const rollParts = [this.data.data.hp.hd];
    if (this.data.type == "character") {
      rollParts.push(this.data.data.scores.con.mod);
    }

    const data = {
      actor: this.data,
      roll: {
        type: "hitdice",
      },
    };

    // Roll and return
    return OWBDice.Roll({
      event: options.event,
      parts: rollParts,
      data: data,
      skipDialog: true,
      speaker: ChatMessage.getSpeaker({ actor: this }),
      flavor: label,
      title: label,
    });
  }

  rollExploration(expl, options = {}) {
    const label = game.i18n.localize(`OWB.exploration.${expl}.long`);
    const rollParts = ["1d6"];

    const data = {
      actor: this.data,
      roll: {
        type: "below",
        target: this.data.data.exploration[expl],
      },
      details: game.i18n.format("OWB.roll.details.exploration", {
        expl: label,
      }),
    };

    let skip = options.event && options.event.ctrlKey;

    // Roll and return
    return OWBDice.Roll({
      event: options.event,
      parts: rollParts,
      data: data,
      skipDialog: skip,
      speaker: ChatMessage.getSpeaker({ actor: this }),
      flavor: game.i18n.format("OWB.roll.exploration", { exploration: label }),
      title: game.i18n.format("OWB.roll.exploration", { exploration: label }),
    });
  }

  rollDamage(attData, options = {}) {
    const data = this.data.data;

    const rollData = {
      actor: this.data,
      item: attData.item,
      roll: {
        type: "damage",
      },
    };

    let dmgParts = [];
    if (!attData.roll.dmg) {
      dmgParts.push("1d6");
    } else {
      dmgParts.push(attData.roll.dmg);
    }

    // Add Str to damage
    if (attData.roll.type == "melee") {
      dmgParts.push(data.scores.str.mod);
    }

    // Damage roll
    OWBDice.Roll({
      event: options.event,
      parts: dmgParts,
      data: rollData,
      skipDialog: true,
      speaker: ChatMessage.getSpeaker({ actor: this }),
      flavor: `${attData.label} - ${game.i18n.localize("OWB.Damage")}`,
      title: `${attData.label} - ${game.i18n.localize("OWB.Damage")}`,
    });
  }

  async targetAttack(data, type, options) {
    if (game.user.targets.size > 0) {
      for (let t of game.user.targets.values()) {
        data.roll.target = t;
        await this.rollAttack(data, {
          type: type,
          skipDialog: options.skipDialog,
        });
      }
    } else {
      this.rollAttack(data, { type: type, skipDialog: options.skipDialog });
    }
  }

  rollAttack(attData, options = {}) {
    const data = this.data.data;
    const rollParts = ["1d20"];
    const dmgParts = [];
    let label = game.i18n.format("OWB.roll.attacks", {
      name: this.data.name,
    });
    if (!attData.item) {
      dmgParts.push("1d6");
    } else {
      label = game.i18n.format("OWB.roll.attacksWith", {
        name: attData.item.name,
      });
      dmgParts.push(attData.item.data.damage);
    }

    let ascending = game.settings.get("owb", "ascendingAC");
    if (ascending) {
      rollParts.push(data.thac0.bba.toString());
    }

    if (options.type == "missile") {
      rollParts.push(
        data.scores.dex.mod.toString(),
        data.thac0.mod.missile.toString(),
        data.thac0.bhb.toString()
      );
    } else if (options.type == "melee") {
      rollParts.push(
        data.scores.str.mod.toString(),
        data.thac0.mod.melee.toString(),
        data.thac0.bhb.toString()
      );
    }
    if (attData.item && attData.item.data.bonus) {
      rollParts.push(attData.item.data.bonus);
    }
    let thac0 = data.thac0.value;
    if (options.type == "melee") {
      dmgParts.push(data.scores.str.mod);
    }
    const rollData = {
      actor: this.data,
      item: attData.item,
      roll: {
        type: options.type,
        thac0: thac0,
        dmg: dmgParts,
        save: attData.roll.save,
        target: attData.roll.target,
      },
    };

    // Roll and return
    return OWBDice.Roll({
      event: options.event,
      parts: rollParts,
      data: rollData,
      skipDialog: options.skipDialog,
      speaker: ChatMessage.getSpeaker({ actor: this }),
      flavor: label,
      title: label,
    });
  }

  async applyDamage(amount = 0, multiplier = 1) {
    amount = Math.floor(parseInt(amount) * multiplier);
    const hp = this.data.data.hp;

    // Remaining goes to health
    const dh = Math.clamped(hp.value - amount, 0, hp.max);

    // Update the Actor
    return this.update({
      "data.hp.value": dh,
    });
  }

  static _valueFromTable(table, val) {
    let output;
    for (let i = 0; i <= val; i++) {
      if (table[i] != undefined) {
        output = table[i];
      }
    }
    return output;
  }

  _isSlow() {
    this.data.data.isSlow = false;
    if (this.data.type != "character") {
      return;
    }
    this.data.items.forEach((item) => {
      if (item.type == "weapon" && item.data.slow && item.data.equipped) {
        this.data.data.isSlow = true;
        return;
      }
    });
  }

  computeEncumbrance() {
    if (this.data.type != "character") {
      return;
    }
    const data = this.data.data;
    let option = game.settings.get("owb", "encumbranceOption");

    // Compute encumbrance
    let totalWeight = 0;
    let hasItems = false;
    Object.values(this.data.items).forEach((item) => {
      if (item.type == "item" && !item.data.treasure) {
        hasItems = true;
      }
      if (
        item.type == "item" &&
        (["complete", "disabled"].includes(option) || item.data.treasure)
      ) {
        totalWeight += item.data.quantity.value * item.data.weight;
      } else if (option != "basic" && ["weapon", "armor"].includes(item.type)) {
        totalWeight += item.data.weight;
      }
    });
    if (option === "detailed" && hasItems) totalWeight += 80;

    data.encumbrance = {
      pct: Math.clamped(
        (100 * parseFloat(totalWeight)) / data.encumbrance.max,
        0,
        100
      ),
      max: data.encumbrance.max,
      encumbered: totalWeight > data.encumbrance.max,
      value: totalWeight,
    };

    if (data.config.movementAuto && option != "disabled") {
      this._calculateMovement();
    }
  }

  _calculateMovement() {
    const data = this.data.data;
    let option = game.settings.get("owb", "encumbranceOption");
    let weight = data.encumbrance.value;
    let delta = data.encumbrance.max - 1600;
    if (["detailed", "complete"].includes(option)) {
      if (weight > data.encumbrance.max) {
        data.movement.base = 0;
      } else if (weight > 800 + delta) {
        data.movement.base = 30;
      } else if (weight > 600 + delta) {
        data.movement.base = 60;
      } else if (weight > 400 + delta) {
        data.movement.base = 90;
      } else {
        data.movement.base = 120;
      }
    } else if (option == "basic") {
      const armors = this.data.items.filter((i) => i.type == "armor");
      let heaviest = 0;
      armors.forEach((a) => {
        if (a.data.equipped) {
          if (a.data.type == "light" && heaviest == 0) {
            heaviest = 1;
          } else if (a.data.type == "heavy") {
            heaviest = 2;
          }
        }
      });
      switch (heaviest) {
        case 0:
          data.movement.base = 120;
          break;
        case 1:
          data.movement.base = 90;
          break;
        case 2:
          data.movement.base = 60;
          break;
      }
    }
  }

  computeAC() {
    if (this.data.type != "character") {
      return;
    }
    // Compute AC
    let baseAc = 7;
    let baseAac = 12;
    let AcShield = 0;
    let AacShield = 0;
    const data = this.data.data;
    data.aac.base = baseAac + data.scores.dex.mod;
    data.ac.base = baseAc - data.scores.dex.mod;
    const armors = this.data.items.filter((i) => i.type == "armor");
    armors.forEach((a) => {
      if (a.data.equipped && a.data.type != "shield") {
        baseAc -= a.data.ac.value;
        baseAac += a.data.aac.value;
      } else if (a.data.equipped && a.data.type == "shield") {
        AcShield -= a.data.ac.value;
        AacShield += a.data.aac.value;
      }
    });
    data.aac.value = baseAac + data.scores.dex.mod + AacShield + data.aac.mod;
    data.ac.value = baseAc - data.scores.dex.mod - AcShield - data.ac.mod;
    data.ac.shield = AcShield;
    data.aac.shield = AacShield;
  }

  computeModifiers() {
    if (this.data.type != "character") {
      return;
    }
    const data = this.data.data;

    const standard = {
      0: -3,
      3: -3,
      4: -2,
      6: -1,
      9: 0,
      13: 1,
      16: 2,
      18: 3,
    };
    data.scores.str.mod = OWBActor._valueFromTable(
      standard,
      data.scores.str.value
    );
    data.scores.int.mod = OWBActor._valueFromTable(
      standard,
      data.scores.int.value
    );
    data.scores.dex.mod = OWBActor._valueFromTable(
      standard,
      data.scores.dex.value
    );
    data.scores.cha.mod = OWBActor._valueFromTable(
      standard,
      data.scores.cha.value
    );
    data.scores.wis.mod = OWBActor._valueFromTable(
      standard,
      data.scores.wis.value
    );
    data.scores.con.mod = OWBActor._valueFromTable(
      standard,
      data.scores.con.value
    );

    // TODO: Proper computation of BHB 
    data.thac0.bhb = data.details.rank - 1;

    const capped = {
      0: -2,
      3: -2,
      4: -1,
      6: -1,
      9: 0,
      13: 1,
      16: 1,
      18: 2,
    };
    data.scores.dex.init = OWBActor._valueFromTable(
      capped,
      data.scores.dex.value
    );
    data.scores.cha.npc = OWBActor._valueFromTable(
      capped,
      data.scores.cha.value
    );
    data.scores.cha.loyalty = data.scores.cha.mod + 7;

    const fluent = {
      0: 0,
      16: 1,
      17: 2,
      18: 3,
    };
    data.languages.fluent = OWBActor._valueFromTable(
      fluent,
      data.scores.int.value
    );

    const basic = {
      0: 0,
      16: 2,
      17: 4,
      18: 6,
    };
    data.languages.basic = OWBActor._valueFromTable(
      basic,
      data.scores.int.value
    );
  }
}
