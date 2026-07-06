import * as utils from "../utils/module.mjs";
import * as rolls from "../rolls/module.mjs";
import RULESET from "../utils/ruleset.mjs";
import DEFAULT_VALUES from "../utils/default-values.mjs";
import { helpers } from "../models/module.mjs";
import { AtoriaRollDialog, AtoriaRollCombatDialog } from "../sheets/module.mjs";

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
    super.prepareBaseData();
    const actorData = this;

    actorData.system.encumbrance.value = 0;
    actorData.system.regain_rest_mana_mod = 0;
    switch (this.type) {
      case "hero":
        break;
      case "non-player-character":
        break;

      case "player-character":
        actorData.system.movement = utils.default_values.character.movement;
        actorData.system.armor_fields =
          utils.default_values.models.helpers.armorField(
            actorData.effect_fields,
          );
        actorData.system.armor = utils.default_values.models.helpers
          .armorField()
          .getInitialValue({});
        actorData.system.resistance_fields =
          utils.default_values.models.helpers.resistanceField(
            actorData.effect_fields,
          );
        actorData.system.resistance = utils.default_values.models.helpers
          .resistanceField()
          .getInitialValue({});
        break;
    }
  }

  prepareDerivedData() {
    super.prepareDerivedData();
    const actorData = this;
    for (let i of this.items) {
      actorData.system.encumbrance.value += i.getEncumbrance();
    }

    actorData.system.active_sharable_keywords_level =
      utils.ruleset.character.getActiveSharableKeywordsLevel(this);

    switch (this.type) {
      case "player-character":
        actorData.system.mana.current_max =
          utils.ruleset.character.getCurrentMaxMana(this);
        actorData.system.stamina.current_max =
          utils.ruleset.character.getCurrentMaxStamina(this);
        break;
      case "hero":
        actorData.system.encumbrance.value +=
          actorData.system.ration * RULESET.ration_encumbrance;
        break;
    }
    actorData.system.encumbrance.level =
      RULESET.character.get_encumbrance_level(actorData);
  }

  get_effect_fields() {
    return {
      "system.encumbrance.max": "ATORIA.Model.Encumbrance.Max",
      "system.endurance.max": "ATORIA.Model.Endurance.Max",
      "system.health.max": "ATORIA.Model.Health.Max",
      "system.mana.max": "ATORIA.Model.Mana.Max",
      "system.sanity.max": "ATORIA.Model.Sanity.Max",
      "system.stamina.max": "ATORIA.Model.Stamina.Max",

      "system.initiative": "ATORIA.Ruleset.Initiative",
      "system.movement": "ATORIA.Ruleset.Movement",

      "system.armor.main": "ATORIA.Ruleset.Armor.Main",
      "system.armor.bludgeoning": "ATORIA.Ruleset.Armor.Bludgeoning",
      "system.armor.piercing": "ATORIA.Ruleset.Armor.Piercing",
      "system.armor.slashing": "ATORIA.Ruleset.Armor.Slashing",

      "system.resistance.main": "ATORIA.Ruleset.Resistance.Main",
      "system.resistance.acid": "ATORIA.Ruleset.Resistance.Acid",
      "system.resistance.arcanic": "ATORIA.Ruleset.Resistance.Arcanic",
      "system.resistance.fire": "ATORIA.Ruleset.Resistance.Fire",
      "system.resistance.lightning": "ATORIA.Ruleset.Resistance.Lightning",
      "system.resistance.cold": "ATORIA.Ruleset.Resistance.Cold",
      "system.resistance.necrotic": "ATORIA.Ruleset.Resistance.Necrotic",
      "system.resistance.poison": "ATORIA.Ruleset.Resistance.Poison",
      "system.resistance.psychic": "ATORIA.Ruleset.Resistance.Psychic",
      "system.resistance.radiant": "ATORIA.Ruleset.Resistance.Radiant",

      "system.regain_rest_mana_mod": "ATORIA.Ruleset.Rest.Mana_regain",
    };
  }

  getRollData() {
    const roll_data = {
      ...super.getRollData(),
      ...(this.system.getRollData?.() ?? null),
    };

    roll_data["initiative"] =
      utils.ruleset.character.get_usable_initiative(this);

    return roll_data;
  }

  toPlainObject() {
    const result = { ...this };

    // result.system = this.system.toPlainObject();
    result.items = this.items?.size > 0 ? this.items.contents : [];
    result.effects = this.effects?.size > 0 ? this.effects.contents : [];

    return result;
  }

  getSkillFromPath(skill_path) {
    let target_skill = foundry.utils.getProperty(this, skill_path);
    if (target_skill === undefined) {
      target_skill = this;
      let effective_skill_path_parts = [];
      for (let p of skill_path.split(".")) {
        const t = foundry.utils.getType(target_skill);
        if (!(t === "Object" || t === "Array" || t === "Unknown")) break; // Invalid path
        if (p in target_skill) target_skill = target_skill[p];
        else break; // Can't traverse anymore
        effective_skill_path_parts.push(p);
      }
      target_skill["path"] = effective_skill_path_parts.join(".");
    } else {
      target_skill["path"] = skill_path;
    }
    if (!utils.isSkill(target_skill)) return undefined;

    target_skill["critical_success_amount"] =
      utils.ruleset.character.getSkillCriticalSuccessAmount(target_skill);
    target_skill["critical_fumble_amount"] =
      utils.ruleset.character.getSkillCriticalFumbleAmount(target_skill);
    target_skill["proper_label"] = this.getSkillTitle(target_skill.path);
    target_skill["label"] = this.getSkillLabel(target_skill.path);
    return target_skill;
  }

  getSkillLabel(skill_path) {
    return utils.ruleset.character.getSkillOrKnowledgeTitle(this, skill_path);
  }

  getSkillTitle(skill_path) {
    let skill_cat_label = game.i18n.localize(
      utils.ruleset.character.getSkillOrKnowledgeCategoryTitle(
        this,
        skill_path,
      ),
    );

    let skill_label = game.i18n.localize(this.getSkillLabel(skill_path));

    return skill_cat_label + " - " + skill_label;
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
      skill_list[skill_path] = this.getSkillTitle(skill_path);
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
        skill_list["system.skills.physical"] = this.getSkillLabel(
          "system.skills.physical",
        );
        skill_list["system.skills.social"] = this.getSkillLabel(
          "system.skills.social",
        );
      }
      if (Object.keys(skill_types).includes("knowledges")) {
        for (let knowledge_group_key in this.system.knowledges) {
          skill_list[`system.knowledges.${knowledge_group_key}`] =
            this.getSkillLabel(`system.knowledges.${knowledge_group_key}`);
        }
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
            skill_list[skill_path] = this.getSkillTitle(skill_path);
          }
        }
      }
      return skill_list;
    }

    for (let skill_type_key in skill_types) {
      const skill_type = skill_types[skill_type_key];
      for (let skill_group_key in skill_type) {
        const skill_group = skill_type[skill_group_key];
        if (skill_group_key == "perceptions") {
          for (let skill_key in skill_group) {
            const skill_path = `system.${skill_type_key}.${skill_group_key}.${skill_key}`;
            skill_list[skill_path] = this.getSkillTitle(skill_path);
          }
          continue;
        }
        for (let skill_cat_key in skill_group) {
          const skill_cat = skill_group[skill_cat_key];
          for (let skill_key in skill_cat) {
            const skill_path = `system.${skill_type_key}.${skill_group_key}.${skill_cat_key}.${skill_key}`;
            skill_list[skill_path] = this.getSkillTitle(skill_path);
          }
        }
      }
    }
    return skill_list;
  }

  getAssociatedSkillList() {
    return Object.assign({}, this.getSkillnKnowledgeList());
  }

  getWeaponSkillList() {
    const skill_list = {};
    if (
      !["player-character", "non-player-character", "hero"].includes(this.type)
    )
      return skill_list;

    let skill_paths = utils.ruleset.character.getWeaponSkills(this);

    for (const skill_path of skill_paths) {
      let skill = this.getSkillFromPath(skill_path);
      skill_list[skill_path] = skill?.label;
    }

    return skill_list;
  }

  async getKeywordTooltipHTML(keyword_data) {
    return await foundry.applications.handlebars.renderTemplate(
      CONFIG.ATORIA.ITEM_TOOLTIP_TEMPLATES["keyword"],
      {
        item: keyword_data,
        systemFields: this.system.schema
          .getField("keywords")
          .getField(keyword_data.id),
      },
    );
  }

  async _rollSkill(skill, skill_path) {
    console.debug("_rollSkill");
    console.debug(skill);
    // Get roll parameters
    let roll_parameters = await AtoriaRollDialog.ask({
      actor_uuid: this.uuid,
      roll_label: skill.proper_label,
      skills: [skill],
    });

    if (roll_parameters === null) return;

    // Create message roll
    console.debug("roll_parameters");
    console.debug(roll_parameters);
    let roll_data = utils.get_roll_data(roll_parameters, skill_path);

    let effects_data = utils.get_effects_data(roll_parameters);
    let critical_effects_data =
      utils.get_critical_effects_data(roll_parameters);

    let used_perks_data = {
      keywords: {
        length: roll_parameters.used_keywords.length,
        description: (
          await Promise.all(
            roll_parameters.used_keywords.map(
              async (keyword) => await this.getKeywordTooltipHTML(keyword),
            ),
          )
        ).join(""),
      },
      supplementaries: {
        length: 0,
        description: "",
      },
      act_mod: {
        length: 0,
        description: "",
      },
      feature: {
        length: 0,
        description: "",
      },
    };
    for (let item of roll_parameters.used_perks) {
      if (item.type === "feature") {
        used_perks_data["feature"].length += 1;
        used_perks_data["feature"].description += await item.getTooltipHTML();
      } else if (["weapon", "armor", "kit"].includes(item.type)) {
        used_perks_data["feature"].length += 1;
        used_perks_data["feature"].description += await item.getTooltipHTML();
      } else {
        console.error("Unknown type found in used_perks");
      }
    }
    let used_perks = [];
    if (used_perks_data.keywords.length !== 0) {
      used_perks.push({
        name: game.i18n.format("ATORIA.Chat_message.Used.Keywords", {
          amount: used_perks_data.keywords.length,
        }),
        description: used_perks_data.keywords.description,
      });
    }
    if (used_perks_data.feature.length !== 0) {
      used_perks.push({
        name: game.i18n.format("ATORIA.Chat_message.Used.Features", {
          amount: used_perks_data.feature.length,
        }),
        description: used_perks_data.feature.description,
      });
    }
    let system_data = {
      used_perks: used_perks,
      saves_asked: utils.get_asked_saves(roll_parameters),
    };

    console.debug("roll_data");
    console.debug(roll_data);
    console.debug(effects_data);
    console.debug(critical_effects_data);
    let rolls = await utils.create_rolls_with_effect(
      this,
      roll_data,
      effects_data,
      critical_effects_data,
    );

    await utils.chat_message_from_roll(
      this,
      roll_parameters.message_mode,
      rolls,
      system_data,
    );

    // Consume resource used
    for (let keyword of roll_parameters.used_keywords) {
      this.takeOneKeywordUse(keyword);
    }
    for (let perk_item of roll_parameters.used_perks) {
      perk_item.takeOneLimitationUse();
    }
    this.update({
      "system.luck": this.system.luck - roll_parameters.roll_data.luck_applied,
    });
  }

  async rollFistFight() {
    const martial_skill = this.getSkillFromPath(
      utils.ruleset.character.MARTIAL_CONTACT_PATH,
    );
    const weapon_skill = this.getSkillFromPath(
      utils.ruleset.character.FISTFIGHT_SKILL_PATH,
    );
    if (martial_skill === undefined || weapon_skill === undefined) {
      // console.warn(`Unknown skill: '${skill_path}'`);
      const skill_name = this.getSkillTitle(
        utils.ruleset.character.FISTFIGHT_SKILL_PATH,
      );
      const speaker = ChatMessage.getSpeaker({ actor: this });
      ChatMessage.create({
        speaker: speaker,
        whisper: [game.user.id],
        blind: false,
        content: `${this.name} doesn't know the skill '${skill_name}'`,
      });
      return;
    }

    // -----------------
    martial_skill.usable_keywords = await utils.get_usable_keywords(
      this,
      undefined,
      utils.ruleset.character.MARTIAL_CONTACT_PATH,
    );
    martial_skill.usable_perks = utils.get_usable_perks_for_skill(
      this,
      utils.ruleset.character.MARTIAL_CONTACT_PATH,
    );

    let skill = martial_skill;

    if (this.type == "player-character") {
      weapon_skill.usable_keywords = await utils.get_usable_keywords(
        this,
        undefined,
        utils.ruleset.character.FISTFIGHT_SKILL_PATH,
      );
      weapon_skill.usable_perks = utils.get_usable_perks_for_skill(
        this,
        utils.ruleset.character.FISTFIGHT_SKILL_PATH,
      );

      skill = utils.ruleset.item.getFinalSkillDataFromKnowledgeAndWeapon(
        martial_skill,
        weapon_skill,
      );
    }

    this._rollSkill(skill, utils.ruleset.character.FISTFIGHT_SKILL_PATH);
  }

  async rollThrow() {
    const skill_path = utils.ruleset.character.MARTIAL_APART_PATH;
    const martial_skill = this.getSkillFromPath(skill_path);
    if (martial_skill === undefined) {
      // console.warn(`Unknown skill: '${skill_path}'`);
      const skill_name = this.getSkillTitle(skill_path);
      const speaker = ChatMessage.getSpeaker({ actor: this });
      ChatMessage.create({
        speaker: speaker,
        whisper: [game.user.id],
        blind: false,
        content: `${this.name} doesn't know the skill '${skill_name}'`,
      });
      return;
    }

    // -----------------
    martial_skill.usable_keywords = await utils.get_usable_keywords(
      this,
      undefined,
      skill_path,
    );
    martial_skill.usable_perks = utils.get_usable_perks_for_skill(
      this,
      skill_path,
    );

    let skill = foundry.utils.deepClone(martial_skill);
    skill.label = game.i18n.localize("ATORIA.Ruleset.Attack.Throw");
    this._rollSkill(skill, skill_path);
  }

  async rollSkill(skill_path) {
    const skill = this.getSkillFromPath(skill_path);
    if (skill === undefined) {
      // console.warn(`Unknown skill: '${skill_path}'`);
      const skill_name = this.getSkillTitle(skill_path);
      const speaker = ChatMessage.getSpeaker({ actor: this });
      ChatMessage.create({
        speaker: speaker,
        whisper: [game.user.id],
        blind: false,
        content: `${this.name} doesn't know the skill '${skill_name}'`,
      });
      return;
    }

    // -----------------
    skill.usable_keywords = await utils.get_usable_keywords(
      this,
      undefined,
      skill_path,
    );
    skill.usable_perks = utils.get_usable_perks_for_skill(this, skill_path);

    this._rollSkill(skill, skill_path);
  }

  async rollCombatSkill(type) {
    let dialog = new AtoriaRollCombatDialog(
      {
        type: type,
        actor_uuid: this.uuid,
        items: this.items.filter(
          (item) =>
            utils.ruleset.item.isCompatibleItemFromMartialRoll(item, type) &&
            item.type == "weapon" &&
            item.system.is_worn,
        ),
      },
      {},
    );
    dialog.render({ force: true });
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
    // Medical inactive 2
    tmp_value = this.system.healing_inactive.medical_2;
    tmp_new_value =
      "healing_inactive.medical_2" in attribute_changes
        ? attribute_changes["healing_inactive.medical_2"]
        : tmp_value;
    if (tmp_value != tmp_new_value) {
      changelogs.push(
        game.i18n.format(
          game.i18n.localize("ATORIA.Chat_message.Changelog.Regain"),
          {
            type: game.i18n.localize(
              this.system.schema.fields.healing_inactive.fields.medical_2.label,
            ),
            previous: checkboxVisual(tmp_value),
            new: checkboxVisual(tmp_new_value),
          },
        ),
      );
      update_list["system.healing_inactive.medical_2"] = tmp_new_value;
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
      game.i18n.format("ATORIA.Chat_message.Changelog.Time_phase_passed", {
        time_phase: game.i18n.localize(
          utils.ruleset.time_phases[time_phase_type],
        ),
      }),
    ];

    const time_phases_type_to_apply =
      utils.ruleset.general.getTimePhasesTypeToApply(time_phase_type);

    changelogs.push(
      ...(await utils.ruleset.character.applyTimePhases(
        this,
        time_phases_type_to_apply,
      )),
    );

    const speaker = ChatMessage.getSpeaker({ actor: this });
    ChatMessage.create({
      speaker: speaker,
      whisper: game.users.filter((u) => u.isGM),
      blind: false,
      content: changelogs.join("<br>"),
    });
  }

  getAssociatedFeature_n_ItemAlterations(skill_path) {
    const associated_features = [];
    for (let i of this.items) {
      if (!["feature", "kit", "weapon", "armor"].includes(i.type)) continue;
      for (let alteration of i.system.skill_alterations) {
        if (
          utils.isSkillPathsMatchingAssociatedOne(
            alteration.associated_skill,
            skill_path,
            true,
          )
        ) {
          associated_features.push(i);
          break;
        }
      }
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

  takeOneKeywordUse(keyword_data) {
    console.debug("takeOneKeywordUse");
    let keyword_id = keyword_data.id;
    this.update({
      [`system.keywords.${keyword_id}.limit_remaining`]:
        this.system.keywords[keyword_id].limit_remaining - 1,
    });
  }

  createKeywordAlteration(keyword_id, level) {
    let effect_level = {};
    let effect_level_path = "";
    switch (level) {
      case 0:
        effect_level = this.system.keywords[keyword_id].effect_level_1;
        effect_level_path = "effect_level_1";
        break;
      case 1:
        effect_level = this.system.keywords[keyword_id].effect_level_2;
        effect_level_path = "effect_level_2";
        break;
      case 2:
        effect_level = this.system.keywords[keyword_id].effect_level_3;
        effect_level_path = "effect_level_3";
        break;
      case 3:
        effect_level = this.system.keywords[keyword_id].effect_level_4;
        effect_level_path = "effect_level_4";
        break;
      case 4:
        effect_level = this.system.keywords[keyword_id].effect_level_5;
        effect_level_path = "effect_level_5";
        break;
      default:
        return;
    }
    effect_level.skill_alterations.push(
      this.system.schema
        .getField(
          "keywords." +
            keyword_id +
            "." +
            effect_level_path +
            ".skill_alterations",
        )
        .element.getInitialValue(),
    );
    let value_path = `system.keywords.${keyword_id}.${effect_level_path}`;
    let update_dict = {};
    update_dict[value_path] = effect_level;
    this.update(update_dict);
  }

  deleteKeywordAlteration(keyword_id, level, index) {
    let effect_level = {};
    let effect_level_path = "";
    switch (level) {
      case 0:
        effect_level = this.system.keywords[keyword_id].effect_level_1;
        effect_level_path = "effect_level_1";
        break;
      case 1:
        effect_level = this.system.keywords[keyword_id].effect_level_2;
        effect_level_path = "effect_level_2";
        break;
      case 2:
        effect_level = this.system.keywords[keyword_id].effect_level_3;
        effect_level_path = "effect_level_3";
        break;
      case 3:
        effect_level = this.system.keywords[keyword_id].effect_level_4;
        effect_level_path = "effect_level_4";
        break;
      case 4:
        effect_level = this.system.keywords[keyword_id].effect_level_5;
        effect_level_path = "effect_level_5";
        break;
      default:
        return;
    }
    effect_level.skill_alterations.splice(Number(index), 1);
    let value_path = `system.keywords.${keyword_id}.${effect_level_path}`;
    let update_dict = {};
    update_dict[value_path] = effect_level;
    this.update(update_dict);
  }

  onChatButton(data) {
    console.log("Actor");
    console.dir(data);
  }
}
