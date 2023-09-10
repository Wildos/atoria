import {confirm_deletion} from "../../utils.mjs"

/**
 * Override and extend the core ItemSheet implementation to handle specific item types.
 */
export default class ItemAtoriaSheetAction extends ItemSheet {

  /** @inheritdoc */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      width: 470,
      height: 560,
      classes: ["atoria", "sheet", "action"],
      resizable: true
    });
  }

  /* -------------------------------------------- */

  /** @inheritdoc */
  get template() {
    return `systems/atoria/templates/items/action-sheet.hbs`;
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

    context.descriptionHTML = await TextEditor.enrichHTML(item.system.description, {async: true});

    // Item rendering data
    foundry.utils.mergeObject(context, {
      source: source.system,
      system: item.system,
      isOwned: !(this.actor === undefined || this.actor === null)
    });


    return context;
  }

  /** @inheritdoc */
  activateListeners(html) {
    super.activateListeners(html);
    if ( this.isEditable ) {
      html.find('.item-delete').click(this._onItemDelete.bind(this));
    }
  }


  // /** @inheritdoc */
  // async activateEditor(name, options={}, initialContent="") {
  //   options.relativeLinks = true;
  //   options.plugins = {
  //     menu: ProseMirror.ProseMirrorMenu.build(ProseMirror.defaultSchema, {
  //       compact: true,
  //       destroyOnSave: true,
  //       onSave: () => this.saveEditor(name, {remove: true})
  //     })
  //   };
  //   return super.activateEditor(name, options, initialContent);
  // }


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
