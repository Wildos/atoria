/**
 * The Atoria game system for Foundry Virtual Tabletop
 * A system for playing the Atoria role-playing game.
 * Author: Wildos
 * Repository: https://gitlab.com/Mustachioed_Cat/atoria-sheet-foundry
 */
// Import Configuration
import ATORIA from "./module/config.mjs";
import {localize_config} from "./module/config.mjs";

// Import Submodules
import * as applications from "./module/applications/_module.mjs";
import * as utils from "./module/utils.mjs";

// Import document classes.
import { AtoriaActor } from "./module/documents/actor.mjs";
import { AtoriaItem } from "./module/documents/item.mjs";
import SkillRoll from "./module/rolls/skill-roll.mjs";
import EffectRoll from "./module/rolls/effect-roll.mjs";

import * as documents from "./module/documents/_module.mjs"; 


const ATORIA_MIGRATION_SYSTEM_CREATION_VERSION = "0.1.10";

/* -------------------------------------------- */
/*  Define Module Structure                     */
/* -------------------------------------------- */

globalThis.atoria = {
  applications,
  config: ATORIA,
  utils,
  macro: documents.macro,
};

/* -------------------------------------------- */
/*  Foundry VTT Initialization                  */
/* -------------------------------------------- */

Hooks.once("init", function() {
  globalThis.atoria = game.atoria = Object.assign(game.system, globalThis.atoria);
  console.log(`Atoria | Initializing the Atoria Game System - Version ${atoria.version}`);


  // Add custom constants for configuration.
  CONFIG.ATORIA = ATORIA;
  CONFIG.Dice.SkillRoll = SkillRoll
  CONFIG.Dice.EffectRoll = EffectRoll

  // Define custom Document classes
  CONFIG.Actor.documentClass = AtoriaActor;
  CONFIG.Item.documentClass = AtoriaItem;


  game.settings.register("atoria", "systemMigrationVersion", {
    name: "System Migration Version",
    scope: "world",
    config: false,
    type: String,
    default: ATORIA_MIGRATION_SYSTEM_CREATION_VERSION
  });

  CONFIG.Dice.rolls.push(SkillRoll);
  CONFIG.Dice.rolls.push(EffectRoll);

  // Patch Core Functions
  Combatant.prototype.getInitiativeRoll = documents.combat.getInitiativeRoll;

  // Register sheet application classes
  Actors.unregisterSheet("core", ActorSheet);
  Actors.registerSheet("atoria", applications.actor.ActorAtoriaSheetCharacter, {
    types: ["character"],
    makeDefault: true,
    label: "ATORIA.SheetClassCharacter"
  });
  Actors.registerSheet("atoria", applications.actor.ActorAtoriaSheetNPC, {
    types: ["npc"],
    makeDefault: true,
    label: "ATORIA.SheetClassNPC"
  });

  Items.unregisterSheet("core", ItemSheet);
  Items.registerSheet("atoria", applications.item.ItemAtoriaSheetGear, {
    types: ["gear-consumable", "gear-equipment", "gear-ingredient", "gear-weapon", "gear-armor"],
    makeDefault: true,
    label: "ATORIA.SheetClassGear"
  });
  Items.registerSheet("atoria", applications.item.ItemAtoriaSheetAction, {
    types: ["action"],
    makeDefault: true,
    label: "ATORIA.SheetClassAction"
  });
  Items.registerSheet("atoria", applications.item.ItemAtoriaSheetSpell, {
    types: ["spell", "spell-supp"],
    makeDefault: true,
    label: "ATORIA.SheetClassSpell"
  });
  Items.registerSheet("atoria", applications.item.ItemAtoriaSheetFeature, {
    types: ["feature"],
    makeDefault: true,
    label: "ATORIA.SheetClassFeature"
  });
  Items.registerSheet("atoria", applications.item.ItemAtoriaSheetSkill, {
    types: ["skill", "skill-category"],
    makeDefault: true,
    label: "ATORIA.SheetClassSkill"
  });

  // Preload Handlebars helpers & partials
  utils.registerHandlebarsHelpers();
  utils.preloadHandlebarsTemplates();
});


Hooks.once("i18nInit", () => localize_config());


Hooks.once("ready", function() {
  // Wait to register hotbar drop hook on ready so that modules could register earlier if they want to
  Hooks.on("hotbarDrop", (bar, data, slot) => {
    switch (data.type) {
      case "Item":
        documents.macro.createItemMacro(data, slot);
        return false;
      case "initiative":
        documents.macro.createInitiativeMacro(data, slot);
        return false;
      case "skill":
      case "perception":
        documents.macro.createSkillMacro(data, slot);
        return false;
      default: 
        return false;
    }
  });
});
