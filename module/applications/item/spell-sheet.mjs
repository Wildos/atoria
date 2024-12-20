/**
 * Override and extend the core ItemSheet implementation to handle specific item types.
 */
export default class ItemAtoriaSheetSpell extends ItemSheet {

    /** @inheritdoc */
    static get defaultOptions() {
      return foundry.utils.mergeObject(super.defaultOptions, {
        width: 340,
        height: 660,
        classes: ["atoria", "sheet", "spell"],
        resizable: true,
      });
    }
  
    /* -------------------------------------------- */
  
    /** @inheritdoc */
    get template() {
      return `systems/atoria/templates/items/spell-sheet.hbs`;
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
      });

      const action_modifier = this.actor.get_action_modifiers();
      context.incantatory_addition_list = action_modifier["incantatory_addition"];
      action_modifier["incantatory_addition"].forEach((element) => {
        item.system.related_incantatory_additions[element._id] = item.system.related_incantatory_additions[element._id] || false;
      });

      for( let key in item.system.spell_supps) {
        context.system.spell_supps[key].descriptionHTML = await TextEditor.enrichHTML(item.system.spell_supps[key].description, {async: true});
      }
      return context;
    }

    /** @inheritDoc */
    activateListeners(html) {
      super.activateListeners(html);
      
      if ( this.isEditable ) {
        html.find(".spell-supp-create").click(this._onSpellSuppCreate.bind(this));
        html.find(".spell-supp-delete").click(this._onSpellSuppDelete.bind(this));
      }
    }


    async _onSpellSuppCreate(event) {
      event.preventDefault();
      await this.item.addSpellSupp();
    }
    
    async _onSpellSuppDelete(event) {
      event.preventDefault();
      const header = event.currentTarget;
      const li = $(header).parents(".spell-supp");
      const key_id = li.data("id");
      await this.item.removeSpellSupp(key_id);
    }
  
  }
  