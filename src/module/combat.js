export class OWBCombat {
  static  async rollInitiative(combat, data) {
    // Check groups
    const groups = {};
    combat.combatants.forEach((cbt) => {
      const group = cbt.getFlag("owb","group");
      groups[group] = { present: true };
    });

    // const rolls = await new Roll(`${Object.keys(groups).lenth}d6`).evalute();
    // Roll init
    for (const group of Object.keys(groups)) {
      const roll =  await new Roll("1d6").evaluate();
      groups[group].initiative = roll.total;
      await roll.toMessage({flavor: game.i18n.format('OWB.roll.initiative', { group: CONFIG["OWB"].colors[group] })});
    };

    // Set init
    combat.combatants.forEach((cbt)=> {
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
    combat.combatants.forEach((c, i) => {
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
    html.querySelectorAll(".initiative").forEach((span) => {
      span.innerHTML = (span?.innerHTML == "-789.00") ? '<i class="fas fa-weight-hanging"></i>' : span?.innerHTML;
      span.innerHTML =  (span?.innerHTML == "-790.00") ? '<i class="fas fa-dizzy"></i>' : span?.innerHTML;
    });

    const init = game.settings.get("owb", "initiative") === "group";
    if (!init) return;

    html.querySelector('.combat-control[data-action="rollNPC"]')?.remove();
    html.querySelector('.combat-control[data-action="rollAll"]')?.remove();
    const gear = html.querySelector('button[data-action="trackerSettings"]');
    if (gear) {
      gear.previousElementSibling.insertAdjacentHTML('afterend', '<button type="button" class="inline-control roll icon fas fa-dice" data-action="reroll" data-tooltip aria-label="roll initiative"></button>');
    }

    html.querySelectorAll(".combatant").forEach((ct) => {
      // Can't roll individual inits
      ct.querySelector(".roll")?.remove();

      // Get group color
      const cmbtant = object.viewed.combatants.get(ct.dataset.combatantId);
      const color = cmbtant.getFlag("owb","group");

      // moved flag
      const moveActive = cmbtant.token.movementHistory.length > 0 ? "active" : "";
      const button = `<button type="button" class='inline-control combatant-control move-combat icon fas fa-walking ${moveActive}' data-tooltip aria-label='Moved in Combat'></button>`;

      // Append colored flag
      const controls = ct.querySelector(".combatant-controls");
      if (controls) controls.innerHTML = `<a class='combatant-control flag' style='color:${color}' title="${CONFIG.OWB.colors[color]}"><i class='fas fa-flag'></i></a>` + button + controls.innerHTML;
      OWBCombat.announceListener(html);
    });
    OWBCombat.addListeners(html);
  }

  static updateCombatant(combatant, data) {
    const init = game.settings.get("owb", "initiative");
    // Why do you reroll ?
    if (data.initiative && init === "group") {
      const groupInit = data.initiative;
      // Check if there are any members of the group with init
      game.combat.combatants.forEach((ct) => {
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
    html.querySelectorAll(".combatant-control.move-combat").forEach((el) => {
      el.addEventListener('click', (ev) => {
        ev.preventDefault();
        const id = ev.currentTarget.closest(".combatant").dataset.combatantId;
        const isActive = ev.currentTarget.classList.contains('active');
        const cbnt = game.combat.combatants.get(id);
        cbnt.update({
          id: id,
          flags: { owb: { moveInCombat: !isActive } },
        });
      });
    });
  }

  static addListeners(html) {
    // Cycle through colors
    html.querySelectorAll(".combatant-control.flag").forEach((el) => {
      el.addEventListener('click', (ev) => {
        if (!game.user.isGM) {
          return;
        }
        const currentColor = ev.currentTarget.style.color;
        const colors = Object.keys(CONFIG.OWB.colors);
        const index = (colors.indexOf(currentColor) + 1) % colors.length;
        const id = ev.currentTarget.closest(".combatant").dataset.combatantId;
        const cbnt = game.combat.combatants.get(id);
        cbnt.update({
          id: id,
          flags: { owb: { group: colors[index] } },
        });
      });
    });

    html.querySelectorAll('.combat-control[data-action="reroll"]').forEach((el) => {
      el.addEventListener('click', (ev) => {
        if (!game.combat) return;
        const data = {};
        OWBCombat.rollInitiative(game.combat, data);
      });
    });

    html.querySelectorAll('button[data-action="reroll"]').forEach((el) => {
      el.addEventListener('click', (ev) => {
        if (!game.combat) return;
        const data = {};
        OWBCombat.rollInitiative(game.combat, data);
      });
    });
  }

  static addCombatant(combatant, data, options, id) {
    let token = canvas.tokens.get(data.tokenId);
    let color = "black";
    switch (token.document.disposition) {
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
    combatant.updateSource({flags: flags});
  }

  static activateCombatant(li) {
    const turn = game.combat.turns.findIndex(turn => turn.id === li.dataset.combatantId);
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
