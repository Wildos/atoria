const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

import RULESET from "../../utils/ruleset.mjs";
import * as utils from "../../utils/module.mjs";
import * as model_helper from "../../models/helpers.mjs";

//
// By default, a button will trigger the submit process of whatever form it is in.
// AppV2 will attempt to capture this if you have form handling configured with tag:
// "form" and a registered handler in DEFAULT_OPTIONS,
// however if that is not the case then the default browser behavior is to submit
// the webpage - causing a full refresh.
//
// To fix this, add type="button" to the attributes of any button you don't want
// to trigger a submission event.
//

// const data_format = {
//   actor_uuid: "<actor_uuid>",
//   roll_label: "Title to show",
//   skill: {
//     proper_label: "Label to show",
//     success: 0,
//     critical_success_amount: 0,
//     critical_fumble_amount: 0,
//
//     usable_keywords: [],
//     usable_supplementaries: [],
//     usable_perks: [],
//   }
// };

export default class AtoriaRollDialog extends HandlebarsApplicationMixin(
  ApplicationV2,
) {
  constructor(data, options = {}) {
    super(options);

    this.data = data;
    this.#roll_parameters = undefined;
    this.#current_skill = data.skills.at(0);
    this.#actor_name = fromUuidSync(this.data.actor_uuid).name;

    this.data.skills.forEach((skill_data) => {
      console.debug(skill_data);
      skill_data.usable_perks.sort((a, b) => {
        console.debug(a);
        console.debug(b);
        const types_ord = [
          "supplementary",
          "technique",
          "incantatory-addition",
          "feature",
          "kit",
          "armor",
          "weapon",
          undefined,
          null,
        ];
        let type_ord = types_ord.indexOf(a.type) - types_ord.indexOf(b.type);
        if (type_ord != 0) {
          return type_ord;
        }
        return (a.sort || 0) - (b.sort || 0);
      });
    });
  }

  #actor_name = "";
  #roll_parameters = undefined;
  #current_skill = undefined;

  static DEFAULT_OPTIONS = {
    tag: "form",
    form: {
      handler: AtoriaRollDialog.formHandler,
      submitOnChange: false,
      closeOnSubmit: false,
    },
    actions: {
      skillChange: AtoriaRollDialog.skill_change,
    },
  };
  static PARTS = {
    skill_setup: {
      template: "systems/atoria/templates/v2/dialogs/parts/skill-setup.hbs",
    },
    skill_selection: {
      template: "systems/atoria/templates/v2/dialogs/parts/skill-selection.hbs",
    },
    launch_options: {
      template: "systems/atoria/templates/v2/dialogs/parts/launch-options.hbs",
    },
  };

  static async ask(data, config) {
    return new Promise((resolve, reject) => {
      const dialog = new this(data, config);
      dialog.addEventListener(
        "close",
        (event) => {
          const roll_parameters = dialog.#roll_parameters;
          resolve(roll_parameters ?? null);
        },
        { once: true },
      );
      dialog.render({ force: true });
    });
  }

  get title() {
    if (this.#current_skill != undefined) {
      return `${this.#actor_name}: ${game.i18n.localize(this.data.roll_label)} | ${this.#current_skill.success}`;
    }
    return `${this.#actor_name}: ${game.i18n.localize(this.data.roll_label)}`;
  }

  /** @override */
  _configureRenderOptions(options) {
    // This fills in `options.parts` with an array of ALL part keys by default
    // So we need to call `super` first
    super._configureRenderOptions(options);
    // Completely overriding the parts
    let parts = [];
    // skill_selection
    if (this.data.skills.length > 1) {
      parts.push("skill_selection");
    }
    // skill_setup
    if (this.#current_skill != undefined) {
      parts.push("skill_setup");
    }
    // launch_options
    parts.push("launch_options");
    options.parts = parts;
  }

  /**
   * Process form submission for the sheet
   * @this {MyApplication}                      The handler is called with the application as its bound scope
   * @param {SubmitEvent} event                   The originating form submission event
   * @param {HTMLFormElement} form                The form element that was submitted
   * @param {FormDataExtended} formData           Processed data for the submitted form
   * @returns {Promise<void>}
   */
  static async formHandler(event, form, formData) {
    if (event.type === "change") {
      return;
    }
    // Do things with the returned FormData
    let form_data_obj = formData.object;

    let used_keywords = [];
    let used_supplementaries = [];
    let used_perks = [];
    if (this.#current_skill != undefined) {
      for (let value_key in form_data_obj) {
        if (value_key.startsWith("usable_keywords.")) {
          let index = parseInt((value_key.split(".") ?? [undefined])[1]);
          if (!Number.isNaN(index) && form_data_obj[value_key]) {
            used_keywords.push(this.#current_skill.usable_keywords[index]);
          }
        }
      }

      for (let value_key in form_data_obj) {
        if (value_key.startsWith("usable_supplementaries.")) {
          let index = parseInt((value_key.split(".") ?? [undefined])[1]);
          if (!Number.isNaN(index) && form_data_obj[value_key]) {
            used_supplementaries.push(
              this.#current_skill.usable_supplementaries[index],
            );
          }
        }
      }

      for (let value_key in form_data_obj) {
        if (value_key.startsWith("usable_perks.")) {
          let index = parseInt((value_key.split(".") ?? [undefined])[1]);
          if (!Number.isNaN(index) && form_data_obj[value_key]) {
            used_perks.push(this.#current_skill.usable_perks[index]);
          }
        }
      }
    }

    this.#roll_parameters = {
      message_mode: form_data_obj.asked_visibility,
      roll_data: {
        owning_actor_id: fromUuidSync(this.data.actor_uuid)._id,

        title: this.#current_skill?.label ?? this.data.roll_label,
        success_value: this.#current_skill?.success,
        critical_success_amount: this.#current_skill?.critical_success_amount,
        critical_fumble_amount: this.#current_skill?.critical_fumble_amount,
        path: this.#current_skill?.path,

        advantage_amount: form_data_obj.advantage_amount ?? 0,
        disadvantage_amount: form_data_obj.disadvantage_amount ?? 0,
        luck_applied: form_data_obj.luck_applied ?? 0,
        dos_mod: form_data_obj.dos_mod ?? 0,
        is_danger: form_data_obj.is_danger ?? false,
      },
      used_keywords: used_keywords,
      used_supplementaries: used_supplementaries,
      used_perks: used_perks,
    };
    this.close({ submitted: true });
  }

  async _prepareContext(options) {
    const context = {};
    return context;
  }

  async _preparePartContext(partId, context, options) {
    let skill_path = this.#current_skill?.path;
    await super._preparePartContext(partId, context, options);
    switch (partId) {
      case "skill_selection":
        context.skills = this.data.skills;
        break;
      case "launch_options":
        {
          let available_message_mods = RULESET.character.isBlindSkill(
            skill_path,
          )
            ? {
                blind: CONFIG.ChatMessage.modes["blind"],
              }
            : CONFIG.ChatMessage.modes;
          let selected_message_mode = game.settings.get("core", "messageMode");
          context.message_modes = available_message_mods;
          context.selected_message_mode = selected_message_mode;
        }
        break;
      case "skill_setup":
        {
          let skill_paths = skill_path.includes("///")
            ? skill_path.split("///")
            : [skill_path];
          context.skill_path = skill_path;
          context.aiming = RULESET.aiming;
          context.usable_keywords = await Promise.all(
            this.#current_skill.usable_keywords.map(async (keyword_data) => {
              return {
                name: keyword_data.label,
                limitation: utils.makeTimeLimitationForKeyword(keyword_data),
                skill_alterations: keyword_data.skill_alterations
                  .filter((skill_alteration) => {
                    return skill_paths.includes(
                      skill_alteration.associated_skill,
                    );
                  })
                  .map((skill_alteration) => {
                    let result = {
                      dos_mod: skill_alteration.dos_mod,
                      adv_amount: skill_alteration.adv_amount,
                      disadv_amount: skill_alteration.disadv_amount,
                    };
                    return result;
                  }),
                description: keyword_data.effect,
                systemFields: {
                  limitation: model_helper.defineTimePhaseLimitation(),
                  skill_alterations:
                    model_helper.define_skills_alterations_list(),
                },
              };
            }),
          );
          context.usable_supplementaries =
            this.#current_skill.usable_supplementaries;
          context.usable_perks = await Promise.all(
            this.#current_skill.usable_perks.map(async (item_perk) => {
              return {
                name: item_perk.name,
                limitation: item_perk.system.limitation,
                skill_alterations: skill_paths
                  .map((skill_path) => item_perk.getAlterations(skill_path))
                  .flat(),
                description: await item_perk.getTooltipHTML(),
                systemFields: item_perk.systemFields,
              };
            }),
          );
        }
        break;
    }
    return context;
  }

  /**
   * Actions performed after any render of the Application.
   * Post-render steps are not awaited by the render process.
   * @param {ApplicationRenderContext} context      Prepared context data
   * @param {RenderOptions} options                 Provided render options
   * @protected
   */
  _onRender(context, options) {
    // Inputs with class `item-quantity`
    // const itemQuantities = this.element.querySelectorAll(".item-quantity");
    // for (const input of itemQuantities) {
    // keep in mind that if your callback is a named function instead of an arrow function expression
    // you'll need to use `bind(this)` to maintain context
    // input.addEventListener("change", (e) => {
    //   e.preventDefault();
    //   e.stopImmediatePropagation();
    // const newQuantity = e.currentTarget.value;
    // assuming the item's ID is in the input's `data-item-id` attribute
    // const itemId = e.currentTarget.dataset.itemId;
    // const item = this.actor.items.get(itemId);
    // // the following is asynchronous and assumes the quantity is in the path `system.quantity`
    // item.update({ system: { quantity: newQuantity } });
    // });
    // }
  }

  static skill_change(event, target) {
    let { skillId } = target.dataset;
    this.#current_skill = this.data.skills.at(skillId);
    this.render();
  }
}
