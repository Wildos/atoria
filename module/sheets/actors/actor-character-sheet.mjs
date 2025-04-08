import * as utils from "../../utils/module.mjs";
import { AtoriaActorSheet } from "../module.mjs";

export default class AtoriaActorCharacterSheet extends AtoriaActorSheet {

    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            classes: ["atoria", "sheet", "actor", "character"],
            width: 900,
            height: 900,
            tabs: [],
        });
    }


    async _prepareItems(context) {
        await super._prepareItems(context);
        if (this.actor.type === "non-player-character") {
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
                    case "kit":
                    case "armor":
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

    activateListeners(html) {
        super.activateListeners(html);

        if (!this.isEditable) return;

        html.on("click", ".skill-shown-control", async (event) => {
            event.preventDefault();
            const { skillPath } = event.currentTarget.dataset;
            const current_value = this.actor.getFlag("atoria", skillPath) ?? false;

            const show_element = async (element_path) => {
                const path_data = foundry.utils.getProperty(this.actor, element_path);
                if (utils.isSkill(path_data)) await this.actor.setFlag("atoria", element_path, true);
                else {
                    for (let key of Object.keys(path_data)) {
                        await show_element(`${element_path}.${key}`);
                    }
                }
            };

            if (!current_value) {
                await show_element(skillPath);
            } else {
                await this.actor.setFlag("atoria", skillPath, null);
                let flag_path = skillPath.split('.');
                while (flag_path.length > 0) {
                    flag_path.pop();
                    const current_path = flag_path.join('.');
                    const flag_data = this.actor.getFlag("atoria", current_path);
                    for (let [_, value] of Object.entries(flag_data)) {
                        if (value != null) {
                            return; // If one is not null we stop deleting flags
                        }
                    }
                    await this.actor.setFlag("atoria", current_path, null);
                }
            }
        });
    }
}