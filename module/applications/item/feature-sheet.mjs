import {confirm_deletion} from "../../utils.mjs"

/**
 * Override and extend the core ItemSheet implementation to handle specific item types.
 */
export default class ItemAtoriaSheetFeature extends ItemSheet {

    /** @inheritdoc */
    static get defaultOptions() {
      return foundry.utils.mergeObject(super.defaultOptions, {
        width: 575,
        height: 330,
        classes: ["atoria", "sheet", "feature"],
        resizable: true
      });
    }
  
    /* -------------------------------------------- */
  
    /** @inheritdoc */
    get template() {
      return `systems/atoria/templates/items/feature-sheet.hbs`;
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

      context.descriptionHTML = await TextEditor.enrichHTML(item.system.description, {async: true});
  
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
  