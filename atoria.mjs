/**
 * The Atoria game system for Foundry Virtual Tabletop
 * A system for playing the Atoria role-playing game.
 * Author: Wildos
 * Repository: https://gitlab.com/Mustachioed_Cat/atoria-sheet-foundry
 */
// Import Configuration
import ATORIA from "./module/config.mjs";
import { localize_config } from "./module/config.mjs";

// Import Submodules
import * as applications from "./module/applications/_module.mjs";
import * as utils from "./module/utils.mjs";

// Import document classes.
import { AtoriaActor } from "./module/documents/actor.mjs";
import { AtoriaItem } from "./module/documents/item.mjs";
import SkillRoll from "./module/rolls/skill-roll.mjs";
import EffectRoll from "./module/rolls/effect-roll.mjs";

import * as documents from "./module/documents/_module.mjs";
import { migrateData } from "./module/migrations/migration.mjs";

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

Hooks.once("init", function () {
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
  Items.registerSheet("atoria", applications.item.ItemAtoriaSheetActionModifier, {
    types: ["action-modifier"],
    makeDefault: true,
    label: "ATORIA.SheetClassActionModifier"
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


Hooks.once("ready", function () {

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

  // Change status effect list
  CONFIG.statusEffects = [
    {
      "id": "concentration",
      "name": "Concentration",
      "icon": "systems/atoria/imgs/brain.svg",
      "description": "Vous vous concentrez à votre tâche.",
      "duration": {
        "round": 0
      }
    },
    {
      "id": "preparing",
      "name": "Préparation",
      "icon": "systems/atoria/imgs/gift-of-knowledge.svg",
      "description": "Vous préparez un sort.",
      "duration": {
        "round": 0
      }
    },
    {
      "id": "evocation",
      "name": "Évocation",
      "icon": "systems/atoria/imgs/bolt-spell-cast.svg",
      "description": "Vous évoquez votre magie.",
      "duration": {
        "round": 0
      }
    },
    {
      "id": "channelling",
      "name": "Canalisation",
      "icon": "systems/atoria/imgs/brainstorm.svg",
      "description": "Vous canalisez votre magie.",
      "duration": {
        "round": 0
      }
    },
    {
      "id": "bleeding",
      "name": "Saignement",
      "icon": "systems/atoria/imgs/bleeding-wound.svg",
      "description": "Vous avez Santé -1 / round.",
      "duration": {
        "round": 0
      }
    },
    {
      "id": "abused",
      "name": "Brutalisé",
      "icon": "systems/atoria/imgs/chopped-skull.svg",
      "description": "Vous subissez Dégât Arme +1 de l'émetteur.",
      "duration": {
        "round": 0
      }
    },
    {
      "id": "abused+",
      "name": "Brutalisé+",
      "icon": "systems/atoria/imgs/chopped-skull+.svg",
      "description": "Vous subissez Dégât Arme +1 et vous avez DR Réflexe - Parade -1 contre l'émetteur.",
      "duration": {
        "round": 0
      }
    },
    {
      "id": "prone",
      "name": "Renversé",
      "icon": "icons/svg/falling.svg",
      "description": "Vous avez un Demi-couvert mais vous êtes facile à attaquer au corps à corps.",
      "duration": {
        "round": 0
      }
    },
    {
      "id": "burning",
      "name": "Enflammé",
      "icon": "systems/atoria/imgs/flame.svg",
      "description": "Vous subissez Dégât feu 1 / round",
      "duration": {
        "round": 0
      }
    },
    {
      "id": "burning+",
      "name": "Enflammé+",
      "icon": "systems/atoria/imgs/flame+.svg",
      "description": "Vous subissez Dégât feu 2 / round",
      "duration": {
        "round": 0
      }
    },
    {
      "id": "moist",
      "name": "Humide",
      "icon": "systems/atoria/imgs/water-drop.svg",
      "description": "Vous avez Résistance foudre -1 feu +1.",
      "duration": {
        "round": 0
      }
    },
    {
      "id": "frostbite",
      "name": "Gelure",
      "icon": "systems/atoria/imgs/snowflake-1.svg",
      "description": "Vous subissez Dégât froid 1 / round.",
      "duration": {
        "round": 0
      }
    },
    {
      "id": "unconscious",
      "name": "Inconscient",
      "icon": "icons/svg/unconscious.svg",
      "description": "Vous ne pouvez rien faire et vous n'avez pas conscience de ce qui vous entoure.",
      "duration": {
        "round": 0
      }
    },
    {
      "id": "dead",
      "name": "Mort",
      "icon": "icons/svg/skull.svg",
      "description": "Vous ne pouvez rien faire et vous n'avez pas conscience de ce qui vous entoure. Faites que vos camarades trouvent une solution, ou préparer un nouveau personnage.",
      "duration": {
        "round": 0
      }
    },
    {
      "id": "stunned",
      "name": "Étourdi",
      "icon": "systems/atoria/imgs/knocked-out-stars.svg",
      "description": "Vous ne pouvez rien faire et vous n'avez pas conscience de ce qui vous entoure.",
      "duration": {
        "round": 0
      }
    },
    {
      "id": "banished",
      "name": "Banni",
      "icon": "systems/atoria/imgs/portal.svg",
      "description": "Vous disparaissez. Vous ne pouvez pas être ciblé, prendre d'opportunité et passez votre tour.",
      "duration": {
        "round": 0
      }
    },
    {
      "id": "afraid",
      "name": "Effrayé",
      "icon": "systems/atoria/imgs/dread.svg",
      "description": "Vous ne pouvez pas approcher l'émetteur et vous avez le désavantage pour l'attaquer.",
      "duration": {
        "round": 0
      }
    },
    {
      "id": "panic",
      "name": "Paniqué",
      "icon": "systems/atoria/imgs/run.svg",
      "description": "Vous devez fuir le plus loin possible de l'émetteur.",
      "duration": {
        "round": 0
      }
    },
    {
      "id": "terrified",
      "name": "Terrifié",
      "icon": "icons/svg/terror.svg",
      "description": "Vous ne pouvez pas vous déplacer ou attaquer et vous avez le désavantage aux esquives, aux parades et aux opportunités.",
      "duration": {
        "round": 0
      }
    },
    {
      "id": "dazed",
      "name": "Hébété",
      "icon": "systems/atoria/imgs/electric.svg",
      "description": "Vous jouez en dernier.",
      "duration": {
        "round": 0
      }
    },
    {
      "id": "seduced",
      "name": "Séduit",
      "icon": "systems/atoria/imgs/hearts.svg",
      "description": "Vous avez le désavantage contre l'émetteur.",
      "duration": {
        "round": 0
      }
    },
    {
      "id": "chamed",
      "name": "Charmé",
      "icon": "systems/atoria/imgs/charm.svg",
      "description": "Vous considérez l'émetteur comme un ami proche.",
      "duration": {
        "round": 0
      }
    },
    {
      "id": "captivated",
      "name": "Subjugué",
      "icon": "systems/atoria/imgs/lovers.svg",
      "description": "Vous obéissez à l'émetteur tant que cela ne comprend pas de vous blesser.",
      "duration": {
        "round": 0
      }
    },
    {
      "id": "control",
      "name": "Contrôlé",
      "icon": "systems/atoria/imgs/puppet.svg",
      "description": "Vous obéissez à l'émetteur tant que cela ne comprend pas de vous suicider.",
      "duration": {
        "round": 0
      }
    },
    {
      "id": "provoked",
      "name": "Provoqué",
      "icon": "systems/atoria/imgs/angry-eyes.svg",
      "description": "Vous avez DR -1 à tous vos jets tant que vous ne suivez pas la provocation.",
      "duration": {
        "round": 0
      }
    },
    {
      "id": "provoked+",
      "name": "Provoqué+",
      "icon": "systems/atoria/imgs/angry-eyes+.svg",
      "description": "Vous avez le désavantage à tous vos jets tant que vous ne suivez pas la provocation.",
      "duration": {
        "round": 0
      }
    },
    {
      "id": "enraged",
      "name": "Enragé",
      "icon": "systems/atoria/imgs/enrage.svg",
      "description": "Vous devez attaquer la cible la plus proche dont vous avez conscience.",
      "duration": {
        "round": 0
      }
    },
    {
      "id": "radiate",
      "name": "Irradié",
      "icon": "icons/svg/paralysis.svg",
      "description": "Vous éclairez clairement sur 1m et vous attaquer au corps à corps est plus facile.",
      "duration": {
        "round": 0
      }
    },
    {
      "id": "conductive",
      "name": "Conducteur",
      "icon": "systems/atoria/imgs/lightning-arc.svg",
      "description": "Vous conduisez l'éléctricité.",
      "duration": {
        "round": 0
      }
    },
    {
      "id": "shocked",
      "name": "Choqué",
      "icon": "icons/svg/lightning.svg",
      "description": "Vous avez DR -1 à tous vos jets.",
      "duration": {
        "round": 0
      }
    },
    {
      "id": "numb",
      "name": "Engourdi",
      "icon": "systems/atoria/imgs/hand-bandage.svg",
      "description": "Vous avez DR Attaque -1 lorsqu'une main ou plus est nécessaire.",
      "duration": {
        "round": 0
      }
    },
    {
      "id": "numb+",
      "name": "Engourdi+",
      "icon": "systems/atoria/imgs/hand-bandage+.svg",
      "description": "Vous avez le désavantage à l'attaque lorsqu'une main ou plus est nécessaire.",
      "duration": {
        "round": 0
      }
    },
    {
      "id": "hungry",
      "name": "Affamé",
      "icon": "systems/atoria/imgs/meat.svg",
      "description": "Vous avez DR -1 aux compétences physiques et combatives.",
      "duration": {
        "round": 0
      }
    },
    {
      "id": "dehydrated",
      "name": "Déshydrater",
      "icon": "systems/atoria/imgs/waterskin.svg",
      "description": "Vous avez DR -1 aux compétences physiques et combatives.",
      "duration": {
        "round": 0
      }
    },
    {
      "id": "drunk",
      "name": "Ébriété",
      "icon": "systems/atoria/imgs/beer-stein.svg",
      "description": "Vous avez DR -1 à tous vos jets.",
      "duration": {
        "round": 0
      }
    },
    {
      "id": "hangover",
      "name": "Gueule de bois",
      "icon": "systems/atoria/imgs/beer-stein+.svg",
      "description": "Vous avez DR -1 aux compétences cognitives, combatives et aux perceptions.",
      "duration": {
        "round": 0
      }
    },
    {
      "id": "tired",
      "name": "Fatigué",
      "icon": "systems/atoria/imgs/tired-eye.svg",
      "description": "Vous avez DR -1 aux compétences cognitives, physiques et aux connaissances.",
      "duration": {
        "round": 0
      }
    },
    {
      "id": "rested",
      "name": "Reposé",
      "icon": "icons/svg/sleep.svg",
      "description": "Vous avez Initiative +1.",
      "duration": {
        "round": 0
      }
    },
    {
      "id": "incurable",
      "name": "Incurable",
      "icon": "systems/atoria/imgs/wrapped-heart.svg",
      "description": "Vous ne pouvez pas avoir de soin en Santé.",
      "duration": {
        "round": 0
      }
    },
    {
      "id": "incurable+",
      "name": "Incurable+",
      "icon": "systems/atoria/imgs/wrapped-heart+.svg",
      "description": "Vous ne pouvez pas regagner de Santé.",
      "duration": {
        "round": 0
      }
    },
    {
      "id": "blindness",
      "name": "Cécité",
      "icon": "icons/svg/blind.svg",
      "description": "Vous ne voyez plus.",
      "duration": {
        "round": 0
      }
    },
    {
      "id": "deaf",
      "name": "Surdité",
      "icon": "icons/svg/deaf.svg",
      "description": "Vous n'entendez plus.",
      "duration": {
        "round": 0
      }
    },
    {
      "id": "silenced",
      "name": "Silence",
      "icon": "icons/svg/silenced.svg",
      "description": "Un personnage affecté ne peut plus émettre de son avec sa voix. Elle ne peut pas utiliser de sort à composante verbale.",
      "duration": {
        "round": 0
      }
    },
    {
      "id": "invisible",
      "name": "Invisible",
      "icon": "icons/svg/invisible.svg",
      "description": "Vous ne pouvez pas être perçu et ciblé.",
      "duration": {
        "round": 0
      }
    },
    {
      "id": "slowed",
      "name": "Ralenti",
      "icon": "systems/atoria/imgs/sticky-boot.svg",
      "description": "Vous avez coût Mouvement +1 pour vous déplacer.",
      "duration": {
        "round": 0
      }
    },
    {
      "id": "immobilised",
      "name": "Immobilisé",
      "icon": "icons/svg/net.svg",
      "description": "Vous ne pouvez pas utiliser de mouvement et vous avez le désavantage pour esquiver.",
      "duration": {
        "round": 0
      }
    },
    {
      "id": "disability",
      "name": "Incapacité",
      "icon": "systems/atoria/imgs/imprisoned.svg",
      "description": "Vous ne pouvez rien faire.",
      "duration": {
        "round": 0
      }
    }
  ]

  // Determine whether a system migration is required
  if (!game.user.isGM) return; // Only do migration with the GM
  if (game.settings.get("atoria", "systemMigrationVersion") || ATORIA_MIGRATION_SYSTEM_CREATION_VERSION) {
    migrateData();
  }
});
