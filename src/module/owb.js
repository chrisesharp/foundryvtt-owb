// Import Modules
import { OWBItemSheet } from "./item/item-sheet.js";
import { OWBActorSheetCharacter } from "./actor/character-sheet.js";
import { OWBActorSheetEnemy } from "./actor/enemy-sheet.js";
import { OWBActorSheetVehicle } from "./actor/vehicle-sheet.js";
import { preloadHandlebarsTemplates } from "./preloadTemplates.js";
import { OWBActor } from "./actor/entity.js";
import { OWBItem } from "./item/item.js";
import { OWB } from "./config.js";
import { registerSettings } from "./settings.js";
import { registerHelpers } from "./helpers.js";
import * as chat from "./chat.js";
import * as macros from "./macros.js";
import * as party from "./party.js";
import { OWBCombat } from "./combat.js";
const { Actors, Items } = foundry.documents.collections;
const { renderTemplate } = foundry.applications.handlebars;
const { ActorSheet, ItemSheet } = foundry.appv1.sheets;
const { FrameViewer } = foundry.applications.sidebar.apps;

/* -------------------------------------------- */
/*  Foundry VTT Initialization                  */
/* -------------------------------------------- */

Hooks.once("init", async function () {
  /**
   * Set an initiative formula for the system
   * @type {String}
   */
  CONFIG.Combat.initiative = {
    formula: "1d6 + @initiative.value",
    decimals: 2,
  };

  CONFIG.OWB = OWB;

  game.owb = {
    rollItemMacro: macros.rollItemMacro,
  };

  // Custom Handlebars helpers
  registerHelpers();

  // Register custom system settings
  registerSettings();

  CONFIG.Actor.documentClass = OWBActor;
  CONFIG.Item.documentClass = OWBItem;

  // Register sheet application classes
  Actors.unregisterSheet("core", ActorSheet);
  Actors.registerSheet("owb", OWBActorSheetCharacter, {
    types: ["character"],
    makeDefault: true,
  });
  Actors.registerSheet("owb", OWBActorSheetEnemy, {
    types: ["enemy"],
    makeDefault: true,
  });
  Actors.registerSheet("owb", OWBActorSheetVehicle, {
    types: ["vehicle"],
    makeDefault: true,
  });
  Items.unregisterSheet("core", ItemSheet);
  Items.registerSheet("owb", OWBItemSheet, { makeDefault: true });

  await preloadHandlebarsTemplates();
});

/**
 * This function runs after game data has been requested and loaded from the servers, so entities exist
 */
Hooks.once("setup", function () {
  // Localize CONFIG objects once up-front
  const toLocalize = ["saves_short", "saves_long", "scores", "armor", "colors", "tags"];
  for (let o of toLocalize) {
    CONFIG.OWB[o] = Object.entries(CONFIG.OWB[o]).reduce((obj, e) => {
      obj[e[0]] = game.i18n.localize(e[1]);
      return obj;
    }, {});
  }
});

Hooks.once("ready", async () => {
  Hooks.on("hotbarDrop", (bar, data, slot) =>
    macros.createOWBMacro(data, slot)
  );
});

// License and KOFI infos
Hooks.on('renderActorDirectory', async (object, html) => {
  party.addControl(object, html);
});

Hooks.on('renderSettings', async (object, html) => {
  const gamesystem = html.querySelector('.info');
  // License text
  const template = 'systems/owb/templates/chat/license.html';
  const rendered = await renderTemplate(template, {});
  gamesystem.querySelector('.system').innerHTML += rendered;

  // User guide
  const docs = html.querySelector("button[data-app='support']");
  const site = 'https://chrisesharp.github.io/foundryvtt-owb';
  const styling = 'border:none;margin-right:2px;vertical-align:middle;margin-bottom:5px';
  const button = `<button data-action="userguide"><img src='systems/owb/assets/default/ability.png' width='16' height='16' style='${styling}'/>WWII:OWB Guide</button>`;
  docs.parentNode.innerHTML += button;
  html.querySelector('button[data-action="userguide"]').addEventListener('click', () => {
    const fv = new FrameViewer({ url: site });
    fv.url = site;
    fv.render(true);
  });
});

Hooks.on("preCreateCombatant", (combatant, data, options, id) => {
  let init = game.settings.get("owb", "initiative");
  if (init == "group") {
    OWBCombat.addCombatant(combatant, data, options, id);
  }
});

Hooks.on("preUpdateCombatant", OWBCombat.updateCombatant);
Hooks.on("renderCombatTracker", OWBCombat.format);
Hooks.on("preUpdateCombat", OWBCombat.preUpdateCombat);
Hooks.on("getCombatTrackerEntryContext", OWBCombat.addContextEntry);

Hooks.on("getChatLog", chat.addChatMessageContextOptions); // TODO not possible in V13?
Hooks.on("renderChatMessageHTML", chat.addChatMessageButtons);
Hooks.on("renderChatMessageHTML", (app, html, data) => OWBItem.chatListeners(html));
Hooks.on("updateActor", party.update);

Hooks.once("dragRuler.ready", (SpeedProvider) => {
  class OWBSpeedProvider extends SpeedProvider {
      get colors() {
          return [
              {id: "careful", default: 0x00FF00, name: "OWB.speeds.careful"},
              {id: "normal", default: 0xFFFF00, name: "OWB.speeds.normal"},
              {id: "running", default: 0xFF8000, name: "OWB.speeds.running"}
          ];
      }

      getRanges(token) {
          const baseSpeed = token.actor.system.movement.base;

          const ranges = [
            {range: baseSpeed / 2, color: "careful"},
            {range: baseSpeed, color: "normal"},
            {range: baseSpeed * 2, color: "running"}
          ];
          return ranges;
      }
  }

  dragRuler.registerSystem("owb", OWBSpeedProvider)
})