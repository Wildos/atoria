import * as utils from "../utils/module.mjs";
import * as rolls from "../rolls/module.mjs";
import RULESET from "../utils/ruleset.mjs";
import DEFAULT_VALUES from "../utils/default-values.mjs";
import { helpers } from "../models/module.mjs";

export default class AtoriaActor extends Actor {
  /**
   * Overriden to force only linked token to update
   */
  _updateDependentTokens(...args) {
    for (const token of this.getDependentTokens({ linked: true })) {
      token._onUpdateBaseActor(...args);
    }
  }

  prepareBaseData() {
    const actorData = this;
    actorData.system.encumbrance.value = 0;
    switch (this.type) {
      case "player-character":
        actorData.system.movement = utils.default_values.character.movement;
        actorData.system.armor_fields =
          utils.default_values.models.helpers.armorField();
        actorData.system.armor = utils.default_values.models.helpers
          .armorField()
          .getInitialValue({});
        actorData.system.resistance_fields =
          utils.default_values.models.helpers.resistanceField();
        actorData.system.resistance = utils.default_values.models.helpers
          .resistanceField()
          .getInitialValue({});
        break;
    }
  }

  prepareDerivedData() {
    const actorData = this;
    for (let i of this.items) {
      actorData.system.encumbrance.value += i.getEncumbrance();
    }
    switch (this.type) {
      case "player-character":
        actorData.system.mana.current_max =
          utils.ruleset.character.getCurrentMaxMana(this);
        actorData.system.stamina.current_max =
          utils.ruleset.character.getCurrentMaxStamina(this);
        for (let i of this.items) {
          actorData.system.armor.main = Math.max(
            actorData.system.armor.main,
            utils.ruleset.character.getMainArmorValue(i),
          );
        }
        break;
      case "hero":
        actorData.system.encumbrance.value +=
          actorData.system.ration * RULESET.ration_encumbrance;
        break;
    }
    actorData.system.encumbrance.level =
      RULESET.character.get_encumbrance_level(actorData);
  }

  getRollData() {
    const roll_data = {
      ...super.getRollData(),
      ...(this.system.getRollData?.() ?? null),
    };
    const active_keywords = utils.ruleset.character.getActiveKeywords(this);
    for (const keyword of active_keywords.values()) {
      switch (keyword) {
        case "obstruct":
          roll_data["initiative"] = roll_data["initiative"] + "-1";
          break;
        case "obstruct_more":
          roll_data["initiative"] = roll_data["initiative"] + "-1d2";
          break;
      }
    }
    return roll_data;
  }

  toPlainObject() {
    const result = { ...this };

    result.system = this.system.toPlainObject();
    result.items = this.items?.size > 0 ? this.items.contents : [];
    result.effects = this.effects?.size > 0 ? this.effects.contents : [];

    return result;
  }

  getSkillFromPath(skill_path) {
    let effective_skill_path_parts = skill_path.split(".");
    let target_skill = foundry.utils.getProperty(this, skill_path);
    if (target_skill === undefined) {
      target_skill = this;
      effective_skill_path_parts = [];
      for (let p of skill_path.split(".")) {
        const t = foundry.utils.getType(target_skill);
        if (!(t === "Object" || t === "Array")) break; // Invalid path
        if (p in target_skill) target_skill = target_skill[p];
        else break; // Can't traverse anymore
        effective_skill_path_parts.push(p);
      }
    }
    if (!utils.isSkill(target_skill)) return undefined;
    target_skill["path"] = effective_skill_path_parts.join(".");
    return target_skill;
  }

  getSkillnKnowledgeList() {
    const skill_types = {
      skills: this.system.skills,
      knowledges: this.system.knowledges,
    };
    return this.getSkillList(skill_types);
  }

  getOpposedSkillList() {
    const skill_list = {};
    for (const skill_path of RULESET.character.getOpposingSaves()) {
      skill_list[skill_path] = utils.getSkillTitle(
        skill_path,
        DEFAULT_VALUES.associated_skills[skill_path],
      );
    }
    return skill_list;
  }

  getSkillList(skill_types = { skills: this.system.skills }) {
    const skill_list = {};

    if (
      !["player-character", "non-player-character", "hero"].includes(this.type)
    )
      return skill_list;

    if (this.type === "hero") {
      if (Object.keys(skill_types).includes("skills")) {
        skill_list["system.skills.physical"] =
          this.system.skills.physical.label;
        skill_list["system.skills.social"] = this.system.skills.social.label;
        skill_list["system.skills.combative"] =
          this.system.skills.combative.label;
      }
      if (Object.keys(skill_types).includes("knowledges")) {
        skill_list["system.knowledges.craftmanship"] =
          this.system.knowledges.craftmanship.label;
        skill_list["system.knowledges.artistic"] =
          this.system.knowledges.artistic.label;
        skill_list["system.knowledges.erudition"] =
          this.system.knowledges.erudition.label;
        skill_list["system.knowledges.utilitarian"] =
          this.system.knowledges.utilitarian.label;
        skill_list["system.knowledges.magic"] =
          this.system.knowledges.magic.label;
      }
      return skill_list;
    }

    if (this.type === "non-player-character") {
      for (let skill_group_key in skill_types) {
        const skill_group = skill_types[skill_group_key];
        for (let skill_cat_key in skill_group) {
          const skill_cat = skill_group[skill_cat_key];
          for (let skill_key in skill_cat) {
            const skill_path = `system.${skill_group_key}.${skill_cat_key}.${skill_key}`;
            skill_list[skill_path] =
              skill_group[skill_cat_key][skill_key].label;
          }
        }
      }
      return skill_list;
    }
    for (let skill_type_key in skill_types) {
      const skill_type = skill_types[skill_type_key];
      for (let skill_group_key in skill_type) {
        const skill_group = skill_type[skill_group_key];
        for (let skill_cat_key in skill_group) {
          const skill_cat = skill_group[skill_cat_key];
          for (let skill_key in skill_cat) {
            const skill_path = `system.${skill_type_key}.${skill_group_key}.${skill_cat_key}.${skill_key}`;
            skill_list[skill_path] =
              skill_type[skill_group_key][skill_cat_key][skill_key].label;
          }
        }
      }
    }
    return skill_list;
  }

  getPerceptionSkillList() {
    const perception_list = {};
    for (let perception in this.system.perceptions) {
      const skill_path = `system.perceptions.${perception}`;
      perception_list[skill_path] = this.system.perceptions[perception].label;
    }
    return perception_list;
  }

  getAssociatedSkillList() {
    return Object.assign(
      {},
      this.getSkillnKnowledgeList(),
      this.getPerceptionSkillList(),
    );
  }

  getWeaponSkillList() {
    const skill_list = {};
    if (
      !["player-character", "non-player-character", "hero"].includes(this.type)
    )
      return skill_list;

    if (this.type === "hero") {
      return {
        "system.skills.combative": this.system.skills.combative.label,
      };
    }
    if (this.type === "non-player-character") {
      return {
        "system.skills.combative.weapon":
          this.system.skills.combative.weapon.label,
      };
    }

    const skill_cat = this.system.skills.combative.weapon;
    for (let skill_key in skill_cat) {
      const skill_path = `system.skills.combative.weapon.${skill_key}`;
      skill_list[skill_path] = skill_cat[skill_key].label;
    }

    return skill_list;
  }

  getSkillTitle(skill_path) {
    const skill = this.getSkillFromPath(skill_path);
    if (skill === undefined) {
      console.warn(`Couldn't generate skill title for path: '${skill_path}'`);
      return "";
    }
    return utils.getSkillTitle(skill.path, skill.label);
  }

  async rollSkill(skill_path) {
    const skill = this.getSkillFromPath(skill_path);
    if (skill === undefined) {
      // console.warn(`Unknown skill: '${skill_path}'`);
      const skill_name = utils.getSkillTitle(skill_path);
      const speaker = ChatMessage.getSpeaker({ actor: this });
      ChatMessage.create({
        speaker: speaker,
        whisper: [game.user.id],
        blind: false,
        content: `${this.name} doesn't know the skill '${skill_name}'`,
      });
      return;
    }

    const roll_config = await utils.skillRollDialog(this, skill_path);
    if (roll_config === null) return;

    const used_features = roll_config["used_features"].map((element_id) =>
      this.items.get(element_id),
    );
    const used_features_id = used_features.map((element) => {
      return element.uuid;
    });

    const roll_config_altered_step_1 = utils.applyFeaturesToRollConfig(
      roll_config,
      used_features,
    );
    const roll_config_altered = utils.applyKeywordsToRollConfig(
      roll_config_altered_step_1,
      roll_config["used_keywords"],
    );

    const {
      roll_mode,
      advantage_amount,
      disadvantage_amount,
      luck_applied,
      dos_mod,
    } = roll_config_altered;

    const skill_title = this.getSkillTitle(skill_path);
    const roll = new rolls.AtoriaDOSRoll(this.getRollData(), {
      owning_actor_id: this._id,
      success_value: skill.success,
      critical_success_amount:
        utils.ruleset.character.getSkillCriticalSuccessAmount(skill),
      critical_fumble_amount:
        utils.ruleset.character.getSkillCriticalFumbleAmount(skill),
      title: skill_title,
      advantage_amount,
      disadvantage_amount,
      luck_applied,
      dos_mod,
    });
    await roll.evaluate();

    await ChatMessage.create(
      {
        type: "interactable",
        speaker: ChatMessage.getSpeaker({ actor: this }),
        user: game.user.id,
        sound: CONFIG.sounds.dice,
        rolls: [roll],
        system: {
          related_items: [
            {
              type: "feature",
              items_id: used_features_id,
            },
          ],
        },
      },
      { rollMode: roll_mode },
    );

    for (let feature of used_features) {
      feature.update({
        "system.limitation.usage_left":
          feature.system.limitation.usage_left - 1,
      });
    }

    this.update({
      "system.luck": this.system.luck - luck_applied,
    });

    return roll;
  }

  async createSkill(skill_cat_path, skill_key, skill_label) {
    const actor_with_skill = ["player-character", "non-player-character"];
    if (!actor_with_skill.includes(this.type)) return;

    if (
      skill_cat_path === undefined ||
      !utils.ruleset.character.getExtendableSkill().includes(skill_cat_path)
    ) {
      console.warn(
        `Invalid skill category path given for skill handling: '${skill_cat_path}'`,
      );
      return;
    }
    const skill_category = foundry.utils.deepClone(
      foundry.utils.getProperty(this, skill_cat_path),
    );
    if (skill_category === undefined || skill_category === null) {
      console.warn(
        `Invalid skill category path given for skill handling: '${skill_cat_path}'`,
      );
      return;
    }
    const valid_key_regex = /^[a-z]+$/g;
    if (
      (skill_key ?? "") === "" ||
      !valid_key_regex.test(skill_key) ||
      Object.keys(skill_category).includes(skill_key)
    ) {
      console.warn(
        `Invalid skill key given for skill creation: '${skill_key}'`,
      );
      return;
    }
    const skill_cat_path_system_less = skill_cat_path.slice("system.".length);
    const skill_schema = this.system.schema.getField(
      skill_cat_path_system_less,
    );
    const new_skill = skill_schema.sub_element.getInitialValue({});
    new_skill["label"] = skill_label;
    skill_category[skill_key] = new_skill;
    this.update({
      [`${skill_cat_path}`]: skill_category,
    });
    this.render();
  }

  async deleteSkill(skill_cat_path, skill_key) {
    const actor_with_skill = ["player-character", "non-player-character"];
    if (!actor_with_skill.includes(this.type)) return;

    if (skill_cat_path === undefined) {
      console.warn(
        `Invalid skill category path given for skill handling: '${skill_cat_path}'`,
      );
      return;
    }
    const skill_category = foundry.utils.deepClone(
      foundry.utils.getProperty(this, skill_cat_path),
    );
    if (skill_category === undefined || skill_category === null) {
      console.warn(
        `Invalid skill category path given for skill handling: '${skill_cat_path}'`,
      );
      return;
    }
    if (!Object.keys(skill_category).includes(skill_key)) {
      console.warn(
        `Invalid skill key given for skill deletion: '${skill_key}'`,
      );
      return;
    }
    const confirmed = await utils.confirmDeletion(
      skill_category[skill_key].label,
    );
    if (!confirmed) return;
    this.update({
      [`${skill_cat_path}.-=${skill_key}`]: null,
    });
    this.render();
  }

  async createSubItem(config) {
    const { type } = config;
    if (type === null || type === undefined) {
      console.warn(`Missing item's type`);
      return;
    }
    if (type === "effect") {
      delete config.type;
      if (config.name === undefined) {
        const new_name = "ATORIA.Sheet.New_name";
        config.name = game.i18n.format(new_name, {
          type: game.i18n.localize(`TYPES.Effect`),
        });
      }
      const created_effect = await ActiveEffect.create(config, {
        parent: this,
      });
      return created_effect;
    }
    if (config.name === undefined) {
      const new_name = "ATORIA.Sheet.New_name";
      config.name = game.i18n.format(new_name, {
        type: game.i18n.localize(`TYPES.Item.${type}`),
      });
    }
    const created_item = await Item.create(config, { parent: this });
    // var max_sort_value = this.items.reduce((acc, i) => Math.max(acc, i.sort), 0);
    // created_item.update({ "sort": max_sort_value + 10000 });
    return created_item;
  }

  async editEffect(effect_id) {
    const effect = effect_id ? this.effects.get(effect_id) : null;
    if (effect === null || effect === undefined) {
      console.warn(`Missing or invalid effect-id: '${effect_id}'`);
      return;
    }
    await effect.sheet.render(true);
    effect.sheet.bringToFront();
  }

  async deleteEffect(effect_id) {
    const effect = effect_id ? this.effects.get(effect_id) : null;
    if (effect === null || effect === undefined) {
      console.warn(`Missing or invalid effect-id: '${effect_id}'`);
      return;
    }
    const confirmed = await utils.confirmDeletion(effect.name);
    if (!confirmed) return;
    effect.delete();
  }

  async editSubItem(item_id) {
    const item = item_id ? this.items.get(item_id) : null;
    if (item === null || item === undefined) {
      console.warn(`Missing or invalid item-id: '${item_id}'`);
      return;
    }
    await item.sheet.render(true);
    item.sheet.bringToFront();
  }
  async deleteSubItem(item_id) {
    const item = item_id ? this.items.get(item_id) : null;
    if (item === null || item === undefined) {
      console.warn(`Missing or invalid item-id: '${item_id}'`);
      return;
    }
    const confirmed = await utils.confirmDeletion(item.name);
    if (!confirmed) return;
    item.delete();
  }

  async manageItem(action, type, item_id) {
    console.warn("'manageItem' is deprecated, please inform Wildos");
  }

  _convertAttributeChangeToModChange(attribute_changes, changelogs) {
    if (!["player-character", "non-player-character"].includes(this.type))
      return;

    const update_list = {};
    // Health
    let tmp_value = this.system.health.value;
    let tmp_max = this.system.health.max;
    let tmp_new_value = Math.min(
      tmp_max,
      tmp_value + attribute_changes["health"],
    );
    if (!Number.isNaN(tmp_new_value) && tmp_value != tmp_new_value) {
      changelogs.push(
        game.i18n.format(
          game.i18n.localize("ATORIA.Chat_message.Changelog.Regain"),
          {
            type: game.i18n.localize(this.system.schema.fields.health.label),
            previous: tmp_value,
            new: tmp_new_value,
          },
        ),
      );
      update_list["system.health.value"] = tmp_new_value;
    }
    // Stamina
    tmp_value = this.system.stamina.value;
    tmp_max = utils.ruleset.character.getCurrentMaxStamina(this);
    tmp_new_value = Math.min(tmp_max, tmp_value + attribute_changes["stamina"]);
    if (!Number.isNaN(tmp_new_value) && tmp_value != tmp_new_value) {
      changelogs.push(
        game.i18n.format(
          game.i18n.localize("ATORIA.Chat_message.Changelog.Regain"),
          {
            type: game.i18n.localize(this.system.schema.fields.stamina.label),
            previous: tmp_value,
            new: tmp_new_value,
          },
        ),
      );
      update_list["system.stamina.value"] = tmp_new_value;
    }
    // Mana
    tmp_value = this.system.mana.value;
    tmp_max = utils.ruleset.character.getCurrentMaxMana(this);
    tmp_new_value = Math.min(tmp_max, tmp_value + attribute_changes["mana"]);
    if (!Number.isNaN(tmp_new_value) && tmp_value != tmp_new_value) {
      changelogs.push(
        game.i18n.format(
          game.i18n.localize("ATORIA.Chat_message.Changelog.Regain"),
          {
            type: game.i18n.localize(this.system.schema.fields.mana.label),
            previous: tmp_value,
            new: tmp_new_value,
          },
        ),
      );
      update_list["system.mana.value"] = tmp_new_value;
    }

    if (this.type !== "player-character") return update_list;

    // Healing inactive amount
    tmp_value = this.system.healing_inactive.amount;
    tmp_new_value = Math.max(
      0,
      tmp_value + attribute_changes["healing_inactive.amount"],
    );
    if (!Number.isNaN(tmp_new_value) && tmp_value != tmp_new_value) {
      changelogs.push(
        game.i18n.format(
          game.i18n.localize("ATORIA.Chat_message.Changelog.Regain"),
          {
            type: game.i18n.localize(
              this.system.schema.fields.healing_inactive.label,
            ),
            previous: tmp_value,
            new: tmp_new_value,
          },
        ),
      );
      update_list["system.healing_inactive.amount"] = tmp_new_value;
    }

    const checkboxVisual = (is_true) => {
      return `<input type='checkbox' ${is_true ? "checked" : ""} disabled>`;
    };

    // Herbs inactive
    tmp_value = this.system.healing_inactive.herbs;
    tmp_new_value =
      "healing_inactive.herbs" in attribute_changes
        ? attribute_changes["healing_inactive.herbs"]
        : tmp_value;
    if (tmp_value != tmp_new_value) {
      changelogs.push(
        game.i18n.format(
          game.i18n.localize("ATORIA.Chat_message.Changelog.Regain"),
          {
            type: game.i18n.localize(
              this.system.schema.fields.healing_inactive.fields.herbs.label,
            ),
            previous: checkboxVisual(tmp_value),
            new: checkboxVisual(tmp_new_value),
          },
        ),
      );
      update_list["system.healing_inactive.herbs"] = tmp_new_value;
    }

    // Medical inactive
    tmp_value = this.system.healing_inactive.medical;
    tmp_new_value =
      "healing_inactive.medical" in attribute_changes
        ? attribute_changes["healing_inactive.medical"]
        : tmp_value;
    if (tmp_value != tmp_new_value) {
      changelogs.push(
        game.i18n.format(
          game.i18n.localize("ATORIA.Chat_message.Changelog.Regain"),
          {
            type: game.i18n.localize(
              this.system.schema.fields.healing_inactive.fields.medical.label,
            ),
            previous: checkboxVisual(tmp_value),
            new: checkboxVisual(tmp_new_value),
          },
        ),
      );
      update_list["system.healing_inactive.medical"] = tmp_new_value;
    }

    // Resurrection inactive
    tmp_value = this.system.healing_inactive.resurrection;
    tmp_new_value =
      "healing_inactive.resurrection" in attribute_changes
        ? attribute_changes["healing_inactive.resurrection"]
        : tmp_value;
    if (tmp_value != tmp_new_value) {
      changelogs.push(
        game.i18n.format(
          game.i18n.localize("ATORIA.Chat_message.Changelog.Regain"),
          {
            type: game.i18n.localize(
              this.system.schema.fields.healing_inactive.fields.resurrection
                .label,
            ),
            previous: checkboxVisual(tmp_value),
            new: checkboxVisual(tmp_new_value),
          },
        ),
      );
      update_list["system.healing_inactive.resurrection"] = tmp_new_value;
    }

    // Sanity inactive
    tmp_value = this.system.sanity.regain_inactive;
    tmp_new_value =
      "sanity.regain_inactive" in attribute_changes
        ? attribute_changes["sanity.regain_inactive"]
        : tmp_value;
    if (tmp_value != tmp_new_value) {
      changelogs.push(
        game.i18n.format(
          game.i18n.localize("ATORIA.Chat_message.Changelog.Regain"),
          {
            type: game.i18n.localize(
              this.system.schema.fields.sanity.fields.regain_inactive.label,
            ),
            previous: checkboxVisual(tmp_value),
            new: checkboxVisual(tmp_new_value),
          },
        ),
      );
      update_list["system.sanity.regain_inactive"] = tmp_new_value;
    }

    // Endurance inactive
    tmp_value = this.system.endurance.regain_inactive;
    tmp_new_value =
      "endurance.regain_inactive" in attribute_changes
        ? attribute_changes["endurance.regain_inactive"]
        : tmp_value;
    if (tmp_value != tmp_new_value) {
      changelogs.push(
        game.i18n.format(
          game.i18n.localize("ATORIA.Chat_message.Changelog.Regain"),
          {
            type: game.i18n.localize(
              this.system.schema.fields.endurance.fields.regain_inactive.label,
            ),
            previous: checkboxVisual(tmp_value),
            new: checkboxVisual(tmp_new_value),
          },
        ),
      );
      update_list["system.endurance.regain_inactive"] = tmp_new_value;
    }
    return update_list;
  }

  async applyTimePhase(time_phase_type) {
    if (!["player-character", "non-player-character"].includes(this.type))
      return;

    let changelogs = [
      game.i18n.format(
        game.i18n.localize("ATORIA.Chat_message.Changelog.Time_phase_passed"),
        {
          time_phase: game.i18n.localize(
            utils.ruleset.time_phases[time_phase_type],
          ),
        },
      ),
    ];

    const update_list = this._convertAttributeChangeToModChange(
      utils.ruleset.character.getRestoredAttributes(this, time_phase_type),
      changelogs,
    );

    const time_phases_type_to_apply =
      utils.ruleset.general.getTimePhasesTypeToApply(time_phase_type);
    for (let time_phase_type of time_phases_type_to_apply) {
      for (const [_, i] of this.items.entries()) {
        const item_changelogs = await i.applyTimePhase(time_phase_type);
        for (let e of item_changelogs) {
          changelogs.push(e);
        }
      }
    }
    await this.update(update_list);

    const speaker = ChatMessage.getSpeaker({ actor: this });
    ChatMessage.create({
      speaker: speaker,
      whisper: game.users.filter((u) => u.isGM),
      blind: false,
      content: changelogs.join("<br>"),
    });
    await this.render();
  }

  getAssociatedFeatures(skill_path) {
    const associated_features = [];
    for (let i of this.items) {
      if (i.type !== "feature") continue;
      if (
        i.system.skill_alteration.has_skill_alteration &&
        i.system.skill_alteration.associated_skill === skill_path
      )
        associated_features.push(i);
    }
    return associated_features;
  }

  getActableModifierList(want_technique = true, want_incantatory = true) {
    const actable_modifier_types = ["technique", "incantatory-addition"];
    const actable_mod_list = [];
    for (let i of this.items) {
      if (!actable_modifier_types.includes(i.type)) continue;
      if (want_technique && i.type === "technique") actable_mod_list.push(i);
      if (want_incantatory && i.type === "incantatory-addition")
        actable_mod_list.push(i);
    }
    return actable_mod_list;
  }

  onChatButton(data) {
    console.log("Actor");
    console.dir(data);
  }
}
