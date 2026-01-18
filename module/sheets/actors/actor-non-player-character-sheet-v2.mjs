import { AtoriaActorSheetV2 } from "../module.mjs";
import * as utils from "../../utils/module.mjs";

export default class AtoriaActorNonPlayerCharacterSheetV2 extends AtoriaActorSheetV2 {
  static DEFAULT_OPTIONS = {
    classes: ["non-player-character"],
  };

  static PARTS = {
    header: {
      template: "systems/atoria/templates/v2/actors/parts/character-header.hbs",
    },
    inventory: {
      template:
        "systems/atoria/templates/v2/actors/parts/character-simple-inventory.hbs",
    },
    skill_n_knowledge: {
      template:
        "systems/atoria/templates/v2/actors/parts/character-simple-skill-n-knowledge.hbs",
    },
  };

  async _preparePartContext(partId, context, options) {
    await super._preparePartContext(partId, context, options);
    switch (partId) {
      case "inventory":
        context.items = await Promise.all(
          this.actor.items.map(async (i) => {
            i.systemFields = i.system.schema.fields;
            i.keywords_recap = i.getKeywordRecap();
            return i;
          }),
        );
        context.items.sort((a, b) => (a.sort || 0) - (b.sort || 0));

        context.effects = await Promise.all(
          this.actor.effects.map(async (i) => {
            i.descriptive_tooltip = await renderTemplate(
              CONFIG.ATORIA.EFFECT_TOOLTIP_TEMPLATES,
              {
                effect: i,
              },
            );
            return i;
          }),
        );
        context.effects.sort((a, b) => (a.sort || 0) - (b.sort || 0));

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

        {
          const tracked_keywords = [
            "reach",
            "brute",
            "guard",
            "penetrating",
            "protect",
            "protection",
            "gruff",
            "tough",
            "grip",
            "resistant",
            "sturdy",
            "stable",
            "direct",
            "noisy",
            "obstruct",
          ];
          context.tracked_keywords_data = {};
          context.tracked_keywords = [];
          for (let keyword in this.actor.active_keywords_data) {
            if (tracked_keywords.includes(keyword)) {
              if (keyword === "direct") {
                context.tracked_keywords.push("direct");
                context.tracked_keywords_data["direct"] = {};
                for (let direct_type in this.actor.active_keywords_data[
                  "direct"
                ]) {
                  context.tracked_keywords_data["direct"][direct_type] = {
                    checked:
                      this.actor.system.keywords_used.direct.includes(
                        direct_type,
                      ),
                    time_phase: utils.ruleset.keywords.get_time_phase(
                      "direct",
                      this.actor.active_keywords_data["direct"][direct_type],
                    ),
                    description: utils.ruleset.keywords.get_description(
                      "direct",
                      this.actor.active_keywords_data["direct"][direct_type],
                    ),
                  };
                }
              } else {
                context.tracked_keywords.push(keyword);
                context.tracked_keywords_data[keyword] = {
                  label: utils.ruleset.keywords.get_localized_name(
                    keyword,
                    this.actor.active_keywords_data[keyword],
                  ),
                  time_phase: utils.ruleset.keywords.get_time_phase(
                    keyword,
                    this.actor.active_keywords_data[keyword],
                  ),
                  description: utils.ruleset.keywords.get_description(
                    keyword,
                    this.actor.active_keywords_data[keyword],
                  ),
                };
              }
            }
          }
          context.tracked_keywords.sort(function (key_a, key_b) {
            return utils.ruleset.keywords
              .get_localized_name(key_a)
              .localeCompare(utils.ruleset.keywords.get_localized_name(key_b));
          });
        }

        context.feature_items = feature_items;
        context.action_items = action_items;
        context.inventory_items = inventory_items;
        context.actable_modifier_items = actable_modifier_items;
        break;
      case "skill_n_knowledge":
        context.skill_n_knowledge_sorting_list = {
          "system.skills": ["combative", "physical", "social"],

          "system.skills.combative": ["reflex", "weapon"],
          "system.skills.social": [
            "analyse",
            "charisma",
            "eloquence",
            "spirit",
            "trickery",
          ],
          "system.skills.physical": [
            "agility",
            "athletic",
            "slyness",
            "environment",
            "sturdiness",
          ],
        };
        break;
      default:
        break;
    }
    return context;
  }
}
