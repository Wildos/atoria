import * as utils from "../utils/module.mjs";
import * as rolls from "../rolls/module.mjs";
import RULESET from "../utils/ruleset.mjs";

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
        keywords_recap: this.getKeywordRecap(),
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

        let supp_name =
          supplementary.name === ""
            ? game.i18n.format("ATORIA.Chat_message.Spell.Supplementary_name", {
                key: idx,
              })
            : supplementary.name;

        changelog_messages.push(
          game.i18n.format(
            game.i18n.localize("ATORIA.Chat_message.Changelog.Regain"),
            {
              type: `${this.name} - ${supp_name}`,
              previous: supplementary.limitation.usage_left,
              new: supplementary.limitation.usage_max,
            },
          ),
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

  async rollAction() {
    const action_item_types = ["weapon", "action", "spell", "opportunity"];
    if (!action_item_types.includes(this.type)) return;

    const used_ressources = await utils.itemRollDialog(this);
    if (used_ressources === null) return;

    for (let keyword of used_ressources.used_keywords) {
      this.actor.takeOneKeywordUse(keyword);
    }

    for (let feature_uuid of used_ressources.used_features) {
      let feature = fromUuidSync(feature_uuid);
      feature.takeOneLimitationUse();
    }
    if (Object.keys(used_ressources.used_supplementaries).length != 0) {
      let supplementaries_list = this.system.supplementaries_list;
      for (let [supplementary_idx, amount] of Object.entries(
        used_ressources.used_supplementaries,
      )) {
        let supplementary = supplementaries_list[supplementary_idx];
        if (supplementary.limitation.regain_type != "permanent") {
          supplementary.limitation.usage_left -= 1;
        }
      }
      this.update({
        "system.supplementaries_list": supplementaries_list,
      });
    }
    for (let actable_modifier_uuid of used_ressources.used_actable_modifiers) {
      let actable_modifier = fromUuidSync(actable_modifier_uuid);
      actable_modifier.takeOneLimitationUse();
    }

    this.actor?.update({
      "system.luck": this.actor.system.luck - used_ressources.luck,
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
      return this.system.effect;
    }
    return "";
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
      return this.system.critical_effect;
    }
    return "";
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
