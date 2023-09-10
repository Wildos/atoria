import {confirm_deletion} from "../../utils.mjs"


/**
 * Override and extend the core ItemSheet implementation to handle specific item types.
 */
export default class ItemAtoriaSheetGear extends ItemSheet {

  /** @inheritdoc */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      width: 300,
      classes: ["atoria", "sheet", "gear"],
      resizable: true,
      tabs: [{navSelector: ".tabs", contentSelector: ".sheet-body", initial: "description"}],
    });
  }
  /* -------------------------------------------- */

  /** @inheritdoc */
  get template() {
    return `systems/atoria/templates/items/gear-sheet.hbs`;
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
      isWeapon: item.type === "gear-weapon",
      isBagItem: [ "gear-consumable", "gear-equipment", "gear-ingredient"].includes(item.type),
      isOwned: !(this.actor === undefined || this.actor === null)
    });
    
    context.descriptionHTML = await TextEditor.enrichHTML(item.system.effect_description, {async: true});

    return context;
  }



  /** @inheritdoc */
  activateListeners(html) {
    super.activateListeners(html);
    if ( this.isEditable ) {
      html.find('.item-delete').click(this._onItemDelete.bind(this));
    }
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
