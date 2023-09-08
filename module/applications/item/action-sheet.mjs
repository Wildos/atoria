/**
 * Override and extend the core ItemSheet implementation to handle specific item types.
 */
export default class ItemAtoriaSheetAction extends ItemSheet {

  /** @inheritdoc */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      width: 560,
      height: 400,
      classes: ["atoria", "sheet", "action"],
      resizable: true,
      tabs: [{navSelector: ".tabs", contentSelector: ".sheet-body", initial: "description"}],
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

    // Item rendering data
    foundry.utils.mergeObject(context, {
      source: source.system,
      system: item.system,
    });

    return context;
  }

}
