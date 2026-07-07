import * as utils from "../utils/module.mjs";
import * as rolls from "../rolls/module.mjs";
import RULESET from "../utils/ruleset.mjs";
import * as model_utils from "../models/helpers.mjs";
import { AtoriaRollDialog } from "../sheets/module.mjs";

export default class AtoriaItem extends Item {
  // Prepare data for the item execute the following, in order:
  // data reset (to clear active effects),
  // prepareBaseData(),
  // prepareEmbeddedDocuments() (including active effects),
  // prepareDerivedData().

  prepareBaseData() {
    super.prepareBaseData();
  }

  async prepareDerivedData() {
    await super.prepareDerivedData();
    this.descriptive_tooltip =
      await foundry.applications.handlebars.renderTemplate(
        CONFIG.ATORIA.ITEM_TOOLTIP_TEMPLATES[this.type],
        {
          item: this,
          systemFields: this.system.schema.fields,
          keywords_recap: this.getKeywordRecap(),
        },
      );
    if (this.type === "spell") {
      for (let supp of this.system.supplementaries_list) {
        supp.descriptive_tooltip =
          await foundry.applications.handlebars.renderTemplate(
            CONFIG.ATORIA.ITEM_TOOLTIP_TEMPLATES["supplementary"],
            {
              supplementary: supp,
              systemFields:
                this.system.schema.fields.supplementaries_list.element.fields,
            },
          );
      }
    }
    if (this.system.usable_actable_modifiers !== undefined) {
      let invalid_ids = this.system.usable_actable_modifiers.flatMap((id) => {
        let usable_actable = this.actor.items.get(id);
        return usable_actable !== undefined ? [] : id;
      });
      for (const id of invalid_ids) {
        this.disableActableModifier(id);
      }
    }
    if (this.system.usable_actable_modifiers_typed !== undefined) {
      let invalid_ids = this.system.usable_actable_modifiers_typed.flatMap(
        (data) => {
          let usable_actable = this.actor.items.get(data.uuid);
          return usable_actable !== undefined
            ? []
            : data?.uuid !== undefined
              ? data.uuid
              : data;
        },
      );
      if (!invalid_ids.length == 0) {
        this.system.usable_actable_modifiers_typed =
          this.system.usable_actable_modifiers_typed.filter(
            (data) => !invalid_ids.includes(data.uuid),
          );
      }
    }
  }

  prepareEmbeddedDocuments() {
    super.prepareEmbeddedDocuments();
    if (["armor", "weapon"].includes(this.type)) {
      for (const collectionName of Object.keys(
        this.constructor.hierarchy || {},
      )) {
        for (let e of this.getEmbeddedCollection(collectionName)) {
          e.disabled = !this.system.is_worn;
        }
      }
    }
  }

  getRollData() {
    const rollData = {
      descriptive_tooltip: this.descriptive_tooltip,
      ...this.system,
    };

    if (!this.actor) return rollData;

    rollData.actor = this.actor.getRollData();

    return rollData;
  }

  toObject() {
    const data = super.toObject();
    data.owner = this.actor;
    return data;
  }

  toPlainObject() {
    const data = { ...this };

    data.system = this.system.toPlainObject();
    data.effects = this.effects?.size > 0 ? this.effects.contents : [];

    return data;
  }

  async addSubElement(sub_element_path) {
    if (sub_element_path === undefined) {
      console.warn(
        `Invalid sub-element category path given for sub-element handling: '${sub_element_path}'`,
      );
      return;
    }
    const sub_element_category = foundry.utils.getProperty(
      this.system,
      sub_element_path,
    );
    if (sub_element_category === undefined || sub_element_category === null) {
      console.warn(
        `Invalid sub-element category path given for sub-element handling: '${sub_element_path}'`,
      );
      return;
    }
    if (!Array.isArray(sub_element_category)) {
      console.warn(
        `Unexpected sub_element_category's type: '${typeof sub_element_category}'`,
      );
      return;
    }
    const sub_element_schema = this.system.schema.getField(sub_element_path);
    const new_sub_element = sub_element_schema.element.getInitialValue();
    sub_element_category.push(new_sub_element);
    await this.update({
      [`system.${sub_element_path}`]: sub_element_category,
    });
    this.render();
  }

  async deleteSubElement(sub_element_path, subElementIndex) {
    if (sub_element_path === undefined) {
      console.warn(
        `Invalid sub-element category path given for sub-element handling: '${sub_element_path}'`,
      );
      return;
    }
    const sub_element_category = foundry.utils.getProperty(
      this.system,
      sub_element_path,
    );
    if (sub_element_category === undefined || sub_element_category === null) {
      console.warn(
        `Invalid sub-element category path given for sub-element handling: '${sub_element_path}'`,
      );
      return;
    }
    if (!Array.isArray(sub_element_category)) {
      console.warn(
        `Unexpected sub_element_category's type: '${typeof sub_element_category}'`,
      );
      return;
    }
    if (
      subElementIndex === undefined ||
      subElementIndex >= sub_element_category.length
    ) {
      console.warn(
        `Invalid sub-element index given for sub-element deletion: '${subElementIndex}'`,
      );
      return;
    }

    const confirmed = await utils.confirmDeletion(
      sub_element_category[subElementIndex]?.name,
    );
    if (!confirmed) return;

    sub_element_category.splice(Number(subElementIndex), 1);
    await this.update({
      [`system.${sub_element_path}`]: sub_element_category,
    });
    this.render();
  }

  async createEffect(config) {
    if (config.name === undefined) {
      const new_name = "ATORIA.Sheet.New_name";
      config.name = game.i18n.format(new_name, {
        type: game.i18n.localize(`TYPES.Effect`),
      });
    }
    delete config.type;
    const created_effect = await ActiveEffect.create(config, {
      parent: this,
    });
    return created_effect;
  }

  async editEffect(effect_id) {
    const effect = effect_id ? this.effects.get(effect_id) : null;
    if (effect === null || effect === undefined) {
      console.warn(`Missing or invalid effect-id: '${effect_id}'`);
      return;
    }
    effect.sheet.render(true);
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

  getEncumbrance() {
    const inventory_item_types = ["kit", "armor", "weapon"];
    if (!inventory_item_types.includes(this.type)) return 0.0;
    if (this.type === "kit")
      return this.system.encumbrance * this.system.quantity;
    if (this.type === "armor")
      return this.system.is_worn
        ? this.system.worn_encumbrance
        : this.system.encumbrance;
    return this.system.encumbrance;
  }

  enableActableModifier(action_modifier_id, actable_type = undefined) {
    if (action_modifier_id === undefined) {
      console.warn(
        `Invalid action_modifier_id given for handling: '${action_modifier_id}'`,
      );
      return;
    }
    if (actable_type === undefined) {
      const new_usable_actable_modifiers = foundry.utils.deepClone(
        this.system.usable_actable_modifiers,
      );
      if (this.system.usable_actable_modifiers.includes(action_modifier_id)) {
        console.warn(
          `Addition error: action_modifier_id '${action_modifier_id}' already present in list of item ${this._id}`,
        );
        return;
      }
      new_usable_actable_modifiers.push(action_modifier_id);
      this.update({
        "system.usable_actable_modifiers": new_usable_actable_modifiers,
      });
    } else {
      const new_usable_actable_modifiers_typed = foundry.utils.deepClone(
        this.system.usable_actable_modifiers_typed,
      );
      let found_entry = new_usable_actable_modifiers_typed.find(
        (element) => element.uuid == action_modifier_id,
      );
      if (found_entry === undefined) {
        found_entry = {
          uuid: action_modifier_id,
          main: false,
          throw: false,
          focuser: false,
        };
        new_usable_actable_modifiers_typed.push(found_entry);
      }
      switch (actable_type) {
        case "main":
          found_entry.main = true;
          break;
        case "throw":
          found_entry.throw = true;
          break;
        case "focuser":
          found_entry.focuser = true;
          break;
        default:
          console.error("Invalid type");
          break;
      }
      this.update({
        "system.usable_actable_modifiers_typed":
          new_usable_actable_modifiers_typed,
      });
    }
  }

  disableActableModifier(action_modifier_id, actable_type = undefined) {
    if (action_modifier_id === undefined) {
      console.warn(
        `Invalid action_modifier_id given for handling: '${action_modifier_id}'`,
      );
      return;
    }

    if (actable_type === undefined) {
      const new_usable_actable_modifiers = foundry.utils.deepClone(
        this.system.usable_actable_modifiers,
      );
      if (!this.system.usable_actable_modifiers.includes(action_modifier_id)) {
        console.warn(
          `Removal error: action_modifier_id '${action_modifier_id}' not present in list of item ${this._id}`,
        );
        return;
      }
      new_usable_actable_modifiers.splice(
        new_usable_actable_modifiers.indexOf(action_modifier_id),
        1,
      );
      this.update({
        "system.usable_actable_modifiers": new_usable_actable_modifiers,
      });
    } else {
      const new_usable_actable_modifiers_typed = foundry.utils.deepClone(
        this.system.usable_actable_modifiers_typed,
      );
      let found_entry = new_usable_actable_modifiers_typed.find(
        (element) => element.uuid == action_modifier_id,
      );
      if (found_entry === undefined) {
        found_entry = {
          uuid: action_modifier_id,
          main: false,
          throw: false,
          focuser: false,
        };
        new_usable_actable_modifiers_typed.push(found_entry);
      }
      switch (actable_type) {
        case "main":
          found_entry.main = false;
          break;
        case "throw":
          found_entry.throw = false;
          break;
        case "focuser":
          found_entry.focuser = false;
          break;
        default:
          console.error("Invalid type");
          break;
      }
      this.update({
        "system.usable_actable_modifiers_typed":
          new_usable_actable_modifiers_typed,
      });
    }
  }

  getAvailableActableModifiers() {
    return utils.ruleset.item.getActableModifiersApplicable(this);
  }

  isLimitationUsable() {
    return (
      this.system.limitation.regain_type === "permanent" ||
      this.system.limitation.usage_left > 0
    );
  }

  async takeOneLimitationUse() {
    if (
      [
        "weapon",
        "kit",
        "armor",
        "feature",
        "technique",
        "incantatory-addition",
        "action",
        "opportunity",
      ].includes(this.type)
    ) {
      if (this.system.limitation.regain_type != "permanent") {
        await this.update({
          "system.limitation.usage_left": this.system.limitation.usage_left - 1,
        });
      }
    }
  }

  getSavesAsked() {
    switch (this.type) {
      case "weapon":
      case "armor":
      case "kit":
      case "technique":
      case "incantatory-addition":
      case "spell":
      case "opportunity":
      case "action":
        return utils.ruleset.item.getSavesAsked(this);
      default:
        return [];
    }
  }

  getAlterations(skill_path) {
    const item_with_alterations = [
      "kit",
      "armor",
      "weapon",
      "feature",
      "technique",
      "incantatory-addition",
    ];
    if (!item_with_alterations.includes(this.type)) return [];
    switch (this.type) {
      case "kit":
      case "armor":
      case "weapon":
      case "feature":
        return this.system.skill_alterations
          .filter(
            (skill_alteration) =>
              skill_alteration.associated_skill === skill_path,
          )
          .map((skill_alteration) => {
            let result = {
              dos_mod: skill_alteration.dos_mod,
              adv_amount: skill_alteration.adv_amount,
              disadv_amount: skill_alteration.disadv_amount,
            };
            return result;
          });
      case "technique":
      case "incantatory-addition":
        return [this.system.alteration];
      default:
        return [];
    }
  }

  async applyTimePhase(time_phase_type) {
    const item_with_time_limitation = [
      "feature",
      "technique",
      "incantatory-addition",
      "action",
      "opportunity",
      "spell",
      "kit",
      "armor",
      "weapon",
    ];
    if (!item_with_time_limitation.includes(this.type)) return [];
    let changelog_messages = [];
    if (this.type != "spell") {
      if (time_phase_type !== this.system.limitation.regain_type) return [];
      if (this.system.limitation.usage_left >= this.system.limitation.usage_max)
        return [];

      changelog_messages.push(
        game.i18n.format("ATORIA.Chat_message.Changelog.Regain", {
          type: this.name,
          previous: this.system.limitation.usage_left,
          new: this.system.limitation.usage_max,
        }),
      );

      await this.update({
        "system.limitation.usage_left": this.system.limitation.usage_max,
      });
    } else {
      let new_supplementaries_list = this.system.supplementaries_list;
      for (let [
        idx,
        supplementary,
      ] of this.system.supplementaries_list.entries()) {
        if (time_phase_type !== supplementary.limitation.regain_type) continue;
        if (
          supplementary.limitation.usage_left >=
          supplementary.limitation.usage_max
        )
          continue;

        let supp_name =
          supplementary.name === ""
            ? game.i18n.format("ATORIA.Chat_message.Spell.Supplementary_name", {
                key: idx,
              })
            : supplementary.name;

        changelog_messages.push(
          game.i18n.format("ATORIA.Chat_message.Changelog.Regain", {
            type: `${this.name} - ${supp_name}`,
            previous: supplementary.limitation.usage_left,
            new: supplementary.limitation.usage_max,
          }),
        );

        new_supplementaries_list[idx].limitation.usage_left =
          supplementary.limitation.usage_max;
      }
      await this.update({
        "system.supplementaries_list": new_supplementaries_list,
      });
    }
    return changelog_messages;
  }

  getAssociatedSkills(forced_martial_type = undefined) {
    if (this.type == "spell")
      return [
        {
          success: this.system.success,
          critical_success_amount: this.system.critical_success,
          critical_fumble_amount: this.system.critical_fumble,
          label: this.name,
          path: "",
          proper_label: this.name,
          type: "spell",
        },
      ];

    let skills = [];
    if (this.type == "opportunity")
      skills = [
        this.actor.getSkillFromPath(
          utils.ruleset.character.OPPORTUNITY_SKILL_PATH,
        ),
      ];

    if (this.type == "weapon") {
      skills.push(
        ...utils.ruleset.item.getApplicableWeaponSkillFromKnowledge(
          this.actor,
          this,
          forced_martial_type,
        ),
      );
    } else if (
      this.system.associated_skill != undefined &&
      this.system.associated_skill != ""
    ) {
      skills.push(this.actor.getSkillFromPath(this.system.associated_skill));
    }

    return skills;
  }

  getSupplementaries() {
    if (this.type != "spell") return [];
    return this.system.supplementaries_list;
  }

  takeOneSupplementaryUse(supp_id) {
    if (this.type != "spell") return;
    let supplementaries_list = this.system.supplementaries_list;
    let supp = supplementaries_list.at(supp_id);
    if (supp == undefined) return;

    if (supp.limitation.regain_type != "permanent") {
      supp.limitation.usage_left -= 1;
    }
    this.update({
      "system.supplementaries_list": supplementaries_list,
    });
  }

  async fillSkillWithUsableData(skill_data) {
    skill_data.usable_keywords = await utils.get_usable_keywords(
      this.actor,
      this,
      skill_data.path,
    );
    skill_data.usable_perks = utils.get_usable_perks_for_skill(
      this.actor,
      skill_data.path,
    );
    skill_data.usable_supplementaries = this.getSupplementaries().map(
      (supp_data, idx) => {
        supp_data.id = idx;
        return supp_data;
      },
    );
  }

  _getEffectForSkillPath(skill_path_used) {
    if (this.type == "weapon") {
      let skills_path = skill_path_used.split("///");
      let martial_path = skills_path[0];
      let weapon_path = skills_path[1];
      switch (martial_path) {
        case utils.ruleset.character.MARTIAL_APART_PATH: {
          if (weapon_path == utils.ruleset.character.ENCHANTED_SKILL_PATH) {
            // Foca effect needed
            return [
              model_utils.rollFieldToEffect(this.system.focuser_damage_roll),
            ];
          }
        }
      }
      // base effect needed
      return [model_utils.rollFieldToEffect(this.system.damage_roll)];
    }
    return this.get_effect();
  }

  async rollAction(forced_martial_type = undefined) {
    const action_item_types = ["weapon", "action", "spell", "opportunity"];
    if (!action_item_types.includes(this.type)) return;

    let roll_label = this.name;

    let skills = this.getAssociatedSkills(forced_martial_type);

    if (skills.length != 0) {
      for (const skill_data of skills) {
        await this.fillSkillWithUsableData(skill_data);
      }
    }

    if (this.type == "weapon") {
      if (forced_martial_type == undefined) {
        return [];
      }
      let forced_martial_type_path = undefined;
      switch (forced_martial_type) {
        case "contact":
          forced_martial_type_path =
            utils.ruleset.character.MARTIAL_CONTACT_PATH;
          break;
        case "apart":
          forced_martial_type_path = utils.ruleset.character.MARTIAL_APART_PATH;
          break;
        case "instrument":
          forced_martial_type_path =
            utils.ruleset.character.MARTIAL_INSTRUMENT_PATH;
          break;
      }

      let martial_skill = this.actor.getSkillFromPath(forced_martial_type_path);
      await this.fillSkillWithUsableData(martial_skill);

      skills = skills.map((skill) =>
        utils.ruleset.item.getFinalSkillDataFromKnowledgeAndWeapon(
          martial_skill,
          skill,
        ),
      );

      roll_label = game.i18n.localize(martial_skill.label) + " - " + roll_label;
    }

    // Get roll parameters
    let roll_parameters = await AtoriaRollDialog.ask({
      actor_uuid: this.actor.uuid,
      roll_label: roll_label,
      skills: skills,
    });

    if (roll_parameters === null) return;
    console.debug(roll_parameters);

    // Create message roll
    let roll_data = utils.get_roll_data(
      roll_parameters,
      roll_parameters.roll_data.path,
    );
    utils.ruleset.item.applyRollDataRules(this, roll_data);
    roll_data.title = roll_label;

    let effects_data = this._getEffectForSkillPath(
      roll_parameters.roll_data.path,
    );
    effects_data.push(...utils.get_effects_data(roll_parameters));
    let critical_effects_data = this.get_critical_effect();
    critical_effects_data.push(
      ...utils.get_critical_effects_data(roll_parameters),
    );

    let used_perks_data = {
      keywords: {
        length: roll_parameters.used_keywords.length,
        description: (
          await Promise.all(
            roll_parameters.used_keywords.map(
              async (keyword) =>
                await this.actor.getKeywordTooltipHTML(keyword),
            ),
          )
        ).join(""),
      },
      supplementaries: {
        length: roll_parameters.used_supplementaries.length,
        description: roll_parameters.used_supplementaries
          .map((supplementary) => supplementary.descriptive_tooltip)
          .join(""),
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
      } else if (["technique", "incantatory-addition"].includes(item.type)) {
        used_perks_data["act_mod"].length += 1;
        used_perks_data["act_mod"].description += await item.getTooltipHTML();
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
    if (used_perks_data.supplementaries.length !== 0) {
      used_perks.push({
        name: game.i18n.format("ATORIA.Chat_message.Used.Supplementaries", {
          amount: used_perks_data.supplementaries.length,
        }),
        description: used_perks_data.supplementaries.description,
      });
    }
    if (used_perks_data.act_mod.length !== 0) {
      used_perks.push({
        name: game.i18n.format("ATORIA.Chat_message.Used.ActableModifiers", {
          amount: used_perks_data.act_mod.length,
        }),
        description: used_perks_data.act_mod.description,
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
      saves_asked: utils.get_asked_saves(roll_parameters).map((skill_path) => {
        let skill = this.actor.getSkillFromPath(skill_path);
        return {
          skill_path: skill_path,
          name: skill.label,
        };
      }),
    };

    if (roll_data.path != undefined) {
      let rolls = await utils.create_rolls_with_effect(
        this,
        roll_data,
        effects_data,
        critical_effects_data,
      );
      let main_roll_is_success = rolls[0].is_success;

      await utils.chat_message_from_roll(
        this,
        roll_parameters.message_mode,
        rolls,
        system_data,
      );
      if (main_roll_is_success) {
        for (let supp of roll_parameters.used_supplementaries) {
          this.takeOneSupplementaryUse(supp.id);
        }
      }
    } else {
      let rolls = await utils.create_simple_effect_rolls(effects_data);
      await utils.chat_message_from_non_roll(
        this,
        roll_parameters.message_mode,
        game.i18n.format("ATORIA.Chat_message.Used.Actable", {
          name: this.name,
        }),
        rolls,
        system_data,
      );
    }

    // Consume resource used
    for (let keyword of roll_parameters.used_keywords) {
      this.actor.takeOneKeywordUse(keyword);
    }
    for (let perk_item of roll_parameters.used_perks) {
      perk_item.takeOneLimitationUse();
    }

    this.update({
      "system.luck": this.system.luck - roll_parameters.roll_data.luck_applied,
    });

    // ----------------------------------------
    // ----------------------------------------
    // ----------------------------------------

    // const used_ressources = await utils.itemRollDialog(this);
    // if (used_ressources === null) return;

    // for (let keyword of used_ressources.used_keywords) {
    //   this.actor.takeOneKeywordUse(keyword);
    // }

    // for (let feature_uuid of used_ressources.used_features) {
    //   let feature = fromUuidSync(feature_uuid);
    //   feature.takeOneLimitationUse();
    // }
    // if (Object.keys(used_ressources.used_supplementaries).length != 0) {
    //   let supplementaries_list = this.system.supplementaries_list;
    //   for (let [supplementary_idx, amount] of Object.entries(
    //     used_ressources.used_supplementaries,
    //   )) {
    //     let supplementary = supplementaries_list[supplementary_idx];
    //     if (supplementary.limitation.regain_type != "permanent") {
    //       supplementary.limitation.usage_left -= 1;
    //     }
    //   }
    //   this.update({
    //     "system.supplementaries_list": supplementaries_list,
    //   });
    // }
    // for (let actable_modifier_uuid of used_ressources.used_actable_modifiers) {
    //   let actable_modifier = fromUuidSync(actable_modifier_uuid);
    //   actable_modifier.takeOneLimitationUse();
    // }

    // this.takeOneLimitationUse();

    // this.actor?.update({
    //   "system.luck": this.actor.system.luck - used_ressources.luck,
    // });
  }

  async getTooltipHTML() {
    return await foundry.applications.handlebars.renderTemplate(
      CONFIG.ATORIA.ITEM_TOOLTIP_TEMPLATES[this.type],
      {
        item: this,
        systemFields: this.system.schema.fields,
      },
    );
  }

  get_effect() {
    const item_with_effect = [
      "spell",
      "feature",
      "technique",
      "incantatory-addition",
      "action",
      "opportunity",
    ];
    if (item_with_effect.includes(this.type)) {
      const matches = this.system.effect.matchAll(
        /\[\[(.*?)]{2,3}(?:{([^}]+)})?/gi,
      );
      let effects = [];
      for (const match of Array.from(matches)) {
        effects.push({
          flavor: match[2],
          formula: match[1],
        });
      }
      return effects;
    }
    return [];
  }

  get_critical_effect() {
    const item_with_critical_effect = [
      "spell",
      "weapon",
      "feature",
      "technique",
      "incantatory-addition",
    ];
    if (item_with_critical_effect.includes(this.type)) {
      const matches = this.system.critical_effect.matchAll(
        /\[\[(.*?)]{2,3}(?:{([^}]+)})?/gi,
      );
      let effects = [];
      for (const match of Array.from(matches)) {
        effects.push({
          flavor: match[2],
          formula: match[1],
        });
      }
      return effects;
    }
    return [];
  }

  getKeywordRecap() {
    let keywords_recap = {
      list: "",
      list_data: [],
      has_preserve: false,
      has_reserve: false,
    };
    if (
      [
        "feature",
        "action",
        "opportunity",
        "spell",
        "technique",
        "incantatory-addition",
      ].includes(this.type)
    ) {
      return keywords_recap;
    }

    const active_keywords = Array.from(
      utils.ruleset.item.getActiveKeywords(this),
    );
    let keywords_list = [];
    let keywords_list_data = [];
    const special_keyword = ["preserve", "reserve", "direct", "sly"];
    for (const keyword of active_keywords) {
      if (special_keyword.includes(keyword)) {
        switch (keyword) {
          case "preserve":
            keywords_recap.has_preserve = true;
            break;
          case "reserve":
            keywords_recap.has_reserve = true;
            break;
          case "sly":
            keywords_list.push(
              utils.ruleset.keywords.get_localized_name(
                keyword,
                this.system.keywords[keyword],
              ),
            );
            keywords_list_data.push({
              label:
                utils.ruleset.keywords.get_localized_name(
                  keyword,
                  this.system.keywords[keyword],
                ) +
                " " +
                this.system.keywords["sly_amount"],
              description: utils.ruleset.keywords.get_description(
                keyword,
                this.system.keywords[keyword],
              ),
            });
            break;
          case "direct":
            keywords_list.push(
              utils.ruleset.keywords.get_localized_name(
                "direct",
                this.system.keywords.direct,
              ),
            );
            keywords_list_data.push({
              label: utils.ruleset.keywords.get_localized_name(
                "direct",
                this.system.keywords.direct,
              ),
              description: utils.ruleset.keywords.get_description(
                "direct",
                this.system.keywords.direct,
              ),
            });
            break;
        }
      } else {
        keywords_list.push(
          utils.ruleset.keywords.get_localized_name(
            keyword,
            this.system.keywords[keyword],
          ),
        );
        keywords_list_data.push({
          label: utils.ruleset.keywords.get_localized_name(
            keyword,
            this.system.keywords[keyword],
          ),
          description: utils.ruleset.keywords.get_description(
            keyword,
            this.system.keywords[keyword],
          ),
        });
      }
    }
    keywords_recap.list = keywords_list.join(", ");
    keywords_recap.list_data = keywords_list_data;
    return keywords_recap;
  }

  onChatButton(data) {
    console.log("Item");
    console.dir(data);
  }
}
