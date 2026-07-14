const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

import RULESET from "../../utils/ruleset.mjs";
import * as utils from "../../utils/module.mjs";
import * as models from "../../models/module.mjs";

export default class AtoriaRollCombatDialog extends HandlebarsApplicationMixin(
  ApplicationV2,
) {
  constructor(data, options = {}) {
    super(options);

    this.data = data;
    this.#actor_name = fromUuidSync(this.data.actor_uuid).name;
  }

  #actor_name = "";

  static DEFAULT_OPTIONS = {
    tag: "div",
    actions: {
      rollItem: this._rollItem,
      rollThrow: this._rollThrow,
    },
  };

  static PARTS = {
    item_selection: {
      template: "systems/atoria/templates/v2/dialogs/parts/item-selection.hbs",
    },
  };

  get title() {
    return `${this.#actor_name}: ${game.i18n.localize("ATORIA.Dialog.ItemChoice")}`;
  }

  static async _rollThrow(event, target) {
    this.close({ submitted: true });
    fromUuidSync(this.data.actor_uuid).rollThrow();
  }

  static async _rollItem(event, target) {
    const { uuid } = target.dataset;
    this.close({ submitted: true });
    let item = fromUuidSync(uuid);
    if (item != undefined) {
      item.rollAction(this.data.type);
    }
  }

  async _prepareContext(options) {
    const context = {};
    context.items = this.data.items;
    context.type = this.data.type;
    return context;
  }
}
