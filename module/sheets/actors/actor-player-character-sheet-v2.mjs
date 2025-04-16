import { AtoriaActorSheetV2 } from "../module.mjs";
import * as utils from "../../utils/module.mjs";

const DEFAULT_FEATURE_PLACE = "other";

export default class AtoriaActorPlayerCharacterSheetV2 extends AtoriaActorSheetV2 {
  DEFAULT_PAGE = "character";

  constructor(options = {}) {
    super(options);
    this.tabGroups["primary"] = this.DEFAULT_PAGE;
  }

  static DEFAULT_OPTIONS = {
    classes: ["player-character"],
    actions: {
      applyTimePhase: {
        handler: this._applyTimePhase,
        buttons: [0],
      },
      editHealingInactive: this._editHealingInactive,
      createSkill: this._createSkill,
      deleteSkill: this._deleteSkill,
      createItem: this._createItem,
    },
  };

  static PARTS = {
    tabs: {
      // Foundry-provided generic template
      template: "systems/atoria/templates/v2/actors/parts/tab-navigation.hbs",
    },
    header: {
      template: "systems/atoria/templates/v2/actors/parts/player-header.hbs",
    },
    character_page: {
      template:
        "systems/atoria/templates/v2/actors/parts/player-character-page.hbs",
    },
    inventory_page: {
      template:
        "systems/atoria/templates/v2/actors/parts/player-inventory-page.hbs",
    },
    action_page: {
      template:
        "systems/atoria/templates/v2/actors/parts/player-action-page.hbs",
    },
  };

  static async _applyTimePhase(_event, target) {
    const { timePhase } = target.dataset;
    if (!timePhase) return;
    await this.actor.applyTimePhase(timePhase);
  }

  static async _editHealingInactive(_event, target) {
    const { amount } = target.dataset;
    let new_amount = amount;
    if (new_amount == this.actor.system.healing_inactive.amount)
      new_amount -= 1;
    await this.actor.update({
      "system.healing_inactive.amount": new_amount,
    });
  }

  static async _createSkill(_event, target) {
    const { skillCatPath } = target.dataset;
    const result = await utils.skillCreationDialog(this.actor, skillCatPath);
    if (!result) {
      return;
    }
    const { skill_key, skill_label } = result;
    await this.actor.createSkill(skillCatPath, skill_key, skill_label);
  }

  static async _deleteSkill(_event, target) {
    const { skillPath } = target.dataset;
    const split_elements = skillPath.split(".");
    const skill_key = split_elements.pop();
    const skill_cat_path = split_elements.join(".");
    await this.actor.deleteSkill(skill_cat_path, skill_key);
  }

  static async _createItem(_event, target) {
    const item_data = {};
    for (const [key, value] of Object.entries(target.dataset)) {
      // Ignore sheet-action related keys
      if (["action", "open"].includes(key)) continue;
      foundry.utils.setProperty(item_data, key, value);
    }

    const item = await this.document?.createSubItem(item_data);
    if (item.type === "feature") {
      item.setFlag(
        "atoria",
        "feature-category",
        target.dataset.featureCat ?? DEFAULT_FEATURE_PLACE,
      );
    }
    if (target.dataset.open && item !== undefined) item.sheet.render(true);
  }

  async _prepareContext(options) {
    const context = super._prepareContext(options);
    const skillPath = "system.skills.combative";
    const hidden_skills =
      this.document.getFlag("atoria", "hidden_skills") ?? [];
    if (!hidden_skills.includes(skillPath)) {
      hidden_skills.push(skillPath);
    }
    this.document.setFlag("atoria", "hidden_skills", hidden_skills);
    return context;
  }

  _format_feature_items(feature_items) {
    let formatted_feature_items = {};

    for (const feature of feature_items) {
      let feature_place = feature.getFlag("atoria", "feature-category");
      if (feature_place === undefined || feature_place === "") {
        feature_place = DEFAULT_FEATURE_PLACE;
      }
      let new_value = utils.retrieve_from_string(
        formatted_feature_items,
        feature_place,
      );
      if (new_value === undefined) {
        new_value = [];
      }
      new_value.push(feature);
      utils.assignation_from_string(
        formatted_feature_items,
        feature_place,
        new_value,
      );
    }

    return formatted_feature_items;
  }

  async _preparePartContext(partId, context, options) {
    await super._preparePartContext(partId, context, options);

    let feature_skill_categories = [
      ...(utils.extract_leaf_from_player_skills_for_feature_cat(
        this.actor?.getSkillList(),
      ) ?? []),
      {
        id: "perceptions",
        Label: "ATORIA.Sheet.Player.Features.Skills.Perceptions",
      },
      {
        id: "other",
        Label: "ATORIA.Sheet.Player.Features.Skills.Other",
      },
    ];
    let feature_magic_categories = [
      ...(utils.extract_leaf_from_player_magic_skills_for_feature_cat(
        this.actor.system.knowledges,
      ) ?? []),
      {
        id: "other",
        Label: "ATORIA.Sheet.Player.Features.Magic.Other",
      },
    ];
    let feature_knowledge_categories = [
      ...(utils.extract_leaf_from_player_knowledges_for_feature_cat(
        this.actor?.getSkillList({ knowledges: this.actor.system.knowledges }),
        this.actor,
      ) ?? []),
      {
        id: "other",
        Label: "ATORIA.Sheet.Player.Features.Knowledges.Other",
      },
    ];
    const feature_items = [];
    const action_items = [];
    const equipped_items = {
      armors: {
        head: {
          label: "ATORIA.Ruleset.Armor.Position.Head",
          items: [],
        },
        neck: {
          label: "ATORIA.Ruleset.Armor.Position.Neck",
          items: [],
        },
        torso: {
          label: "ATORIA.Ruleset.Armor.Position.Torso",
          items: [],
        },
        shoulders: {
          label: "ATORIA.Ruleset.Armor.Position.Shoulders",
          items: [],
        },
        arms: {
          label: "ATORIA.Ruleset.Armor.Position.Arms",
          items: [],
        },
        hands: {
          label: "ATORIA.Ruleset.Armor.Position.Hands",
          items: [],
        },
        rings: {
          label: "ATORIA.Ruleset.Armor.Position.Rings",
          items: [],
        },
        waist: {
          label: "ATORIA.Ruleset.Armor.Position.Waist",
          items: [],
        },
        legs: {
          label: "ATORIA.Ruleset.Armor.Position.Legs",
          items: [],
        },
        feet: {
          label: "ATORIA.Ruleset.Armor.Position.Feet",
          items: [],
        },
      },
      weapons: [],
    };
    const inventory_items_sort = [
      "consummables",
      "materials_ingredients",
      "gear",
      "combat_gears",
      "other",
    ];
    const inventory_items = {
      combat_gears: {
        label: "ATORIA.Sheet.Player.Inventory.Combat_gears",
        items: [],
      },
      consummables: {
        label: "ATORIA.Sheet.Player.Inventory.Consummables",
        items: [],
      },
      materials_ingredients: {
        label: "ATORIA.Sheet.Player.Inventory.Materials_ingredients",
        items: [],
      },
      gear: {
        label: "ATORIA.Sheet.Player.Inventory.Gear",
        items: [],
      },
      other: {
        label: "ATORIA.Sheet.Player.Inventory.Other",
        items: [],
      },
    };

    context.associated_skills =
      this.actor?.getSkillnKnowledgeList() ??
      utils.default_values.associated_skills;

    switch (partId) {
      case "header":
        context.active_page = this.tabGroups["primary"];
        context.max_override = {
          stamina: utils.ruleset.character.getCurrentMaxStamina(this.actor),
          mana: utils.ruleset.character.getCurrentMaxMana(this.actor),
        };
        context.max_healing_inactive =
          utils.ruleset.character.getMaxHealingInactive(this.actor);
        break;
      case "tabs":
        context.tabs = [
          {
            cssClass: "",
            group: "primary",
            id: "character",
            icon: "",
            label: "ATORIA.Sheet.Player.Pages.Character",
          },
          {
            cssClass: "",
            group: "primary",
            id: "inventory",
            icon: "",
            label: "ATORIA.Sheet.Player.Pages.Inventory",
          },
          {
            cssClass: "",
            group: "primary",
            id: "action",
            icon: "",
            label: "ATORIA.Sheet.Player.Pages.Action",
          },
        ];
        break;
      case "inventory_page":
        context.is_active_page = this.tabGroups["primary"] === "inventory";
        context.items = await Promise.all(
          this.actor.items.map(async (i) => {
            i.systemFields = i.system.schema.fields;
            i.keywords_list = i.getKeywordList();
            return i;
          }),
        );
        context.items.sort((a, b) => (a.sort || 0) - (b.sort || 0));

        for (const i of context.items) {
          switch (i.type) {
            case "weapon":
              if (i.system.is_worn) equipped_items.weapons.push(i);
              else
                inventory_items[
                  i.getFlag("atoria", "inventory-category") ?? "other"
                ].items.push(i);
              break;
            case "armor":
              if (i.system.is_worn)
                equipped_items.armors[i.system.position]?.items.push(i);
              else
                inventory_items[
                  i.getFlag("atoria", "inventory-category") ?? "other"
                ].items.push(i);
              break;
            case "kit":
              inventory_items[
                i.getFlag("atoria", "inventory-category") ?? "other"
              ].items.push(i);
              break;
          }
        }
        context.inventory_items = inventory_items;
        context.equipped_items = equipped_items;
        context.inventory_items_sort = inventory_items_sort;
        break;
      case "character_page":
        context.is_active_page = this.tabGroups["primary"] === "character";

        context.is_forced_horizontally = game.settings.get(
          "atoria",
          "display_player_sheet_horizontally",
        );

        context.skill_n_skill_sorting_list = {
          "system.skills": ["combative", "physical", "social"],

          "system.skills.combative": ["reflex", "weapon"],
          "system.skills.combative.reflex": ["dodge", "parry", "opportuneness"],
          "system.skills.combative.weapon": [
            "brawl",
            "blade",
            "polearm",
            "haft-slashing",
            "haft-bludgeonning-piercing",
            "shield",
            "shooting",
            "throw",
            "focuser",
            "instrument",
          ],

          "system.skills.social": [
            "analyse",
            "charisma",
            "eloquence",
            "spirit",
            "intimidation",
            "trickery",
          ],
          "system.skills.social.analyse": [
            "insight",
            "identification",
            "investigation",
          ],
          "system.skills.social.charisma": ["presence", "seduction"],
          "system.skills.social.eloquence": [
            "persuasion",
            "calming",
            "negotiation",
          ],
          "system.skills.social.spirit": ["will", "guarding"],
          "system.skills.social.intimidation": ["fear", "authority"],
          "system.skills.social.trickery": ["acting", "lying", "provocation"],

          "system.skills.physical": [
            "agility",
            "athletic",
            "slyness",
            "climbing",
            "swiming",
            "sturdiness",
          ],
          "system.skills.physical.agility": ["balance", "dexterity"],
          "system.skills.physical.athletic": ["hiking", "running", "jump"],
          "system.skills.physical.slyness": [
            "silence",
            "stealth",
            "concealment",
          ],
          "system.skills.physical.climbing": ["scale", "fall"],
          "system.skills.physical.swiming": ["ease", "breath-holding"],
          "system.skills.physical.sturdiness": [
            "force",
            "tenacity",
            "fortitude",
          ],
        };
        context.reflex_skills = {
          skill_cat: this.actor.system.skills.combative.reflex,
          path: "system.skills.combative.reflex",
          model: context.systemFields.skills.fields.combative.fields.reflex,
        };
        context.filtered_skills_group = ["combative"];

        context.extendable_skill = utils.ruleset.character.getExtendableSkill();

        context.items = await Promise.all(
          this.actor.items.map(async (i) => {
            i.systemFields = i.system.schema.fields;
            i.keywords_list = i.getKeywordList();
            return i;
          }),
        );
        context.items.sort((a, b) => (a.sort || 0) - (b.sort || 0));

        context.effects = await Promise.all(
          this.actor.effects.map(async (e) => {
            return e;
          }),
        );
        context.effects.sort((a, b) => (a.sort || 0) - (b.sort || 0));

        for (const i of context.items) {
          switch (i.type) {
            case "feature":
              feature_items.push(i);
              break;
            case "weapon":
              if (i.system.is_worn)
                action_items.push(utils.ruleset.item.attackFromWeapon(i));
              break;
          }
        }
        context.feature_items = feature_items;
        context.formatted_feature_items =
          this._format_feature_items(feature_items);

        context.feature_categories = {
          combat: {
            Label: "ATORIA.Sheet.Player.Features.Combat.Label",
            children: [
              {
                id: "combatives",
                Label: "ATORIA.Sheet.Player.Features.Combat.Combatives",
              },
              {
                id: "armors",
                Label: "ATORIA.Sheet.Player.Features.Combat.Armors",
              },
              {
                id: "amplificators",
                Label: "ATORIA.Sheet.Player.Features.Combat.Amplificators",
              },
              {
                id: "other",
                Label: "ATORIA.Sheet.Player.Features.Combat.Other",
              },
            ],
          },
          skills: {
            Label: "ATORIA.Sheet.Player.Features.Skills.Label",
            children: feature_skill_categories,
          },
          magic: {
            Label: "ATORIA.Sheet.Player.Features.Magic.Label",
            children: feature_magic_categories,
          },
          knowledges: {
            Label: "ATORIA.Sheet.Player.Features.Knowledges.Label",
            children: feature_knowledge_categories,
          },
          other: {
            Label: "ATORIA.Sheet.Player.Features.Other.Label",
          },
        };
        context.action_items = action_items;
        break;
      case "action_page":
        context.is_active_page = this.tabGroups["primary"] === "action";
        context.actable_items = {
          action: [],
          opportunity: [],
          spell: [],
          actable_modifier: {
            technique: {
              label:
                "ATORIA.Sheet.Player.Action_area.Actable_modifier.Technique",
              type: "technique",
              items: [],
            },
            incantatory: {
              label:
                "ATORIA.Sheet.Player.Action_area.Actable_modifier.Incantatory_addition",
              type: "incantatory-addition",
              items: [],
            },
          },
        };
        context.items = await Promise.all(
          this.actor.items.map(async (i) => {
            i.systemFields = i.system.schema.fields;
            return i;
          }),
        );
        context.items.sort((a, b) => (a.sort || 0) - (b.sort || 0));

        for (const i of context.items) {
          switch (i.type) {
            case "action":
              context.actable_items.action.push(i);
              break;
            case "opportunity":
              context.actable_items.opportunity.push(i);
              break;
            case "spell":
              context.actable_items.spell.push(i);
              break;
            case "technique":
              context.actable_items.actable_modifier.technique.items.push(i);
              break;
            case "incantatory-addition":
              context.actable_items.actable_modifier.incantatory.items.push(i);
              break;
          }
        }
        break;
      default:
        break;
    }
    return context;
  }

  _onSortItem(event, item) {
    const items = this.actor.items;
    const dropTarget = event.target.closest("[data-item-id]");
    if (!dropTarget) return;
    const target_item = items.get(dropTarget.dataset.itemId);

    if (!target_item) {
      if (["kit", "armor", "weapon"].includes(item.type)) {
        const { inventoryCat } = dropTarget.dataset;
        item.setFlag("atoria", "inventory-category", inventoryCat);
      } else if (["feature"].includes(item.type)) {
        const { featureCat } = dropTarget.dataset;
        item.setFlag("atoria", "feature-category", featureCat);
      }
      return;
    }

    if (item.id === target_item.id) return;

    if (["kit", "armor", "weapon"].includes(item.type)) {
      let target_inventoryCat =
        target_item.getFlag("atoria", "inventory-category") ?? "other";
      item.setFlag("atoria", "inventory-category", target_inventoryCat);
    } else if (["feature"].includes(item.type)) {
      let target_featureCat =
        target_item.getFlag("atoria", "feature-category") ??
        DEFAULT_FEATURE_PLACE;
      item.setFlag("atoria", "feature-category", target_featureCat);
    }

    // -----
    const siblings = [];
    for (let el of dropTarget.parentElement.children) {
      const siblingId = el.dataset.itemId;
      if (siblingId && siblingId !== item.id)
        siblings.push(items.get(el.dataset.itemId));
    }

    const sortUpdates = SortingHelpers.performIntegerSort(item, {
      target: target_item,
      siblings,
    });
    const updateData = sortUpdates.map((u) => {
      const update = u.update;
      update._id = u.target._id;
      return update;
    });

    return this.actor.updateEmbeddedDocuments("Item", updateData);
  }
}
