import * as utils from "../utils/module.mjs";

export async function get_usable_keywords(actor, skill_path) {
  if (skill_path == undefined || skill_path == "") return [];
  const active_keywords = utils.ruleset.character.getActiveKeywordsData(actor);
  let available_keywords = await Promise.all(
    utils.ruleset.character
      .getSkillAssociatedKeywordsData(actor, null, skill_path)
      .filter((keyword) => Object.keys(active_keywords).includes(keyword.name))
      .map(async (keyword_data) => {
        keyword_data["descriptive_tooltip"] =
          await foundry.applications.handlebars.renderTemplate(
            CONFIG.ATORIA.ITEM_TOOLTIP_TEMPLATES["keyword"],
            {
              keyword: keyword_data,
            },
          );
        return keyword_data;
      }),
  );
  return available_keywords;
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
  saves_asked = [...new Set(saves_asked.flat())];
  return saves_asked;
}
export function get_roll_data(roll_parameters, skill_path) {
  for (let keyword_data of roll_parameters.used_keywords) {
    utils.applyAlteration(roll_parameters.roll_data, keyword_data.alteration);
  }
  for (let item_perk of roll_parameters.used_perks) {
    utils.applyAlterationsToRollConfig(
      roll_parameters.roll_data,
      item_perk.getAlterations(skill_path),
    );
  }
  return roll_parameters.roll_data;
}

export function get_effects_data(roll_parameters) {
  let effects = [];
  for (let item_perk of roll_parameters.used_perks) {
    effects.push(...item_perk.get_effect());
  }
  for (let supp of roll_parameters.used_supplementaries) {
    const matches = supp.effect.matchAll(/\[\[(.*?)]{2,3}(?:{([^}]+)})?/gi);
    let supp_effects = [];
    for (const match of Array.from(matches)) {
      supp_effects.push({
        flavor: match[2],
        formula: match[1],
      });
    }
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
