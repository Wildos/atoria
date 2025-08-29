import * as models from "./models/module.mjs";
import * as rolls from "./rolls/module.mjs";
import * as documents from "./documents/module.mjs";
import * as sheets from "./sheets/module.mjs";
import * as utils from "./utils/module.mjs";
import RULESET from "./utils/ruleset.mjs";

Hooks.once("init", function () {

  // Debug helpers
  CONFIG.debug_helpers = {};


  CONFIG.Actor.trackableAttributes = {
    character: {
      bar: ["health", "mana", "stamina", "sanity", "endurance", "encumbrance"],
      value: ["luck", "absorption", "armor.main", "resistance.main"],
    },
    npc: {
      bar: ["health", "mana", "stamina", "encumbrance"],
      value: ["absorption", "armor.main", "resistance.main"],
    },
    hero: {
      bar: ["endurance", "encumbrance"],
      value: ["health"],
    },
    chest: {
      bar: ["encumbrance"],
      value: [],
    },
  };

  CONFIG.ChatMessage.documentClass = documents.AtoriaChatMessage;
  CONFIG.ChatMessage.dataModels["interactable"] =
    models.AtoriaInteractableChatMessage;
  CONFIG.ChatMessage.template =
    "systems/atoria/templates/v2/chat_messages/interactable-chat-message.hbs";

  CONFIG.Actor.documentClass = documents.AtoriaActor;
  CONFIG.Actor.dataModels = {
    "player-character": models.AtoriaPC,
    "non-player-character": models.AtoriaNPC,
    hero: models.AtoriaHero,
    chest: models.AtoriaChest,
  };

  CONFIG.Item.documentClass = documents.AtoriaItem;
  CONFIG.Item.dataModels = {
    feature: models.AtoriaFeatureItem,
    kit: models.AtoriaKitItem,
    armor: models.AtoriaArmorItem,
    weapon: models.AtoriaWeaponItem,
    action: models.AtoriaActionItem,
    opportunity: models.AtoriaOpportunityItem,
    spell: models.AtoriaSpellItem,
    technique: models.AtoriaTechniqueItem,
    "incantatory-addition": models.AtoriaIncantatoryAdditionItem,
  };
  CONFIG.ATORIA = {};
  CONFIG.ATORIA.ITEM_TOOLTIP_TEMPLATES = {
    feature: "systems/atoria/templates/v2/tooltips/items/feature-tooltip.hbs",
    kit: "systems/atoria/templates/v2/tooltips/items/kit-tooltip.hbs",
    armor: "systems/atoria/templates/v2/tooltips/items/armor-tooltip.hbs",
    weapon: "systems/atoria/templates/v2/tooltips/items/weapon-tooltip.hbs",
    action: "systems/atoria/templates/v2/tooltips/items/action-tooltip.hbs",
    opportunity:
      "systems/atoria/templates/v2/tooltips/items/opportunity-tooltip.hbs",
    spell: "systems/atoria/templates/v2/tooltips/items/spell-tooltip.hbs",
    technique:
      "systems/atoria/templates/v2/tooltips/items/actable-modifier-tooltip.hbs",
    "incantatory-addition":
      "systems/atoria/templates/v2/tooltips/items/actable-modifier-tooltip.hbs",

    supplementary:
      "systems/atoria/templates/v2/tooltips/supplementary-tooltip.hbs",
  };
  CONFIG.ATORIA.EFFECT_TOOLTIP_TEMPLATES =
    "systems/atoria/templates/v2/tooltips/effects/effect-tooltip.hbs";
  CONFIG.ATORIA.DIALOG_TEMPLATES = {
    skill_launch: "systems/atoria/templates/v2/dialogs/skill-launch-dialog.hbs",
    item_launch: "systems/atoria/templates/v2/dialogs/item-launch-dialog.hbs",
    skill_creation:
      "systems/atoria/templates/v2/dialogs/skill-creation-dialog.hbs",
  };

  CONFIG.ATORIA.CHAT_MESSAGE_PARTIALS = {
    used_features: "atoria.v2.chat_messages.used-features",
    used_supplementaries: "atoria.v2.chat_messages.used-supplementaries.hbs",
    used_actable_modifiers:
      "atoria.v2.chat_messages.used-actable-modifiers.hbs",
  };

  CONFIG.ActiveEffect.legacyTransferral = false;

  CONFIG.Dice.rolls.push(rolls.AtoriaDOSRoll);

  Actors.unregisterSheet("core", ActorSheet);
  // Actors.registerSheet("atoria", sheets.AtoriaActorChestSheet, {
  //     types: ["chest"],
  //     makeDefault: true,
  //     label: "ATORIA.SheetLabels.Actor",
  // });
  // Actors.registerSheet("atoria", sheets.AtoriaActorHeroSheet, {
  //     types: ["hero"],
  //     makeDefault: true,
  //     label: "ATORIA.SheetLabels.Actor",
  // });
  // Actors.registerSheet("atoria", sheets.AtoriaActorCharacterSheet, {
  //     types: ["player-character", "non-player-character"],
  //     makeDefault: true,
  //     label: "ATORIA.SheetLabels.Actor",
  // });

  Actors.registerSheet("atoria", sheets.AtoriaActorChestSheetV2, {
    types: ["chest"],
    makeDefault: true,
    label: "ATORIA.SheetLabels.ActorV2",
  });
  Actors.registerSheet("atoria", sheets.AtoriaActorHeroSheetV2, {
    types: ["hero"],
    makeDefault: true,
    label: "ATORIA.SheetLabels.ActorV2",
  });
  Actors.registerSheet("atoria", sheets.AtoriaActorNonPlayerCharacterSheetV2, {
    types: ["non-player-character"],
    makeDefault: true,
    label: "ATORIA.SheetLabels.ActorV2",
  });
  Actors.registerSheet("atoria", sheets.AtoriaActorPlayerCharacterSheetV2, {
    types: ["player-character"],
    makeDefault: true,
    label: "ATORIA.SheetLabels.ActorV2",
  });

  Items.unregisterSheet("core", ItemSheet);
  // Items.registerSheet("atoria", sheets.AtoriaItemSheetV1, {
  //   makeDefault: true,
  //   label: "ATORIA.SheetLabels.Item",
  // });
  Items.registerSheet("atoria", sheets.AtoriaItemSheet, {
    makeDefault: true,
    label: "ATORIA.SheetLabels.Item",
  });

  CONFIG.statusEffects = RULESET.status_effects;

  // Internal System Last Migration Version
  game.settings.register("atoria", "worldLastMigrationVersion", {
    name: "System Last Migration Version",
    scope: "world",
    config: false,
    type: String,
    default: "",
  });

  game.settings.register("atoria", "display_player_sheet_horizontally", {
    name: game.i18n.localize("ATORIA.Settings.DisplayPlayerSheetHorizontally"),
    hint: game.i18n.localize(
      "ATORIA.Settings.DisplayPlayerSheetHorizontallyHint",
    ),
    scope: "client",
    config: true,
    type: new foundry.data.fields.BooleanField(),
    default: false,
    // requiresReload: false, // TODO: Maybe it need
  });

  utils.handlebars.registerHandlebarsHelpers();
  return utils.handlebars.preloadHandlebarsTemplates();
});

Hooks.once("ready", function () {
  utils.ruleset.localized_effects(CONFIG.statusEffects);

  // Migration check is only for GM
  if (!game.user.isGM) return;

  utils.migration.migrateWorld();
});

// Activate chat listeners
Hooks.on("renderChatLog", (log, html, data) => {
  documents.AtoriaChatMessage.chatListeners(html);
});
