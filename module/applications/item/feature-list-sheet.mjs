import ATORIA from "../../config.mjs";
import { confirm_deletion } from "../../utils.mjs"

/**
 * Override and extend the core ItemSheet implementation to handle specific item types.
 */
export default class ItemAtoriaSheetFeatureList extends ItemSheet {

  /** @inheritdoc */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      width: 575,
      height: 330,
      classes: ["atoria", "sheet", "feature-list"],
      resizable: true
    });
  }

  /* -------------------------------------------- */

  /** @inheritdoc */
  get template() {
    return `systems/atoria/templates/items/feature-list-sheet.hbs`;
  }

  /* -------------------------------------------- */
  /*  Context Preparation                         */
  /* -------------------------------------------- */

  /** @override */
  async getData(options) {
    const context = await super.getData(options);
    const item = context.item;
    const source = item.toObject();

    // Game system configuration
    context.config = CONFIG.ATORIA;

    // Item rendering data
    foundry.utils.mergeObject(context, {
      source: source.system,
      system: item.system,
      isOwned: !(this.actor === undefined || this.actor === null)
    });

    context.feature_usage_regain_types = [];
    for (const [key, value] of Object.entries(CONFIG.ATORIA.TIME_PHASES_LABEL)) {
      context.feature_usage_regain_types.push({
        "name": value,
        "value": key
      });
    }


    for (const [key, element] of Object.entries(this.item.system.features)) {
      this.item.system.features[key].show_usage_limits = element.regain_type !== CONFIG.ATORIA.TIME_PHASES_PERMANENT;
    }

    return context;
  }



  /** @inheritdoc */
  activateListeners(html) {
    super.activateListeners(html);
    if (this.isEditable) {
      html.find(".subfeature-create").click(this._onSubFeatureCreate.bind(this));
      html.find(".subfeature-delete").click(this._onSubFeatureDelete.bind(this));
      html.find(".data-expand").on('input', this.updateSize.bind(this));
    }
  }

  updateSize(event) {
    const cur = $(event.currentTarget);
    let numberOfLineBreaks = (cur.val().match(/\n/g) || []).length;
    const parent = $(event.currentTarget.parentNode);
    parent.data("expandvalue", cur.val());
    cur.rows = numberOfLineBreaks;
  }

  async _onSubFeatureCreate(event) {
    event.preventDefault();

    console.log("SubFeatureCreate");

    let key_id = "0";
    while (Object.keys(this.item.system.features).includes(key_id)) {
      key_id = String(Number(key_id) + 1);
    }
    this.item.system.features[key_id] = {
      name: "",
      regain_type: CONFIG.ATORIA.TIME_PHASES_PERMANENT,
      usage_left: 0,
      usage_max: 0,
      description: ""
    };
    await this.item.update({
      "system.features": this.item.system.features
    });
  }

  async _onSubFeatureDelete(event) {
    event.preventDefault();
    console.log("SubFeatureDelete");

    const header = event.currentTarget;
    const li = $(header).parents(".subfeature");
    const key_id = li.data("id");

    console.dir(this.item.system.features);
    console.dir(key_id);

    confirm_deletion(this.item.system.features[key_id].name, async user_confirmed => {
      if (user_confirmed) {
        await this.item.update({ [`system.features.-=${key_id}`]: null }, { enforceTypes: false, diff: true });
      }
    });
  }

  async _onItemDelete(event) {
    const li = $(event.currentTarget);

    if (this.actor) {
      const item = this.actor.items.get(li.data("id"));

      confirm_deletion(item.name, user_confirmed => {
        if (user_confirmed) {
          item.delete();
        }
      });
    }
  }

}
