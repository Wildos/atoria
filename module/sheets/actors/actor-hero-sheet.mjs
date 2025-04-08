import { AtoriaActorSheet } from "../module.mjs";

export default class AtoriaActorHeroSheet extends AtoriaActorSheet {

    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            classes: ["atoria", "sheet", "actor", "hero"],
            width: 200,
            height: 450,
            tabs: [],
        });
    }

    getData() {
        this.isEditingMode = true;
        const context = super.getData();
        return context;
    }

    async _prepareItems(context) {
        await super._prepareItems(context);
        const feature_items = [];
        const action_items = [];
        const inventory_items = [];
        const actable_modifier_items = [];
        for (let i of context.items) {
            switch (i.type) {
                case "feature":
                    feature_items.push(i);
                    break;
                case "opportunity":
                case "action":
                case "spell":
                    action_items.push(i);
                    break;
                case "weapon":
                    action_items.push(i);
                case "armor":
                case "kit":
                    inventory_items.push(i);
                    break;
                case "technique":
                case "incantatory-addition":
                    actable_modifier_items.push(i);
                    break;
            }
        }
        context.feature_items = feature_items;
        context.action_items = action_items;
        context.inventory_items = inventory_items;
        context.actable_modifier_items = actable_modifier_items;
    }
}