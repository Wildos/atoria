import * as utils from "./module.mjs";

export function assignation_from_string(dict, string, value) {
  let parts = string.split(".");
  let dict_pointer = dict;
  for (const part of parts.slice(0, -1)) {
    if (!(part in dict_pointer)) {
      dict_pointer[part] = {};
    }
    dict_pointer = dict_pointer[part];
  }
  dict_pointer[parts.at(-1)] = value;
}
export function retrieve_from_string(dict, string) {
  let parts = string.split(".");
  let dict_pointer = dict;
  for (const part of parts.slice(0, -1)) {
    if (!(part in dict_pointer)) {
      return undefined;
    }
    dict_pointer = dict_pointer[part];
  }
  return dict_pointer[parts.at(-1)];
}

export function extract_leaf_from_player_skills_for_feature_cat(skill_tree) {
  let leaf_list = [];
  for (const [key, value] of Object.entries(skill_tree)) {
    leaf_list.push({
      id: key,
      Label: value,
    });
  }
  return leaf_list;
}

export function extract_leaf_from_player_magic_skills_for_feature_cat(
  magic_tree,
  reference_actor,
) {
  let leaf_list = [];
  for (const [magic_school, _] of Object.entries(magic_tree)) {
    if (magic_school.includes("martial")) {
      continue;
    }
    leaf_list.push({
      id: magic_school,
      Label: reference_actor.getSkillFromPath(magic_school).label,
    });
  }
  return leaf_list;
}

export function extract_leaf_from_player_knowledges_for_feature_cat(
  knowledge_tree,
  reference_actor,
) {
  let leaf_list = [];
  for (const [key, _] of Object.entries(knowledge_tree)) {
    if (key.includes("magic")) {
      continue;
    }
    leaf_list.push({
      id: key,
      Label: reference_actor.getSkillFromPath(key).label,
    });
  }
  return leaf_list;
}
