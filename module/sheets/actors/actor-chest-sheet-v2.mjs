import { AtoriaActorSheetV2 } from "../module.mjs";

export default class AtoriaActorChestSheetV2 extends AtoriaActorSheetV2 {
  constructor(options = {}) {
    super(options);
    this.isEditingMode = true;
  }

  static DEFAULT_OPTIONS = {
    classes: ["chest"],
  };

  static PARTS = {
    header: {
      template: "atoria.v2.commons_partials.simple-header",
    },
    body: {
      template: "systems/atoria/templates/v2/actors/actor-chest-sheet.hbs",
    },
  };

  async _preparePartContext(partId, context, options) {
    await super._preparePartContext(partId, context, options);
    switch (partId) {
      case "header":
        context.document = context.actor;
        break;
    }
    return context;
  }

  _canDragDrop(selector) {
    return this.isVisible;
  }

  async _onDropItem(event, data) {
    if (!this.isVisible) return false;
    const item = await Item.implementation.fromDropData(data);

    if (this.actor.uuid === item.parent?.uuid)
      return this._onSortItem(event, item);

    return this._onDropItemCreate(item, event);
  }

  async _onDropItemCreate(itemData) {
    itemData = itemData instanceof Array ? itemData : [itemData];
    const filtered_item_data = itemData.filter((item) =>
      ["kit", "armor", "weapon"].includes(item.type),
    );
    let created_items = [];
    for (let elem of filtered_item_data) {
      let new_item = (
        await this.actor.createEmbeddedDocuments("Item", [elem])
      )[0];
      if (elem.type !== "kit") {
        const owner = elem.actor;
        if ((owner?.type ?? "chest") === "chest") continue;
        const owner_name = owner?.name;
        new_item.setFlag("atoria", "previous_owner_name", owner_name);
      }
      created_items.push(new_item);
    }
    return created_items;
  }
}
