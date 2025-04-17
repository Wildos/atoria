import * as utils from "../utils/module.mjs";
import * as models from "../models/module.mjs";
import RULESET from "./ruleset.mjs";

export async function confirmDeletion(element_name) {
  element_name =
    element_name ?? game.i18n.localize("ATORIA.Dialog.Selected_element");
  return await Dialog.wait({
    title: game.i18n.format("ATORIA.Dialog.Delete.Title", {
      element_name: element_name,
    }),
    content: game.i18n.format("ATORIA.Dialog.Delete.Content", {
      element_name: element_name,
    }),
    buttons: {
      confirm: {
        label: game.i18n.localize("ATORIA.Dialog.Confirm"),
        callback: (_) => {
          return true;
        },
      },
      cancel: {
        label: game.i18n.localize("ATORIA.Dialog.Cancel"),
        callback: (_) => {
          return false;
        },
      },
    },
    default: "confirm",
    close: () => {
      return false;
    },
  });
}

export function applyFeaturesToRollConfig(roll_config, features) {
  return applySkillAlterationsToRollConfig(roll_config, features);
}

export function applySkillAlterationsToRollConfig(
  roll_config,
  skill_alteration_items,
) {
  for (let item of skill_alteration_items) {
    switch (item.system.skill_alteration.skill_alteration_type) {
      case "one_degree_of_success_gain":
        roll_config["dos_mod"] += 1;
        break;
      case "one_degree_of_success_loss":
        roll_config["dos_mod"] -= 1;
        break;
      case "two_degree_of_success_gain":
        roll_config["dos_mod"] += 2;
        break;
      case "two_degree_of_success_loss":
        roll_config["dos_mod"] -= 2;
        break;
      case "advantage":
        roll_config["advantage_amount"] += 1;
        break;
      case "disadvantage":
        roll_config["disadvantage_amount"] += 1;
        break;
      case "":
        break;
      default:
        console.warn(
          `Unknown skill_alteration_type: '${item.system.skill_alteration.skill_alteration_type}'`,
        );
        break;
    }
  }
  return roll_config;
}

export function applyKeywordsToRollConfig(roll_config, keywords_data) {
  for (let keyword_data of keywords_data) {
    switch (keyword_data.skill_alteration_type) {
      case "one_degree_of_success_gain":
        roll_config["dos_mod"] += 1;
        break;
      case "one_degree_of_success_loss":
        roll_config["dos_mod"] -= 1;
        break;
      case "two_degree_of_success_gain":
        roll_config["dos_mod"] += 2;
        break;
      case "two_degree_of_success_loss":
        roll_config["dos_mod"] -= 2;
        break;
      case "advantage":
        roll_config["advantage_amount"] += 1;
        break;
      case "disadvantage":
        roll_config["disadvantage_amount"] += 1;
        break;
      case "":
        break;
      default:
        console.warn(
          `Unknown skill_alteration_type: '${keyword_data.skill_alteration_type}'`,
        );
        break;
    }
  }
  return roll_config;
}

function getSkillData(item, skill_path) {
  if (item.type === "spell")
    return {
      path: "",
      label: item.name,
      success: item.system.success,
      critical_success_amount: item.system.critical_success,
      critical_fumble_amount: item.system.critical_fumble,
    };
  const skill_data = foundry.utils.deepClone(
    item.actor?.getSkillFromPath(skill_path),
  );
  if (skill_data === undefined) {
    return undefined;
  }
  skill_data.critical_success_amount =
    utils.ruleset.character.getSkillCriticalSuccessAmount(skill_data);
  skill_data.critical_fumble_amount =
    utils.ruleset.character.getSkillCriticalFumbleAmount(skill_data);
  skill_data.label = item.actor.getSkillTitle(skill_path);
  return skill_data;
}

export async function skillCreationDialog(actor, skill_cat) {
  const content = await renderTemplate(
    CONFIG.ATORIA.DIALOG_TEMPLATES.skill_creation,
    {},
  );
  const return_format = {
    skill_key: "",
    skill_label: "",
  };
  return await foundry.applications.api.DialogV2.prompt({
    window: {
      title: game.i18n.format("ATORIA.Dialog.Skill_creation.Title", {
        skill_cat: getSkillTitle(skill_cat),
      }),
    },
    rejectClose: false,
    content: content,
    ok: {
      label: game.i18n.localize("ATORIA.Dialog.Launch"),
      callback: (event, button, dialog) => {
        const formElement = dialog.querySelector("form");
        const formData = new FormDataExtended(formElement);
        const formDataObject = formData.object;

        formDataObject["skill_key"] = Array.from(
          formDataObject["skill_name"].toLowerCase(),
        )
          .filter((char) => char >= "a" && char <= "z")
          .join("");

        formDataObject["skill_label"] = formDataObject["skill_name"];
        return foundry.utils.mergeObject(return_format, formDataObject, {
          overwrite: true,
          insertKeys: false,
        });
      },
    },
  });
  return null;
}

export async function itemRollDialog(item, need_roll = true) {
  const allowed_items = ["weapon", "action", "spell", "opportunity"];
  if (!allowed_items.includes(item.type)) {
    console.warn("Disallowed item type asked to roll");
    return null;
  }
  if (item.actor === undefined) {
    console.warn("NO ACTOR, NO SKILL ROLL");
    return null;
  }
  let main_skill_data = {};
  let secondary_skill_data = null;
  if (item.type === "spell") {
    main_skill_data = {
      path: "",
      label: item.name,
      associated_features: [],
    };
  } else if (item.type === "opportunity") {
    let associated_skill = "system.skills.combative.reflex.opportuneness";
    main_skill_data = {
      path: associated_skill,
      label: item.actor.getSkillTitle(associated_skill),
      associated_features: item.actor.getAssociatedFeatures(associated_skill),
    };
  } else if (item.system.associated_skill !== "") {
    let associated_skill = item.system.associated_skill;
    if (getSkillData(item, item.system.associated_skill) === undefined) {
      return null;
    }
    main_skill_data = {
      path: associated_skill,
      label: item.actor.getSkillTitle(associated_skill),
      associated_features: item.actor.getAssociatedFeatures(associated_skill),
    };
  }
  if (item.type === "weapon" && item.system.is_focuser) {
    const focuser_skill_path = "system.skills.combative.weapon.focuser";
    if (Object.keys(main_skill_data).length === 0) {
      main_skill_data = {
        path: focuser_skill_path,
        label: item.actor.getSkillTitle(focuser_skill_path),
        associated_features:
          item.actor.getAssociatedFeatures(focuser_skill_path),
      };
    } else {
      secondary_skill_data = {
        path: focuser_skill_path,
        label: item.actor.getSkillTitle(focuser_skill_path),
        associated_features:
          item.actor.getAssociatedFeatures(focuser_skill_path),
      };
    }
  }
  const available_supplementaries =
    item.type !== "spell" ? [] : item.system.supplementaries_list;
  for (let [idx, supplementary] of available_supplementaries.entries()) {
    supplementary.name = game.i18n.format(
      "ATORIA.Chat_message.Spell.Supplementary_name",
      { key: idx },
    );
    supplementary.idx = idx;
    supplementary.systemFields =
      item.systemFields.supplementaries_list.element.fields;
  }
  const cost_model = utils.default_values.models.helpers.defineCostField();
  const cost_list = [];
  let cost_secondary = null;
  if (item.type == "weapon") {
    cost_list.push(utils.ruleset.general.getCostWeaponAttack(item));
    cost_secondary = utils.ruleset.general.getCostFocuserWeaponAttack(item);
  } else if (item.type == "spell") {
    cost_list.push(item.system.cost);
  } else {
    for (const cost of item.system.cost_list) {
      cost_list.push(cost);
    }
  }

  const associated_actable_modifiers =
    item.system.usable_actable_modifiers.flatMap((id) => {
      let usable_actable = item.actor.items.get(id);
      return usable_actable !== undefined ? usable_actable : [];
    });
  const is_blind_roll =
    (main_skill_data.path ?? "") === ""
      ? false
      : utils.ruleset.character.isBlindSkill(main_skill_data.path);
  const content = await renderTemplate(
    CONFIG.ATORIA.DIALOG_TEMPLATES.item_launch,
    {
      ruleset: utils.ruleset,
      need_roll,
      cost_list,
      cost_secondary,
      costSystemFields: cost_model.fields,
      main_skill_data,
      secondary_skill_data,
      available_supplementaries: available_supplementaries,
      available_actable_modifiers: associated_actable_modifiers,
      is_main_blind_roll: is_blind_roll,
      default_roll_mode: is_blind_roll
        ? "blind"
        : convertRollModeToDesiredVisibility(
            game.settings.get("core", "rollMode"),
          ),
    },
  );
  const return_format = {
    chosen_skill_data: {
      path: "",
      label: "",
      success: 0,
      critical_success: 0,
      critical_fumble: 0,
      damage_roll: "",
    },
    advantage_amount: 0,
    disadvantage_amount: 0,
    luck_applied: 0,
    dos_mod: 0,
    used_features: [],
    used_supplementaries: [],
    used_actable_modifiers: [],
    roll_mode: "public",
  };
  return await foundry.applications.api.DialogV2.prompt({
    window: {
      title: game.i18n.format("ATORIA.Dialog.Item_roll.Title", {
        element_name: item.name,
      }),
    },
    rejectClose: false,
    content: content,
    ok: {
      label: game.i18n.localize("ATORIA.Dialog.Launch"),
      callback: (event, button, dialog) => {
        const formElement = dialog.querySelector("form");
        const formData = new FormDataExtended(formElement);
        const formDataObject = formData.object;

        if (formDataObject["associated_skill"] !== undefined) {
          const picked_skill_data =
            formDataObject["associated_skill"] === "main_skill_data"
              ? main_skill_data
              : secondary_skill_data;

          formDataObject["chosen_skill_data"] = getSkillData(
            item,
            picked_skill_data.path,
          );
          if (formDataObject["chosen_skill_data"] === undefined) {
            console.warn(
              `Couldn't retrieve skill from path: '${picked_skill_data.path}'`,
            );
            return null;
          }

          if (item.type === "weapon") {
            formDataObject["chosen_skill_data"].damage_roll =
              formDataObject["associated_skill"] === "main_skill_data"
                ? item.system.damage_roll
                : item.system.focuser_damage_roll;
          }

          formDataObject["used_supplementaries"] = [];
          for (const [
            key,
            supplementary,
          ] of available_supplementaries.entries()) {
            delete supplementary.systemFields;
            if (formDataObject[`available_supplementaries.${key}`]) {
              formDataObject["used_supplementaries"].push(supplementary);
            }
          }
          formDataObject["used_features"] = [];
          const associated_features = picked_skill_data.associated_features;
          for (const feature of associated_features) {
            if (formDataObject[`associated_features.${feature._id}`])
              formDataObject["used_features"].push(feature._id);
          }

          formDataObject["roll_mode"] =
            utils.convertDesiredVisibilityToRollMode(
              formDataObject["asked_visibility"],
            );
        }

        formDataObject["used_actable_modifiers"] = [];
        for (const actable_modifier of associated_actable_modifiers) {
          if (
            formDataObject[
              `associated_actable_modifiers.${actable_modifier._id}`
            ]
          )
            formDataObject["used_actable_modifiers"].push(actable_modifier);
        }

        return foundry.utils.mergeObject(return_format, formDataObject, {
          overwrite: true,
          insertKeys: false,
        });
      },
    },
  });
}

export async function skillRollDialog(actor, skill_path) {
  if (actor === undefined) {
    console.warn("NO ACTOR, NO SKILL ROLL");
    return undefined;
  }
  const associated_features = actor.getAssociatedFeatures(skill_path);
  const associated_keywords =
    utils.ruleset.character.getSkillAssociatedKeywordsData(actor, skill_path);
  const is_blind_roll = utils.ruleset.character.isBlindSkill(skill_path);
  const content = await renderTemplate(
    CONFIG.ATORIA.DIALOG_TEMPLATES.skill_launch,
    {
      skill_name: actor.getSkillTitle(skill_path),
      skill_path,
      associated_features: associated_features,
      associated_keywords: associated_keywords,
      is_blind_roll: is_blind_roll,
      default_roll_mode: is_blind_roll
        ? "blind"
        : convertRollModeToDesiredVisibility(
            game.settings.get("core", "rollMode"),
          ),
    },
  );
  const return_format = {
    associated_skill: "<path>",
    advantage_amount: 0,
    disadvantage_amount: 0,
    luck_applied: 0,
    dos_mod: 0,
    used_features: [],
    used_keywords: [],
    roll_mode: "public",
  };
  return await foundry.applications.api.DialogV2.prompt({
    window: {
      title: game.i18n.format("ATORIA.Dialog.Skill_roll.Title", {
        actor_name: actor.name,
      }),
    },
    rejectClose: false,
    content: content,
    ok: {
      label: game.i18n.localize("ATORIA.Dialog.Launch"),
      callback: (event, button, dialog) => {
        const formElement = dialog.querySelector("form");
        const formData = new FormDataExtended(formElement);
        const formDataObject = formData.object;
        formDataObject["used_features"] = [];
        for (let feature of associated_features) {
          if (formDataObject[`associated_features.${feature._id}`])
            formDataObject["used_features"].push(feature._id);
        }
        formDataObject["used_keywords"] = [];
        for (let keyword of associated_keywords) {
          if (formDataObject[`associated_keywords.${keyword.name}`])
            formDataObject["used_keywords"].push(keyword);
        }

        formDataObject["roll_mode"] = utils.convertDesiredVisibilityToRollMode(
          formDataObject["asked_visibility"],
        );
        return foundry.utils.mergeObject(return_format, formDataObject, {
          overwrite: true,
          insertKeys: false,
        });
      },
    },
  });
}

export function convertDesiredVisibilityToRollMode(desired_visibility) {
  switch (desired_visibility) {
    case "private":
      return CONST.DICE_ROLL_MODES.PRIVATE;
    case "blind":
      return CONST.DICE_ROLL_MODES.BLIND;
    case "self":
      return CONST.DICE_ROLL_MODES.SELF;
    case "public":
      return CONST.DICE_ROLL_MODES.PUBLIC;
    default:
      return game.settings.get("core", "rollMode");
  }
}
export function convertRollModeToDesiredVisibility(desired_roll_mod) {
  switch (desired_roll_mod) {
    case CONST.DICE_ROLL_MODES.PRIVATE:
      return "private";
    case CONST.DICE_ROLL_MODES.BLIND:
      return "blind";
    case CONST.DICE_ROLL_MODES.SELF:
      return "self";
    case CONST.DICE_ROLL_MODES.PUBLIC:
      return "public";
    default:
      return convertRollModeToDesiredVisibility(
        game.settings.get("core", "rollMode"),
      );
  }
}

export function getSkillTitle(skill_path, skill_label = undefined) {
  const skill_path_parts = skill_path.split(".");
  skill_path_parts[0] = "Ruleset"; // System => Ruleset

  if (skill_label === undefined) {
    skill_label =
      skill_path_parts.length > 1
        ? utils.buildLocalizeString(...skill_path_parts, "Label")
        : undefined;
    if (skill_label === undefined) {
      console.warn("Invalid skill path given, invalid name returned");
      skill_label = "ATORIA.Model.Invalid_name";
    }
  }

  let skill_name = game.i18n.localize(skill_label);

  skill_path_parts.pop();
  if (skill_path_parts.length <= 1) {
    return game.i18n.localize(skill_label);
  }
  const skill_cat_name =
    skill_path_parts.length > 1
      ? utils.buildLocalizeString(...skill_path_parts, "Label")
      : undefined;
  return `${game.i18n.localize(skill_cat_name)} - ${skill_name}`;
}

export function isSkill(data) {
  return models.helpers.isSkill(data);
}

export async function renderUsedFeatures(used_features) {
  if (used_features.length === 0) return "";
  return await renderTemplate(
    CONFIG.ATORIA.CHAT_MESSAGE_TEMPLATES.used_features,
    {
      used_features: used_features,
    },
  );
}
export async function renderUsedSupplementaries(used_supplementaries) {
  if (used_supplementaries.length === 0) return "";
  return await renderTemplate(
    CONFIG.ATORIA.CHAT_MESSAGE_TEMPLATES.used_supplementaries,
    {
      used_supplementaries: used_supplementaries,
    },
  );
}

export async function renderUsedActableModifiers(used_actable_modifiers) {
  if (used_actable_modifiers.length === 0) return "";
  return await renderTemplate(
    CONFIG.ATORIA.CHAT_MESSAGE_TEMPLATES.used_actable_modifiers,
    {
      used_actable_modifiers: used_actable_modifiers,
    },
  );
}

export function getInlineRollFromRollData(roll_data) {
  let label = roll_data.name;
  let active_keys = [];
  for (let key in roll_data.types) {
    if (roll_data.types[key])
      active_keys.push(RULESET.localized_damage_type(key));
  }
  label += " " + active_keys.join(", ");
  return `[[${roll_data.formula}]]{${label}}`;
}
