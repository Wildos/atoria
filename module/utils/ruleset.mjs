import { itemRollDialog } from "./helpers.mjs";
import { default as default_values } from "./default-values.mjs";
import { buildLocalizeString } from "../utils/atoria-lang.mjs";
import * as models_settings from "../models/settings.mjs";
import * as roll_helpers from "../utils/roll_helpers.mjs";

import {
  defineAlteration,
  defineTimePhaseLimitation,
} from "../models/helpers.mjs";

const RULESET = {};

RULESET["general"] = class GeneralRuleset {
  static getTimePhasesTypeToApply(time_phase_type) {
    const time_phases_type_to_apply = [];
    switch (time_phase_type) {
      case "combat":
        time_phases_type_to_apply.push("combat");
        break;
      case "sleep": // also a rest
        time_phases_type_to_apply.push("sleep");
      case "rest":
        time_phases_type_to_apply.push("rest");
        break;
      case "long-moon": // also a short-moon
        time_phases_type_to_apply.push("long-moon");
      case "short-moon":
        time_phases_type_to_apply.push("short-moon");
        break;
    }
    return time_phases_type_to_apply;
  }

  static getCostWeaponAttack(weapon_item) {
    const cost_model = default_values.models.helpers.defineCostField();
    let attack_cost = cost_model.getInitialValue();
    attack_cost.time.second_amount = 3;
    attack_cost.stamina = 1;
    const weapon_keywords = weapon_item.system.keywords;
    if (weapon_keywords.two_handed == 1) {
      attack_cost.time.second_amount += 1;
    }
    return attack_cost;
  }

  static getVersatileEffect() {
    return (
      "[[1]]{" +
      game.i18n.localize("ATORIA.Ruleset.Keywords_effect.Versatile") +
      "}"
    );
  }
};

RULESET["character"] = class ActorRuleset {
  static OPPORTUNITY_SKILL_PATH = "system.skills.physical.reflex.opportuneness";
  static WAND_SKILL_PATH = "system.skills.weapon.apart.wand";
  static ENCHANTED_SKILL_PATH = "system.skills.weapon.apart.enchanted";
  static FISTFIGHT_SKILL_PATH = "system.skills.weapon.contact.fist_fight";

  static MARTIAL_CONTACT_PATH = "system.knowledges.magic.martial.contact";
  static MARTIAL_APART_PATH = "system.knowledges.magic.martial.apart";
  static MARTIAL_INSTRUMENT_PATH = "system.knowledges.magic.martial.instrument";

  static MARTIAL_CONTACT_WEAPON_PATH = "system.skills.weapon.contact";
  static MARTIAL_APART_WEAPON_PATH = "system.skills.weapon.apart";
  static MARTIAL_INSTRUMENT_WEAPON_PATH = "system.skills.weapon.instrument";

  static getSkillsTree(type) {
    switch (type) {
      case "non-player-character":
        return {
          perceptions: [
            "sight",
            "earing",
            "smell",
            "taste",
            "instinct",
            "magice",
          ],
          physical: [
            "agility",
            "athletic",
            "slyness",
            "environment",
            "reflex",
            "sturdiness",
          ],
          social: ["analyse", "charisma", "eloquence", "spirit", "trickery"],
          weapon: ["contact", "apart", "instrument"],
        };
      case "player-character":
        return {
          perceptions: [
            "sight",
            "earing",
            "smell",
            "taste",
            "instinct",
            "magice",
          ],
          physical: {
            agility: ["balance", "dexterity"],
            athletic: ["hiking", "running", "jump"],
            slyness: ["silence", "stealth", "concealment"],
            environment: ["climbing", "nage", "fortitude"],
            reflex: ["dodge", "parry", "opportuneness"],
            sturdiness: ["force", "tenacity"],
          },
          social: {
            analyse: ["insight", "investigation"],
            charisma: ["intimidation", "presence", "seduction"],
            eloquence: ["persuasion", "calming", "negotiation"],
            spirit: ["will", "guarding"],
            trickery: ["acting", "lying", "provocation"],
          },
          weapon: {
            contact: [
              "fist_fight",
              "buckler",
              "rondache",
              "shield",
              "dagger",
              "seax",
              "sabre",
              "rapier",
              "long_sword",
              "bastard_sword",
              "staff",
              "spear",
              "trident",
              "guisarme",
              "bardiche",
              "sickle",
              "scythe",
              "battle_hatchet",
              "bearded_axe",
              "war_axe",
              "gestrox",
              "club",
              "hammer",
              "mallet",
              "flail",
              "morning_star",
              "pickaxe",
            ],
            apart: [
              "throwing_knife",
              "throwing_hatchet",
              "javelin",
              "short_bow",
              "composite_bow",
              "long_bow",
              "crossbow",
              "hand_crossbow",
              "wand",
              "enchanted",
            ],
            instrument: [],
          },
        };

      case "hero":
        return ["perceptions", "physical", "social", "weapon"];

      default:
        return {};
    }
  }

  static getSkillInitialSuccess(key) {
    switch (key) {
      case "sight":
        return 50;
      case "earing":
        return 50;
      case "smell":
        return 50;
      case "taste":
        return 50;
      case "instinct":
        return 25;
      case "magice":
        return 15;
      default:
        return 10;
    }
  }

  static getKnowledgesTree(type) {
    switch (type) {
      case "non-player-character":
        return {
          craftmanship: [
            "alchemy",
            "artistic",
            "jewellery",
            "sewing",
            "cuisine",
            "cabinet-making",
            "forge",
            "engineering",
            "leatherworking",
          ],
          erudition: [
            "civilisation",
            "language",
            "medecine",
            "monstrology",
            "runic",
            "science",
            "strategy",
            "symbolism",
            "zoology",
          ],
          utilitarian: [
            "song",
            "hunting",
            "construction",
            "dance",
            "dressage",
            "theft",
            "nature",
            "fishing",
            "transport",
          ],
          magic: [
            "martial",
            "air",
            "mental",
            "druidic",
            "water",
            "fire",
            "occult",
            "holy",
            "blood",
            "earth",
          ],
        };
      case "player-character":
        return {
          craftmanship: {
            alchemy: ["mixture", "transformation"],
            artistic: ["ceramic", "sculpture", "graphic"],
            jewellery: ["finery", "seaming", "glassware"],
            sewing: ["fashion", "domestic"],
            cuisine: ["meal", "baking"],
            "cabinet-making": ["gear", "woodworking"],
            forge: ["weaponry", "armoury", "goldsmithery"],
            engineering: ["mechanism", "siege"],
            leatherworking: ["tanning", "manufacture"],
          },
          erudition: {
            civilisation: game.settings
              .get("atoria", "civilisations")
              .map((elem) => elem.id),
            language: game.settings
              .get("atoria", "languages")
              .map((elem) => elem.id),
            medecine: ["treatment", "mortuary"],
            monstrology: game.settings
              .get("atoria", "monstrologies")
              .map((elem) => elem.id),
            runic: ["enchantment", "inscription", "tattoo"],
            science: ["astronomy", "geology", "mathematic"],
            strategy: ["battle", "expedition"],
            symbolism: ["heraldry", "cryptography", "cartography"],
            zoology: game.settings
              .get("atoria", "zoologies")
              .map((elem) => elem.id),
          },
          utilitarian: {
            song: ["entertaining", "martial"],
            hunting: ["tracking", "cutting"],
            construction: ["masonry", "carpentry"],
            dance: ["aesthetics", "spinning"],
            dressage: ["taming", "war"],
            theft: ["pickpocketing", "lock-picking"],
            nature: ["farming", "herbalist", "fungus"],
            fishing: ["bank", "high-sea"],
            transport: ["mounting", "land", "sea"],
          },
          magic: {
            martial: ["contact", "apart", "instrument"],
            air: ["dazzling", "breeze", "lightning"],
            mental: ["kinetic", "illusion", "power", "enchanted"],
            druidic: ["astral", "solicitude", "changeforme", "mutation"],
            water: ["ablution", "source", "ice"],
            fire: ["torch", "ignition", "destruction"],
            occult: ["toxic", "curse", "ethereal", "necromancy"],
            holy: ["blessing", "piety", "glory", "purification"],
            blood: ["sacrifice", "puncture", "drain"],
            earth: ["bastion", "telluric", "metallic"],
          },
        };

      case "hero":
        return [
          "alchemy",
          "artistic",
          "jewellery",
          "sewing",
          "cuisine",
          "cabinet-making",
          "forge",
          "engineering",
          "leatherworking",
          "song",
          "dance",
          "music",
          "civilisation",
          "language",
          "monstrology",
          "runic",
          "science",
          "symbolism",
          "zoology",
          "strategy",
          "hunting",
          "construction",
          "dressage",
          "nature",
          "fishing",
          "transport",
          "theft",
          "medecine",
          "martial",
          "air",
          "druidic",
          "water",
          "fire",
          "occult",
          "mental",
          "holy",
          "blood",
          "earth",
        ];

      default:
        return {};
    }
  }

  static getKnowledgeLabel(path_to_key) {
    let knowledges_with_extenstion = [
      "civilisation",
      "language",
      "monstrology",
      "zoology",
    ];
    if (
      path_to_key.length == 4 &&
      knowledges_with_extenstion.includes(path_to_key[2])
    ) {
      switch (path_to_key[2]) {
        case "civilisation":
          return models_settings.KnowledgeArrayField.getKnowledgeLabelFromId(
            game.settings.get("atoria", "civilisations"),
            path_to_key[3],
          );
        case "language":
          return models_settings.KnowledgeArrayField.getKnowledgeLabelFromId(
            game.settings.get("atoria", "languages"),
            path_to_key[3],
          );
        case "monstrology":
          return models_settings.KnowledgeArrayField.getKnowledgeLabelFromId(
            game.settings.get("atoria", "monstrologies"),
            path_to_key[3],
          );
        case "zoology":
          return models_settings.KnowledgeArrayField.getKnowledgeLabelFromId(
            game.settings.get("atoria", "zoologies"),
            path_to_key[3],
          );
      }
    }
    let final_local_path = ["Ruleset", ...path_to_key, "Label"];
    return buildLocalizeString(...final_local_path);
  }

  static getKnowledgeInitialSuccess(key) {
    switch (key) {
      case "air":
      case "druidic":
      case "water":
      case "fire":
      case "occult":
      case "mental":
      case "holy":
      case "blood":
      case "earth":
        return 0;

      default:
        return 10;
    }
  }

  static getSkillOrKnowledgeTitle(actor, path) {
    let path_parts = path.split(".");
    path_parts.shift();
    let skill_label =
      actor.system.schema.getField(path_parts)?.label ??
      this.getKnowledgeLabel(path_parts);

    return skill_label;
  }

  static getSkillOrKnowledgeCategoryTitle(actor, path) {
    let path_parts = path.split(".");
    path_parts.shift();
    path_parts.pop();
    let skill_cat_label = actor.system.schema.getField(path_parts)?.label;

    return skill_cat_label;
  }

  // Return the amount/value that must be restored for the time_phase (doesn't take in consideration the current amount/value)
  static getRestoredAttributes(actor, time_phase_type) {
    const restored_attributes = {};
    switch (time_phase_type) {
      case "combat":
        restored_attributes["stamina"] = actor.system.stamina.max;
        break;
      case "sleep": // also a rest
        restored_attributes["health"] = 4;
        restored_attributes["mana"] = actor.system.mana.max;
        restored_attributes["healing_inactive.amount"] = -1;
        restored_attributes["healing_inactive.medical"] = false;
        restored_attributes["healing_inactive.medical_2"] = false;
      case "rest":
        restored_attributes["mana"] =
          "mana" in restored_attributes
            ? restored_attributes["mana"]
            : 4 + actor.system.regain_rest_mana_mod;
        break;
      case "long-moon": // also a short-moon
        restored_attributes["sanity.regain_inactive"] = false;
        restored_attributes["healing_inactive.resurrection"] = false;
      case "short-moon":
        restored_attributes["endurance.regain_inactive"] = false;
        break;
    }
    return restored_attributes;
  }

  static _getEndurancePercentage(actor) {
    return Math.min(100, actor.system.endurance.value) / 100;
  }

  static getCurrentMaxMana(actor) {
    if (actor.type === "player-character") {
      return Math.max(
        1,
        Math.floor(actor.system.mana.max * this._getEndurancePercentage(actor)),
      );
    }
    return actor.system.mana.max;
  }

  static getCurrentMaxStamina(actor) {
    if (actor.type === "player-character")
      return Math.max(
        1,
        Math.floor(
          actor.system.stamina.max * this._getEndurancePercentage(actor),
        ),
      );
    return actor.system.stamina.max;
  }

  static getSkillCriticalSuccessAmount(skill_data) {
    if (!skill_data) return 0;
    const { success, critical_success_modifier } = skill_data;
    return Math.trunc(success / 10) + critical_success_modifier;
  }
  static getSkillCriticalFumbleAmount(skill_data) {
    if (!skill_data) return 0;
    const { critical_fumble_modifier } = skill_data;
    return 5 + critical_fumble_modifier;
  }

  static isBlindSkill(skill_path) {
    if (skill_path == undefined || skill_path == "") return false;
    const path_keys = skill_path.split(".");
    if (path_keys[0] !== "system") {
      console.warn("Invalid skill path");
      return false;
    }
    return path_keys[2] === "perceptions";
  }

  static getMainArmorValue(item) {
    if (!["armor"].includes(item.type)) return 0;
    if (!item.system.is_worn) return 0;
    if (item.system.position !== "torso") return 0;
    switch (item.system.armor_type) {
      case "without":
        return 0;
      case "light":
        return 1;
      case "medium":
        return 2;
      case "heavy":
        return 3;
    }
    return 0;
  }

  static getMaxHealingInactive(actor) {
    if (actor.type !== "player-character") return 0;
    return 4 - (100 - Math.min(actor.system.endurance.value, 100)) / 25;
  }

  static getWeaponSkills(_actor) {
    let weapon_skill_tree =
      RULESET.character.getSkillsTree("player-character").weapon;
    let weapon_skills = [];

    for (const martial_type in weapon_skill_tree) {
      for (const weapon_type of weapon_skill_tree[martial_type]) {
        weapon_skills.push(
          "system.skills.weapon." + martial_type + "." + weapon_type,
        );
      }
    }

    return weapon_skills;
  }

  static getAttackSaves() {
    return [
      "system.skills.physical.reflex.dodge",
      "system.skills.physical.reflex.parry",
    ];
  }

  static getOpposingSaves() {
    return [
      "system.skills.physical.reflex.dodge",
      "system.skills.physical.reflex.parry",
      "system.skills.physical.reflex.opportuneness",
      "system.skills.physical.sturdiness.tenacity",
      "system.skills.physical.sturdiness.force",
      "system.skills.physical.agility.balance",
      "system.skills.social.analyse.investigation",
      "system.skills.social.charisma.presence",
      "system.skills.social.spirit.will",
      "system.skills.social.spirit.guarding",
    ];
  }

  static getActiveKeywordsData(actor) {
    const keywords_active = {};
    for (const item of actor.items) {
      if (["weapon", "armor"].includes(item.type) && !item.system.is_worn) {
        continue;
      }
      const item_active_keywords = RULESET.item.getActiveKeywords(item);
      if (["weapon"].includes(item.type)) {
        if (
          item.system.associated_skill ==
          "system.skills.combative.weapon.shield"
        ) {
          for (let keyword of item_active_keywords) {
            if (["guard", "protection", "protect"].includes(keyword)) {
              keywords_active[keyword] = Math.min(
                (keywords_active[keyword] || 0) + item.system.keywords[keyword],
                RULESET.keywords.max_amount[keyword],
              );
            }
          }
        } else {
          if (item.system.is_secondary_weapon) {
            switch (item.system.associated_skill) {
              case "system.skills.combative.weapon.blade":
                keywords_active["guard"] = Math.min(
                  (keywords_active["guard"] || 0) + 1,
                  RULESET.keywords.max_amount.guard,
                );
                break;
              case "system.skills.combative.weapon.haft-slashing":
                keywords_active["brute"] = Math.min(
                  (keywords_active["brute"] || 0) + 1,
                  RULESET.keywords.max_amount.brute,
                );
                break;
              case "system.skills.combative.weapon.haft-bludgeonning-piercing":
                keywords_active["smash"] = Math.min(
                  (keywords_active["smash"] || 0) + 1,
                  RULESET.keywords.max_amount.smash,
                );
                break;
            }
          } else {
            for (let keyword of item_active_keywords) {
              if (!RULESET.keywords.weapon_linked.includes(keyword)) {
                keywords_active[keyword] = Math.min(
                  (keywords_active[keyword] || 0) +
                    item.system.keywords[keyword],
                  RULESET.keywords.max_amount[keyword],
                );
              }
            }
          }
        }
      } else {
        for (let keyword of item_active_keywords) {
          if (["direct"].includes(keyword)) {
            if (!Object.keys(keywords_active).includes("direct")) {
              keywords_active["direct"] = {};
            }
            keywords_active["direct"][item.system.keywords.direct_type] =
              Math.min(
                (keywords_active["direct"][item.system.keywords.direct_type] ||
                  0) + item.system.keywords.direct,
                RULESET.keywords.max_amount.direct,
              );
          } else if (["preserve", "reserve"].includes(keyword)) {
            if (!Object.keys(keywords_active).includes(keyword)) {
              keywords_active[keyword] = [];
            }
            keywords_active[keyword].push(item.uuid);
          } else {
            keywords_active[keyword] = Math.min(
              (keywords_active[keyword] || 0) + item.system.keywords[keyword],
              RULESET.keywords.max_amount[keyword],
            );
          }
        }
      }
    }

    return keywords_active;
  }

  static getSkillAssociatedKeywordsEffects(actor, item, skill_path) {
    const skill_associated_keywords_data = [];

    if (skill_path === "") {
      if (
        item !== undefined &&
        item.type === "spell" &&
        item.system.versatile
      ) {
        skill_associated_keywords_data.push(
          RULESET.character.getKeywordEffect(actor, "versatile", 1),
        );
      }
      return skill_associated_keywords_data;
    }

    const actor_active_sharable_keywords_data =
      this.getActiveSharableKeywordsLevel(actor);
    const item_active_keywords_data =
      RULESET.item.getWeaponNonSharableActiveKeywords(item);
    const active_keywords = Object.assign(
      actor_active_sharable_keywords_data,
      item_active_keywords_data,
    );

    for (const keyword_id in active_keywords) {
      let keyword_effect = RULESET.character.getKeywordEffect(
        actor,
        keyword_id,
        active_keywords[keyword_id],
      );
      if (
        keyword_effect.is_shown_on_attack ||
        keyword_effect.skill_alterations.some(
          (skill_alt) => skill_alt.associated_skill == skill_path,
        )
      ) {
        skill_associated_keywords_data.push(keyword_effect);
      }
    }

    return skill_associated_keywords_data;
  }

  static get_encumbrance_level(actor) {
    if (actor.system.encumbrance.value > actor.system.encumbrance.max) {
      return "over";
    } else if (
      actor.system.encumbrance.value >=
      actor.system.encumbrance.max - 4
    ) {
      return "limit";
    }
    return "";
  }

  static getActiveSharableKeywordsLevel(actor) {
    const keywords_active = {};
    for (const item of actor.items) {
      if (["weapon", "armor"].includes(item.type) && !item.system.is_worn) {
        continue;
      }
      if (
        item.system.is_secondary_weapon != undefined &&
        item.system.is_secondary_weapon
      ) {
        if (item.system.secondary_weapon_keyword != "") {
          keywords_active[item.system.secondary_weapon_keyword] =
            (keywords_active[item.system.secondary_weapon_keyword] || 0) + 1;
        }
        continue;
      }

      const item_active_keywords = RULESET.item.getActiveKeywords(item);

      for (let keyword of item_active_keywords) {
        if (RULESET.keywords.sharable_keywords.includes(keyword)) {
          keywords_active[keyword] =
            (keywords_active[keyword] || 0) + item.system.keywords[keyword];
        }
      }
    }

    return keywords_active;
  }

  static getKeywordEffect(actor, keyword_id, asked_level = undefined) {
    let wanted_level =
      asked_level != undefined
        ? asked_level
        : (actor.system.active_sharable_keywords_level[keyword_id] ?? 0);
    if (wanted_level <= 0) {
      return undefined;
    }
    let keyword_field = actor.system.keywords[keyword_id];
    let effect = null;
    switch (wanted_level) {
      case 1:
        effect = keyword_field.effect_level_1;
        break;
      case 2:
        effect = keyword_field.effect_level_2;
        break;
      case 3:
        effect = keyword_field.effect_level_3;
        break;
      case 4:
        effect = keyword_field.effect_level_4;
        break;
      case 5:
        effect = keyword_field.effect_level_5;
        break;
      default:
    }
    if (effect == null) {
      return this.getKeywordEffect(actor, keyword_id, wanted_level - 1);
    }
    effect["label"] = game.i18n.localize(
      actor.system.schema.getField("keywords").getField(keyword_id).label,
    );
    effect["id"] = keyword_id;
    return effect;
  }

  static get_usable_initiative(actor) {
    let initiative = actor.system.initiative;

    let obstruct_effect = this.getKeywordEffect(actor, "obstruct");
    if (obstruct_effect == undefined) return initiative;

    let effects = roll_helpers.extract_effect_from_string(
      obstruct_effect.effect,
    );

    if (effects.length > 0) {
      let initative_effect = effects.find((eff) => eff.flavor == "initiative");

      if (initative_effect != undefined) {
        initiative +=
          initative_effect.formula +
          "[" +
          game.i18n.localize("ATORIA.Ruleset.Keywords.Obstruct") +
          "]";
      }
    }

    return initiative;
  }

  static async applyTimePhases(actor, time_phases_type_to_apply) {
    let changelog_messages = [];
    let update = {};
    for (const i of actor.items) {
      for (const time_phase of time_phases_type_to_apply) {
        let item_changelog = await i.applyTimePhase(time_phase);
        changelog_messages.push(...item_changelog);
      }
    }
    if (time_phases_type_to_apply.includes("combat")) {
      {
        let previous = actor.system.stamina.value;
        let new_value = RULESET.character.getCurrentMaxStamina(actor);
        if (previous != new_value) {
          update["system.stamina.value"] = new_value;
          changelog_messages.push(
            game.i18n.format("ATORIA.Chat_message.Changelog.Regain", {
              type: game.i18n.localize(
                actor.system.schema.getField("stamina").label,
              ),
              previous: previous,
              new: new_value,
            }),
          );
        }
      }
      // mot clefs
      const active_keywords =
        RULESET.character.getActiveSharableKeywordsLevel(actor);
      for (const [keyword_id, level] of Object.entries(active_keywords)) {
        let effect = RULESET.character.getKeywordEffect(
          actor,
          keyword_id,
          level,
        );
        let previous = actor.system.keywords[keyword_id].limit_remaining;
        let new_value = effect.limit_amount;

        if (previous != new_value) {
          update[`system.keywords.${keyword_id}.limit_remaining`] = new_value;
          changelog_messages.push(
            game.i18n.format("ATORIA.Chat_message.Changelog.Regain", {
              type: game.i18n.localize(
                actor.system.schema.getField(
                  `keywords.${keyword_id}.limit_remaining`,
                ).label,
              ),
              previous: previous,
              new: new_value,
            }),
          );
        }
      }
    }
    if (time_phases_type_to_apply.includes("rest")) {
      if (!time_phases_type_to_apply.includes("sleep")) {
        let previous = actor.system.mana.value;
        let new_value = Math.min(
          previous + 4 + actor.system.regain_rest_mana_mod,
          RULESET.character.getCurrentMaxMana(actor),
        );
        if (previous != new_value) {
          update["system.mana.value"] = new_value;
          changelog_messages.push(
            game.i18n.format("ATORIA.Chat_message.Changelog.Regain", {
              type: game.i18n.localize(
                actor.system.schema.getField("mana").label,
              ),
              previous: previous,
              new: new_value,
            }),
          );
        }
      }
    }
    if (time_phases_type_to_apply.includes("sleep")) {
      {
        let previous = actor.system.health.value;
        let new_value = Math.min(previous + 4, actor.system.health.max);
        if (previous != new_value) {
          update["system.health.value"] = new_value;
          changelog_messages.push(
            game.i18n.format("ATORIA.Chat_message.Changelog.Regain", {
              type: game.i18n.localize(
                actor.system.schema.getField("health").label,
              ),
              previous: previous,
              new: new_value,
            }),
          );
        }
      }
      {
        let previous = actor.system.healing_inactive.medical ? 1 : 0;
        if (previous > 0) {
          update["system.healing_inactive.medical"] = false;
          if (actor.system.healing_inactive.medical_2) {
            previous = 2;
            update["system.healing_inactive.medical_2"] = false;
          }
          changelog_messages.push(
            game.i18n.format("ATORIA.Chat_message.Changelog.Regain", {
              type: game.i18n.localize(
                actor.system.schema.getField("healing_inactive.medical").label,
              ),
              previous: previous,
              new: 0,
            }),
          );
        }
      }
      {
        let previous = actor.system.healing_inactive.amount;
        let new_value = Math.max(previous - 1, 0);
        if (previous != new_value) {
          update["system.healing_inactive.amount"] = new_value;
          changelog_messages.push(
            game.i18n.format("ATORIA.Chat_message.Changelog.Regain", {
              type: game.i18n.localize(
                actor.system.schema.getField("healing_inactive.amount").label,
              ),
              previous: previous,
              new: new_value,
            }),
          );
        }
      }
      {
        let previous = actor.system.mana.value;
        let new_value = RULESET.character.getCurrentMaxMana(actor);
        if (previous != new_value) {
          update["system.mana.value"] = new_value;
          changelog_messages.push(
            game.i18n.format("ATORIA.Chat_message.Changelog.Regain", {
              type: game.i18n.localize(
                actor.system.schema.getField("mana").label,
              ),
              previous: previous,
              new: new_value,
            }),
          );
        }
      }
    }
    if (time_phases_type_to_apply.includes("short-moon")) {
      if (actor.type == "player-character") {
        let previous = actor.system.endurance.regain_inactive;
        let new_value = false;
        if (previous != new_value) {
          update["system.endurance.regain_inactive"] = new_value;
          changelog_messages.push(
            game.i18n.format("ATORIA.Chat_message.Changelog.Regain", {
              type: game.i18n.localize(
                actor.system.schema.getField("endurance.regain_inactive").label,
              ),
              previous: previous,
              new: new_value,
            }),
          );
        }
      }
    }
    if (time_phases_type_to_apply.includes("long-moon")) {
      if (actor.type == "player-character") {
        let previous = actor.system.sanity.regain_inactive;
        let new_value = false;
        if (previous != new_value) {
          update["system.sanity.regain_inactive"] = new_value;
          changelog_messages.push(
            game.i18n.format("ATORIA.Chat_message.Changelog.Regain", {
              type: game.i18n.localize(
                actor.system.schema.getField("sanity.regain_inactive").label,
              ),
              previous: previous,
              new: new_value,
            }),
          );
        }
      }
      {
        let previous = actor.system.healing_inactive.resurrection;
        let new_value = false;
        if (previous != new_value) {
          update["system.healing_inactive.resurrection"] = new_value;
          changelog_messages.push(
            game.i18n.format("ATORIA.Chat_message.Changelog.Regain", {
              type: game.i18n.localize(
                actor.system.schema.getField("healing_inactive.resurrection")
                  .label,
              ),
              previous: previous,
              new: new_value,
            }),
          );
        }
      }
    }
    actor.update(update);
    return changelog_messages;
  }
};

RULESET["item"] = class ItemRuleset {
  static getActableModifiersApplicable(item) {
    if (item.actor === undefined || item.actor === null) return [];
    const available_actable_modifiers = [];
    for (let i of item.actor.getActableModifierList()) {
      if (this.isActableModifierApplicable(item, i))
        available_actable_modifiers.push(i);
    }
    return available_actable_modifiers;
  }

  static getActableModifiersTypedApplicable(item) {
    if (item.type !== "weapon") {
      console.error("Invalid call, only weapon have typed modifier data");
      return [];
    }
    let actable_mod_list = this.getActableModifiersApplicable(item);

    return actable_mod_list.map((actable_mod) => {
      let found_item = foundry.utils.deepClone(
        item.system.usable_actable_modifiers_typed.find(
          (data) => data.uuid === actable_mod._id,
        ),
      );
      if (found_item === undefined) {
        found_item = {
          actable: actable_mod,
          main: false,
          throw: false,
          focuser: false,
        };
      } else {
        found_item.actable = actable_mod;
      }
      return found_item;
    });
  }

  static isActableModifierApplicable(item, actable_modifier) {
    if (!["technique", "incantatory-addition"].includes(actable_modifier.type))
      return false;
    switch (item.type) {
      case "spell":
        if (actable_modifier.type === "incantatory-addition") return true;
        break;
      case "action":
        if (actable_modifier.type === "incantatory-addition")
          return item.system.is_magic;
        if (actable_modifier.type === "technique") return !item.system.is_magic;
        break;
      case "weapon":
        if (actable_modifier.type === "technique") return true;
        break;
    }
    return false;
  }

  static getActiveKeywords(item) {
    if (item === null || item === undefined) return [];
    if (!["kit", "weapon", "armor"].includes(item.type)) return [];
    const keywords_active = new Set();
    const ignored_key = [
      "reserve_max",
      "reserve_current",
      "sly_amount",
      "direct_type",
      "preserve",
      "preserve_mana",
      "preserve_health",
      "preserve_stamina",
      "preserve_endurance",
      "preserve_sanity",
    ];
    for (const keyword of Object.keys(item.system.keywords)) {
      if (ignored_key.includes(keyword)) {
        switch (keyword) {
          case "preserve":
            if (item.system.keywords.preserve.active) {
              keywords_active.add(keyword);
            }
            break;
          default:
            continue;
        }
      } else {
        if (Number(item.system.keywords[keyword]) > 0) {
          keywords_active.add(keyword);
        }
      }
    }
    return keywords_active;
  }

  static getWeaponLinkedActiveKeywords(item) {
    let active_keywords = this.getActiveKeywords(item);
    return active_keywords.filter((key) =>
      RULESET.keywords.weapon_linked.includes(key),
    );
  }

  static getWeaponNonSharableActiveKeywords(item) {
    if (item == undefined) return {};
    const active_keywords = this.getActiveKeywords(item).filter(
      (key) => !RULESET.keywords.sharable_keywords.includes(key),
    );
    const active_keyswords_data = {};
    for (const keyword_id of active_keywords) {
      active_keyswords_data[keyword_id] = item.system.keywords[keyword_id];
    }
    return active_keyswords_data;
  }

  static attackFromWeapon(item) {
    const new_item = foundry.utils.deepClone(item);
    new_item.system.cost_list = [];
    if (new_item.system.associated_skill || item.system.is_focuser) {
      new_item.system.cost_list.push(RULESET.general.getCostWeaponAttack(item));
    }
    return new_item;
  }

  static getSavesAsked(item) {
    return item.system.savesAsked ?? [];
  }

  static applyRollDataRules(item, roll_data) {
    if (
      item.type == "weapon" &&
      roll_data.path == RULESET.character.THROW_SKILL_PATH
    ) {
      roll_data.dos_mod -= 2;
    }
  }

  static isCompatibleItemFromMartialRoll(item, martial_type) {
    if (item.type != "weapon") return false;
    console.debug("isCompatibleItemFromMartialRoll");
    console.debug(martial_type);
    switch (martial_type) {
      case "contact":
        return item.system.associated_skill.startsWith(
          RULESET.character.MARTIAL_CONTACT_WEAPON_PATH,
        );

      case "apart":
        return true;

      case "instrument":
        return item.system.associated_skill.startsWith(
          RULESET.character.MARTIAL_INSTRUMENT_WEAPON_PATH,
        );

      default:
        return false;
    }
  }

  static getApplicableWeaponSkillFromKnowledge(
    actor,
    weapon_data,
    martial_knowledge_type,
  ) {
    let skills = [];

    switch (martial_knowledge_type) {
      case "contact":
        if (
          weapon_data.system.associated_skill.startsWith(
            RULESET.character.MARTIAL_CONTACT_WEAPON_PATH,
          )
        ) {
          skills.push(
            actor.getSkillFromPath(weapon_data.system.associated_skill),
          );
        }
        break;
      case "apart":
        if (
          weapon_data.system.is_focuser &&
          weapon_data.system.associated_skill !=
            RULESET.character.WAND_SKILL_PATH
        ) {
          skills.push(
            actor.getSkillFromPath(RULESET.character.ENCHANTED_SKILL_PATH),
          );
        }
        {
          let asso_skill = foundry.utils.deepClone(
            actor.getSkillFromPath(weapon_data.system.associated_skill),
          );
          if (
            !weapon_data.system.associated_skill.startsWith(
              RULESET.character.MARTIAL_APART_WEAPON_PATH,
            )
          ) {
            asso_skill.label = game.i18n.localize(
              "ATORIA.Ruleset.Attack.Throw",
            );
          }
          skills.push(asso_skill);
        }
        break;
      case "instrument":
        if (
          weapon_data.system.associated_skill.startsWith(
            RULESET.character.MARTIAL_INSTRUMENT_WEAPON_PATH,
          )
        ) {
          skills.push(
            actor.getSkillFromPath(weapon_data.system.associated_skill),
          );
        }
        break;
    }
    return skills;
  }

  static getFinalSkillDataFromKnowledgeAndWeapon(
    knowledge_skill,
    weapon_skill,
  ) {
    let skill_data = {
      success: knowledge_skill.success + weapon_skill.success,
      mastery: knowledge_skill.mastery + weapon_skill.mastery,
      critical_success_modifier:
        knowledge_skill.critical_success_modifier +
        weapon_skill.critical_success_modifier,
      critical_fumble_modifier:
        knowledge_skill.critical_fumble_modifier +
        weapon_skill.critical_fumble_modifier,
    };

    skill_data.usable_keywords = [];
    if (knowledge_skill.usable_keywords.length > 0)
      skill_data.usable_keywords.push(...knowledge_skill.usable_keywords);
    if (weapon_skill.usable_keywords.length > 0)
      skill_data.usable_keywords.push(...weapon_skill.usable_keywords);

    skill_data.usable_perks = [];
    if (knowledge_skill.usable_perks.length > 0)
      skill_data.usable_perks.push(...knowledge_skill.usable_perks);
    if (weapon_skill.usable_perks.length > 0)
      skill_data.usable_perks.push(...weapon_skill.usable_perks);

    return {
      success: skill_data.success,
      critical_success_amount:
        RULESET.character.getSkillCriticalSuccessAmount(skill_data),
      critical_fumble_amount:
        RULESET.character.getSkillCriticalFumbleAmount(skill_data),
      label: weapon_skill.label,
      path: knowledge_skill.path + "///" + weapon_skill.path,
      proper_label: weapon_skill.proper_label,

      usable_keywords: skill_data.usable_keywords,
      usable_perks: skill_data.usable_perks,

      type: "skill",
    };
  }
};

RULESET["time_phases"] = {
  permanent: "ATORIA.Ruleset.Time_phase.Permanent",
  combat: "ATORIA.Ruleset.Time_phase.Combat",
  rest: "ATORIA.Ruleset.Time_phase.Rest",
  sleep: "ATORIA.Ruleset.Time_phase.Sleep",
  "short-moon": "ATORIA.Ruleset.Time_phase.Short_moon",
  "long-moon": "ATORIA.Ruleset.Time_phase.Long_moon",
};

RULESET["time_units"] = {
  second: "ATORIA.Ruleset.Time_unit.Seconds",
  turn: "ATORIA.Ruleset.Time_unit.Turns",
  round: "ATORIA.Ruleset.Time_unit.Rounds",
  minute: "ATORIA.Ruleset.Time_unit.Minutes",
  hour: "ATORIA.Ruleset.Time_unit.Hours",
};

RULESET["skill_alterations"] = {
  hand_handled: "ATORIA.Model.Skill_alteration.Hand_handled",
  one_degree_of_success_gain:
    "ATORIA.Model.Skill_alteration.One_degree_of_success_gain",
  one_degree_of_success_loss:
    "ATORIA.Model.Skill_alteration.One_degree_of_success_loss",
  two_degree_of_success_gain:
    "ATORIA.Model.Skill_alteration.Two_degree_of_success_gain",
  two_degree_of_success_loss:
    "ATORIA.Model.Skill_alteration.Two_degree_of_success_loss",
  advantage: "ATORIA.Model.Skill_alteration.Advantage",
  disadvantage: "ATORIA.Model.Skill_alteration.Disadvantage",
  advantage_n_one_degree_of_success_gain:
    "ATORIA.Model.Skill_alteration.Advantage_n_One_degree_of_success_gain",
  disadvantage_n_one_degree_of_success_loss:
    "ATORIA.Model.Skill_alteration.Disadvantage_n_One_degree_of_success_loss",
};

RULESET["aiming"] = {
  type: {
    //TODO: adapt to new ruleset
    none: "ATORIA.Ruleset.Aiming.None.Label",
    arm: "ATORIA.Ruleset.Aiming.Arm.Label",
    hand: "ATORIA.Ruleset.Aiming.Hand.Label",
    leg: "ATORIA.Ruleset.Aiming.Leg.Label",
    foot: "ATORIA.Ruleset.Aiming.Foot.Label",
    neck: "ATORIA.Ruleset.Aiming.Neck.Label",
    joint: "ATORIA.Ruleset.Aiming.Joint.Label",
    head: "ATORIA.Ruleset.Aiming.Head.Label",
  },
  description: {
    none: "ATORIA.Ruleset.Aiming.None.Description",
    arm: "ATORIA.Ruleset.Aiming.Arm.Description",
    hand: "ATORIA.Ruleset.Aiming.Hand.Description",
    leg: "ATORIA.Ruleset.Aiming.Leg.Description",
    foot: "ATORIA.Ruleset.Aiming.Foot.Description",
    neck: "ATORIA.Ruleset.Aiming.Neck.Description",
    joint: "ATORIA.Ruleset.Aiming.Joint.Description",
    head: "ATORIA.Ruleset.Aiming.Head.Description",
  },
  dos_mod: {
    none: 0,
    arm: -1,
    hand: -2,
    leg: -1,
    foot: -2,
    neck: -3,
    joint: -2,
    head: -3,
  },
  get_alteration: function (aiming_type) {
    return {
      dos_mod: this.dos_mod[aiming_type],
      adv_amount: 0,
      disadv_amount: 0,
    };
  },
  saves_asked: {
    none: [],
    arm: ["system.skills.physical.sturdiness.tenacity"],
    hand: [],
    leg: ["system.skills.physical.sturdiness.tenacity"],
    foot: [],
    neck: [],
    joint: [],
    head: ["system.skills.physical.sturdiness.tenacity"],
  },
  get_descriptive_html: function (aiming_type) {
    if (aiming_type === "none") {
      return "";
    }
    return `
    <label data-tooltip="${game.i18n.localize(this.description[aiming_type])}">${game.i18n.localize("ATORIA.Dialog.Roll.Aiming")}: ${game.i18n.localize(this.type[aiming_type])}</label>
    `;
  },
};

RULESET["keywords"] = {
  with_type: {
    preserve: {
      mana: "ATORIA.Ruleset.Mana",
      health: "ATORIA.Ruleset.Health",
      stamina: "ATORIA.Ruleset.Stamina",
      sanity: "ATORIA.Ruleset.Sanity",
      endurance: "ATORIA.Ruleset.Endurance",
      all: "ATORIA.Ruleset.All",
    },
  },
  max_amount: {
    two_handed: 5,
    reach: 5,
    brute: 5,
    deployable: 5,
    smash: 5,
    guard: 5,
    throwable: 5,
    light: 5,
    heavy: 5,
    penetrating: 5,
    versatile: 5,
    quick: 5,
    recharge: 5,
    somatic: 5,
    reserve: 5,
    sly: 5,

    noisy: 4,
    obstruct: 4,
    restrictive: 4,

    gruff: 4,
    tough: 4,
    grip: 4,
    resistant: 4,
    sturdy: 4,
    stable: 4,

    direct: 4,
    preserve: 1,
  },
  weapon_linked: [
    "two_handed",
    "deployable",
    "smash",
    "throwable",
    "heavy",
    "versatile",
    "quick",
    "recharge",
    "somatic",
    "reserve",
    "sly",
    "preserve",
  ],

  get_description: function (keyword_id, amount) {
    let pluses = "";
    for (let i = 1; i < amount; i++) {
      pluses += "+";
    }
    return game.i18n.localize(
      buildLocalizeString("Ruleset", "Keywords_description", keyword_id) +
        pluses,
    );
  },

  get_localized_name: function (keyword_id, amount) {
    let pluses = "";
    for (let i = 1; i < amount; i++) {
      pluses += "+";
    }
    return (
      game.i18n.localize(
        buildLocalizeString("Ruleset", "Keywords", keyword_id),
      ) + pluses
    );
  },

  sharable_keywords: [
    "brute",
    "guard",
    "smash",
    "noisy",
    "obstruct",
    "restrictive",
    "gruff",
    "tough",
    "grip",
    "resistant",
    "sturdy",
    "stable",
    "direct",
  ],

  getKeywordsList: function () {
    return [
      {
        id: "brute",
        is_shown_on_attack: true,
        initial_levels: [
          {
            effect: "Utilises ta brute ! Opportunité de qualité",
            skill_alterations: [
              {
                associated_skill: RULESET.character.OPPORTUNITY_SKILL_PATH,
                dos_mod: 1,
                adv_amount: 0,
                disadv_amount: 0,
              },
              {
                associated_skill: RULESET.character.ENCHANTED_SKILL_PATH,
                dos_mod: 2,
                adv_amount: 1,
                disadv_amount: 0,
              },
            ],
            limit_amount: 1,
          },
          {
            effect: "Utilises ta brute !!!!!!!!! Opportunité de qualité",
            skill_alterations: [
              {
                associated_skill: RULESET.character.OPPORTUNITY_SKILL_PATH,
                dos_mod: 10,
                adv_amount: 0,
                disadv_amount: 0,
              },
              {
                associated_skill: RULESET.character.ENCHANTED_SKILL_PATH,
                dos_mod: 20,
                adv_amount: 1,
                disadv_amount: 0,
              },
            ],
            limit_amount: 1,
          },
          {
            effect: "Utilises ta brute !!!!!!!!! Opportunité de qualité",
            skill_alterations: [
              {
                associated_skill: RULESET.character.OPPORTUNITY_SKILL_PATH,
                dos_mod: 10,
                adv_amount: 0,
                disadv_amount: 0,
              },
              {
                associated_skill: RULESET.character.ENCHANTED_SKILL_PATH,
                dos_mod: 20,
                adv_amount: 1,
                disadv_amount: 0,
              },
            ],
            limit_amount: 1,
          },
          {
            effect: "Utilises ta brute !!!!!!!!! Opportunité de qualité",
            skill_alterations: [
              {
                associated_skill: RULESET.character.OPPORTUNITY_SKILL_PATH,
                dos_mod: 10,
                adv_amount: 0,
                disadv_amount: 0,
              },
              {
                associated_skill: RULESET.character.ENCHANTED_SKILL_PATH,
                dos_mod: 20,
                adv_amount: 1,
                disadv_amount: 0,
              },
            ],
            limit_amount: 1,
          },
          {
            effect: "Utilises ta brute !!!!!!!!! Opportunité de qualité",
            skill_alterations: [
              {
                associated_skill: RULESET.character.OPPORTUNITY_SKILL_PATH,
                dos_mod: 10,
                adv_amount: 0,
                disadv_amount: 0,
              },
              {
                associated_skill: RULESET.character.ENCHANTED_SKILL_PATH,
                dos_mod: 20,
                adv_amount: 1,
                disadv_amount: 0,
              },
            ],
            limit_amount: 1,
          },
        ],
        label: "ATORIA.Ruleset.Keywords.Brute",
      },
      {
        id: "obstruct",
        is_shown_on_attack: false,
        initial_levels: [
          {
            effect: "[[-1]]{initiative}",
            skill_alterations: [],
            limit_amount: 0,
          },
          {
            effect: "[[-1d2]]{initiative}",
            skill_alterations: [],
            limit_amount: 0,
          },
        ],
        label: "ATORIA.Ruleset.Keywords.Obstruct",
      },
    ];
  },
};

RULESET["armor"] = {
  positions: {
    head: "ATORIA.Ruleset.Armor.Position.Head",
    neck: "ATORIA.Ruleset.Armor.Position.Neck",
    torso: "ATORIA.Ruleset.Armor.Position.Torso",
    shoulders: "ATORIA.Ruleset.Armor.Position.Shoulders",
    arms: "ATORIA.Ruleset.Armor.Position.Arms",
    hands: "ATORIA.Ruleset.Armor.Position.Hands",
    waist: "ATORIA.Ruleset.Armor.Position.Waist",
    legs: "ATORIA.Ruleset.Armor.Position.Legs",
    feet: "ATORIA.Ruleset.Armor.Position.Feet",
    rings: "ATORIA.Ruleset.Armor.Position.Rings",
  },
  types: {
    without: "ATORIA.Ruleset.Armor.Type.Without",
    light: "ATORIA.Ruleset.Armor.Type.Light",
    medium: "ATORIA.Ruleset.Armor.Type.Medium",
    heavy: "ATORIA.Ruleset.Armor.Type.Heavy",
  },
};

RULESET["actable"] = {
  somatic_types: {
    none: "ATORIA.Ruleset.Somatic.None",
    gesture: "ATORIA.Ruleset.Somatic.Gesture",
    one_hand: "ATORIA.Ruleset.Somatic.One_hand",
    two_hands: "ATORIA.Ruleset.Somatic.Two_hands",
    meditate: "ATORIA.Ruleset.Somatic.Meditate",
  },
  associated_magic_schools: {
    "system.knowledges.magic.air.dazzling": buildLocalizeString(
      "ruleset",
      "knowledges",
      "magic",
      "air",
      "dazzling",
      "full_label",
    ),
    "system.knowledges.magic.air.breeze": buildLocalizeString(
      "ruleset",
      "knowledges",
      "magic",
      "air",
      "breeze",
      "full_label",
    ),
    "system.knowledges.magic.air.lightning": buildLocalizeString(
      "ruleset",
      "knowledges",
      "magic",
      "air",
      "lightning",
      "full_label",
    ),
    "system.knowledges.magic.mental.kinetic": buildLocalizeString(
      "ruleset",
      "knowledges",
      "magic",
      "mental",
      "kinetic",
      "full_label",
    ),
    "system.knowledges.magic.mental.illusion": buildLocalizeString(
      "ruleset",
      "knowledges",
      "magic",
      "mental",
      "illusion",
      "full_label",
    ),
    "system.knowledges.magic.mental.power": buildLocalizeString(
      "ruleset",
      "knowledges",
      "magic",
      "mental",
      "power",
      "full_label",
    ),
    "system.knowledges.magic.mental.enchanted": buildLocalizeString(
      "ruleset",
      "knowledges",
      "magic",
      "mental",
      "enchanted",
      "full_label",
    ),
    "system.knowledges.magic.druidic.astral": buildLocalizeString(
      "ruleset",
      "knowledges",
      "magic",
      "druidic",
      "astral",
      "full_label",
    ),
    "system.knowledges.magic.druidic.solicitude": buildLocalizeString(
      "ruleset",
      "knowledges",
      "magic",
      "druidic",
      "solicitude",
      "full_label",
    ),
    "system.knowledges.magic.druidic.changeforme": buildLocalizeString(
      "ruleset",
      "knowledges",
      "magic",
      "druidic",
      "changeforme",
      "full_label",
    ),
    "system.knowledges.magic.druidic.mutation": buildLocalizeString(
      "ruleset",
      "knowledges",
      "magic",
      "druidic",
      "mutation",
      "full_label",
    ),
    "system.knowledges.magic.water.ablution": buildLocalizeString(
      "ruleset",
      "knowledges",
      "magic",
      "water",
      "ablution",
      "full_label",
    ),
    "system.knowledges.magic.water.source": buildLocalizeString(
      "ruleset",
      "knowledges",
      "magic",
      "water",
      "source",
      "full_label",
    ),
    "system.knowledges.magic.water.ice": buildLocalizeString(
      "ruleset",
      "knowledges",
      "magic",
      "water",
      "ice",
      "full_label",
    ),
    "system.knowledges.magic.fire.torch": buildLocalizeString(
      "ruleset",
      "knowledges",
      "magic",
      "fire",
      "torch",
      "full_label",
    ),
    "system.knowledges.magic.fire.ignition": buildLocalizeString(
      "ruleset",
      "knowledges",
      "magic",
      "fire",
      "ignition",
      "full_label",
    ),
    "system.knowledges.magic.fire.destruction": buildLocalizeString(
      "ruleset",
      "knowledges",
      "magic",
      "fire",
      "destruction",
      "full_label",
    ),
    "system.knowledges.magic.occult.toxic": buildLocalizeString(
      "ruleset",
      "knowledges",
      "magic",
      "occult",
      "toxic",
      "full_label",
    ),
    "system.knowledges.magic.occult.curse": buildLocalizeString(
      "ruleset",
      "knowledges",
      "magic",
      "occult",
      "curse",
      "full_label",
    ),
    "system.knowledges.magic.occult.ethereal": buildLocalizeString(
      "ruleset",
      "knowledges",
      "magic",
      "occult",
      "ethereal",
      "full_label",
    ),
    "system.knowledges.magic.occult.necromancy": buildLocalizeString(
      "ruleset",
      "knowledges",
      "magic",
      "occult",
      "necromancy",
      "full_label",
    ),
    "system.knowledges.magic.holy.blessing": buildLocalizeString(
      "ruleset",
      "knowledges",
      "magic",
      "holy",
      "blessing",
      "full_label",
    ),
    "system.knowledges.magic.holy.piety": buildLocalizeString(
      "ruleset",
      "knowledges",
      "magic",
      "holy",
      "piety",
      "full_label",
    ),
    "system.knowledges.magic.holy.glory": buildLocalizeString(
      "ruleset",
      "knowledges",
      "magic",
      "holy",
      "glory",
      "full_label",
    ),
    "system.knowledges.magic.holy.purification": buildLocalizeString(
      "ruleset",
      "knowledges",
      "magic",
      "holy",
      "purification",
      "full_label",
    ),
    "system.knowledges.magic.blood.sacrifice": buildLocalizeString(
      "ruleset",
      "knowledges",
      "magic",
      "blood",
      "sacrifice",
      "full_label",
    ),
    "system.knowledges.magic.blood.puncture": buildLocalizeString(
      "ruleset",
      "knowledges",
      "magic",
      "blood",
      "puncture",
      "full_label",
    ),
    "system.knowledges.magic.blood.drain": buildLocalizeString(
      "ruleset",
      "knowledges",
      "magic",
      "blood",
      "drain",
      "full_label",
    ),
    "system.knowledges.magic.earth.bastion": buildLocalizeString(
      "ruleset",
      "knowledges",
      "magic",
      "earth",
      "bastion",
      "full_label",
    ),
    "system.knowledges.magic.earth.telluric": buildLocalizeString(
      "ruleset",
      "knowledges",
      "magic",
      "earth",
      "telluric",
      "full_label",
    ),
    "system.knowledges.magic.earth.metallic": buildLocalizeString(
      "ruleset",
      "knowledges",
      "magic",
      "earth",
      "metallic",
      "full_label",
    ),
  },
};

RULESET["status_effects"] = [
  {
    id: "preparing",
    name: "ATORIA.Ruleset.Status_effect.Preparing.Label",
    img: "systems/atoria/imgs/gift-of-knowledge.svg",
    description: "ATORIA.Ruleset.Status_effect.Preparing.Description",
  },
  {
    id: "evocation",
    name: "ATORIA.Ruleset.Status_effect.Evocation.Label",
    img: "systems/atoria/imgs/bolt-spell-cast.svg",
    description: "ATORIA.Ruleset.Status_effect.Evocation.Description",
  },
  {
    id: "channelling",
    name: "ATORIA.Ruleset.Status_effect.Channelling.Label",
    img: "systems/atoria/imgs/brainstorm.svg",
    description: "ATORIA.Ruleset.Status_effect.Channelling.Description",
  },
  {
    id: "concentration",
    name: "ATORIA.Ruleset.Status_effect.Concentration.Label",
    img: "systems/atoria/imgs/brain.svg",
    description: "ATORIA.Ruleset.Status_effect.Concentration.Description",
  },
  {
    id: "unconscious",
    name: "ATORIA.Ruleset.Status_effect.Unconscious.Label",
    img: "icons/svg/unconscious.svg",
    description: "ATORIA.Ruleset.Status_effect.Unconscious.Description",
  },
  {
    id: "bleeding",
    name: "ATORIA.Ruleset.Status_effect.Bleeding.Label",
    img: "systems/atoria/imgs/bleeding-wound.svg",
    description: "ATORIA.Ruleset.Status_effect.Bleeding.Description",
  },
  {
    id: "brutal",
    name: "ATORIA.Ruleset.Status_effect.Brutal.Label",
    img: "systems/atoria/imgs/chopped-skull.svg",
    description: "ATORIA.Ruleset.Status_effect.Brutal.Description",
  },
  {
    id: "enraged",
    name: "ATORIA.Ruleset.Status_effect.Enraged.Label",
    img: "systems/atoria/imgs/enrage.svg",
    description: "ATORIA.Ruleset.Status_effect.Enraged.Description",
  },
  {
    id: "slowed",
    name: "ATORIA.Ruleset.Status_effect.Slowed.Label",
    img: "systems/atoria/imgs/sticky-boot.svg",
    description: "ATORIA.Ruleset.Status_effect.Slowed.Description",
  },
  {
    id: "prone",
    name: "ATORIA.Ruleset.Status_effect.Prone.Label",
    img: "icons/svg/falling.svg",
    description: "ATORIA.Ruleset.Status_effect.Prone.Description",
  },
  {
    id: "immobilised",
    name: "ATORIA.Ruleset.Status_effect.Immobilised.Label",
    img: "icons/svg/net.svg",
    description: "ATORIA.Ruleset.Status_effect.Immobilised.Description",
  },
  {
    id: "disability",
    name: "ATORIA.Ruleset.Status_effect.Disability.Label",
    img: "systems/atoria/imgs/imprisoned.svg",
    description: "ATORIA.Ruleset.Status_effect.Disability.Description",
  },
  {
    id: "moist",
    name: "ATORIA.Ruleset.Status_effect.Moist.Label",
    img: "systems/atoria/imgs/water-drop.svg",
    description: "ATORIA.Ruleset.Status_effect.Moist.Description",
  },
  {
    id: "frostbite",
    name: "ATORIA.Ruleset.Status_effect.Frostbite.Label",
    img: "systems/atoria/imgs/snowflake-1.svg",
    description: "ATORIA.Ruleset.Status_effect.Frostbite.Description",
  },
  {
    id: "burning",
    name: "ATORIA.Ruleset.Status_effect.Burning.Label",
    img: "systems/atoria/imgs/flame.svg",
    description: "ATORIA.Ruleset.Status_effect.Burning.Description",
  },
  {
    id: "burning+",
    name: "ATORIA.Ruleset.Status_effect.Burning+.Label",
    img: "systems/atoria/imgs/flame+.svg",
    description: "ATORIA.Ruleset.Status_effect.Burning+.Description",
  },
  {
    id: "radiate",
    name: "ATORIA.Ruleset.Status_effect.Radiate.Label",
    img: "icons/svg/paralysis.svg",
    description: "ATORIA.Ruleset.Status_effect.Radiate.Description",
  },
  {
    id: "conductive",
    name: "ATORIA.Ruleset.Status_effect.Conductive.Label",
    img: "systems/atoria/imgs/lightning-arc.svg",
    description: "ATORIA.Ruleset.Status_effect.Conductive.Description",
  },
  {
    id: "dazed",
    name: "ATORIA.Ruleset.Status_effect.Dazed.Label",
    img: "systems/atoria/imgs/electric.svg",
    description: "ATORIA.Ruleset.Status_effect.Dazed.Description",
  },
  {
    id: "shocked",
    name: "ATORIA.Ruleset.Status_effect.Shocked.Label",
    img: "icons/svg/lightning.svg",
    description: "ATORIA.Ruleset.Status_effect.Shocked.Description",
  },
  {
    id: "stunned",
    name: "ATORIA.Ruleset.Status_effect.Stunned.Label",
    img: "systems/atoria/imgs/knocked-out-stars.svg",
    description: "ATORIA.Ruleset.Status_effect.Stunned.Description",
  },
  {
    id: "banished",
    name: "ATORIA.Ruleset.Status_effect.Banished.Label",
    img: "systems/atoria/imgs/portal.svg",
    description: "ATORIA.Ruleset.Status_effect.Banished.Description",
  },
  {
    id: "drunk",
    name: "ATORIA.Ruleset.Status_effect.Drunk.Label",
    img: "systems/atoria/imgs/beer-stein.svg",
    description: "ATORIA.Ruleset.Status_effect.Drunk.Description",
  },
  {
    id: "hangover",
    name: "ATORIA.Ruleset.Status_effect.Hangover.Label",
    img: "systems/atoria/imgs/beer-stein+.svg",
    description: "ATORIA.Ruleset.Status_effect.Hangover.Description",
  },
  {
    id: "tired",
    name: "ATORIA.Ruleset.Status_effect.Tired.Label",
    img: "systems/atoria/imgs/tired-eye.svg",
    description: "ATORIA.Ruleset.Status_effect.Tired.Description",
  },
  {
    id: "hungry",
    name: "ATORIA.Ruleset.Status_effect.Hungry.Label",
    img: "systems/atoria/imgs/meat.svg",
    description: "ATORIA.Ruleset.Status_effect.Hungry.Description",
  },
  {
    id: "dehydrated",
    name: "ATORIA.Ruleset.Status_effect.Dehydrated.Label",
    img: "systems/atoria/imgs/waterskin.svg",
    description: "ATORIA.Ruleset.Status_effect.Dehydrated.Description",
  },
  {
    id: "rested",
    name: "ATORIA.Ruleset.Status_effect.Rested.Label",
    img: "icons/svg/sleep.svg",
    description: "ATORIA.Ruleset.Status_effect.Rested.Description",
  },
  {
    id: "deaf",
    name: "ATORIA.Ruleset.Status_effect.Deaf.Label",
    img: "icons/svg/deaf.svg",
    description: "ATORIA.Ruleset.Status_effect.Deaf.Description",
  },
  {
    id: "silenced",
    name: "ATORIA.Ruleset.Status_effect.Silenced.Label",
    img: "icons/svg/silenced.svg",
    description: "ATORIA.Ruleset.Status_effect.Silenced.Description",
  },
  {
    id: "numb",
    name: "ATORIA.Ruleset.Status_effect.Numb.Label",
    img: "systems/atoria/imgs/hand-bandage.svg",
    description: "ATORIA.Ruleset.Status_effect.Numb.Description",
  },
  {
    id: "numb+",
    name: "ATORIA.Ruleset.Status_effect.Numb+.Label",
    img: "systems/atoria/imgs/hand-bandage+.svg",
    description: "ATORIA.Ruleset.Status_effect.Numb+.Description",
  },
  {
    id: "blindness",
    name: "ATORIA.Ruleset.Status_effect.Blindness.Label",
    img: "icons/svg/blind.svg",
    description: "ATORIA.Ruleset.Status_effect.Blindness.Description",
  },
  {
    id: "invisible",
    name: "ATORIA.Ruleset.Status_effect.Invisible.Label",
    img: "icons/svg/invisible.svg",
    description: "ATORIA.Ruleset.Status_effect.Invisible.Description",
  },
  {
    id: "afraid",
    name: "ATORIA.Ruleset.Status_effect.Afraid.Label",
    img: "systems/atoria/imgs/dread.svg",
    description: "ATORIA.Ruleset.Status_effect.Afraid.Description",
  },
  {
    id: "panic",
    name: "ATORIA.Ruleset.Status_effect.Panic.Label",
    img: "systems/atoria/imgs/run.svg",
    description: "ATORIA.Ruleset.Status_effect.Panic.Description",
  },
  {
    id: "terrified",
    name: "ATORIA.Ruleset.Status_effect.Terrified.Label",
    img: "icons/svg/terror.svg",
    description: "ATORIA.Ruleset.Status_effect.Terrified.Description",
  },
  {
    id: "dead",
    name: "ATORIA.Ruleset.Status_effect.Dead.Label",
    img: "icons/svg/skull.svg",
    description: "ATORIA.Ruleset.Status_effect.Dead.Description",
  },
  {
    id: "seduced",
    name: "ATORIA.Ruleset.Status_effect.Seduced.Label",
    img: "systems/atoria/imgs/charm.svg",
    description: "ATORIA.Ruleset.Status_effect.Seduced.Description",
  },
  {
    id: "charmed",
    name: "ATORIA.Ruleset.Status_effect.Charmed.Label",
    img: "systems/atoria/imgs/hearts.svg",
    description: "ATORIA.Ruleset.Status_effect.Charmed.Description",
  },
  {
    id: "captivated",
    name: "ATORIA.Ruleset.Status_effect.Captivated.Label",
    img: "systems/atoria/imgs/lovers.svg",
    description: "ATORIA.Ruleset.Status_effect.Captivated.Description",
  },
  {
    id: "control",
    name: "ATORIA.Ruleset.Status_effect.Control.Label",
    img: "systems/atoria/imgs/puppet.svg",
    description: "ATORIA.Ruleset.Status_effect.Control.Description",
  },
  {
    id: "provoked",
    name: "ATORIA.Ruleset.Status_effect.Provoked.Label",
    img: "systems/atoria/imgs/angry-eyes.svg",
    description: "ATORIA.Ruleset.Status_effect.Provoked.Description",
  },
  {
    id: "provoked+",
    name: "ATORIA.Ruleset.Status_effect.Provoked+.Label",
    img: "systems/atoria/imgs/angry-eyes+.svg",
    description: "ATORIA.Ruleset.Status_effect.Provoked+.Description",
  },
  {
    id: "sharpened",
    name: "ATORIA.Ruleset.Status_effect.Sharpened.Label",
    img: "systems/atoria/imgs/sparkling-sabre.svg",
    description: "ATORIA.Ruleset.Status_effect.Sharpened.Description",
  },
];

RULESET.localized_effects = (status_effects) => {
  for (let status_effect of status_effects) {
    status_effect.description = game.i18n.localize(status_effect.description);
  }
  return status_effects;
};

RULESET.sort_effects = (status_effect_a, status_effect_b) => {
  return game.i18n
    .localize(status_effect_a.name)
    .localeCompare(game.i18n.localize(status_effect_b.name));
};

RULESET.localized_damage_type = (damage_type) => {
  damage_type =
    damage_type.charAt(0).toUpperCase() + damage_type.slice(1).toLowerCase();
  return game.i18n.localize(`ATORIA.Ruleset.Damage_type.${damage_type}`);
};

RULESET.ration_encumbrance = 0.5;

export default RULESET;
