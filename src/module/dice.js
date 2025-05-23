const { renderTemplate } = foundry.applications.handlebars;
const { DialogV2 } = foundry.applications.api;

export class OWBDice {
  static digestResult(data, roll) {
    let result = {
      isSuccess: false,
      isFailure: false,
      target: data.roll.target,
      total: roll.total,
    };

    const die = roll.terms[0].total;

    switch (data.roll.type) {
      case "above":
        // SAVING THROWS
        result.isFailure = !(result.isSuccess = (roll.total >= result.target));
        break;
      case "below":
        // MORALE, EXPLORATION
        result.isFailure = !(result.isSuccess = (roll.total <= result.target));
        break;
      case "check":
        // SCORE CHECKS (1s and 20s)
        result.isFailure = !(result.isSuccess = (die === 1 || (roll.total <= result.target && die < 20)));
        break;
      case "table":
        // Reaction
        const table = data.roll.table;
        let output = Object.values(table)[0];
        for (let i = 0; i <= roll.total; i++) {
          if (table[i]) {
            output = table[i];
          }
        }
        result.details = output;
        break;
    }
    return result;
  }

  static async sendRoll({
    parts = [],
    data = {},
    title = null,
    flavor = null,
    speaker = null,
    form = null,
    chatMessage = true
  } = {}) {
    const template = "systems/owb/templates/chat/roll-result.html";

    let chatData = {
      user: game.user.id,
      speaker: speaker,
    };

    let templateData = {
      title: title,
      flavor: flavor,
      data: data,
    };

    // Optionally include a situational bonus
    if (form !== null && form.bonus.value) {
      parts.push(form.bonus.value);
    }

    const roll = await new Roll(parts.join("+"), data).evaluate();

    // Convert the roll to a chat message and return the roll
    let rollMode = game.settings.get("core", "rollMode");
    rollMode = form ? form.rollMode.value : rollMode;

    // Force blind roll (ability formulas)
    if (!form && data.roll.blindroll) {
      rollMode = game.user.isGM ? "selfroll" : "blindroll";
    }

    if (["gmroll", "blindroll"].includes(rollMode))
      chatData["whisper"] = ChatMessage.getWhisperRecipients("GM");
    if (rollMode === "selfroll") chatData["whisper"] = [game.user.id];
    if (rollMode === "blindroll") {
      chatData["blind"] = true;
      data.roll.blindroll = true;
    }

    templateData.result = OWBDice.digestResult(data, roll);

    return new Promise((resolve) => {
      roll.render().then((r) => {
        templateData.rollOWB = r;
        renderTemplate(template, templateData).then((content) => {
          chatData.content = content;
          // Dice So Nice
          if (game.dice3d) {
            game.dice3d
              .showForRoll(
                roll,
                game.user,
                true,
                chatData.whisper,
                chatData.blind
              )
              .then((displayed) => {
                if (chatMessage !== false) {
                  ChatMessage.create(chatData);
                }
                resolve(roll);
              });
          } else {
            chatData.sound = CONFIG.sounds.dice;
            if (chatMessage !== false) {
              ChatMessage.create(chatData);
            }
            resolve(roll);
          }
        });
      });
    });
  }

  static digestAttackResult(data, roll) {
    let result = {
      isSuccess: false,
      isFailure: false,
      target: "",
      total: roll.total,
    };
    result.target = data.roll.thac0;

    const targetAc = data.roll.target ? data.roll.target.actor.system.ac.value : 9;
    const targetAac = data.roll.target ? data.roll.target.actor.system.aac.value : 0;
    result.victim = data.roll.target ? data.roll.target.name : null;

    if (game.settings.get("owb", "ascendingAC")) {
      if (roll.terms[0] != 1 & (roll.total < targetAac || roll.terms[0] == 20)) {
        result.details = game.i18n.format( "OWB.messages.AttackAscendingFailure", { bonus: result.target});
        return result;
      }
      result.details = game.i18n.format("OWB.messages.AttackAscendingSuccess", {result: roll.total});
      result.isSuccess = true;
    } else {
      // B/X Historic THAC0 Calculation
      if (result.target - roll.total > targetAc) {
        result.details = game.i18n.format("OWB.messages.AttackFailure", {bonus: result.target - targetAc});
        return result;
      }
      result.isSuccess = true;
      let value = Math.clamp(result.target - roll.total, -3, 9);
      result.details = game.i18n.format("OWB.messages.AttackSuccess", {result: value,bonus: result.target - targetAc});
    }
    return result;
  }

  static async sendAttackRoll({
    parts = [],
    data = {},
    title = null,
    flavor = null,
    speaker = null,
    form = null,
  } = {}) {
    const template = "systems/owb/templates/chat/roll-attack.html";

    let chatData = {
      user: game.user.id,
      speaker: speaker,
    };

    let templateData = {
      title: title,
      flavor: flavor,
      data: data,
      config: CONFIG.OWB,
    };

    // Optionally include a situational bonus
    if (form !== null && form.bonus.value) parts.push(form.bonus.value);

    const roll = await new Roll(parts.join("+"), data).evaluate();
    const dmgRoll = await new Roll(data.roll.dmg.join("+"), data).evaluate();

    // Convert the roll to a chat message and return the roll
    let rollMode = game.settings.get("core", "rollMode");
    rollMode = form ? form.rollMode.value : rollMode;

    // Force blind roll (ability formulas)
    if (data.roll.blindroll) {
      rollMode = game.user.isGM ? "selfroll" : "blindroll";
    }

    if (["gmroll", "blindroll"].includes(rollMode))
      chatData["whisper"] = ChatMessage.getWhisperRecipients("GM");
    if (rollMode === "selfroll") chatData["whisper"] = [game.user.id];
    if (rollMode === "blindroll") {
      chatData["blind"] = true;
      data.roll.blindroll = true;
    }

    templateData.result = OWBDice.digestAttackResult(data, roll);
    return new Promise((resolve) => {
      roll.render().then((r) => {
        templateData.rollOWB = r;
        dmgRoll.render().then((dr) => {
          templateData.rollDamage = dr;
          renderTemplate(template, templateData).then((content) => {
            chatData.content = content;
            // 2 Step Dice So Nice
            if (game.dice3d) {
              game.dice3d
                .showForRoll(
                  roll,
                  game.user,
                  true,
                  chatData.whisper,
                  chatData.blind
                )
                .then(() => {
                  if (templateData.result.isSuccess) {
                    templateData.result.dmg = dmgRoll.total;
                    game.dice3d
                      .showForRoll(
                        dmgRoll,
                        game.user,
                        true,
                        chatData.whisper,
                        chatData.blind
                      )
                      .then(() => {
                        ChatMessage.create(chatData);
                        resolve(roll);
                      });
                  } else {
                    ChatMessage.create(chatData);
                    resolve(roll);
                  }
                });
            } else {
              chatData.sound = CONFIG.sounds.dice;
              ChatMessage.create(chatData);
              resolve(roll);
            }
          });
        });
      });
    });
  }

  static async RollSave({
    parts = [],
    data = {},
    skipDialog = false,
    speaker = null,
    flavor = null,
    title = null,
    chatMessage = true
  } = {}) {
    let rolled = false;
    const template = "systems/owb/templates/chat/roll-dialog.html";
    let dialogData = {
      formula: parts.join(" "),
      data: data,
      rollMode: data.roll.blindroll ? "blindroll" : game.settings.get("core", "rollMode"),
      rollModes: CONFIG.Dice.rollModes,
    };

    let rollData = {
      parts: parts,
      data: data,
      title: title,
      flavor: flavor,
      speaker: speaker,
      chatMessage: chatMessage
    };
    if (skipDialog) { return OWBDice.sendRoll(rollData); }

    const buttons = [
      {
        action: 'ok',
        label: 'OWB.Roll',
        icon: 'fas fa-dice-d20',
        callback: (html) => {
          rolled = true;
          rollData.form = html.currentTarget.querySelector("form");
          roll = OWBDice.sendRoll(rollData);
        },
      },
      {
        action: 'cancel',
        icon: 'fas fa-times',
        label: 'OWB.Cancel',
        callback: () => { },
      },
    ];

    const html = await renderTemplate(template, dialogData);
    let roll;

    return new Promise((resolve) => {
      DialogV2.wait({
        classes: ['owb'],
        window: {
          title: title ?? '',
        },
        modal: false,
        content: html,
        buttons: buttons,
        rejectClose: false,
        submit: () => {
          if (rolled) {
            resolve(roll);
          } else {
            PromiseRejectionEvent;
          }
        },
      });
    });
  }

  static async Roll({
    parts = [],
    data = {},
    skipDialog = false,
    speaker = null,
    flavor = null,
    title = null,
    chatMessage = true
  } = {}) {
    let rolled = false;
    const template = "systems/owb/templates/chat/roll-dialog.html";
    const dialogData = {
      formula: parts.join(" "),
      data: data,
      rollMode: game.settings.get("core", "rollMode"),
      rollModes: CONFIG.Dice.rollModes,
    };

    const rollData = {
      parts: parts,
      data: data,
      title: title,
      flavor: flavor,
      speaker: speaker,
      chatMessage: chatMessage
    };
    if (skipDialog) {
      return ["melee", "missile", "attack"].includes(data.roll.type)
        ? OWBDice.sendAttackRoll(rollData)
        : OWBDice.sendRoll(rollData);
    }

    const buttons = [
      {
        action: 'ok',
        label: 'OWB.Roll',
        icon: 'fas fa-dice-d20',
        callback: (html) => {
          rolled = true;
          rollData.form = html.currentTarget.querySelector("form");
          roll = ["melee", "missile", "attack"].includes(data.roll.type)
            ? OWBDice.sendAttackRoll(rollData)
            : OWBDice.sendRoll(rollData);
        },
      },
      {
        action: 'cancel',
        icon: 'fas fa-times',
        label: 'OWB.Cancel',
        callback: () => { },
      },
    ];

    const html = await renderTemplate(template, dialogData);
    let roll;

    return new Promise((resolve) => {
      DialogV2.wait({
        classes: ['owb'],
        window: {
          title: title ?? '',
        },
        modal: false,
        content: html,
        buttons: buttons,
        rejectClose: false,
        submit: () => {
          if (rolled) {
            resolve(roll);
          } else {
            PromiseRejectionEvent;
          }
        },
      });
    });
  }
}
