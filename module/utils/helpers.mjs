import * as utils from "../utils/module.mjs";
import * as models from "../models/module.mjs";
import RULESET from "./ruleset.mjs";

import { AtoriaRollItemDialogV2 } from "../sheets/module.mjs";

export function hasPopoutV2Module() {
  try {
    return PopoutV2Module !== undefined;
  } catch (e) {
    return false;
  }
}

export function isPoppedOut(app) {
  if (hasPopoutV2Module())
    return PopoutV2Module.singleton.poppedOut.has(app.appId);
  else {
    return false;
  }
}

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

export function applyAlterationsToRollConfig(roll_config, alterations) {
  for (let alteration of alterations) {
    applyAlteration(roll_config, alteration);
  }
  return roll_config;
}

export function applyAlteration(roll_config, alteration) {
  roll_config["dos_mod"] += alteration.dos_mod;
  roll_config["advantage_amount"] += alteration.adv_amount;
  roll_config["disadvantage_amount"] += alteration.disadv_amount;
  return roll_config;
}

export function getSkillData(item, skill_path) {
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
      label: game.i18n.localize("ATORIA.Dialog.Confirm"),
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

async function sendChatMessageFromRollData(item, roll_data) {
  const used_supplementaries_data = Object.entries(
    roll_data.used_supplementaries,
  ).map(([supp_idx, amount]) => {
    let supplementary = foundry.utils.deepClone(
      item.system.supplementaries_list[supp_idx],
    );
    if (supplementary.name === "") {
      supplementary.name = game.i18n.format(
        "ATORIA.Chat_message.Spell.Supplementary_name",
        { key: supp_idx },
      );
    }
    if (amount > 1) {
      supplementary.name = amount + "x " + supplementary.name;
    }
    return supplementary;
  });

  ChatMessage.create(
    {
      type: "interactable",
      speaker: ChatMessage.getSpeaker({ actor: item.actor }),
      user: game.user.id,
      sound: CONFIG.sounds.dice,
      flavor: roll_data.flavor,
      rolls: roll_data.chat_rolls,
      system: {
        flavor_tooltip: roll_data.flavor_tooltip,
        owning_actor_id: item.actor?._id,
        related_items: [
          {
            type: "feature",
            items_id: roll_data.used_features,
          },
          {
            type: "supplementary",
            items: used_supplementaries_data,
          },
          {
            type: "keyword",
            items: roll_data.used_keywords.map((keyword_data) => {
              return {
                descriptive_tooltip: keyword_data["description"],
                name: keyword_data["label"],
              };
            }),
          },
          {
            type: "actable-modifier",
            items_id: roll_data.used_actable_modifiers,
          },
        ],
        critical_effect: roll_data.critical_effect,
        effect: roll_data.effect,
        savesAsked: roll_data.saves_asked,
      },
    },
    { rollMode: roll_data.roll_mode },
  );
}

export async function itemRollDialog(item) {
  let roll_data = await AtoriaRollItemDialogV2.wait({ item: item });

  if (roll_data === null) {
    return null;
  }

  roll_data.saves_asked =
    foundry.utils.deepClone(item.system.saves_asked) ?? [];
  if (
    item.type === "weapon" ||
    (item.type === "spell" && item.system.markers.is_attack)
  ) {
    roll_data.saves_asked.push(...utils.ruleset.character.getAttackSaves());
  }

  sendChatMessageFromRollData(item, roll_data);

  let used_ressources = {
    luck: roll_data.luck_applied,
    used_actable_modifiers: roll_data.used_actable_modifiers,
    used_features: roll_data.used_features,
    used_supplementaries: roll_data.used_supplementaries,
    used_keywords: roll_data.used_keywords,
  };
  return used_ressources;
}

export async function skillRollDialog(actor, skill_path) {
  if (actor === undefined) {
    console.warn("NO ACTOR, NO SKILL ROLL");
    return undefined;
  }
  const associated_features =
    actor.getAssociatedFeature_n_ItemAlterations(skill_path);
  const associated_keywords =
    utils.ruleset.character.getSkillAssociatedKeywordsData(
      actor,
      null,
      skill_path,
    );
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
