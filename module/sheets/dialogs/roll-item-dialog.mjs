import * as utils from "../../utils/module.mjs";
import * as helpers from "../../utils/helpers.mjs";
import * as rolls from "../../rolls/module.mjs";

const { HandlebarsApplicationMixin, ApplicationV2 } = foundry.applications.api;

export default class AtoriaRollItemDialogV2 extends HandlebarsApplicationMixin(
  ApplicationV2,
) {
  constructor(options = {}) {
    super(options);
    this.#item = options.item;
    this.isEditingMode = false;
  }

  static PARTS = {
    tabs: {
      // Foundry-provided generic template
      template: "templates/generic/tab-navigation.hbs",
    },
    body: {
      template: "systems/atoria/templates/v2/dialogs/roll-item-dialog.hbs",
    },
  };

  expanded_section = [];

  #roll_config = {
    advantage_amount: 0,
    disadvantage_amount: 0,
    luck_applied: 0,
    dos_mod: 0,
  };

  static DEFAULT_OPTIONS = {
    id: "{id}",
    tag: "form", // Document sheets are forms by default
    classes: ["atoria", "roll-dialog"],
    position: {},
    window: {},
    actions: {
      onPopoutV2: this._onPopoutV2,
      expandSection: {
        handler: this._expandSection,
        buttons: [0, 2],
      },
      rollItem: this._rollItem,
    },
    viewPermission: CONST.DOCUMENT_OWNERSHIP_LEVELS.LIMITED,
    editPermission: CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER,
    sheetConfig: true,
    form: {
      handler: this.#onSubmitForm,
      submitOnChange: false,
      closeOnSubmit: false,
    },
  };

  /**
   * The Item document referenced by this dialog.
   * @type {ClientDocument}
   */
  get item() {
    return this.#item;
  }
  #item;

  get need_roll() {
    return (
      this.item.type === "spell" ||
      (this.item.type === "weapon" && this.item.system.is_focuser) ||
      this.item.type === "opportunity" ||
      ((this.item.system.associated_skill ?? "") !== "" &&
        !(this.item.type === "action" && this.item.system.is_magic))
    );
  }

  current_picked_skill_id() {
    if (this.item.type === "spell") {
      return "default";
    }
    if (this.item.type === "opportunity") {
      return "default";
    }
    return this.tabGroups["primary"];
  }

  current_picked_skill_data() {
    if (this.item.type === "spell") {
      return helpers.getSkillData(this.item, "");
    }
    if (this.item.type === "opportunity") {
      return helpers.getSkillData(
        this.item,
        "system.skills.combative.reflex.opportuneness",
      );
    }
    if (this.tabGroups["primary"] == "focuser") {
      return helpers.getSkillData(
        this.item,
        "system.skills.combative.weapon.focuser",
      );
    }
    if (this.tabGroups["primary"] == "throw") {
      return helpers.getSkillData(
        this.item,
        "system.skills.combative.weapon.throw",
      );
    }
    return helpers.getSkillData(this.item, this.item.system.associated_skill);
  }

  available_skills_data() {
    let skills_data = [];

    if (this.item.type === "spell") {
      skills_data.push({
        group: "primary",
        id: "default",
        path: "",
      });
      return skills_data;
    }
    if (this.item.type === "opportunity") {
      skills_data.push({
        group: "primary",
        id: "default",
        path: "system.skills.combative.reflex.opportuneness",
      });
      return skills_data;
    }
    if (this.item.system.associated_skill !== "") {
      skills_data.push({
        group: "primary",
        id: "default",
        path: this.item.system.associated_skill,
      });
    }
    if (
      this.item.type === "weapon" &&
      this.item.system.is_focuser &&
      this.item.system.associated_skill !==
        "system.skills.combative.weapon.focuser"
    ) {
      skills_data.push({
        group: "primary",
        id: "focuser",
        path: "system.skills.combative.weapon.focuser",
      });
    }
    if (
      this.item.type === "weapon" &&
      this.item.system.keywords.throwable >= 1
    ) {
      skills_data.push({
        group: "primary",
        id: "throw",
        path: "system.skills.combative.weapon.throw",
      });
    }
    return skills_data;
  }

  get title() {
    return `${this.item.actor.name}: ${game.i18n.localize(this.item.name)}`;
  }

  static async _onPopoutV2(event, _target) {
    if (!helpers.hasPopoutV2Module()) return;
    if (helpers.isPoppedOut(this)) {
      event.stopPropagation();
      await this.close();
      this.render(true);
    } else {
      await this.render();
      PopoutV2Module.popoutv2App(this);
    }
  }

  /** @override */
  _getHeaderControls() {
    const controls = this.options.window.controls;
    return controls;
  }

  async close(options = {}) {
    this.is_popouted = false;
    return super.close(options);
  }

  static async #onSubmitForm(event, form, formData) {
    let form_values = formData.object;

    let used_keywords = [];
    let used_features = [];
    let used_supplementaries = [];
    let used_actable_modifiers = [];

    let skill_id = this.current_picked_skill_id() || "";

    for (const [key, value] of Object.entries(form_values)) {
      if (key.startsWith("used_keywords_" + skill_id)) {
        if (value) {
          used_keywords.push(key.split(".")[1]);
        }
        continue;
      }
      if (key.startsWith("used_supplementaries_" + skill_id)) {
        if (value) {
          used_supplementaries.push(key.split(".")[1]);
        }
        continue;
      }
      if (key.startsWith("used_features_" + skill_id)) {
        if (value) {
          used_features.push(key.split("|")[1]);
        }
        continue;
      }
      if (key.startsWith("used_actable_modifiers_" + skill_id)) {
        if (value) {
          used_actable_modifiers.push(key.split("|")[1]);
        }
        continue;
      }
    }

    let chat_rolls = [];

    let roll_effect = this.item.system.effect;
    let out_used_supplementaries = [];

    let luck_applied = 0;

    if (this.need_roll) {
      let picked_skill_data = this.current_picked_skill_data();

      luck_applied = form_values.luck_applied;

      let skill_roll_data = {
        owning_actor_id: this.item.actor?._id,
        success_value: picked_skill_data.success,
        critical_success_amount: picked_skill_data.critical_success_amount,
        critical_fumble_amount: picked_skill_data.critical_fumble_amount,
        title: picked_skill_data.label,
        advantage_amount: form_values.advantage_amount,
        disadvantage_amount: form_values.disadvantage_amount,
        luck_applied: luck_applied,
        dos_mod: form_values.dos_mod,
      };

      if (this.item.type === "weapon") {
        skill_roll_data.success_value += this.item.system.modificators.success;
        skill_roll_data.critical_success_amount +=
          this.item.system.modificators.critical_success;
        skill_roll_data.critical_fumble_amount +=
          this.item.system.modificators.critical_fumble;

        const damage_roll =
          picked_skill_data.path === "system.skills.combative.weapon.focuser"
            ? this.item.system.focuser_damage_roll
            : this.item.system.damage_roll;
        if (damage_roll != "") {
          damage_roll.name = game.i18n.localize(
            "ATORIA.Model.Weapon.Damage_name",
          );
          roll_effect = utils.getInlineRollFromRollData(damage_roll);
        }
      }

      if (this.item.type === "spell") {
        let supplementaries_list = foundry.utils.deepClone(
          this.item.system.supplementaries_list,
        );
        for (let supplementary_idx of used_supplementaries) {
          let supplementary = supplementaries_list[supplementary_idx];
          if (supplementary.name === "") {
            supplementary.name = game.i18n.format(
              "ATORIA.Chat_message.Spell.Supplementary_name",
              { key: supplementary_idx },
            );
          }
          roll_effect += supplementary.description;
          out_used_supplementaries.push(supplementary_idx);
        }
      }
      let actor_active_keyword =
        utils.ruleset.character.getSkillAssociatedKeywordsData(
          this.item.actor,
          this.item,
          picked_skill_data.path,
        );
      for (const keyword in used_keywords) {
        utils.applySkillAlteration(
          skill_roll_data,
          actor_active_keyword[keyword].skill_alteration_type,
        );
      }
      for (const feature_uuid of used_features) {
        let feature = fromUuidSync(feature_uuid);
        utils.applySkillAlteration(
          skill_roll_data,
          feature.system.skill_alteration.skill_alteration_type,
        );
        roll_effect += feature.system.description;
      }
      for (const actable_uuid of used_actable_modifiers) {
        let actable_mod = fromUuidSync(actable_uuid);
        utils.applySkillAlteration(
          skill_roll_data,
          actable_mod.system.skill_alteration.skill_alteration_type,
        );
        roll_effect += actable_mod.system.description;
      }

      const roll = new rolls.AtoriaDOSRoll(
        this.item.getRollData(),
        skill_roll_data,
      );
      await roll.evaluate();
      chat_rolls.push(roll);
    }

    const roll_data = {
      chat_rolls: chat_rolls,
      luck_applied: luck_applied,
      used_keywords: used_keywords,
      used_features: used_features, // uuid
      used_supplementaries: out_used_supplementaries,
      used_actable_modifiers: used_actable_modifiers, // uuid
      roll_mode: utils.convertDesiredVisibilityToRollMode(
        form_values.asked_visibility,
      ),
      flavor: this.need_roll ? null : `<h5>${this.item.name}</h5>`,
      flavor_tooltip: this.need_roll ? null : this.item.descriptive_tooltip,
      effect: roll_effect,
    };
    await this.options.submit?.(roll_data);
    this.close();
  }

  static async wait(options = {}) {
    return new Promise((resolve, reject) => {
      // Wrap submission handler with Promise resolution.
      const originalSubmit = options.submit;
      options.submit = async (result) => {
        await originalSubmit?.(result);
        resolve(result);
      };

      const dialog = new this(options);
      dialog.addEventListener(
        "close",
        (event) => {
          resolve(null);
        },
        { once: true },
      );
      dialog.render({ force: true });
    });
  }

  async _prepareContext(options) {
    const context = {
      isEditingMode: false,

      editable: false,
      owner: this.item.isOwner,
      limited: this.item.limited,
      gm: game.user.isGM,

      actor: this.item.actor,
      item: this.item,
      system: this.item.system,
      systemSource: this.item.system._source,
      flags: this.item.flags,

      fields: this.item.schema.fields,
      systemFields: this.item.system.schema.fields,

      ruleset: utils.ruleset,

      inputs: foundry.applications.fields,
    };

    if (this.classList) {
      if (this.isEditingMode) this.classList.add("editing-mode");
      else this.classList.remove("editing-mode");
    }

    return context;
  }

  async _preparePartContext(partId, context, options) {
    await super._preparePartContext(partId, context, options);
    switch (partId) {
      case "tabs":
        context.tabs = [];
        if (this.item.type === "spell") {
          context.tabs.push({
            cssClass: "",
            group: "primary",
            id: "default",
            icon: "",
            label: this.item.name,
          });
          break;
        }
        if (this.item.type === "opportunity") {
          context.tabs.push({
            cssClass: "",
            group: "primary",
            id: "default",
            icon: "",
            label: this.item.actor.getSkillTitle(
              "system.skills.combative.reflex.opportuneness",
            ),
          });
          break;
        }
        if (this.item.system.associated_skill !== "") {
          context.tabs.push({
            cssClass: "",
            group: "primary",
            id: "default",
            icon: "",
            label: this.item.actor.getSkillTitle(
              this.item.system.associated_skill,
            ),
          });
        }
        if (
          this.item.type === "weapon" &&
          this.item.system.is_focuser &&
          this.item.system.associated_skill !==
            "system.skills.combative.weapon.focuser"
        ) {
          context.tabs.push({
            cssClass: "",
            group: "primary",
            id: "focuser",
            icon: "",
            label: this.item.actor.getSkillTitle(
              "system.skills.combative.weapon.focuser",
            ),
          });
        }
        if (
          this.item.type === "weapon" &&
          this.item.system.keywords.throwable >= 1
        ) {
          context.tabs.push({
            cssClass: "",
            group: "primary",
            id: "throw",
            icon: "",
            label: this.item.actor.getSkillTitle(
              "system.skills.combative.weapon.throw",
            ),
          });
        }
        break;
      case "body":
        {
          context.tab = context.tabs[partId];
          context.roll_config = this.#roll_config;
          let active_keywords = utils.ruleset.character.getActiveKeywordsData(
            this.item.actor,
          );
          context.available_skills_data = [];
          let available_skills = this.available_skills_data();

          if (
            available_skills.length === 0 &&
            this.item.type === "action" &&
            this.item.system.is_magic
          ) {
            let sub_context = {};
            sub_context.available_actable_modifiers =
              this.item.system.usable_actable_modifiers.flatMap((id) => {
                let usable_actable = this.item.actor.items.get(id);
                return usable_actable !== undefined ? usable_actable : [];
              });
            context.available_skills_data.push(sub_context);
          }

          for (const available_skill of available_skills) {
            let sub_context = {
              group: available_skill.group,
              tab: available_skill.id,
            };

            sub_context.available_supplementaries =
              this.item.type === "spell"
                ? foundry.utils.deepClone(this.item.system.supplementaries_list)
                : [];
            for (let [
              idx,
              supplementary,
            ] of sub_context.available_supplementaries.entries()) {
              if (supplementary.name === "") {
                supplementary.name = game.i18n.format(
                  "ATORIA.Chat_message.Spell.Supplementary_name",
                  { key: idx },
                );
              }
              supplementary.idx = idx;
              supplementary.systemFields =
                this.item.systemFields.supplementaries_list.element.fields;
            }

            if (available_skill !== undefined) {
              sub_context.available_keywords = utils.ruleset.character
                .getSkillAssociatedKeywordsData(
                  this.item.actor,
                  this.item,
                  available_skill.path,
                )
                .map((keyword_data) => {
                  keyword_data["usable"] =
                    this.item.actor.system.keywords_used[keyword_data.name] ||
                    true;
                  keyword_data["time_phase"] =
                    utils.ruleset.keywords.get_time_phase(
                      keyword_data.name,
                      active_keywords[keyword_data.name],
                    );
                  return keyword_data;
                });

              sub_context.available_features =
                this.item.actor.getAssociatedFeatures(available_skill.path);
            }
            sub_context.available_actable_modifiers =
              this.item.system.usable_actable_modifiers.flatMap((id) => {
                let usable_actable = this.item.actor.items.get(id);
                return usable_actable !== undefined ? usable_actable : [];
              });
            context.available_skills_data.push(sub_context);
          }
        }
        break;
    }
    return context;
  }

  static async _expandSection(event, _expand_control) {
    if (event.button != 2) return;
    const ref_expand_control = event.target.closest("[data-expand-id]");
    const $expand_control = $(ref_expand_control);
    const { expandId } = ref_expand_control.dataset;

    if (!expandId) {
      console.warn("Undefined data-expand-id");
      return;
    }
    if ($expand_control.hasClass("expanded"))
      this.expanded_section.splice(this.expanded_section.indexOf(expandId), 1);
    else this.expanded_section.push(expandId);
    $expand_control.toggleClass("expanded");
  }

  _onRender(context, options) {
    super._onRender(context, options);

    const html = $(this.element);

    // Ensure height is adjusted on edit.
    html.find("textarea.textarea-auto-resize").on("input", function () {
      this.nextElementSibling.textContent = this.value;
    });

    for (const id in this.expanded_section) {
      html
        .find(
          `.atoria-expand-control[data-expand-id="${this.expanded_section[id]}"]`,
        )
        .each((_idx, element) => {
          const $element = $(element);
          $element.addClass("expanded");
        });
    }

    let tab = this.available_skills_data()[0]?.id;
    if (tab) {
      this.changeTab(tab, "primary", {});
    }

    if (!this.isEditable) return;
  }
}
