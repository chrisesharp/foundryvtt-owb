// Import Modules
import { OWBItemSheet } from "./module/item/item-sheet.js";
import { OWBActorSheetCharacter } from "./module/actor/character-sheet.js";
import { OWBActorSheetEnemy } from "./module/actor/enemy-sheet.js";
import { OWBActorSheetVehicle } from "./module/actor/vehicle-sheet.js";
import { preloadHandlebarsTemplates } from "./module/preloadTemplates.js";
import { OWBActor } from "./module/actor/entity.js";
import { OWBItem } from "./module/item/item.js";
import { OWB } from "./module/config.js";
import { registerSettings } from "./module/settings.js";
import { registerHelpers } from "./module/helpers.js";
import * as chat from "./module/chat.js";
import * as treasure from "./module/treasure.js";
import * as macros from "./module/macros.js";
import * as party from "./module/party.js";
import { OWBCombat } from "./module/combat.js";

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

  CONFIG.Actor.entityClass = OWBActor;
  CONFIG.Item.entityClass = OWBItem;

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
Hooks.on("renderSidebarTab", async (object, html) => {
  if (object instanceof ActorDirectory) {
    party.addControl(object, html);
  }
  if (object instanceof Settings) {
    let gamesystem = html.find("#game-details");
    // SRD Link
    let owb = gamesystem.find('h4').last();
    owb.append(` <sub><a href="https://oldschoolessentials.necroticgnome.com/srd/index.php">SRD<a></sub>`);

    // License text
    const template = "systems/owb/templates/chat/license.html";
    const rendered = await renderTemplate(template);
    gamesystem.find(".system").append(rendered);
    
    // User guide
    let docs = html.find("button[data-action='docs']");
    const styling = "border:none;margin-right:2px;vertical-align:middle;margin-bottom:5px";
    $(`<button data-action="userguide"><img src='/systems/owb/assets/default/ability.png' width='16' height='16' style='${styling}'/>WWII:OWB Guide</button>`).insertAfter(docs);
    html.find('button[data-action="userguide"]').click(ev => {
      new FrameViewer('https://chrisesharp.github.io/foundryvtt-owb', {resizable: true}).render(true);
    });
  }
});

Hooks.on("preCreateCombatant", (combat, data, options, id) => {
  let init = game.settings.get("owb", "initiative");
  if (init == "group") {
    OWBCombat.addCombatant(combat, data, options, id);
  }
});

Hooks.on("preUpdateCombatant", OWBCombat.updateCombatant);
Hooks.on("renderCombatTracker", OWBCombat.format);
Hooks.on("preUpdateCombat", OWBCombat.preUpdateCombat);
Hooks.on("getCombatTrackerEntryContext", OWBCombat.addContextEntry);

Hooks.on("renderChatLog", (app, html, data) => OWBItem.chatListeners(html));
Hooks.on("getChatLogEntryContext", chat.addChatMessageContextOptions);
Hooks.on("renderChatMessage", chat.addChatMessageButtons);
Hooks.on("renderRollTableConfig", treasure.augmentTable);
Hooks.on("updateActor", party.update);