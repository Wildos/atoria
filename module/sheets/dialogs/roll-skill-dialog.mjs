import * as utils from "../../utils/module.mjs";
import * as helpers from "../../utils/helpers.mjs";
import * as rolls from "../../rolls/module.mjs";
import RULESET from "../../utils/ruleset.mjs";

const { HandlebarsApplicationMixin, ApplicationV2 } = foundry.applications.api;

export default class AtoriaRollSkillDialogV2 extends HandlebarsApplicationMixin(
  ApplicationV2,
) {
  constructor(options = {}) {
    super(options);
    this.#actor = options.actor;
    this.#skill = options.skill;
    this.isEditingMode = false;
  }

  static PARTS = {
    tabs: {
      // Foundry-provided generic template
      template: "templates/generic/tab-navigation.hbs",
    },
    body: {
      template: "systems/atoria/templates/v2/dialogs/skill-launch-dialog.hbs",
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
  get actor() {
    return this.#actor;
  }
  #actor;

  get skill() {
    return this.#skill;
  }
  #skill;

  get title() {
    return `${this.actor.name}: ${game.i18n.localize(this.#skill.label)}`;
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

    for (const [key, value] of Object.entries(form_values)) {
      if (key.startsWith("used_keywords")) {
        if (value) {
          used_keywords.push({
            id: key.split(".")[1],
            type: key.split(".")[2] || "",
          });
        }
        continue;
      }
      if (key.startsWith("used_features")) {
        if (value) {
          used_features.push(key.split("|")[1]);
        }
        continue;
      }
    }

    let chat_rolls = [];

    let roll_effect = "";
    let roll_critical_effect = "";

    let skill_roll_data = {
      owning_actor_id: this.actor._id,
      success_value: this.skill.success,
      critical_success_amount: this.skill.critical_success_amount,
      critical_fumble_amount: this.skill.critical_fumble_amount,
      title: game.i18n.localize(this.skill.label),
      advantage_amount: form_values.advantage_amount,
      disadvantage_amount: form_values.disadvantage_amount,
      luck_applied: form_values.luck_applied,
      dos_mod: form_values.dos_mod,
      is_danger: form_values.is_danger,
    };

    let actor_active_keyword =
      utils.ruleset.character.getSkillAssociatedKeywordsData(
        this.actor,
        null,
        this.skill.path,
      );
    for (const keyword_data of used_keywords) {
      let keyword_idx = keyword_data["id"];
      let actor_active_keyword_data = actor_active_keyword.find(
        (elem) => elem["name"] === keyword_idx,
      );
      keyword_data.label = actor_active_keyword_data["label"];
      keyword_data.description = actor_active_keyword_data["description"];
      utils.applyAlteration(
        skill_roll_data,
        actor_active_keyword_data.alteration,
      );
    }
    for (const feature_uuid of used_features) {
      let feature = fromUuidSync(feature_uuid);
      utils.applyAlterationsToRollConfig(
        skill_roll_data,
        feature.getAlterations(this.skill.path),
      );
      roll_critical_effect += feature.get_critical_effect();
    }

    const roll = new rolls.AtoriaDOSRoll(
      this.actor.getRollData(),
      skill_roll_data,
    );
    await roll.evaluate();
    chat_rolls.push(roll);

    // Add effect
    if (used_keywords.some((elem) => elem.id == "versatile")) {
      roll_effect += RULESET.general.getVersatileEffect();
    }

    for (const feature_uuid of used_features) {
      let feature = fromUuidSync(feature_uuid);
      roll_effect += feature.get_effect();
    }

    const roll_data = {
      chat_rolls: chat_rolls,
      luck_applied: form_values.luck_applied,
      used_keywords: used_keywords,
      used_features: used_features, // uuid
      roll_mode: utils.convertDesiredVisibilityToRollMode(
        form_values.asked_visibility,
      ),
      flavor: null,
      flavor_tooltip: null,
      effect: roll_effect,
      critical_effect: roll_critical_effect,
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
      owner: this.actor.isOwner,
      limited: this.actor.limited,
      gm: game.user.isGM,

      actor: this.actor,

      skill: this.skill,

      system: this.actor.system,
      systemSource: this.actor.system._source,
      flags: this.actor.flags,

      fields: this.actor.schema.fields,
      systemFields: this.actor.system.schema.fields,

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
      case "body":
        {
          context.default_roll_mode = utils.convertRollModeToDesiredVisibility(
            game.settings.get("core", "rollMode"),
          );
          context.roll_config = this.#roll_config;
          let active_keywords = utils.ruleset.character.getActiveKeywordsData(
            this.actor,
          );
          context.available_keywords = utils.ruleset.character
            .getSkillAssociatedKeywordsData(this.actor, null, this.skill.path)
            .map((keyword_data) => {
              keyword_data["time_phase"] =
                utils.ruleset.keywords.get_time_phase(
                  keyword_data.name,
                  active_keywords[keyword_data.name],
                );
              return keyword_data;
            });

          context.available_features =
            this.actor.getAssociatedFeature_n_ItemAlterations(this.skill.path);
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

    if (!this.isEditable) return;
  }
}
