import { itemRollDialog } from "./helpers.mjs";
import { default as default_values } from "./default-values.mjs";
import { buildLocalizeString } from "../utils/atoria-lang.mjs";

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
};

RULESET["character"] = class ActorRuleset {
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
    if (actor.type === "player-character")
      return Math.floor(
        actor.system.mana.max * this._getEndurancePercentage(actor),
      );
    return actor.system.mana.max;
  }

  static getCurrentMaxStamina(actor) {
    if (actor.type === "player-character")
      return Math.floor(
        actor.system.stamina.max * this._getEndurancePercentage(actor),
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
    const path_keys = skill_path.split(".");
    if (path_keys[0] !== "system") {
      console.warn("Invalid skill path");
      return false;
    }
    return path_keys[1] === "perceptions";
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

  static getAttackSaves() {
    return [
      "system.skills.combative.reflex.dodge",
      "system.skills.combative.reflex.parry",
    ];
  }

  static getOpposingSaves() {
    return [
      "system.skills.combative.reflex.dodge",
      "system.skills.combative.reflex.parry",
      "system.skills.physical.sturdiness.tenacity",
      "system.skills.physical.agility.balance",
      "system.skills.social.charisma.presence",
      "system.skills.social.spirit.will",
      "system.skills.social.spirit.guarding",
    ];
  }

  static getExtendableSkill() {
    return [
      "system.knowledges.erudition.civilisation",
      "system.knowledges.erudition.language",
      "system.knowledges.erudition.monstrology",
      "system.knowledges.erudition.zoology",
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

  static getSkillAssociatedKeywordsData(actor, item, skill_path) {
    const skill_associated_keywords_data = [];

    if (skill_path === "") return skill_associated_keywords_data;

    const add_keyword_data = (keyword, keyword_amount, alteration_type) => {
      skill_associated_keywords_data.push({
        name: keyword,
        label: RULESET.keywords.get_localized_name(keyword, keyword_amount),
        description: RULESET.keywords.get_description(keyword, keyword_amount),
        skill_alteration_type: alteration_type,
        skill_alteration_type_label: RULESET.skill_alterations[alteration_type],
      });
    };
    const actor_active_keywords_data = this.getActiveKeywordsData(actor);
    const item_active_keywords_data =
      RULESET.item.getWeaponLinkedActiveKeywords(item);
    const active_keywords_data = {};
    Object.keys(actor_active_keywords_data).forEach((key) => {
      active_keywords_data[key] = actor_active_keywords_data[key];
    });
    item_active_keywords_data.forEach((key) => {
      active_keywords_data[key] =
        active_keywords_data[key] || 0 + item.system.keywords[key];
    });

    const PARRY = "system.skills.combative.reflex.parry";
    const THROW = "system.skills.combative.weapon.throw";
    const FORCE = "system.skills.physical.sturdiness.force";
    const SILENCE = "system.skills.physical.slyness.silence";
    const STEALTH = "system.skills.physical.slyness.stealth";
    const WEAPON = "system.skills.combative.weapon";
    const BRAWL = "system.skills.combative.weapon.brawl";
    const TENACITY = "system.skills.physical.sturdiness.tenacity";

    if (PARRY.startsWith(skill_path) && active_keywords_data["guard"] > 0) {
      add_keyword_data(
        "guard",
        active_keywords_data["guard"],
        "one_degree_of_success_gain",
      );
    }

    if (THROW.startsWith(skill_path) && active_keywords_data["throwable"] > 0) {
      add_keyword_data(
        "throwable",
        active_keywords_data["throwable"],
        active_keywords_data["throwable"] >= 2
          ? "two_degree_of_success_gain"
          : "one_degree_of_success_gain",
      );
    }

    if (
      PARRY.startsWith(skill_path) &&
      active_keywords_data["protection"] > 0
    ) {
      add_keyword_data(
        "protection",
        active_keywords_data["protection"],
        active_keywords_data["protection"] >= 2
          ? "advantage"
          : "one_degree_of_success_gain",
      );
    }

    if (FORCE.startsWith(skill_path) && active_keywords_data["gruff"] > 0) {
      add_keyword_data(
        "gruff",
        active_keywords_data["gruff"],
        "one_degree_of_success_gain",
      );
    }

    if (
      active_keywords_data["noisy"] > 0 &&
      (SILENCE.startsWith(skill_path) || STEALTH.startsWith(skill_path))
    ) {
      add_keyword_data(
        "noisy",
        active_keywords_data["noisy"],
        active_keywords_data["noisy"] >= 3
          ? "disadvantage_n_one_degree_of_success_loss"
          : active_keywords_data["noisy"] >= 2
            ? "disadvantage"
            : "one_degree_of_success_loss",
      );
    }

    if (
      (WEAPON.startsWith(skill_path) || skill_path.startsWith(WEAPON)) &&
      BRAWL.localeCompare(skill_path) !== 0 &&
      active_keywords_data["grip"] > 0
    ) {
      add_keyword_data(
        "grip",
        active_keywords_data["grip"],
        "one_degree_of_success_gain",
      );
    }

    if (TENACITY.startsWith(skill_path) && active_keywords_data["stable"] > 0) {
      add_keyword_data(
        "stable",
        active_keywords_data["stable"],
        "one_degree_of_success_gain",
      );
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

  static attackFromWeapon(item) {
    const new_item = foundry.utils.deepClone(item);
    new_item.system.cost_list = [];
    if (new_item.system.associated_skill || item.system.is_focuser) {
      new_item.system.cost_list.push(RULESET.general.getCostWeaponAttack(item));
    }

    new_item.system.limitation = default_values.models.helpers
      .defineTimePhaseLimitation()
      .getInitialValue({});

    return new_item;
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
    two_handed: 2,
    reach: 3,
    brute: 2,
    equip: 1,
    fluxian: 1,
    smash: 3,
    guard: 2,
    throwable: 2,
    light: 1,
    heavy: 2,
    penetrating: 2,
    versatile: 1,
    protect: 2,
    protection: 2,
    quick: 2,
    recharge: 1,
    somatic: 1,
    reserve: 1,
    sly: 1,
    gruff: 4,
    noisy: 3,
    tough: 4,
    obstruct: 2,
    grip: 4,
    resistant: 4,
    sturdy: 4,
    stable: 4,
    direct: 2,
    preserve: 1,
  },
  weapon_linked: [
    "two_handed",
    "reach",
    "smash",
    "throwable",
    "heavy",
    "penetrating",
    "versatile",
    "quick",
    "recharge",
    "somatic",
    "reserve",
    "sly",
    "preserve",
  ],
  get_time_phase: function (keyword, amount) {
    const four_phase_keywords = [
      "gruff",
      "tough",
      "grip",
      "resistant",
      "sturdy",
      "stable",
    ];
    if (four_phase_keywords.includes(keyword)) {
      switch (amount) {
        case 0:
          return "";
        case 1:
          return "long-moon";
        case 2:
          return "short-moon";
        case 3:
          return "sleep";
        default:
          return "combat";
      }
    }
    switch (keyword) {
      case "reach":
        if (amount < 2) return "";
        else return "combat";
      case "brute":
        if (amount < 2) return "";
        else return "combat";
      case "guard":
        if (amount < 2) return "";
        else return "combat";
      case "penetrating":
        if (amount < 2) return "";
        else return "combat";
      case "protect":
        if (amount === 0) return "";
        else if (amount === 1) return "sleep";
        return "combat";
      case "direct":
        if (amount === 0) return "";
        else if (amount === 1) return "sleep";
        return "combat";
      default:
        return "";
    }
  },
  get_description: function (keyword, amount) {
    let pluses = "";
    for (let i = 1; i < amount; i++) {
      pluses += "+";
    }
    return game.i18n.localize(
      buildLocalizeString("Ruleset", "Keywords_description", keyword) + pluses,
    );
  },
  get_localized_name: function (keyword, amount) {
    let pluses = "";
    for (let i = 1; i < amount; i++) {
      pluses += "+";
    }
    return (
      game.i18n.localize(buildLocalizeString("Ruleset", "Keywords", keyword)) +
      pluses
    );
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
    duration: {
      round: 0,
    },
  },
  {
    id: "evocation",
    name: "ATORIA.Ruleset.Status_effect.Evocation.Label",
    img: "systems/atoria/imgs/bolt-spell-cast.svg",
    description: "ATORIA.Ruleset.Status_effect.Evocation.Description",
    duration: {
      round: 0,
    },
  },
  {
    id: "channelling",
    name: "ATORIA.Ruleset.Status_effect.Channelling.Label",
    img: "systems/atoria/imgs/brainstorm.svg",
    description: "ATORIA.Ruleset.Status_effect.Channelling.Description",
    duration: {
      round: 0,
    },
  },
  {
    id: "concentration",
    name: "ATORIA.Ruleset.Status_effect.Concentration.Label",
    img: "systems/atoria/imgs/brain.svg",
    description: "ATORIA.Ruleset.Status_effect.Concentration.Description",
    duration: {
      round: 0,
    },
  },
  {
    id: "unconscious",
    name: "ATORIA.Ruleset.Status_effect.Unconscious.Label",
    img: "icons/svg/unconscious.svg",
    description: "ATORIA.Ruleset.Status_effect.Unconscious.Description",
    duration: {
      round: 0,
    },
  },
  {
    id: "bleeding",
    name: "ATORIA.Ruleset.Status_effect.Bleeding.Label",
    img: "systems/atoria/imgs/bleeding-wound.svg",
    description: "ATORIA.Ruleset.Status_effect.Bleeding.Description",
    duration: {
      round: 0,
    },
  },
  {
    id: "brutal",
    name: "ATORIA.Ruleset.Status_effect.Brutal.Label",
    img: "systems/atoria/imgs/chopped-skull.svg",
    description: "ATORIA.Ruleset.Status_effect.Brutal.Description",
    duration: {
      round: 0,
    },
  },
  {
    id: "enraged",
    name: "ATORIA.Ruleset.Status_effect.Enraged.Label",
    img: "systems/atoria/imgs/enrage.svg",
    description: "ATORIA.Ruleset.Status_effect.Enraged.Description",
    duration: {
      round: 0,
    },
  },
  {
    id: "slowed",
    name: "ATORIA.Ruleset.Status_effect.Slowed.Label",
    img: "systems/atoria/imgs/sticky-boot.svg",
    description: "ATORIA.Ruleset.Status_effect.Slowed.Description",
    duration: {
      round: 0,
    },
  },
  {
    id: "prone",
    name: "ATORIA.Ruleset.Status_effect.Prone.Label",
    img: "icons/svg/falling.svg",
    description: "ATORIA.Ruleset.Status_effect.Prone.Description",
    duration: {
      round: 0,
    },
  },
  {
    id: "immobilised",
    name: "ATORIA.Ruleset.Status_effect.Immobilised.Label",
    img: "icons/svg/net.svg",
    description: "ATORIA.Ruleset.Status_effect.Immobilised.Description",
    duration: {
      round: 0,
    },
  },
  {
    id: "disability",
    name: "ATORIA.Ruleset.Status_effect.Disability.Label",
    img: "systems/atoria/imgs/imprisoned.svg",
    description: "ATORIA.Ruleset.Status_effect.Disability.Description",
    duration: {
      round: 0,
    },
  },
  {
    id: "moist",
    name: "ATORIA.Ruleset.Status_effect.Moist.Label",
    img: "systems/atoria/imgs/water-drop.svg",
    description: "ATORIA.Ruleset.Status_effect.Moist.Description",
    duration: {
      round: 0,
    },
  },
  {
    id: "frostbite",
    name: "ATORIA.Ruleset.Status_effect.Frostbite.Label",
    img: "systems/atoria/imgs/snowflake-1.svg",
    description: "ATORIA.Ruleset.Status_effect.Frostbite.Description",
    duration: {
      round: 0,
    },
  },
  {
    id: "burning",
    name: "ATORIA.Ruleset.Status_effect.Burning.Label",
    img: "systems/atoria/imgs/flame.svg",
    description: "ATORIA.Ruleset.Status_effect.Burning.Description",
    duration: {
      round: 0,
    },
  },
  {
    id: "burning+",
    name: "ATORIA.Ruleset.Status_effect.Burning+.Label",
    img: "systems/atoria/imgs/flame+.svg",
    description: "ATORIA.Ruleset.Status_effect.Burning+.Description",
    duration: {
      round: 0,
    },
  },
  {
    id: "radiate",
    name: "ATORIA.Ruleset.Status_effect.Radiate.Label",
    img: "icons/svg/paralysis.svg",
    description: "ATORIA.Ruleset.Status_effect.Radiate.Description",
    duration: {
      round: 0,
    },
  },
  {
    id: "conductive",
    name: "ATORIA.Ruleset.Status_effect.Conductive.Label",
    img: "systems/atoria/imgs/lightning-arc.svg",
    description: "ATORIA.Ruleset.Status_effect.Conductive.Description",
    duration: {
      round: 0,
    },
  },
  {
    id: "dazed",
    name: "ATORIA.Ruleset.Status_effect.Dazed.Label",
    img: "systems/atoria/imgs/electric.svg",
    description: "ATORIA.Ruleset.Status_effect.Dazed.Description",
    duration: {
      round: 0,
    },
  },
  {
    id: "shocked",
    name: "ATORIA.Ruleset.Status_effect.Shocked.Label",
    img: "icons/svg/lightning.svg",
    description: "ATORIA.Ruleset.Status_effect.Shocked.Description",
    duration: {
      round: 0,
    },
  },
  {
    id: "stunned",
    name: "ATORIA.Ruleset.Status_effect.Stunned.Label",
    img: "systems/atoria/imgs/knocked-out-stars.svg",
    description: "ATORIA.Ruleset.Status_effect.Stunned.Description",
    duration: {
      round: 0,
    },
  },
  {
    id: "banished",
    name: "ATORIA.Ruleset.Status_effect.Banished.Label",
    img: "systems/atoria/imgs/portal.svg",
    description: "ATORIA.Ruleset.Status_effect.Banished.Description",
    duration: {
      round: 0,
    },
  },
  {
    id: "drunk",
    name: "ATORIA.Ruleset.Status_effect.Drunk.Label",
    img: "systems/atoria/imgs/beer-stein.svg",
    description: "ATORIA.Ruleset.Status_effect.Drunk.Description",
    duration: {
      round: 0,
    },
  },
  {
    id: "hangover",
    name: "ATORIA.Ruleset.Status_effect.Hangover.Label",
    img: "systems/atoria/imgs/beer-stein+.svg",
    description: "ATORIA.Ruleset.Status_effect.Hangover.Description",
    duration: {
      round: 0,
    },
  },
  {
    id: "tired",
    name: "ATORIA.Ruleset.Status_effect.Tired.Label",
    img: "systems/atoria/imgs/tired-eye.svg",
    description: "ATORIA.Ruleset.Status_effect.Tired.Description",
    duration: {
      round: 0,
    },
  },
  {
    id: "hungry",
    name: "ATORIA.Ruleset.Status_effect.Hungry.Label",
    img: "systems/atoria/imgs/meat.svg",
    description: "ATORIA.Ruleset.Status_effect.Hungry.Description",
    duration: {
      round: 0,
    },
  },
  {
    id: "dehydrated",
    name: "ATORIA.Ruleset.Status_effect.Dehydrated.Label",
    img: "systems/atoria/imgs/waterskin.svg",
    description: "ATORIA.Ruleset.Status_effect.Dehydrated.Description",
    duration: {
      round: 0,
    },
  },
  {
    id: "rested",
    name: "ATORIA.Ruleset.Status_effect.Rested.Label",
    img: "icons/svg/sleep.svg",
    description: "ATORIA.Ruleset.Status_effect.Rested.Description",
    duration: {
      round: 0,
    },
  },
  {
    id: "deaf",
    name: "ATORIA.Ruleset.Status_effect.Deaf.Label",
    img: "icons/svg/deaf.svg",
    description: "ATORIA.Ruleset.Status_effect.Deaf.Description",
    duration: {
      round: 0,
    },
  },
  {
    id: "silenced",
    name: "ATORIA.Ruleset.Status_effect.Silenced.Label",
    img: "icons/svg/silenced.svg",
    description: "ATORIA.Ruleset.Status_effect.Silenced.Description",
    duration: {
      round: 0,
    },
  },
  {
    id: "numb",
    name: "ATORIA.Ruleset.Status_effect.Numb.Label",
    img: "systems/atoria/imgs/hand-bandage.svg",
    description: "ATORIA.Ruleset.Status_effect.Numb.Description",
    duration: {
      round: 0,
    },
  },
  {
    id: "numb+",
    name: "ATORIA.Ruleset.Status_effect.Numb+.Label",
    img: "systems/atoria/imgs/hand-bandage+.svg",
    description: "ATORIA.Ruleset.Status_effect.Numb+.Description",
    duration: {
      round: 0,
    },
  },
  {
    id: "blindness",
    name: "ATORIA.Ruleset.Status_effect.Blindness.Label",
    img: "icons/svg/blind.svg",
    description: "ATORIA.Ruleset.Status_effect.Blindness.Description",
    duration: {
      round: 0,
    },
  },
  {
    id: "invisible",
    name: "ATORIA.Ruleset.Status_effect.Invisible.Label",
    img: "icons/svg/invisible.svg",
    description: "ATORIA.Ruleset.Status_effect.Invisible.Description",
    duration: {
      round: 0,
    },
  },
  {
    id: "incurable",
    name: "ATORIA.Ruleset.Status_effect.Incurable.Label",
    img: "systems/atoria/imgs/wrapped-heart.svg",
    description: "ATORIA.Ruleset.Status_effect.Incurable.Description",
    duration: {
      round: 0,
    },
  },
  {
    id: "incurable+",
    name: "ATORIA.Ruleset.Status_effect.Incurable+.Label",
    img: "systems/atoria/imgs/wrapped-heart+.svg",
    description: "ATORIA.Ruleset.Status_effect.Incurable+.Description",
    duration: {
      round: 0,
    },
  },
  {
    id: "afraid",
    name: "ATORIA.Ruleset.Status_effect.Afraid.Label",
    img: "systems/atoria/imgs/dread.svg",
    description: "ATORIA.Ruleset.Status_effect.Afraid.Description",
    duration: {
      round: 0,
    },
  },
  {
    id: "panic",
    name: "ATORIA.Ruleset.Status_effect.Panic.Label",
    img: "systems/atoria/imgs/run.svg",
    description: "ATORIA.Ruleset.Status_effect.Panic.Description",
    duration: {
      round: 0,
    },
  },
  {
    id: "terrified",
    name: "ATORIA.Ruleset.Status_effect.Terrified.Label",
    img: "icons/svg/terror.svg",
    description: "ATORIA.Ruleset.Status_effect.Terrified.Description",
    duration: {
      round: 0,
    },
  },
  {
    id: "dead",
    name: "ATORIA.Ruleset.Status_effect.Dead.Label",
    img: "icons/svg/skull.svg",
    description: "ATORIA.Ruleset.Status_effect.Dead.Description",
    duration: {
      round: 0,
    },
  },
  {
    id: "seduced",
    name: "ATORIA.Ruleset.Status_effect.Seduced.Label",
    img: "systems/atoria/imgs/charm.svg",
    description: "ATORIA.Ruleset.Status_effect.Seduced.Description",
    duration: {
      round: 0,
    },
  },
  {
    id: "charmed",
    name: "ATORIA.Ruleset.Status_effect.Charmed.Label",
    img: "systems/atoria/imgs/hearts.svg",
    description: "ATORIA.Ruleset.Status_effect.Charmed.Description",
    duration: {
      round: 0,
    },
  },
  {
    id: "captivated",
    name: "ATORIA.Ruleset.Status_effect.Captivated.Label",
    img: "systems/atoria/imgs/lovers.svg",
    description: "ATORIA.Ruleset.Status_effect.Captivated.Description",
    duration: {
      round: 0,
    },
  },
  {
    id: "control",
    name: "ATORIA.Ruleset.Status_effect.Control.Label",
    img: "systems/atoria/imgs/puppet.svg",
    description: "ATORIA.Ruleset.Status_effect.Control.Description",
    duration: {
      round: 0,
    },
  },
  {
    id: "provoked",
    name: "ATORIA.Ruleset.Status_effect.Provoked.Label",
    img: "systems/atoria/imgs/angry-eyes.svg",
    description: "ATORIA.Ruleset.Status_effect.Provoked.Description",
    duration: {
      round: 0,
    },
  },
  {
    id: "provoked+",
    name: "ATORIA.Ruleset.Status_effect.Provoked+.Label",
    img: "systems/atoria/imgs/angry-eyes+.svg",
    description: "ATORIA.Ruleset.Status_effect.Provoked+.Description",
    duration: {
      round: 0,
    },
  },
];

RULESET.localized_effects = (status_effects) => {
  for (let status_effect of status_effects) {
    status_effect.description = game.i18n.localize(status_effect.description);
  }
  return status_effects;
};

RULESET.localized_damage_type = (damage_type) => {
  damage_type =
    damage_type.charAt(0).toUpperCase() + damage_type.slice(1).toLowerCase();
  return game.i18n.localize(`ATORIA.Ruleset.Damage_type.${damage_type}`);
};

RULESET.ration_encumbrance = 0.5;

export default RULESET;
