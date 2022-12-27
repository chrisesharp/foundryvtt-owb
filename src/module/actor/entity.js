import { OWBDice } from "../dice.js";

export class OWBActor extends Actor {
  /**
   * Extends data from base Actor class
   */

  prepareData() {
    super.prepareData();
    const data = this.system;

    if (this.type === "character") this.prepareCharacterData(this.system);
    // Compute modifiers from actor scores
    this.computeModifiers();
    this.computeAC();
    this.computeEncumbrance();

    // Determine Initiative
    if (game.settings.get("owb", "initiative") != "group") {
      data.initiative.value = data.initiative.mod;
      if (this.type == "character") {
        data.initiative.value += data.scores.dex.mod;
      }
    } else {
      data.initiative.value = 0;
    }
    data.movement.encounter = Math.floor(data.movement.base / 3);
  }

  prepareCharacterData(data) {
    let [items, weapons, armors, abilities, languages] = this.items.reduce(
      (arr, item) => {
        // Classify items into types
        if (item.type === "item") arr[0].push(item);
        else if (item.type === "weapon") arr[1].push(item);
        else if (item.type === "armor") arr[2].push(item);
        else if (item.type === "ability") arr[3].push(item);
        else if (item.type === "language") arr[4].push(item);
        return arr;
      },
      [[], [], [], [], []]
    );

    // Assign and return
    data.owned = {
      items: items,
      weapons: weapons,
      armors: armors,
    };
    data.abilities = abilities;
    data.languages.value = languages;
  }
  /* -------------------------------------------- */
  /*  Socket Listeners and Handlers
    /* -------------------------------------------- */
  getExperience(value, options = {}) {
    if (this.type != "character") {
      return;
    }
    let modified = Math.floor(value + (this.system.details.xp.bonus * value) / 100);
    return this.update({"data.details.xp.value": modified + this.system.details.xp.value}).then(() => {
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
    const data = this.system;
    if (this.type == "character") {
      let ct = 0;
      Object.values(data.scores).forEach((el) => {
        ct += el.value;
      });
      return ct == 0 ? true : false;
    } else if (this.type == "enemy") {
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
    const roll = new Roll(this.system.hp.hd).roll();
    return this.update({
      data: {
        hp: {
          max: roll.total,
          value: roll.total,
        },
      },
    });
  }

  rollLanguageSave(language, options = {}) {
    let target = this.system.saves["save"].value
    let speakerRank = 1;
    let speakerFluency = null;
    let mod = 0;
    let bonus = 0;
    if (game.user.targets.size > 0) {
      for (let t of game.user.targets.values()) {
        speakerRank = t.actor.system.details.rank;
        let speakerLangs = t.actor.system.languages.value.filter((el) => el.name === language.name);
        if (speakerLangs.length > 0) {
          speakerFluency = speakerLangs[0].system.fluency
        }
      }
    }
    if (language.fluency === "F") {
      switch (speakerFluency) {
          case "F":
            mod = -2;
            break;
          case "M":
            mod = -1;
            break;
          case "B":
            mod = 0;
            bonus = 5
            break;
          default:
            bonus = 10;
        }
    } else if (language.fluency === "M") {
      switch (speakerFluency) {
        case "F":
          mod = -3;
          break;
        case "M":
          mod = -2;
          break;
        case "B":
          mod = -1;
          bonus = 1;
          break;
        default:
          bonus = 5;
      }
    } else if (language.fluency === "B") {
      switch (speakerFluency) {
        case "F":
          mod = -4;
          break;
        case "M":
          mod = -3;
          break;
        case "B":
          mod = -2;
          break;
        default:
          bonus = 1;
      }
    }
    
    const label = game.i18n.localize(`OWB.Language`) + " (" + language.name + ")";
    const rollParts = ["1d20", speakerRank * mod, bonus];

    const data = {
      actor: this.system,
      roll: {
        type: "above",
        target: target,
      },
      details: game.i18n.format("OWB.roll.details.save", { save: label }),
    };

    let skip = options?.event?.ctrlKey || options.fastForward;
    // let skip = true;

    const rollMethod = this.type == "character" ? OWBDice.RollSave : OWBDice.Roll;

    // Roll and return
    return rollMethod({
      event: options.event,
      parts: rollParts,
      data: data,
      skipDialog: skip,
      speaker: ChatMessage.getSpeaker({ actor: this }),
      flavor: game.i18n.format("OWB.roll.language", { lang: label }),
      title: game.i18n.format("OWB.roll.language", { lang: label }),
      chatMessage: options.chatMessage
    });
  }

  rollSave(save, options = {}) {
    const label = game.i18n.localize(`OWB.saves.${save}.long`);
    const rollParts = ["1d20"];

    const data = {
      actor: this.system,
      roll: {
        type: "above",
        target: this.system.saves[save].value,
      },
      details: game.i18n.format("OWB.roll.details.save", { save: label }),
    };

    let skip = options?.event?.ctrlKey || options.fastForward;

    const rollMethod = this.type == "character" ? OWBDice.RollSave : OWBDice.Roll;

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
      actor: this.system,
      roll: {
        type: "below",
        target: this.system.details.morale,
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
      chatMessage: options.chatMessage
    });
  }

  rollReaction(options = {}) {
    const rollParts = ["2d6"];
    const data = {
      actor: this.system,
      roll: {
        type: "table",
        table: {
          2: game.i18n.format("OWB.reaction.Hostile", {
            name: this.name,
          }),
          3: game.i18n.format("OWB.reaction.Unfriendly", {
            name: this.name,
          }),
          6: game.i18n.format("OWB.reaction.Neutral", {
            name: this.name,
          }),
          9: game.i18n.format("OWB.reaction.Indifferent", {
            name: this.name,
          }),
          12: game.i18n.format("OWB.reaction.Friendly", {
            name: this.name,
          }),
        },
      },
    };

    let skip = options?.event?.ctrlKey || options.fastForward;

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
      actor: this.system,
      roll: {
        type: "check",
        target: this.system.scores[score].value,
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
    const rollParts = [this.system.hp.hd];
    if (this.type == "character") {
      rollParts.push(this.system.scores.con.mod);
    }

    const data = {
      actor: this.system,
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
      actor: this.system,
      roll: {
        type: "below",
        target: this.system.exploration[expl],
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
    const data = this.system;

    const rollData = {
      actor: this.system,
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

  async rollAttack(attData, options = {}) {
    const burst = (attData.burst || attData.suppress) ? "+2" : "0";
    const data = this.system;
    const rollParts = ["1d20"];
    const dmgParts = [];
    let label = game.i18n.format("OWB.roll.attacks", {name: this.name});

    if (!attData.item) {
      dmgParts.push("1d3");
    } else {
      label = game.i18n.format("OWB.roll.attacksWith", {name: attData.item.name});
      dmgParts.push(attData.item.system.damage);
    }

    const ascending = game.settings.get("owb", "ascendingAC");
    if (ascending) {
      rollParts.push(data.thac0.bba.toString());
    }

    if (options.type != "melee") {
      let range = 0;
      switch (options.type) {
        case "medium":
          range = -2;
          break;
        case "long":
          range = -4;
          break;
        case "extreme":
          range = -6;
          break;
      }
      options.type = "missile";
      rollParts.push(
        data.scores.dex.mod.toString(),
        data.thac0.mod.missile.toString(),
        data.thac0.bhb.toString(),
        range.toString(),
        burst,
      );

    } else {
      rollParts.push(
        data.scores.str.mod.toString(),
        data.thac0.mod.melee.toString(),
        data.thac0.bhb.toString()
      );
    }
    let thac0 = data.thac0.value;
    if (options.type == "melee") {
      dmgParts.push(data.scores.str.mod);
    }

    if (attData.ammo) {
      if (attData.ammo.system.quantity.value > 0) {
        this.decreaseQuantity(attData.ammo, attData.burst, attData.suppress);
      } else {
        const messageContent = `<b>OUT OF AMMO!</b><p>You need to reload with more <b>${attData.ammo.calibre}</b> rounds</p>`;
        const chatData = {
            user: game.user.id,
            speaker: ChatMessage.getSpeaker({ actor: this }),
            content: messageContent
        };
        return ChatMessage.create(chatData);
      }
    }

    const rollData = {
      actor: this.system,
      item: attData.item,
      roll: {
        type: options.type,
        thac0: thac0,
        dmg: dmgParts,
        save: attData.roll.save,
        target: attData.roll.target,
        suppress: attData.suppress,
        burst: attData.burst,
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

  decreaseQuantity(item, burst, suppressive) {
    const max = item.system.quantity.max;
    let qty = item.system.quantity.value;

    if (suppressive) {
      qty = 0;
    } else if (burst) {
      qty -= Math.floor(max / 3);
    } else {
      qty -= 1;
    }
    qty = Math.max(0, qty);
    item.update({system: {quantity: {value: qty}}});
  }

  async applyDamage(amount = 0, multiplier = 1) {
    amount = Math.floor(parseInt(amount) * multiplier);
    const hp = this.system.hp;

    // Remaining goes to health
    const dh = Math.clamped(hp.value - amount, 0, hp.max);

    // Update the Actor
    return this.update({"system.hp.value": dh});
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

  computeEncumbrance() {
    if (!["character","enemy"].includes(this.type)) {
      return;
    }
    const data = this.system;
    let option = game.settings.get("owb", "encumbranceOption");
    const items = [...this.items.values()];
    // Compute encumbrance
    const hasItems = items.every((item) => {
      return item.type != "item";
    });

    let totalWeight = items.reduce((acc, item) => {
      if (
        item.type === "item" &&
        (["complete", "disabled"].includes(option))
      ) {
        return acc + item.system.quantity.value * item.system.weight;
      }
      if (["weapon", "armor"].includes(item.type)) {
        return acc + item.system.weight;
      }
      return acc;
    }, 0);

    const max = data.encumbrance.max;

    let steps = ["complete"].includes(option) ? [(100 * 400) / max, (100 * 600) / max, (100 * 800) / max] : [];

    data.encumbrance = {
      pct: Math.clamped((100 * parseFloat(totalWeight)) / max, 0, 100),
      max: max,
      encumbered: totalWeight > data.encumbrance.max,
      value: totalWeight,
      steps: steps,
    };

    if (data.config.movementAuto && option != "disabled") {
      this._calculateMovement();
    }
  }

  _calculateMovement() {
    const data = this.system;
    const option = game.settings.get("owb", "encumbranceOption");
    const weight = data.encumbrance.value;
    const delta = data.encumbrance.max - 250;
    if (["complete"].includes(option)) {
      if (weight > data.encumbrance.max) {
        data.movement.base = 10;
      } else if (weight > 150 + delta) {
        data.movement.base = 30;
      } else if (weight > 100 + delta) {
        data.movement.base = 60;
      } else if (weight > 25 + delta) {
        data.movement.base = 90;
      } else {
        data.movement.base = 120;
      }
    }
    if (this.type === "character") {
      data.movement.base = Math.min(120, data.movement.base + 30);
    }
  }

  computeAC() {
    if (this.type != "character") {
      return;
    }
    // Compute AC
    let baseAc = 7;
    let baseAac = 12;
    let AcShield = 0;
    let AacShield = 0;
    const data = this.system;
    data.aac.base = baseAac + data.scores.dex.mod;
    data.ac.base = baseAc - data.scores.dex.mod;
    const armors = this.items.filter((i) => i.type === "armor");
    armors.forEach((a) => {
      const armorData = a.system;
      if (armorData.equipped) {
        baseAc -= armorData.ac.value;
        baseAac += armorData.aac.value;
      }
    });
    data.aac.value = baseAac + data.scores.dex.mod + AacShield + data.aac.mod;
    data.ac.value = baseAc - data.scores.dex.mod - AcShield - data.ac.mod;
    data.ac.shield = AcShield;
    data.aac.shield = AacShield;
  }

  computeModifiers() {
    const data = this.system;
    if (this.type != "character") {
      if (this.type === "enemy") {
        data.thac0.bhb = data.details.rank - 1;
      }
      return;
    }

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
    data.scores.str.mod = OWBActor._valueFromTable(standard, data.scores.str.value);
    data.scores.int.mod = OWBActor._valueFromTable(standard, data.scores.int.value);
    data.scores.dex.mod = OWBActor._valueFromTable(standard, data.scores.dex.value);
    data.scores.cha.mod = OWBActor._valueFromTable(standard, data.scores.cha.value);
    data.scores.wis.mod = OWBActor._valueFromTable(standard, data.scores.wis.value);
    data.scores.con.mod = OWBActor._valueFromTable(standard, data.scores.con.value);

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
    data.scores.dex.init = OWBActor._valueFromTable(capped, data.scores.dex.value);
    data.scores.cha.npc = OWBActor._valueFromTable(capped, data.scores.cha.value);
    data.scores.cha.loyalty = data.scores.cha.mod + 7;

    const fluent = {
      0: 0,
      16: 1,
      17: 2,
      18: 3,
    };
    data.languages.fluent = OWBActor._valueFromTable(fluent, data.scores.int.value);

    const basic = {
      0: 0,
      16: 2,
      17: 4,
      18: 6,
    };
    data.languages.basic = OWBActor._valueFromTable(basic, data.scores.int.value);
  }
}
