export class OWBCombat {
  static  async rollInitiative(combat, data) {
    // Check groups
    const groups = {};
    combat.data.combatants.forEach((cbt) => {
      const group = cbt.getFlag("owb","group");
      groups[group] = { present: true };
    });

    // Roll init
    Object.keys(groups).forEach( (group) => {
      const roll =  new Roll("1d6").evaluate({async:false});
      roll.toMessage({flavor: game.i18n.format('OWB.roll.initiative', { group: CONFIG["OWB"].colors[group] })});
      groups[group].initiative = roll.total;
    });

    // Set init
    combat.data.combatants.forEach((cbt)=> {
      const group = cbt.getFlag("owb","group");
      const initiative = groups[group].initiative;
      combat.setInitiative(cbt.id, initiative);
    });
    combat.setupTurns();
  }

  static async resetInitiative(combat, data) {
    const reroll = game.settings.get("owb", "rerollInitiative");
    if (!["reset", "reroll"].includes(reroll)) {
      return;
    }
    combat.resetAll();
  }

  static async individualInitiative(combat, data) {
    const updates = [];
    const messages = [];
    combat.data.combatants.forEach((c, i) => {
      // This comes from foundry.js, had to remove the update turns thing
      // Roll initiative
      const cf = combat._getInitiativeFormula(c);
      const roll = combat._getInitiativeRoll(c, cf);
      let value = roll.total;
      if (combat.settings.skipDefeated && c.defeated) {
        value = -790;
      }
      updates.push({ id: c.id, initiative: value });

      // Determine the roll mode
      let rollMode = game.settings.get("core", "rollMode");
      if ((c.token.hidden || c.hidden) && (rollMode === "roll")) rollMode = "gmroll";

      // Construct chat message data
      let messageData =foundry.utils.mergeObject({
        speaker: {
          scene: canvas.scene.id,
          actor: c.actor ? c.actor.id : null,
          token: c.token.id,
          alias: c.token.name
        },
        flavor: game.i18n.format('OWB.roll.individualInit', { name: c.token.name })
      }, {});
      const chatData = roll.toMessage(messageData, { rollMode, create: false });

      if (i > 0) chatData.sound = null;   // Only play 1 sound for the whole set
      messages.push(chatData);
    });
    await combat.updateEmbeddedDocuments("Combatant", updates);
    await CONFIG.ChatMessage.entityClass.create(messages);
    data.turn = 0;
  }

  static format(object, html, user) {
    html.find(".initiative").each((_, span) => {
      span.innerHTML = (span.innerHTML == "-789.00") ? '<i class="fas fa-weight-hanging"></i>' : span.innerHTML;
      span.innerHTML =  (span.innerHTML == "-790.00") ? '<i class="fas fa-dizzy"></i>' : span.innerHTML;
    });
    
    html.find(".combatant").each((_, ct) => {
      // Append spellcast and retreat
      const controls = $(ct).find(".combatant-controls .combatant-control");
      const cmbtant = object.viewed.combatants.get(ct.dataset.combatantId);
      const moveActive = cmbtant.getFlag("owb", "moveInCombat") ? "active" : "";
      controls.eq(1).after(`<a class='combatant-control move-combat ${moveActive}'><i class='fas fa-walking'></i></a>`);
    });
    OWBCombat.announceListener(html);

    const init = game.settings.get("owb", "initiative") === "group";
    if (!init) return;

    html.find('.combat-control[data-control="rollNPC"]').remove();
    html.find('.combat-control[data-control="rollAll"]').remove();
    const trash = html.find('.encounters .combat-control[data-control="endCombat"]');
    $('<a class="combat-control" data-control="reroll"><i class="fas fa-dice"></i></a>').insertBefore(trash);

    html.find(".combatant").each((_, ct) => {
      // Can't roll individual inits
      $(ct).find(".roll").remove();

      // Get group color
      const cmbtant = object.viewed.combatants.get(ct.dataset.combatantId);
      const color = cmbtant.getFlag("owb","group");

      // Append colored flag
      const controls = $(ct).find(".combatant-controls");
      controls.prepend(`<a class='combatant-control flag' style='color:${color}' title="${CONFIG.OWB.colors[color]}"><i class='fas fa-flag'></i></a>`);
    });
    OWBCombat.addListeners(html);
  }

  static updateCombatant(combatant, data) {
    const init = game.settings.get("owb", "initiative");
    // Why do you reroll ?
    if (data.initiative && init === "group") {
      const groupInit = data.initiative;
      // Check if there are any members of the group with init
      game.combat.data.combatants.forEach((ct) => {
        if (
          ct.initiative &&
          ct.initiative != "-789.00" &&
          ct.id != data._id &&
          ct.getFlag("owb","group") === combatant.getFlag("owb","group")
        ) {
          groupInit = ct.initiative;
          data.initiative = parseInt(groupInit);
        }
      });
    }
  }

  static announceListener(html) {
    html.find(".combatant-control.move-combat").click((ev) => {
      ev.preventDefault();
      const id = $(ev.currentTarget).closest(".combatant")[0].dataset.combatantId;
      const isActive = ev.currentTarget.classList.contains('active');
      const cbnt = game.combat.data.combatants.get(id);
      cbnt.update({
        id: id,
        flags: { owb: { moveInCombat: !isActive } },
      });
    })
  }

  static addListeners(html) {
    // Cycle through colors
    html.find(".combatant-control.flag").click((ev) => {
      if (!game.user.isGM) {
        return;
      }
      const currentColor = ev.currentTarget.style.color;
      const colors = Object.keys(CONFIG.OWB.colors);
      const index = (colors.indexOf(currentColor) + 1) % colors.length;
      const id = $(ev.currentTarget).closest(".combatant")[0].dataset.combatantId;
      const cbnt = game.combat.data.combatants.get(id);
      cbnt.update({
        id: id,
        flags: { owb: { group: colors[index] } },
      });
    });

    html.find('.combat-control[data-control="reroll"]').click((ev) => {
      if (!game.combat) return;
      const data = {};
      OWBCombat.rollInitiative(game.combat, data);
    });
  }

  static addCombatant(combatant, data, options, id) {
    let token = canvas.tokens.get(data.tokenId);
    let color = "black";
    switch (token.data.disposition) {
      case -1:
        color = "red";
        break;
      case 0:
        color = "yellow";
        break;
      case 1:
        color = "green";
        break;
    }
    const flags = {
      owb: {
        group: color,
      },
    };
    combatant.data.update({flags: flags});
  }

  static activateCombatant(li) {
    const turn = game.combat.turns.findIndex(turn => turn.id === li.data('combatant-id'));
    game.combat.update({turn: turn})
  }

  static addContextEntry(html, options) {
    options.unshift({
      name: "Set Active",
      icon: '<i class="fas fa-star-of-life"></i>',
      callback: OWBCombat.activateCombatant
    });
    const idx = options.findIndex(e => e.name === "COMBAT.CombatantReroll");
    options.splice(idx, 1);
  }

  static async preUpdateCombat(combat, data, diff, id) {
    const init = game.settings.get("owb", "initiative");
    const reroll = game.settings.get("owb", "rerollInitiative");
    if (!data.round) return;
    if (data.round !== 1) {
      if (reroll === "reset") {
        OWBCombat.resetInitiative(combat, data, diff, id);
        return;
      } else if (reroll === "keep") {
        return;
      }
    }
    if (init === "group") {
      OWBCombat.rollInitiative(combat, data, diff, id);
    } else if (init === "individual") {
      OWBCombat.individualInitiative(combat, data, diff, id);
    }
  }
}
