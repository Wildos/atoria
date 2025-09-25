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

    schema.perceptions = new atoria_models.fields.TypedDictionaryField(
      helpers.skillField(
        "ATORIA.Model.New_name",
        utils.default_values.character.skill.success,
        true,
      ),
      {
        required: true,
        nullable: false,
        initial: this._perceptions_initials(),
        label: "ATORIA.Ruleset.Perceptions.Label",
      },
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

    schema.keywords_used = new fields.SchemaField({
      reach: new fields.BooleanField({
        required: true,
        nullable: false,
        initial: false,
        label: "ATORIA.Ruleset.Keywords.Reach",
      }),

      brute: new fields.BooleanField({
        required: true,
        nullable: false,
        initial: false,
        label: "ATORIA.Ruleset.Keywords.Brute",
      }),

      guard: new fields.BooleanField({
        required: true,
        nullable: false,
        initial: false,
        label: "ATORIA.Ruleset.Keywords.Guard",
      }),

      penetrating: new fields.BooleanField({
        required: true,
        nullable: false,
        initial: false,
        label: "ATORIA.Ruleset.Keywords.Penetrating",
      }),

      protect: new fields.BooleanField({
        required: true,
        nullable: false,
        initial: false,
        label: "ATORIA.Ruleset.Keywords.Protect",
      }),

      gruff: new fields.BooleanField({
        required: true,
        nullable: false,
        initial: false,
        label: "ATORIA.Ruleset.Keywords.Gruff",
      }),

      tough: new fields.BooleanField({
        required: true,
        nullable: false,
        initial: false,
        label: "ATORIA.Ruleset.Keywords.Tough",
      }),

      grip: new fields.BooleanField({
        required: true,
        nullable: false,
        initial: false,
        label: "ATORIA.Ruleset.Keywords.Grip",
      }),

      resistant: new fields.BooleanField({
        required: true,
        nullable: false,
        initial: false,
        label: "ATORIA.Ruleset.Keywords.Resistant",
      }),

      sturdy: new fields.BooleanField({
        required: true,
        nullable: false,
        initial: false,
        label: "ATORIA.Ruleset.Keywords.Sturdy",
      }),

      stable: new fields.BooleanField({
        required: true,
        nullable: false,
        initial: false,
        label: "ATORIA.Ruleset.Keywords.Stable",
      }),

      direct: new fields.ArrayField(
        new fields.StringField({
          required: true,
          nullable: false,
          initial: undefined,
        }),
        {
          required: true,
          nullable: false,
          initial: [],
          label: "ATORIA.Ruleset.Keywords.Direct",
        },
      ),
    });
    return schema;
  }

  static _perceptions_initials() {
    return {
      sight: helpers.skillInitialValue(
        utils.buildLocalizeString("Ruleset", "Perceptions", "sight"),
        utils.default_values.character.perceptions.sight,
      ),
      earing: helpers.skillInitialValue(
        utils.buildLocalizeString("Ruleset", "Perceptions", "earing"),
        utils.default_values.character.perceptions.earing,
      ),
      smell: helpers.skillInitialValue(
        utils.buildLocalizeString("Ruleset", "Perceptions", "smell"),
        utils.default_values.character.perceptions.smell,
      ),
      taste: helpers.skillInitialValue(
        utils.buildLocalizeString("Ruleset", "Perceptions", "taste"),
        utils.default_values.character.perceptions.taste,
      ),
      instinct: helpers.skillInitialValue(
        utils.buildLocalizeString("Ruleset", "Perceptions", "instinct"),
        utils.default_values.character.perceptions.instinct,
      ),
      magice: helpers.skillInitialValue(
        utils.buildLocalizeString("Ruleset", "Perceptions", "magice"),
        utils.default_values.character.perceptions.magice,
      ),
    };
  }

  static _fullSkillSchema(skill_type_data, skill_holder_label) {
    const skill_type_schema = {};
    Object.keys(skill_type_data).map(function (skill_group_key, _) {
      const skill_group_list = skill_type_data[skill_group_key];
      const skill_list = {};

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
              false,
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
}
