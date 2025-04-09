import * as utils from "../utils/module.mjs";
import * as rolls from "../rolls/module.mjs";

export default class AtoriaItem extends Item {
  // Prepare data for the item execute the following, in order:
  // data reset (to clear active effects),
  // prepareBaseData(),
  // prepareEmbeddedDocuments() (including active effects),
  // prepareDerivedData().

  prepareBaseData() {}

  async prepareDerivedData() {
    this.descriptive_tooltip = await renderTemplate(
      CONFIG.ATORIA.ITEM_TOOLTIP_TEMPLATES[this.type],
      {
        item: this,
        systemFields: this.system.schema.fields,
      },
    );
    if (this.type === "spell") {
      for (let supp of this.system.supplementaries_list) {
        supp.descriptive_tooltip = await renderTemplate(
          CONFIG.ATORIA.ITEM_TOOLTIP_TEMPLATES["supplementary"],
          {
            supplementary: supp,
            systemFields: this.system.schema.fields.supplementaries_list.fields,
          },
        );
      }
    }
  }

  getRollData() {
    const rollData = { ...this.system };

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
    return this.system.encumbrance;
  }

  enableActableModifier(action_modifier_id) {
    if (action_modifier_id === undefined) {
      console.warn(
        `Invalid action_modifier_id given for handling: '${action_modifier_id}'`,
      );
      return;
    }
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
  }

  disableActableModifier(action_modifier_id) {
    if (action_modifier_id === undefined) {
      console.warn(
        `Invalid action_modifier_id given for handling: '${action_modifier_id}'`,
      );
      return;
    }
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
  }

  getAvailableActableModifiers() {
    return utils.ruleset.item.getActableModifiersApplicable(this);
  }

  async applyTimePhase(time_phase_type) {
    const item_with_time_limitation = [
      "feature",
      "technique",
      "incantatory-addition",
      "action",
      "opportunity",
      "spell",
    ];
    if (!item_with_time_limitation.includes(this.type)) return [];
    let changelog_messages = [];
    if (this.type != "spell") {
      if (time_phase_type !== this.system.limitation.regain_type) return [];
      if (this.system.limitation.usage_left >= this.system.limitation.usage_max)
        return [];

      changelog_messages.push(
        game.i18n.format(
          game.i18n.localize("ATORIA.Chat_message.Changelog.Regain"),
          {
            type: this.name,
            previous: this.system.limitation.usage_left,
            new: this.system.limitation.usage_max,
          },
        ),
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

        changelog_messages.push(
          game.i18n.format(
            game.i18n.localize("ATORIA.Chat_message.Changelog.Regain"),
            {
              type: `${this.name} - ${game.i18n.format("ATORIA.Chat_message.Spell.Supplementary_name", { key: idx })}`,
              previous: supplementary.limitation.usage_left,
              new: supplementary.limitation.usage_max,
            },
          ),
        );

        new_supplementaries_list[idx].limitation.usage_left =
          supplementary.limitation.usage_max;
      }
      await this.update({
        "system.new_supplementaries_list": new_supplementaries_list,
      });
    }
    return changelog_messages;
  }

  async rollAction() {
    const action_item_types = ["weapon", "action", "spell", "opportunity"];
    if (!action_item_types.includes(this.type)) return;

    const need_roll =
      this.type === "spell" ||
      (this.type === "weapon" && this.system.is_focuser) ||
      this.type === "opportunity" ||
      ((this.system.associated_skill ?? "") !== "" &&
        !(this.type === "action" && this.system.is_magic));

    if (!need_roll) {
      const roll_config = await utils.itemRollDialog(this, need_roll);
      if (roll_config === null) return;
      const { used_actable_modifiers } = roll_config;

      let roll_effect = this.system.effect;

      const saves_asked =
        foundry.utils.deepClone(this.system.saves_asked) ?? [];

      const speaker = ChatMessage.getSpeaker({ actor: this });
      ChatMessage.create(
        {
          type: "interactable",
          speaker: speaker,
          user: game.user.id,
          type: CONST.CHAT_MESSAGE_STYLES.IC,
          flavor: `<h5>${this.name}</h5>`,
          system: {
            related_items: [
              {
                type: "actable-modifier",
                items_id: used_actable_modifiers.map((elem) => elem.uuid),
              },
            ],
            savesAsked: saves_asked,
            effect: roll_effect,
          },
        },
        { rollMode: utils.convertDesiredVisibilityToRollMode(null) },
      );

      if (
        this.type === "action" &&
        this.system.limitation.regain_type != "permanent"
      ) {
        this.update({
          "system.limitation.usage_left": this.system.limitation.usage_left - 1,
        });
      }
      if (
        this.type === "opportunity" &&
        this.system.limitation.regain_type != "permanent"
      ) {
        this.update({
          "system.limitation.usage_left": this.system.limitation.usage_left - 1,
        });
      }
      for (let actable_modifier of used_actable_modifiers) {
        actable_modifier.update({
          "system.limitation.usage_left":
            actable_modifier.system.limitation.usage_left - 1,
        });
      }
      return;
    }

    const roll_config = await utils.itemRollDialog(this);
    if (roll_config === null) return;

    const used_features = roll_config["used_features"].map((element_id) =>
      this.actor.items.get(element_id),
    );

    let roll_config_altered = utils.applyFeaturesToRollConfig(
      roll_config,
      used_features,
    );
    roll_config_altered = utils.applySkillAlterationsToRollConfig(
      roll_config,
      roll_config["used_actable_modifiers"],
    );
    const {
      advantage_amount,
      disadvantage_amount,
      luck_applied,
      dos_mod,
      roll_mode,
      chosen_skill_data,
      used_supplementaries,
      used_actable_modifiers,
    } = roll_config_altered;

    let roll_data = {
      owning_actor_id: this.actor?._id,
      success_value: chosen_skill_data.success,
      critical_success_amount: chosen_skill_data.critical_success_amount,
      critical_fumble_amount: chosen_skill_data.critical_fumble_amount,
      title: this.name,
      advantage_amount,
      disadvantage_amount,
      luck_applied,
      dos_mod,
    };

    if (this.type === "weapon") {
      roll_data.success_value += this.system.modificators.success;
      roll_data.critical_success_amount +=
        this.system.modificators.critical_success;
      roll_data.critical_fumble_amount +=
        this.system.modificators.critical_fumble;
    }

    const roll = new rolls.AtoriaDOSRoll(this.getRollData(), roll_data);
    await roll.evaluate();

    const chat_rolls = [roll];
    let roll_effect = this.system.effect;
    if (chosen_skill_data.damage_roll != "") {
      chosen_skill_data.damage_roll.name = game.i18n.localize(
        "ATORIA.Model.Weapon.Damage_name",
      );
      roll_effect = utils.getInlineRollFromRollData(
        chosen_skill_data.damage_roll,
      );
    }

    if (this.type === "spell") {
      let new_supplementaries_list = this.system.supplementaries_list;
      for (let supplementary of used_supplementaries) {
        let own_supplementary = new_supplementaries_list[supplementary.idx];
        roll_effect += own_supplementary.description;
      }
    }

    const saves_asked = foundry.utils.deepClone(this.system.saves_asked) ?? [];
    if (
      this.type === "weapon" ||
      (this.type === "spell" && this.system.markers.is_attack)
    ) {
      saves_asked.push(...utils.ruleset.character.getAttackSaves());
    }

    const critical_effect =
      this.type === "spell" ? this.system.critical_effect : "";

    ChatMessage.create(
      {
        type: "interactable",
        speaker: ChatMessage.getSpeaker({ actor: this }),
        user: game.user.id,
        sound: CONFIG.sounds.dice,
        rolls: chat_rolls,
        system: {
          related_items: [
            {
              type: "feature",
              items_id: used_features.map((elem) => elem.uuid),
            },
            {
              type: "supplementary",
              items: used_supplementaries,
            },
            {
              type: "actable-modifier",
              items_id: used_actable_modifiers.map((elem) => elem.uuid),
            },
          ],
          savesAsked: saves_asked,
          critical_effect: critical_effect,
          effect: roll_effect,
        },
      },
      { rollMode: roll_mode },
    );

    for (let feature of used_features) {
      if (feature.system.limitation.regain_type != "permanent") {
        feature.update({
          "system.limitation.usage_left":
            feature.system.limitation.usage_left - 1,
        });
      }
    }
    if (used_supplementaries.length != 0) {
      let new_supplementaries_list = this.system.supplementaries_list;
      for (let supplementary of used_supplementaries) {
        let own_supplementary = new_supplementaries_list[supplementary.idx];
        if (own_supplementary.limitation.regain_type != "permanent") {
          own_supplementary.limitation.usage_left -= 1;
        }
      }
      this.update({
        "system.supplementaries_list": new_supplementaries_list,
      });
    }
    for (let actable_modifier of used_actable_modifiers) {
      if (actable_modifier.system.limitation.regain_type != "permanent") {
        actable_modifier.update({
          "system.limitation.usage_left":
            actable_modifier.system.limitation.usage_left - 1,
        });
      }
    }
    if (
      this.type === "action" &&
      this.system.limitation.regain_type != "permanent"
    ) {
      this.update({
        "system.limitation.usage_left": this.system.limitation.usage_left - 1,
      });
    }
    if (
      this.type === "opportunity" &&
      this.system.limitation.regain_type != "permanent"
    ) {
      this.update({
        "system.limitation.usage_left": this.system.limitation.usage_left - 1,
      });
    }

    this.actor?.update({
      "system.luck": this.actor.system.luck - luck_applied,
    });
  }

  async getTooltipHTML() {
    return await renderTemplate(
      CONFIG.ATORIA.ITEM_TOOLTIP_TEMPLATES[this.type],
      {
        item: this,
        systemFields: this.system.schema.fields,
      },
    );
  }

  getKeywordList() {
    let keywords_list = [];

    const active_keywords = Array.from(
      utils.ruleset.item.getActiveKeywords(this),
    );
    const special_keyword = ["preserve"];
    for (const keyword of active_keywords) {
      if (special_keyword.includes(keyword)) {
        switch (keyword) {
          case "preserve":
            keywords_list.push(
              game.i18n.format("ATORIA.Ruleset.Keywords.Preserve.Recap", {
                amount: this.system.keywords.preserve_data.max_amount,
                type: game.i18n.localize(
                  utils.buildLocalizeString(
                    "Ruleset",
                    this.system.keywords.preserve_data.type,
                  ),
                ),
                increment: this.system.keywords.preserve_data.increment,
              }),
            );
            break;
        }
      } else {
        keywords_list.push(
          game.i18n.localize(this.systemFields.keywords.fields[keyword]?.label),
        );
      }
    }

    return keywords_list.join(", ");
  }

  onChatButton(data) {
    console.log("Item");
    console.dir(data);
  }
}
