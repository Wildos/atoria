import ATORIA from "../../config.mjs";
import { confirm_deletion } from "../../utils.mjs"

/**
 * Override and extend the core ItemSheet implementation to handle specific item types.
 */
export default class ItemAtoriaSheetFeatureList extends ItemSheet {

  /** @inheritdoc */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      width: 400,
      height: 350,
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

    return context;
  }



  /** @inheritdoc */
  activateListeners(html) {
    super.activateListeners(html);
    if (this.isEditable) {
      html.find(".subfeature-create").click(this._onSubFeatureCreate.bind(this));
      html.find(".subfeature-delete").click(this._onSubFeatureDelete.bind(this));
      html.find(".data-expand").on('input', this.updateSize.bind(this));
      html.find('.item-delete').click(this._onItemDelete.bind(this));

      html.find('input[data-update-features-index]').change(this._onUpdateFeatures.bind(this));
      html.find('textarea[data-update-features-index]').change(this._onUpdateFeatures.bind(this));
      html.find('select[data-update-features-index]').change(this._onUpdateFeatures.bind(this));
    }
  }

  /**
   * Handle update of item from character sheet
   * 
   */
  async _onUpdateFeatures(event) {
    event.preventDefault();
    const { updateFeaturesIndex, insideArrayKey } = event.currentTarget.dataset;

    const access = (path, object) => {
      return path.split('.').reduce((o, i) => o[i], object)
    }

    let new_array = this.item.system.features;

    let new_array_element = new_array[updateFeaturesIndex];
    new_array_element[insideArrayKey] = event.target.value;

    new_array[updateFeaturesIndex] = new_array_element;


    this.item.update({ "system.features": new_array });
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

    let new_features = this.item.system.features;
    if (!Array.isArray(new_features)) {
      new_features = [];
      for (const [key, value] of Object.entries(this.item.system.features)) {
        new_features.push(value);
      }
    }

    new_features.push({
      name: "",
      regain_type: CONFIG.ATORIA.TIME_PHASES_PERMANENT,
      usage_left: 0,
      usage_max: 0,
      description: ""
    });

    await this.item.update({
      "system.features": new_features
    });
  }

  async _onSubFeatureDelete(event) {
    event.preventDefault();

    const header = event.currentTarget;
    const li = $(header).parents(".subfeature");
    const key_id = li.data("id");

    confirm_deletion(this.item.system.features[key_id].name, async user_confirmed => {
      if (user_confirmed) {
        let new_features = this.item.system.features
        new_features.splice(key_id, 1);
        await this.item.update({ "system.features": new_features }, { enforceTypes: false, diff: true });
      }
    });
  }

  async _onItemDelete(event) {
    const li = $(event.currentTarget);

    if (this.actor) {
      const item = this.actor.items.get(li.data("id"));

      confirm_deletion(item.name, async user_confirmed => {
        if (user_confirmed) {
          await this.actor.remove_item_link("feature-list-item", li.data("id"));
          item.delete();
        }
      });
    }
  }

}
