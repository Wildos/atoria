import { AtoriaActorSheetV2 } from "../module.mjs";
import * as utils from "../../utils/module.mjs";
import * as helpers from "../../utils/helpers.mjs";

const DEFAULT_FEATURE_PLACE = "other";

export default class AtoriaActorPlayerCharacterSheetV2 extends AtoriaActorSheetV2 {
  DEFAULT_PAGE = "character";

  constructor(options = {}) {
    super(options);
    this.tabGroups["primary"] = this.DEFAULT_PAGE;
  }

  static DEFAULT_OPTIONS = {
    classes: ["player-character"],
    window: {
      controls: [
        ...AtoriaActorSheetV2.DEFAULT_OPTIONS.window.controls,
        {
          action: "onFixKnowledges",
          icon: "fa-solid fa-wrench",
          label: "ATORIA.DEBUG.FixKnowledges",
          ownership: "OWNER",
        },
        {
          action: "onFixSkills",
          icon: "fa-solid fa-wrench",
          label: "ATORIA.DEBUG.FixSkills",
          ownership: "OWNER",
        },
      ],
    },
    actions: {
      applyTimePhase: {
        handler: this._applyTimePhase,
        buttons: [0],
      },
      editHealingInactive: this._editHealingInactive,
      toggle_keyword_direct: this._toggle_keyword_direct,
      createSkill: this._createSkill,
      deleteSkill: this._deleteSkill,
      createItem: this._createItem,
      onFixKnowledges: this._onFixKnowledges,
      onFixSkills: this._onFixSkills,
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

  /** @override */
  _getHeaderControls() {
    const controls = this.options.window.controls;

    // Portrait image
    const img = this.actor.img;
    controls.find((c) => c.action === "showPortraitArtwork").visible =
      img !== CONST.DEFAULT_TOKEN;

    // Token image
    const pt = this.actor.prototypeToken;
    const tex = pt.texture.src;
    const show_token_art = !(
      pt.randomImg || [null, undefined, CONST.DEFAULT_TOKEN].includes(tex)
    );
    controls.find((c) => c.action === "showTokenArtwork").visible =
      show_token_art;

    // PopOutV2
    controls.find(
      (c) => c.action === "onPopoutV2" && c.label === "POPOUT.PopOut",
    ).visible = helpers.hasPopoutV2Module();

    // DEBUG
    controls.find(
      (c) =>
        c.action === "onFixKnowledges" &&
        c.label === "ATORIA.DEBUG.FixKnowledges",
    ).visible = game.user?.isGM;
    controls.find(
      (c) => c.action === "onFixSkills" && c.label === "ATORIA.DEBUG.FixSkills",
    ).visible = game.user?.isGM;

    return controls;
  }

  static async _onFixKnowledges(event, _target) {
    event.stopPropagation();
    await this.actor.debug_fix_knowledges();
  }

  static async _onFixSkills(event, _target) {
    event.stopPropagation();
    await this.actor.debug_fix_skills();
  }

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

  static async _toggle_keyword_direct(_event, target) {
    const { type } = target.dataset;
    let new_value = this.actor.system.keywords_used.direct;
    if (new_value.includes(type)) {
      new_value = new_value.filter(function (item) {
        return item !== type;
      });
    } else {
      new_value.push(type);
    }
    await this.actor.update({
      "system.keywords_used.direct": new_value,
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

    context.associated_skills = this.actor?.getAssociatedSkillList() ?? {};
    // utils.default_values.associated_skills;

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
            i.keywords_recap = i.getKeywordRecap();
            return i;
          }),
        );
        context.items.sort((a, b) => (a.sort || 0) - (b.sort || 0));

        for (const i of context.items) {
          switch (i.type) {
            case "weapon":
              // if (i.system.is_worn)
              equipped_items.weapons.push(i);
              // else
              //   inventory_items[
              //     i.getFlag("atoria", "inventory-category") ?? "other"
              //   ].items.push(i);
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
        context.skill_n_knowledge_sorting_list = {
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
            "trickery",
          ],
          "system.skills.social.analyse": ["insight", "investigation"],
          "system.skills.social.charisma": [
            "intimidation",
            "presence",
            "seduction",
          ],
          "system.skills.social.eloquence": [
            "persuasion",
            "calming",
            "negotiation",
          ],
          "system.skills.social.spirit": ["will", "guarding"],
          "system.skills.social.trickery": ["acting", "lying", "provocation"],

          "system.skills.physical": [
            "agility",
            "athletic",
            "slyness",
            "environment",
            "sturdiness",
          ],
          "system.skills.physical.agility": ["balance", "dexterity"],
          "system.skills.physical.athletic": ["hiking", "running", "jump"],
          "system.skills.physical.slyness": [
            "silence",
            "stealth",
            "concealment",
          ],
          "system.skills.physical.environment": [
            "climbing",
            "nage",
            "fortitude",
          ],
          "system.skills.physical.sturdiness": ["force", "tenacity"],
          "system.knowledges": [
            "craftmanship",
            "erudition",
            "utilitarian",
            "magic",
          ],

          "system.knowledges.craftmanship": [
            "alchemy",
            "artistic",
            "jewellery",
            "sewing",
            "cuisine",
            "cabinet-making",
            "forge",
            "engineering",
            "leatherworking",
          ],

          "system.knowledges.craftmanship.alchemy": [
            "mixture",
            "transformation",
          ],
          "system.knowledges.craftmanship.artistic": [
            "ceramic",
            "sculpture",
            "graphic",
          ],
          "system.knowledges.craftmanship.jewellery": [
            "finery",
            "seaming",
            "glassware",
          ],
          "system.knowledges.craftmanship.sewing": ["fashion", "domestic"],
          "system.knowledges.craftmanship.cuisine": ["meal", "baking"],
          "system.knowledges.craftmanship.cabinet-making": [
            "gear",
            "woodworking",
          ],
          "system.knowledges.craftmanship.forge": [
            "weaponry",
            "armoury",
            "goldsmithery",
          ],
          "system.knowledges.craftmanship.engineering": ["mechanism", "siege"],
          "system.knowledges.craftmanship.leatherworking": [
            "tanning",
            "manufacture",
          ],

          "system.knowledges.erudition": [
            "civilisation",
            "language",
            "medecine",
            "monstrology",
            "runic",
            "science",
            "strategy",
            "symbolism",
            "zoology",
          ],

          "system.knowledges.utilitarian.medecine": ["treatment", "mortuary"],
          "system.knowledges.erudition.runic": [
            "enchantment",
            "inscription",
            "tattoo",
          ],
          "system.knowledges.erudition.science": [
            "astronomy",
            "geology",
            "mathematic",
          ],
          "system.knowledges.erudition.strategy": ["battle", "expedition"],
          "system.knowledges.erudition.symbolism": [
            "heraldry",
            "cryptography",
            "cartography",
          ],

          "system.knowledges.utilitarian": [
            "song",
            "hunting",
            "construction",
            "dance",
            "dressage",
            "theft",
            "nature",
            "fishing",
            "transport",
          ],
          "system.knowledges.utilitarian.song": ["entertaining", "martial"],
          "system.knowledges.utilitarian.hunting": ["tracking", "cutting"],
          "system.knowledges.utilitarian.construction": [
            "masonry",
            "carpentry",
          ],
          "system.knowledges.utilitarian.dance": ["aesthetics", "spinning"],
          "system.knowledges.utilitarian.dressage": ["taming", "war"],
          "system.knowledges.utilitarian.theft": [
            "pickpocketing",
            "lock-picking",
          ],
          "system.knowledges.utilitarian.nature": [
            "farming",
            "herbalist",
            "fungus",
          ],
          "system.knowledges.utilitarian.fishing": ["bank", "high-sea"],
          "system.knowledges.utilitarian.transport": [
            "mounting",
            "land",
            "sea",
          ],

          "system.knowledges.magic": [
            "air",
            "mental",
            "druidic",
            "water",
            "fire",
            "occult",
            "holy",
            "blood",
            "earth",
          ],

          "system.knowledges.magic.air": ["dazzling", "breeze", "lightning"],
          "system.knowledges.magic.mental": [
            "kinetic",
            "illusion",
            "power",
            "enchanted",
          ],
          "system.knowledges.magic.druidic": [
            "astral",
            "solicitude",
            "changeforme",
            "mutation",
          ],
          "system.knowledges.magic.water": ["ablution", "source", "ice"],
          "system.knowledges.magic.fire": ["torch", "ignition", "destruction"],
          "system.knowledges.magic.occult": [
            "toxic",
            "curse",
            "ethereal",
            "necromancy",
          ],
          "system.knowledges.magic.holy": [
            "blessing",
            "piety",
            "glory",
            "purification",
          ],
          "system.knowledges.magic.blood": ["sacrifice", "puncture", "drain"],
          "system.knowledges.magic.earth": ["bastion", "telluric", "metallic"],
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
            i.keywords_recap = i.getKeywordRecap();
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

        break;
      case "action_page": {
        context.is_active_page = this.tabGroups["primary"] === "action";
        let spell_container = {};
        let spell_school_order = [];
        for (const school_path in utils.ruleset.actable
          .associated_magic_schools) {
          spell_container[school_path] = [];
          spell_school_order.push(school_path);
        }

        context.actable_items = {
          action: [],
          opportunity: [],
          spell: spell_container,
          spell_school_order: spell_school_order,
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
              context.actable_items.spell[
                i.system.associated_magic_school
              ].push(i);
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
      }
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
