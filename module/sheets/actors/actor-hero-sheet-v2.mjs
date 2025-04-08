import { AtoriaActorSheetV2 } from "../module.mjs";
import * as utils from "../../utils/module.mjs";

export default class AtoriaActorHeroSheetV2 extends AtoriaActorSheetV2 {
  static DEFAULT_OPTIONS = {
    classes: ["hero"],
    window: {
      resizable: true,
    },
  };

  static PARTS = {
    body: {
      template: "systems/atoria/templates/v2/actors/actor-hero-sheet.hbs",
    },
  };

  async _preparePartContext(partId, context, options) {
    await super._preparePartContext(partId, context, options);
    switch (partId) {
      case "body":
        context.items = await Promise.all(
          this.actor.items.map(async (i) => {
            // i.descriptive_tooltip = await i.getTooltipHTML();
            i.systemFields = i.system.schema.fields;
            return i;
          }),
        );
        context.items.sort((a, b) => (a.sort || 0) - (b.sort || 0));

        const feature_items = [];
        const action_items = [];
        const inventory_items = [];
        const actable_modifier_items = [];
        for (const i of context.items) {
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
              if (i.system.is_worn)
                action_items.push(utils.ruleset.item.attackFromWeapon(i));
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
        break;
    }
    return context;
  }
}
