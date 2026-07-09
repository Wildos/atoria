import * as atoria_models from "../module.mjs";
import * as utils from "../../utils/module.mjs";
import { helpers } from "../module.mjs";

export default class AtoriaActorBase extends atoria_models.AtoriaDataModel {
  static defineSchema() {
    const fields = foundry.data.fields;
    const requiredInteger = { required: true, nullable: false, integer: true };
    const schema = {};

    schema.health = new fields.SchemaField(
      {
        value: new fields.NumberField({
          ...requiredInteger,
          initial: utils.default_values.character.health,
          label: "ATORIA.Model.Health.Value",
        }),
        max: new fields.NumberField({
          ...requiredInteger,
          initial: utils.default_values.character.health,
          min: 0,
          label: "ATORIA.Model.Health.Max",
        }),
      },
      { label: "ATORIA.Ruleset.Health" },
    );

    schema.healing_inactive = new fields.SchemaField(
      {
        amount: new fields.NumberField({
          ...requiredInteger,
          initial: 0,
          min: 0,
          label: "ATORIA.Ruleset.Healing_inactive.Amount",
        }),
        incurable: new fields.NumberField({
          ...requiredInteger,
          initial: 0,
          min: 0,
          label: "ATORIA.Ruleset.Healing_inactive.Incurable",
        }),
        medical: new fields.BooleanField({
          required: true,
          nullable: false,
          initial: false,
          label: "ATORIA.Ruleset.Healing_inactive.Medical",
        }),
        medical_2: new fields.BooleanField({
          required: true,
          nullable: false,
          initial: false,
          label: "ATORIA.Ruleset.Healing_inactive.Medical",
        }),
        resurrection: new fields.BooleanField({
          required: true,
          nullable: false,
          initial: false,
          label: "ATORIA.Ruleset.Healing_inactive.Resurrection",
        }),
      },
      { label: "ATORIA.Model.Healing_inactive" },
    );

    schema.stamina = new fields.SchemaField(
      {
        value: new fields.NumberField({
          ...requiredInteger,
          initial: utils.default_values.character.stamina,
          label: "ATORIA.Model.Stamina.Value",
        }),
        max: new fields.NumberField({
          ...requiredInteger,
          initial: utils.default_values.character.stamina,
          min: 0,
          label: "ATORIA.Model.Stamina.Max",
        }),
      },
      { label: "ATORIA.Ruleset.Stamina" },
    );
    schema.mana = new fields.SchemaField(
      {
        value: new fields.NumberField({
          ...requiredInteger,
          initial: utils.default_values.character.mana,
          label: "ATORIA.Model.Mana.Value",
        }),
        max: new fields.NumberField({
          ...requiredInteger,
          initial: utils.default_values.character.mana,
          min: 0,
          label: "ATORIA.Model.Mana.Max",
        }),
      },
      { label: "ATORIA.Ruleset.Mana" },
    );

    schema.absorption = new fields.NumberField({
      ...requiredInteger,
      initial: utils.default_values.character.absorption,
      min: 0,
      label: "ATORIA.Ruleset.Absorption",
    });

    schema.initiative = new fields.StringField({
      required: true,
      nullable: false,
      blank: false,
      initial: utils.default_values.character.initiative,
      label: "ATORIA.Ruleset.Initiative",
    });

    schema.encumbrance = new fields.SchemaField(
      {
        max: new fields.NumberField({
          ...requiredInteger,
          initial: utils.default_values.character.encumbrance,
          min: 0,
          label: "ATORIA.Model.Encumbrance.Max",
        }),
      },
      { label: "ATORIA.Ruleset.Encumbrance" },
    );

    schema.coins = new fields.SchemaField(
      {
        copper: new fields.NumberField({
          ...requiredInteger,
          initial: 0,
          min: 0,
          label: "ATORIA.Ruleset.Coins.Copper",
        }),
        silver: new fields.NumberField({
          ...requiredInteger,
          initial: 0,
          min: 0,
          label: "ATORIA.Ruleset.Coins.Silver",
        }),
        electrum: new fields.NumberField({
          ...requiredInteger,
          initial: 0,
          min: 0,
          label: "ATORIA.Ruleset.Coins.Electrum",
        }),
        gold: new fields.NumberField({
          ...requiredInteger,
          initial: 0,
          min: 0,
          label: "ATORIA.Ruleset.Coins.Gold",
        }),
      },
      { label: "ATORIA.Model.Coins" },
    );

    schema.keywords = new fields.SchemaField(this.keywords_fields(), {
      required: true,
      nullable: false,
      persisted: true,
      label: "ATORIA.Model.Keywords.Label",
    });

    schema.active_sharable_keywords_level = new fields.ObjectField(
      {},
      {
        nullable: false,
        persisted: false,
      },
    );

    schema.skills = new fields.SchemaField(this._skillsFields(), {
      required: true,
      nullable: false,
      label: "ATORIA.Ruleset.Skills.Label",
    });
    schema.knowledges = new fields.SchemaField(this._knowledgesFields(), {
      required: true,
      nullable: false,
      label: "ATORIA.Ruleset.Knowledges.Label",
    });

    return schema;
  }

  static direct_keyword_field(levels, is_shown_on_attack, label) {
    const fields = foundry.data.fields;

    return new fields.SchemaField(
      {
        is_shown_on_attack: new fields.BooleanField({
          required: true,
          initial: is_shown_on_attack,
          persisted: false,
          label: "ATORIA.Model.Keywords.IsShownOnAttack",
        }),
        limit_remaining: new fields.ObjectField({
          required: true,
          nullable: false,
          initial: {},
          label: "ATORIA.Model.Keywords.LimitRemaining",
        }),
        effect_level_1: new fields.SchemaField(
          {
            effect: new fields.StringField({
              required: true,
              label: "ATORIA.Model.Keywords.Effect",
            }),
            skill_alterations:
              atoria_models.helpers.define_skills_alterations_list(),
            limit_amount: new fields.NumberField({
              required: true,
              nullable: false,
              integer: true,
              initial: 1,
              min: 0,
              persisted: true,
              label: "ATORIA.Model.Keywords.LimitAmount",
            }),
          },
          {
            required: true,
            nullable: false,
            initial: levels[0],
            label: "ATORIA.Model.Keywords.EffectLevel1",
          },
        ),
        effect_level_2: new fields.SchemaField(
          {
            effect: new fields.StringField({
              required: true,
              label: "ATORIA.Model.Keywords.Effect",
            }),
            skill_alterations:
              atoria_models.helpers.define_skills_alterations_list(),
            limit_amount: new fields.NumberField({
              required: true,
              nullable: false,
              integer: true,
              initial: 1,
              min: 0,
              persisted: true,
              label: "ATORIA.Model.Keywords.LimitAmount",
            }),
          },
          {
            required: false,
            nullable: true,
            initial: levels.at(1) ?? null,
            label: "ATORIA.Model.Keywords.EffectLevel2",
          },
        ),
        effect_level_3: new fields.SchemaField(
          {
            effect: new fields.StringField({
              required: true,
              label: "ATORIA.Model.Keywords.Effect",
            }),
            skill_alterations:
              atoria_models.helpers.define_skills_alterations_list(),
            limit_amount: new fields.NumberField({
              required: true,
              nullable: false,
              integer: true,
              initial: 1,
              min: 0,
              persisted: true,
              label: "ATORIA.Model.Keywords.LimitAmount",
            }),
          },
          {
            required: false,
            nullable: true,
            initial: levels.at(2) ?? null,
            label: "ATORIA.Model.Keywords.EffectLevel3",
          },
        ),
        effect_level_4: new fields.SchemaField(
          {
            effect: new fields.StringField({
              required: true,
              label: "ATORIA.Model.Keywords.Effect",
            }),
            skill_alterations:
              atoria_models.helpers.define_skills_alterations_list(),
            limit_amount: new fields.NumberField({
              required: true,
              nullable: false,
              integer: true,
              initial: 1,
              min: 0,
              persisted: true,
              label: "ATORIA.Model.Keywords.LimitAmount",
            }),
          },
          {
            required: false,
            nullable: true,
            initial: levels.at(3) ?? null,
            label: "ATORIA.Model.Keywords.EffectLevel4",
          },
        ),
        effect_level_5: new fields.SchemaField(
          {
            effect: new fields.StringField({
              required: true,
              label: "ATORIA.Model.Keywords.Effect",
            }),
            skill_alterations:
              atoria_models.helpers.define_skills_alterations_list(),
            limit_amount: new fields.NumberField({
              required: true,
              nullable: false,
              integer: true,
              initial: 1,
              min: 0,
              persisted: true,
              label: "ATORIA.Model.Keywords.LimitAmount",
            }),
          },
          {
            required: false,
            nullable: true,
            initial: levels.at(4) ?? null,
            label: "ATORIA.Model.Keywords.EffectLevel5",
          },
        ),
      },
      {
        required: true,
        nullable: false,
        persisted: true,
        label: label,
      },
    );
  }

  static keyword_field(levels, is_shown_on_attack, label) {
    const fields = foundry.data.fields;

    return new fields.SchemaField(
      {
        is_shown_on_attack: new fields.BooleanField({
          required: true,
          initial: is_shown_on_attack,
          persisted: false,
          label: "ATORIA.Model.Keywords.IsShownOnAttack",
        }),
        limit_remaining: new fields.NumberField({
          required: true,
          nullable: false,
          integer: true,
          initial: 1,
          min: 0,
          persisted: true,
          label: "ATORIA.Model.Keywords.LimitRemaining",
        }),

        effect_level_1: new fields.SchemaField(
          {
            effect: new fields.StringField({
              required: true,
              label: "ATORIA.Model.Keywords.Effect",
            }),
            skill_alterations:
              atoria_models.helpers.define_skills_alterations_list(),
            limit_amount: new fields.NumberField({
              required: true,
              nullable: false,
              integer: true,
              initial: 1,
              min: 0,
              persisted: true,
              label: "ATORIA.Model.Keywords.LimitAmount",
            }),
          },
          {
            required: true,
            nullable: false,
            initial: levels[0],
            label: "ATORIA.Model.Keywords.EffectLevel1",
          },
        ),
        effect_level_2: new fields.SchemaField(
          {
            effect: new fields.StringField({
              required: true,
              label: "ATORIA.Model.Keywords.Effect",
            }),
            skill_alterations:
              atoria_models.helpers.define_skills_alterations_list(),
            limit_amount: new fields.NumberField({
              required: true,
              nullable: false,
              integer: true,
              initial: 1,
              min: 0,
              persisted: true,
              label: "ATORIA.Model.Keywords.LimitAmount",
            }),
          },
          {
            required: false,
            nullable: true,
            initial: levels.at(1) ?? null,
            label: "ATORIA.Model.Keywords.EffectLevel2",
          },
        ),
        effect_level_3: new fields.SchemaField(
          {
            effect: new fields.StringField({
              required: true,
              label: "ATORIA.Model.Keywords.Effect",
            }),
            skill_alterations:
              atoria_models.helpers.define_skills_alterations_list(),
            limit_amount: new fields.NumberField({
              required: true,
              nullable: false,
              integer: true,
              initial: 1,
              min: 0,
              persisted: true,
              label: "ATORIA.Model.Keywords.LimitAmount",
            }),
          },
          {
            required: false,
            nullable: true,
            initial: levels.at(2) ?? null,
            label: "ATORIA.Model.Keywords.EffectLevel3",
          },
        ),
        effect_level_4: new fields.SchemaField(
          {
            effect: new fields.StringField({
              required: true,
              label: "ATORIA.Model.Keywords.Effect",
            }),
            skill_alterations:
              atoria_models.helpers.define_skills_alterations_list(),
            limit_amount: new fields.NumberField({
              required: true,
              nullable: false,
              integer: true,
              initial: 1,
              min: 0,
              persisted: true,
              label: "ATORIA.Model.Keywords.LimitAmount",
            }),
          },
          {
            required: false,
            nullable: true,
            initial: levels.at(3) ?? null,
            label: "ATORIA.Model.Keywords.EffectLevel4",
          },
        ),
        effect_level_5: new fields.SchemaField(
          {
            effect: new fields.StringField({
              required: true,
              label: "ATORIA.Model.Keywords.Effect",
            }),
            skill_alterations:
              atoria_models.helpers.define_skills_alterations_list(),
            limit_amount: new fields.NumberField({
              required: true,
              nullable: false,
              integer: true,
              initial: 1,
              min: 0,
              persisted: true,
              label: "ATORIA.Model.Keywords.LimitAmount",
            }),
          },
          {
            required: false,
            nullable: true,
            initial: levels.at(4) ?? null,
            label: "ATORIA.Model.Keywords.EffectLevel5",
          },
        ),
      },
      {
        required: true,
        nullable: false,
        persisted: true,
        label: label,
      },
    );
  }

  static keywords_fields() {
    let keywords = utils.ruleset.keywords.getKeywordsList();

    const fields = {};
    for (const keyword_data of keywords) {
      if (keyword_data.id == "direct") {
        fields[keyword_data.id] = this.direct_keyword_field(
          keyword_data.initial_levels,
          keyword_data.is_shown_on_attack,
          keyword_data.label,
        );
      } else {
        fields[keyword_data.id] = this.keyword_field(
          keyword_data.initial_levels,
          keyword_data.is_shown_on_attack,
          keyword_data.label,
        );
      }
    }
    return fields;
  }

  static _skillsFields() {
    const fields = foundry.data.fields;
    let result_fields = {};
    let skills_tree = utils.ruleset.character.getSkillsTree(this.type);

    if (Array.isArray(skills_tree)) {
      for (const key of skills_tree) {
        result_fields[key] = helpers.skillField(
          utils.buildLocalizeString("Ruleset", "skills", key, "Label"),
          utils.ruleset.character.getSkillInitialSuccess(key),
        );
      }
    } else {
      for (const parent_key in skills_tree) {
        let top_data = skills_tree[parent_key];
        let parent_fields = {};
        if (Array.isArray(top_data)) {
          for (const key of top_data) {
            parent_fields[key] = helpers.skillField(
              utils.buildLocalizeString(
                "Ruleset",
                "skills",
                parent_key,
                key,
                "Label",
              ),
              utils.ruleset.character.getSkillInitialSuccess(key),
            );
          }
        } else {
          for (const mid_key in top_data) {
            let mid_data = skills_tree[parent_key][mid_key];
            let mid_fields = {};
            if (Array.isArray(mid_data)) {
              for (const key of mid_data) {
                mid_fields[key] = helpers.skillField(
                  utils.buildLocalizeString(
                    "Ruleset",
                    "skills",
                    parent_key,
                    mid_key,
                    key,
                    "Label",
                  ),
                  utils.ruleset.character.getSkillInitialSuccess(key),
                );
              }
            } else {
              console.error("SkillsTree is not valid");
            }

            parent_fields[mid_key] = new fields.SchemaField(mid_fields, {
              required: true,
              nullable: false,
              label: utils.buildLocalizeString(
                "Ruleset",
                "skills",
                parent_key,
                mid_key,
                "Label",
              ),
            });
          }
        }

        result_fields[parent_key] = new fields.SchemaField(parent_fields, {
          required: true,
          nullable: false,
          label: utils.buildLocalizeString(
            "Ruleset",
            "skills",
            parent_key,
            "Label",
          ),
        });
      }
    }
    return result_fields;
  }

  static _knowledgesFields() {
    const fields = foundry.data.fields;
    let result_fields = {};
    let knowledges_tree = utils.ruleset.character.getKnowledgesTree(this.type);

    if (Array.isArray(knowledges_tree)) {
      for (const key of knowledges_tree) {
        let key_parts = key.split(".");
        let real_key = key_parts[1];
        let cat_key = key_parts[0];
        result_fields[real_key] = helpers.skillField(
          utils.ruleset.character.getKnowledgeLabel([
            "knowledges",
            cat_key,
            real_key,
          ]),
          utils.ruleset.character.getKnowledgeInitialSuccess(real_key),
        );
      }
    } else {
      for (const parent_key in knowledges_tree) {
        let top_data = knowledges_tree[parent_key];
        let parent_fields = {};
        if (Array.isArray(top_data)) {
          for (const key of top_data) {
            parent_fields[key] = helpers.skillField(
              utils.ruleset.character.getKnowledgeLabel([
                "knowledges",
                parent_key,
                key,
              ]),
              utils.ruleset.character.getKnowledgeInitialSuccess(key),
            );
          }
        } else {
          for (const mid_key in top_data) {
            let mid_data = knowledges_tree[parent_key][mid_key];
            let mid_fields = {};
            if (Array.isArray(mid_data)) {
              for (const key of mid_data) {
                mid_fields[key] = helpers.skillField(
                  utils.ruleset.character.getKnowledgeLabel([
                    "knowledges",
                    parent_key,
                    mid_key,
                    key,
                  ]),
                  utils.ruleset.character.getKnowledgeInitialSuccess(key),
                );
              }
            } else {
              console.error("KnowledgesTree is not valid");
            }

            parent_fields[mid_key] = new fields.SchemaField(mid_fields, {
              required: true,
              nullable: false,
              label: utils.ruleset.character.getKnowledgeLabel([
                "knowledges",
                parent_key,
                mid_key,
              ]),
            });
          }
        }

        result_fields[parent_key] = new fields.SchemaField(parent_fields, {
          required: true,
          nullable: false,
          label: utils.ruleset.character.getKnowledgeLabel([
            "knowledges",
            parent_key,
          ]),
        });
      }
    }
    return result_fields;
  }

  static _fullSkillSchema(skill_type_data, skill_holder_label) {
    const skill_type_schema = {};
    Object.keys(skill_type_data).map(function (skill_group_key, _) {
      const skill_group_list = skill_type_data[skill_group_key];
      const skill_list = {};
      const cat_list_initial = {};

      Object.keys(skill_group_list).forEach(function (skill_category_key, _) {
        const skill_category_list = skill_group_list[skill_category_key];
        const skill_list_initial = {};

        skill_category_list.forEach((skill_key) => {
          skill_list_initial[skill_key] = helpers.skillInitialValue(
            utils.buildLocalizeString(
              "Ruleset",
              skill_holder_label,
              skill_group_key,
              skill_category_key,
              skill_key,
              "Label",
            ),
            utils.default_values.character.skill.get_success(skill_group_key),
          );
        });
        skill_list[skill_category_key] =
          new atoria_models.fields.TypedDictionaryField(
            helpers.skillField(
              "ATORIA.Model.New_name",
              utils.default_values.character.skill.success,
              skill_holder_label === "skills",
            ),
            {
              required: true,
              nullable: false,
              initial: skill_list_initial,
              label: utils.buildLocalizeString(
                "Ruleset",
                skill_holder_label,
                skill_group_key,
                skill_category_key,
                "Label",
              ),
            },
          );
        cat_list_initial[skill_category_key] = skill_list_initial;
      });
      skill_type_schema[skill_group_key] = new foundry.data.fields.SchemaField(
        skill_list,
        {
          required: true,
          nullable: false,
          initial: cat_list_initial,
          label: utils.buildLocalizeString(
            "Ruleset",
            skill_holder_label,
            skill_group_key,
            "Label",
          ),
        },
      );
    });
    return skill_type_schema;
  }
  static _catLimitedSkillSchema(skill_type_data, skill_holder_label) {
    const skill_type_schema = {};
    Object.keys(skill_type_data).map(function (skill_group_key, _) {
      const skill_group_list = skill_type_data[skill_group_key];
      const skill_list = {};

      Object.keys(skill_group_list).forEach(function (skill_category_key, _) {
        skill_list[skill_category_key] = helpers.skillField(
          utils.buildLocalizeString(
            "Ruleset",
            skill_holder_label,
            skill_group_key,
            skill_category_key,
            "Label",
          ),
          utils.default_values.character.skill.get_success(skill_group_key),
          false,
        );
      });
      skill_type_schema[skill_group_key] = new foundry.data.fields.SchemaField(
        skill_list,
        {
          required: true,
          nullable: false,
          label: utils.buildLocalizeString(
            "Ruleset",
            skill_holder_label,
            skill_group_key,
            "Label",
          ),
        },
      );
    });
    return skill_type_schema;
  }

  static migrateData(source, options) {
    const current_version = game.settings.get(
      "atoria",
      "worldLastMigrationVersion",
    );
    const version = game.system.version;
    if (current_version === version) {
      return super.migrateData(source, options);
    }
    if (foundry.utils.isNewerVersion("0.3.29", current_version)) {
      if (this.type === "hero") {
        source.skills.perceptions = source.perceptions;
        source.skills.weapon = source.skills.combative;
      } else if (this.type === "non-player-character") {
        source.skills.perceptions = source.perceptions;
        source.skills.physical.reflex = source.skills.combative.reflex;

        let old_combative_weapon = source.skills.combative.weapon;
        old_combative_weapon.success = old_combative_weapon.success - 10;

        source.skills.weapon = {
          contact: old_combative_weapon,
          apart: old_combative_weapon,
          instrument: old_combative_weapon,
        };
      } else if (this.type === "player-character") {
        source.skills.perceptions = source.perceptions;
        source.skills.physical.reflex = source.skills.combative.reflex;
      }
    }
    return super.migrateData(source, options);
  }
}
