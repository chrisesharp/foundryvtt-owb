export const registerSettings = function () {

  game.settings.register("owb", "initiative", {
    name: game.i18n.localize("OWB.Setting.Initiative"),
    hint: game.i18n.localize("OWB.Setting.InitiativeHint"),
    default: "group",
    scope: "world",
    type: String,
    config: true,
    choices: {
      individual: "OWB.Setting.InitiativeIndividual",
      group: "OWB.Setting.InitiativeGroup",
    },
    onChange: _ => window.location.reload()
  });

  game.settings.register("owb", "rerollInitiative", {
    name: game.i18n.localize("OWB.Setting.RerollInitiative"),
    hint: game.i18n.localize("OWB.Setting.RerollInitiativeHint"),
    default: "reset",
    scope: "world",
    type: String,
    config: true,
    choices: {
      keep: "OWB.Setting.InitiativeKeep",
      reset: "OWB.Setting.InitiativeReset",
      reroll: "OWB.Setting.InitiativeReroll",
    }
  });

  game.settings.register("owb", "ascendingAC", {
    name: game.i18n.localize("OWB.Setting.AscendingAC"),
    hint: game.i18n.localize("OWB.Setting.AscendingACHint"),
    default: false,
    scope: "world",
    type: Boolean,
    config: true,
    onChange: _ => window.location.reload()
  });

  game.settings.register("owb", "morale", {
    name: game.i18n.localize("OWB.Setting.Morale"),
    hint: game.i18n.localize("OWB.Setting.MoraleHint"),
    default: false,
    scope: "world",
    type: Boolean,
    config: true,
  });

  game.settings.register("owb", "encumbranceOption", {
    name: game.i18n.localize("OWB.Setting.Encumbrance"),
    hint: game.i18n.localize("OWB.Setting.EncumbranceHint"),
    default: "complete",
    scope: "world",
    type: String,
    config: true,
    choices: {
      disabled: "OWB.Setting.EncumbranceDisabled",
      basic: "OWB.Setting.EncumbranceBasic",
      detailed: "OWB.Setting.EncumbranceDetailed",
      complete: "OWB.Setting.EncumbranceComplete",
    },
    onChange: _ => window.location.reload()
  });
};
