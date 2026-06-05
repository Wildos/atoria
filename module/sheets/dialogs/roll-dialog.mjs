const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

import RULESET from "../../utils/ruleset.mjs";
import * as utils from "../../utils/module.mjs";
import * as models from "../../models/module.mjs";

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
//   actor_id: "<actor_id>",
//   action_cost: utils.get_empty_cost(),
//   skill: {
//     proper_label: "Title to show",
//     success: 0,
//     critical_success_amount: 0,
//     critical_fumble_amount: 0,
//   },
//   usable_keywords: [],
//   usable_supplementaries: [],
//   usable_perks: [],
// };

export default class AtoriaRollDialog extends HandlebarsApplicationMixin(
  ApplicationV2,
) {
  constructor(data, options = {}) {
    super(options);

    console.debug("data");
    console.debug(data);

    this.data = data;
    this.#roll_parameters = undefined;

    this.data.usable_perks.sort((a, b) => {
      const types_ord = [
        "supplementary",
        "technique",
        "incantatory-addition",
        "feature",
        "kit",
        "armor",
        "weapon",
        undefined,
      ];
      let type_ord = types_ord.indexOf(a.type) - types_ord.indexOf(b.type);
      if (type_ord != 0) {
        return type_ord;
      }
      return (a.sort || 0) - (b.sort || 0);
    });
  }

  #roll_parameters = undefined;

  static DEFAULT_OPTIONS = {
    tag: "form",
    form: {
      handler: AtoriaRollDialog.formHandler,
      submitOnChange: false,
      closeOnSubmit: false,
    },
    actions: {},
  };

  static PARTS = {
    form: {
      template: "systems/atoria/templates/v2/dialogs/roll-dialog.hbs",
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
    return `${game.i18n.localize(this.data.skill.proper_label)}`;
  }

  /** @override */
  _configureRenderOptions(options) {
    // This fills in `options.parts` with an array of ALL part keys by default
    // So we need to call `super` first
    super._configureRenderOptions(options);
    // Completely overriding the parts
    options.parts = ["form"];
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
    for (let value_key in form_data_obj) {
      if (value_key.startsWith("usable_keywords.")) {
        let index = parseInt((value_key.split(".") ?? [undefined])[1]);
        if (!Number.isNaN(index) && form_data_obj[value_key]) {
          used_keywords.push(this.data.usable_keywords[index]);
        }
      }
    }
    let used_perks = [];
    for (let value_key in form_data_obj) {
      if (value_key.startsWith("usable_perks.")) {
        let index = parseInt((value_key.split(".") ?? [undefined])[1]);
        if (!Number.isNaN(index) && form_data_obj[value_key]) {
          used_perks.push(this.data.usable_perks[index]);
        }
      }
    }

    this.#roll_parameters = {
      message_mode: form_data_obj.asked_visibility,
      roll_data: {
        owning_actor_id: this.data.actor_id,
        success_value: this.data.skill.success,
        critical_success_amount: this.data.skill.critical_success_amount,
        critical_fumble_amount: this.data.skill.critical_fumble_amount,
        title: this.data.skill.label,
        advantage_amount: form_data_obj.advantage_amount,
        disadvantage_amount: form_data_obj.disadvantage_amount,
        luck_applied: form_data_obj.luck_applied,
        dos_mod: form_data_obj.dos_mod,
        is_danger: form_data_obj.is_danger,
      },
      used_keywords: used_keywords,
      used_supplementaries: [],
      used_perks: used_perks,
    };
    this.close({ submitted: true });
  }

  async _prepareContext(options) {
    let available_message_mods = RULESET.character.isBlindSkill(
      this.data.skill.path,
    )
      ? {
          blind: CONFIG.ChatMessage.modes["blind"],
        }
      : CONFIG.ChatMessage.modes;

    let selected_message_mode = game.settings.get("core", "messageMode");

    let skill_path = this.data.skill.path;

    const context = {
      skill_path: skill_path,
      aiming: RULESET.aiming,
      force_blind_roll: false,
      message_modes: available_message_mods,
      selected_message_mode: selected_message_mode,
      usable_keywords: this.data.usable_keywords,
      usable_supplementaries: [],
      usable_perks: await Promise.all(
        this.data.usable_perks.map(async (item_perk) => {
          return {
            name: item_perk.name,
            limitation: item_perk.system.limitation,
            skill_alterations: item_perk.getAlterations(skill_path),
            description: await item_perk.getTooltipHTML(),
            systemFields: item_perk.systemFields,
          };
        }),
      ),
      // action_cost: this.data.action_cost,
      // action_cost_fields: models.helpers.defineCostField(),
    };
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
}
