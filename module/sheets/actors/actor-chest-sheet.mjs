import { AtoriaActorSheet } from "../module.mjs";

export default class AtoriaActorChestSheet extends AtoriaActorSheet {

    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            classes: ["atoria", "sheet", "actor", "chest"],
            width: 450,
            height: 350,
            tabs: [],
        });
    }

    async getData() {
        const context = await super.getData();
        this._updateTextareaLineCount("description", this.actor.system.description);
        return context;
    }

    _prepareItemCreation(item_data_array) {
        for (let elem of item_data_array) {
            if (elem.type !== "kit") {
                const owner = elem.owner;
                if ((owner?.type ?? "chest") === "chest") continue;
                const owner_name = owner?.name;
                elem.name = elem.name + ((owner_name) ? ` [${owner_name}]` : "");
            }
        }
        return item_data_array;
    }

    async _onDropItemCreate(itemData) {
        if (!["kit", "armor", "weapon"].includes(itemData.type)) return;

        itemData = itemData instanceof Array ? this._prepareItemCreation(itemData) : this._prepareItemCreation([itemData]);
        return this.actor.createEmbeddedDocuments("Item", itemData);
    }

}