import * as utils from "../utils/module.mjs";
import * as model_helper from "../models/helpers.mjs";

export function makeTimeLimitationForKeyword(keyword_effect) {
  let limit_remaining = keyword_effect.limit_remaining ?? 0;
  if (keyword_effect.id == "direct") {
    limit_remaining =
      keyword_effect.limit_remaining[keyword_effect.direct_type] ?? 0;
  }
  return {
    regain_type: keyword_effect.limit_amount != 0 ? "combat" : "permanent",
    usage_left: limit_remaining,
    usage_max: keyword_effect.limit_amount ?? 0,
  };
}

export async function get_usable_keywords(actor, item, skill_path) {
  if (skill_path == undefined) return [];
  return utils.ruleset.character.getSkillAssociatedKeywordsEffects(
    actor,
    item,
    skill_path,
  );
}

export function get_usable_perks_for_skill(actor, skill_path) {
  if (skill_path == undefined) return [];
  let available_features =
    actor.getAssociatedFeature_n_ItemAlterations(skill_path);
  available_features.sort((a, b) => (a.sort || 0) - (b.sort || 0));
  return available_features;
}

export function get_asked_saves(roll_parameters) {
  let saves_asked = roll_parameters.used_perks.map((item_perk) => {
    return item_perk.getSavesAsked();
  });
  saves_asked.push(...(roll_parameters.saves_asked ?? []));
  saves_asked = [...new Set(saves_asked.flat())];
  return saves_asked;
}
export function get_roll_data(roll_parameters, skill_path) {
  let skill_paths = skill_path.includes("///")
    ? skill_path.split("///")
    : [skill_path];
  for (let keyword_data of roll_parameters.used_keywords) {
    let alteration = keyword_data.skill_alterations
      .filter((skill_alteration) =>
        skill_paths.includes(skill_alteration.associated_skill),
      )
      .map((skill_alteration) => {
        let result = {
          dos_mod: skill_alteration.dos_mod,
          adv_amount: skill_alteration.adv_amount,
          disadv_amount: skill_alteration.disadv_amount,
        };
        return result;
      });
    utils.applyAlterationsToRollConfig(roll_parameters.roll_data, alteration);
  }
  for (let item_perk of roll_parameters.used_perks) {
    utils.applyAlterationsToRollConfig(
      roll_parameters.roll_data,
      skill_paths
        .map((skill_path) => item_perk.getAlterations(skill_path))
        .flat(),
    );
  }
  return roll_parameters.roll_data;
}

export function extract_effect_from_string(str) {
  const matches = str.matchAll(/\[\[(.*?)]{2,3}(?:{([^}]+)})?/gi);
  let effects = [];
  for (const match of Array.from(matches)) {
    effects.push({
      flavor: match[2],
      formula: match[1],
    });
  }
  return effects;
}

export function get_effects_data(roll_parameters) {
  let effects = [];
  for (let item_perk of roll_parameters.used_perks) {
    effects.push(...item_perk.get_effect());
  }
  for (let keyword_data of roll_parameters.used_keywords) {
    let keyword_effects = extract_effect_from_string(keyword_data.effect);
    effects.push(...keyword_effects);
  }
  for (let supp of roll_parameters.used_supplementaries) {
    let supp_effects = extract_effect_from_string(supp.effect).map((effect) => {
      effect["formula"] =
        effect["formula"] + ("+ " + effect["formula"]).repeat(supp.cumul - 1);
      return effect;
    });
    effects.push(...supp_effects);
  }
  return effects;
}
export function get_critical_effects_data(roll_parameters) {
  let effects = [];
  for (let item_perk of roll_parameters.used_perks) {
    effects.push(...item_perk.get_critical_effect());
  }
  return effects;
}
