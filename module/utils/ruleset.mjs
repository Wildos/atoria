import { itemRollDialog } from "./helpers.mjs";
import { default as default_values } from "./default-values.mjs";

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
    if (weapon_keywords.two_handed && !weapon_keywords.two_handed_more) {
      attack_cost.time.second_amount += 1;
    }
    return attack_cost;
  }
  static getCostFocuserWeaponAttack(weapon_item) {
    const cost_model = default_values.models.helpers.defineCostField();
    let attack_cost = cost_model.getInitialValue();
    attack_cost.time.second_amount = 3;
    attack_cost.stamina = 1;
    attack_cost.mana = 1;
    const weapon_keywords = weapon_item.system.keywords;
    if (weapon_keywords.two_handed && !weapon_keywords.two_handed_more) {
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
        restored_attributes["health"] = Math.floor(actor.system.health.max / 4);
        restored_attributes["mana"] = actor.system.mana.max;
        restored_attributes["healing_inactive.amount"] = -2;
        restored_attributes["healing_inactive.herbs"] = false;
        restored_attributes["healing_inactive.medical"] = false;
      case "rest":
        restored_attributes["mana"] =
          "mana" in restored_attributes
            ? restored_attributes["mana"]
            : Math.floor(actor.system.mana.max / 5);
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
    return 2 + Math.min(actor.system.endurance.value, 100) / 25;
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

  static getActiveKeywords(actor) {
    const keywords_active = new Set();
    const automatized_keywords_actor_related = [
      "obstruct",
      "obstruct_more",
      "noisy",
      "noisy_more",
      "guard",
      "protection",
      "protection_more",
    ];
    for (const item of actor.items) {
      const item_keywords_active =
        RULESET.item.getAutomatizedActiveKeywords(item);

      for (const keyword of item_keywords_active) {
        if (!automatized_keywords_actor_related.includes(keyword)) {
          // keyword not actor related
          continue;
        }
        if (keywords_active.has(`${keyword}_more`)) {
          // already has more version
          continue;
        }
        if (keyword.endsWith("_more")) {
          // keyword_more
          const base_keyword = keyword.substring(
            0,
            keyword.length - "_more".length,
          );
          keywords_active.delete(base_keyword);
          keywords_active.add(keyword);
        } else if (keywords_active.has(keyword)) {
          // keyword & keyword
          keywords_active.delete(keyword);
          keywords_active.add(`${keyword}_more`);
        } else {
          // keyword is new to the set
          keywords_active.add(keyword);
        }
      }
    }
    return keywords_active;
  }

  static getSkillAssociatedKeywordsData(actor, skill_path) {
    const keywords_active = this.getActiveKeywords(actor);
    const skill_associated_keywords_data = [];

    const NOISY_SKILL_SILENCE = "system.skills.physical.slyness.silence";
    const NOISY_SKILL_STEALTH = "system.skills.physical.slyness.stealth";
    const SKILL_PARRY = "system.skills.combative.reflex.parry";

    for (const keyword of keywords_active.values()) {
      switch (keyword) {
        case "noisy":
          // handled by the skill roll, -1 DoS silence / Furtivité when moving
          if (
            NOISY_SKILL_SILENCE.startsWith(skill_path) ||
            NOISY_SKILL_STEALTH.startsWith(skill_path)
          ) {
            skill_associated_keywords_data.push({
              name: "noisy",
              label: "ATORIA.Ruleset.Keywords.Noisy",
              description: "ATORIA.Ruleset.Keywords_description.Noisy",
              skill_alteration_type: "one_degree_of_success_loss",
              skill_alteration_type_label:
                RULESET.skill_alterations.one_degree_of_success_loss,
            });
          }
          break;
        case "noisy_more":
          // handled by the skill roll, 1 Desavantage silence / Furtivité when moving
          if (
            NOISY_SKILL_SILENCE.startsWith(skill_path) ||
            NOISY_SKILL_STEALTH.startsWith(skill_path)
          ) {
            skill_associated_keywords_data.push({
              name: "noisy_more",
              label: game.i18n.localize("ATORIA.Ruleset.Keywords.Noisy_more"),
              description: game.i18n.localize(
                "ATORIA.Ruleset.Keywords_description.Noisy_more",
              ),
              skill_alteration_type: "disadvantage",
              skill_alteration_type_label:
                RULESET.skill_alterations.disadvantage,
            });
          }
          break;
        case "guard":
          // handled by the skill roll, +1 DoS Parry, against cac attack
          if (SKILL_PARRY.startsWith(skill_path)) {
            skill_associated_keywords_data.push({
              name: "guard",
              label: game.i18n.localize("ATORIA.Ruleset.Keywords.Guard"),
              description: game.i18n.localize(
                "ATORIA.Ruleset.Keywords_description.Guard",
              ),
              skill_alteration_type: "one_degree_of_success_gain",
              skill_alteration_type_label:
                RULESET.skill_alterations.one_degree_of_success_gain,
            });
          }
          break;
        case "protection":
          // handled by the skill roll, +1 DoS Parry, against range attack
          if (SKILL_PARRY.startsWith(skill_path)) {
            skill_associated_keywords_data.push({
              name: "protection",
              label: game.i18n.localize("ATORIA.Ruleset.Keywords.Protection"),
              description: game.i18n.localize(
                "ATORIA.Ruleset.Keywords_description.Protection",
              ),
              skill_alteration_type: "one_degree_of_success_gain",
              skill_alteration_type_label:
                RULESET.skill_alterations.one_degree_of_success_gain,
            });
          }
          break;
        case "protection_more":
          // handled by the skill roll, 1 avantage Parry, against range attack
          if (SKILL_PARRY.startsWith(skill_path)) {
            skill_associated_keywords_data.push({
              name: "protection_more",
              label: game.i18n.localize(
                "ATORIA.Ruleset.Keywords.Protection_more",
              ),
              description: game.i18n.localize(
                "ATORIA.Ruleset.Keywords_description.Protection_more",
              ),
              skill_alteration_type: "advantage",
              skill_alteration_type_label: RULESET.skill_alterations.advantage,
            });
          }
          break;
      }
    }
    return skill_associated_keywords_data;
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

  // AUTOMATIZED KEYWORDS:
  // case "obstruct":
  //   // handled by the initiative roll, initative -1
  //   break;
  // case "obstruct_more":
  //   // handled by the initiative roll, initative -1d2
  //   break;
  // case "noisy":
  //   // handled by the skill roll, -1 DoS silence / Furtivité when moving
  //   break;
  // case "noisy_more":
  //   // handled by the skill roll, 1 Desavantage silence / Furtivité when moving
  //   break;
  // case "guard":
  //   // handled by the skill roll, +1 DoS Parry, against cac attack
  //   break;
  // case "protection":
  //   // handled by the skill roll, +1 DoS Parry, against range attack
  //   break;
  // case "protection_more":
  //   // handled by the skill roll, 1 avantage Parry, against range attack
  //   break;
  // case "brutal":
  //   // handled by the weapon roll, show apply brutal on chat_message
  //   break;
  // case "brutal_more":
  //   // handled by the weapon roll, show apply brutal+ on chat_message
  //   break;
  // case "smash":
  //   // handled by the weapon roll, prefill -1 DoS on Parry button
  //   break;
  // case "penetrating":
  //   // handled by the weapon roll, write it is active on the weapon roll
  //   break;
  // case "two_handed":
  //   // handled by the weapon roll, check it is
  //   break;
  // case "versatile":
  //   // handled by the weapon roll, check it is
  //   break;
  // case "throwable":
  //   // handled by the item throw roll, check it is
  //   // +1 DoS Throw
  //   break;
  // case "throwable_more":
  //   // handled by the item throw roll, check it is
  //   // +2 DoS Throw
  //   break;
  static getAutomatizedActiveKeywords(item) {
    if (!["kit", "weapon", "armor"].includes(item.type)) return [];
    const automatized_keywords = [
      "obstruct",
      "obstruct_more",
      "noisy",
      "noisy_more",
      "guard",
      "protection",
      "protection_more",
      "brutal",
      "brutal_more",
      "smash",
      "penetrating",
      "two_handed",
      "versatile",
      "throwable",
      "throwable_more",
    ];
    const keywords_active = [];
    for (const keyword of Object.keys(item.system.keywords)) {
      if (
        automatized_keywords.includes(keyword) &&
        item.system.keywords[keyword]
      ) {
        keywords_active.push(keyword);
      }
    }
    return keywords_active;
  }

  static getActiveKeywords(item) {
    if (!["kit", "weapon", "armor"].includes(item.type)) return [];
    const keywords_active = new Set();
    const ignored_key = ["preserve_data"];
    for (const keyword of Object.keys(item.system.keywords)) {
      if (item.system.keywords[keyword]) {
        if (
          ignored_key.includes(keyword) ||
          keywords_active.has(`${keyword}_more`)
        ) {
          // ignored or already has more version
          continue;
        }
        if (keyword.endsWith("_more")) {
          // keyword_more
          const base_keyword = keyword.substring(
            0,
            keyword.length - "_more".length,
          );
          keywords_active.delete(base_keyword);
          keywords_active.add(keyword);
        } else if (keywords_active.has(keyword)) {
          // keyword & keyword
          keywords_active.delete(keyword);
          keywords_active.add(`${keyword}_more`);
        } else {
          // keyword is new to the set
          keywords_active.add(keyword);
        }
      }
    }
    return keywords_active;
  }

  static attackFromWeapon(item) {
    const new_item = foundry.utils.deepClone(item);
    new_item.system.cost_list = [];
    if (new_item.system.associated_skill) {
      new_item.system.cost_list.push(RULESET.general.getCostWeaponAttack(item));
    }
    if (item.system.is_focuser) {
      new_item.system.cost_list.push(
        RULESET.general.getCostFocuserWeaponAttack(item),
      );
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
  advantage: "ATORIA.Model.Skill_alteration.Advantage",
  disadvantage: "ATORIA.Model.Skill_alteration.Disadvantage",
};

RULESET["keywords"] = {
  with_type: {
    preserve: {
      mana: "ATORIA.Ruleset.Mana",
      health: "ATORIA.Ruleset.Health",
      stamina: "ATORIA.Ruleset.Stamina",
      sanity: "ATORIA.Ruleset.Sanity",
      endurance: "ATORIA.Ruleset.Endurance",
    },
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
    id: "abused",
    name: "ATORIA.Ruleset.Status_effect.Abused.Label",
    img: "systems/atoria/imgs/chopped-skull.svg",
    description: "ATORIA.Ruleset.Status_effect.Abused.Description",
    duration: {
      round: 0,
    },
  },
  {
    id: "abused+",
    name: "ATORIA.Ruleset.Status_effect.Abused+.Label",
    img: "systems/atoria/imgs/chopped-skull+.svg",
    description: "ATORIA.Ruleset.Status_effect.Abused+.Description",
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
    id: "enraged",
    name: "ATORIA.Ruleset.Status_effect.Enraged.Label",
    img: "systems/atoria/imgs/enrage.svg",
    description: "ATORIA.Ruleset.Status_effect.Enraged.Description",
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
