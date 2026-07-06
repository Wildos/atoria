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

  // CONFIG.ChatMessage.documentClass = documents.AtoriaChatMessage;
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
    keyword: "systems/atoria/templates/v2/tooltips/keyword-tooltip.hbs",
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

  const danger_roll_func = function dangerResult(_modifier) {
    // Sort active results in ascending (keep) or descending (drop) order
    const values = this.results
      .reduce((arr, r) => {
        if (r.active) arr.push(r.result);
        return arr;
      }, [])
      .sort((a, b) => {
        let diff = Math.abs(b - 50) - Math.abs(a - 50);
        if (diff === 0) {
          return a - b;
        } else {
          return diff;
        }
      });

    let kept_value = values[0];

    let discard_mode = false;
    // First mark results on the wrong side of the cut as discarded
    this.results.forEach((r) => {
      if (!r.active) return; // Skip results which have already been discarded
      if (discard_mode) {
        // if kept value already passed, discard everything else
        r.discarded = true;
        r.active = false;
      } else {
        if (kept_value !== r.result) {
          // if not kept value discard
          r.discarded = true;
          r.active = false;
        } else discard_mode = true; // If reach kept value, go discard mode
      }
    });
  };

  foundry.dice.terms.Die.MODIFIERS["dgr"] = danger_roll_func;
  CONFIG.Dice.rolls.push(rolls.AtoriaDOSRoll);
  CONFIG.Dice.rolls.push(rolls.AtoriaEffectRoll);

  foundry.documents.collections.Actors.unregisterSheet(
    "core",
    foundry.appv1.sheets.ActorSheet,
  );

  foundry.documents.collections.Actors.registerSheet(
    "atoria",
    sheets.AtoriaActorChestSheetV2,
    {
      types: ["chest"],
      makeDefault: true,
      label: "ATORIA.SheetLabels.ActorV2",
    },
  );
  foundry.documents.collections.Actors.registerSheet(
    "atoria",
    sheets.AtoriaActorHeroSheetV2,
    {
      types: ["hero"],
      makeDefault: true,
      label: "ATORIA.SheetLabels.ActorV2",
    },
  );
  foundry.documents.collections.Actors.registerSheet(
    "atoria",
    sheets.AtoriaActorNonPlayerCharacterSheetV2,
    {
      types: ["non-player-character"],
      makeDefault: true,
      label: "ATORIA.SheetLabels.ActorV2",
    },
  );
  foundry.documents.collections.Actors.registerSheet(
    "atoria",
    sheets.AtoriaActorPlayerCharacterSheetV2,
    {
      types: ["player-character"],
      makeDefault: true,
      label: "ATORIA.SheetLabels.ActorV2",
    },
  );

  foundry.documents.collections.Items.unregisterSheet(
    "core",
    foundry.appv1.sheets.ItemSheet,
  );
  foundry.documents.collections.Items.registerSheet(
    "atoria",
    sheets.AtoriaItemSheet,
    {
      makeDefault: true,
      label: "ATORIA.SheetLabels.Item",
    },
  );

  CONFIG.statusEffects = RULESET.status_effects.sort(RULESET.sort_effects);

  // Internal System Last Migration Version
  game.settings.register("atoria", "worldLastMigrationVersion", {
    name: "System Last Migration Version",
    scope: "world",
    config: false,
    type: String,
    default: "",
  });

  game.settings.register("atoria", "display_player_sheet_horizontally", {
    name: "ATORIA.Settings.DisplayPlayerSheetHorizontally",
    hint: "ATORIA.Settings.DisplayPlayerSheetHorizontallyHint",
    scope: "client",
    config: true,
    type: new foundry.data.fields.BooleanField(),
    default: false,
  });

  game.settings.register("atoria", "languages", {
    name: "ATORIA.Settings.Knowledges.Languages.Label",
    hint: "ATORIA.Settings.Knowledges.Languages.Hint",
    scope: "world",
    config: false,
    requiresReload: true,
    type: new foundry.data.fields.ArrayField(
      new foundry.data.fields.SchemaField({
        id: new foundry.data.fields.StringField({
          required: true,
          nullable: false,
          blank: false,
          label: "ATORIA.Settings.Knowledges.Languages.Id",
        }),
        label: new foundry.data.fields.StringField({
          required: true,
          nullable: false,
          blank: false,
          label: "ATORIA.Settings.Knowledges.Languages.LabelValue",
        }),
      }),
      { label: "ATORIA.Settings.Knowledges.Languages.Label" },
    ),
    default: [],
  });
  game.settings.registerMenu("atoria", "languages", {
    name: "ATORIA.Settings.Knowledges.Languages.Label",
    label: "ATORIA.Settings.Knowledges.Languages.Label",
    hint: "ATORIA.Settings.Knowledges.Languages.Hint",
    icon: "fa-solid fa-scroll",
    type: models.settings.LanguageKnowledgeArrayField,
    restricted: true,
  });

  game.settings.register("atoria", "civilisations", {
    name: "ATORIA.Settings.Knowledges.Civilisation.Label",
    hint: "ATORIA.Settings.Knowledges.Civilisation.Hint",
    scope: "world",
    config: false,
    requiresReload: true,
    type: new foundry.data.fields.ArrayField(
      new foundry.data.fields.SchemaField({
        id: new foundry.data.fields.StringField({
          required: true,
          nullable: false,
          blank: false,
          label: "ATORIA.Settings.Knowledges.Civilisation.Id",
        }),
        label: new foundry.data.fields.StringField({
          required: true,
          nullable: false,
          blank: false,
          label: "ATORIA.Settings.Knowledges.Civilisation.LabelValue",
        }),
      }),
      { label: "ATORIA.Settings.Knowledges.Civilisation.Label" },
    ),
    default: [],
  });
  game.settings.registerMenu("atoria", "civilisations", {
    name: "ATORIA.Settings.Knowledges.Civilisation.Label",
    label: "ATORIA.Settings.Knowledges.Civilisation.Label",
    hint: "ATORIA.Settings.Knowledges.Civilisation.Hint",
    icon: "fa-solid fa-scroll",
    type: models.settings.CivilisationKnowledgeArrayField,
    restricted: true,
  });

  game.settings.register("atoria", "monstrologies", {
    name: "ATORIA.Settings.Knowledges.Monstrology.Label",
    hint: "ATORIA.Settings.Knowledges.Monstrology.Hint",
    scope: "world",
    config: false,
    requiresReload: true,
    type: new foundry.data.fields.ArrayField(
      new foundry.data.fields.SchemaField({
        id: new foundry.data.fields.StringField({
          required: true,
          nullable: false,
          blank: false,
          label: "ATORIA.Settings.Knowledges.Monstrology.Id",
        }),
        label: new foundry.data.fields.StringField({
          required: true,
          nullable: false,
          blank: false,
          label: "ATORIA.Settings.Knowledges.Monstrology.LabelValue",
        }),
      }),
      { label: "ATORIA.Settings.Knowledges.Monstrology.Label" },
    ),
    default: [],
  });
  game.settings.registerMenu("atoria", "monstrologies", {
    name: "ATORIA.Settings.Knowledges.Monstrology.Label",
    label: "ATORIA.Settings.Knowledges.Monstrology.Label",
    hint: "ATORIA.Settings.Knowledges.Monstrology.Hint",
    icon: "fa-solid fa-scroll",
    type: models.settings.MonstrologyKnowledgeArrayField,
    restricted: true,
  });

  game.settings.register("atoria", "zoologies", {
    name: "ATORIA.Settings.Knowledges.Zoology.Label",
    hint: "ATORIA.Settings.Knowledges.Zoology.Hint",
    scope: "world",
    config: false,
    requiresReload: true,
    type: new foundry.data.fields.ArrayField(
      new foundry.data.fields.SchemaField({
        id: new foundry.data.fields.StringField({
          required: true,
          nullable: false,
          blank: false,
          label: "ATORIA.Settings.Knowledges.Zoology.Id",
        }),
        label: new foundry.data.fields.StringField({
          required: true,
          nullable: false,
          blank: false,
          label: "ATORIA.Settings.Knowledges.Zoology.LabelValue",
        }),
      }),
      { label: "ATORIA.Settings.Knowledges.Zoology.Label" },
    ),
    default: [],
  });
  game.settings.registerMenu("atoria", "zoologies", {
    name: "ATORIA.Settings.Knowledges.Zoology.Label",
    label: "ATORIA.Settings.Knowledges.Zoology.Label",
    hint: "ATORIA.Settings.Knowledges.Zoology.Hint",
    icon: "fa-solid fa-scroll",
    type: models.settings.ZoologyKnowledgeArrayField,
    restricted: true,
  });

  utils.handlebars.registerHandlebarsHelpers();
  return utils.handlebars.preloadHandlebarsTemplates();
});

Hooks.once("ready", function () {
  // Migration check is only for GM
  if (!game.user.isGM) return;

  utils.migration.migrateWorld();
});

// Activate chat listeners
Hooks.on("renderChatMessageHTML", (message, html, context) => {
  documents.AtoriaChatMessage.chatListeners(html);
});

/**
 * Adds a datalist helper for suggesting valid Actor attribute keys in the ActiveEffect config dialog.
 */
Hooks.on("renderActiveEffectConfig", (activeEffectConfig, html, data) => {
  const effectsSection = html[0].querySelector("section[data-tab='effects']");
  if (!effectsSection) return;
  const datalist = document.createElement("datalist");
  datalist.id = "attribute-key-list";
  const inputFields = effectsSection.querySelectorAll(".key input");
  inputFields.forEach((input) => input.setAttribute("list", datalist.id));
  const attributeKeys = [];

  let parent_document = activeEffectConfig.object?.parent;
  let parent_character = data.isActorEffect
    ? parent_document
    : parent_document.actor;
  let parent_systemfields = parent_character
    ? parent_character.get_effect_fields()
    : {};
  for (const model of Object.keys(parent_systemfields)) {
    attributeKeys.push({
      key: model,
      label: game.i18n.localize(parent_systemfields[model]),
    });
  }
  attributeKeys
    .sort((a, b) => a.key.localeCompare(b.key))
    .forEach(({ key, label }) => {
      const option = document.createElement("option");
      option.value = key;
      if (label) option.label = label;
      datalist.appendChild(option);
    });
  effectsSection.appendChild(datalist);
});
