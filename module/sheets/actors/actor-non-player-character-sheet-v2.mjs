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

        context.feature_items = feature_items;
        context.action_items = action_items;
        context.inventory_items = inventory_items;
        context.actable_modifier_items = actable_modifier_items;
        {
          let preserve_keyword_items = [];
          for (const i of context.items) {
            switch (i.type) {
              case "weapon":
              case "armor":
                if (!i.system.is_worn) continue;
                if (i.system.keywords.preserve.active) {
                  preserve_keyword_items.push(
                    utils.ruleset.item.attackFromWeapon(i),
                  );
                }
                break;
              case "kit":
                if (i.system.keywords.preserve.active) {
                  preserve_keyword_items.push(
                    utils.ruleset.item.attackFromWeapon(i),
                  );
                }
                break;
            }
          }
          context.preserve_keyword_items = preserve_keyword_items;
          context.tracked_keywords = utils.ruleset.keywords.sharable_keywords;

          context.active_keywords_data = Object.entries(
            utils.ruleset.character.getActiveSharableKeywordsLevel(this.actor),
          ).map(([keyword_id, level]) => {
            const eff = utils.ruleset.character.getKeywordEffect(
              this.actor,
              keyword_id,
              level,
            );
            eff["limit_remaining"] =
              this.actor.system.keywords[keyword_id].limit_remaining;
            eff["level"] = level - 1;
            return eff;
          });
        }
        context.keywords_setup = this.actor.system.keywords;
        for (const [keyword_id, keyword] of Object.entries(
          context.keywords_setup,
        )) {
          keyword.effect_levels = [keyword.effect_level_1];
          if (keyword.effect_level_2) {
            keyword.effect_levels.push(keyword.effect_level_2);
          }
          if (keyword.effect_level_3) {
            keyword.effect_levels.push(keyword.effect_level_3);
          }
          if (keyword.effect_level_4) {
            keyword.effect_levels.push(keyword.effect_level_4);
          }
          if (keyword.effect_level_5) {
            keyword.effect_levels.push(keyword.effect_level_5);
          }
        }
        break;
      case "skill_n_knowledge":
        context.skill_n_knowledge_sorting_list = {
          "system.skills": this.isEditingMode
            ? ["weapon", "physical", "social"]
            : ["physical", "social"],

          "system.skills.weapon": ["contact", "apart", "instrument"],
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
            "reflex",
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
