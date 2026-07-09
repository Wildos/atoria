import * as atoria_models from "../module.mjs";
import * as utils from "../../utils/module.mjs";

export default class AtoriaHero extends atoria_models.AtoriaActorBase {
  static type = "hero";

  static defineSchema() {
    const fields = foundry.data.fields;
    const requiredInteger = { required: true, nullable: false, integer: true };
    const schema = super.defineSchema();

    schema.sanity = new fields.SchemaField(
      {
        value: new fields.NumberField({
          ...requiredInteger,
          initial: utils.default_values.character.sanity,
          label: "ATORIA.Model.Sanity.Value",
        }),
        max: new fields.NumberField({
          ...requiredInteger,
          initial: utils.default_values.character.sanity,
          min: 0,
          label: "ATORIA.Model.Sanity.Max",
        }),
      },
      { label: "ATORIA.Ruleset.Sanity" },
    );

    schema.endurance = new fields.SchemaField(
      {
        value: new fields.NumberField({
          ...requiredInteger,
          initial: utils.default_values.character.endurance,
          label: "ATORIA.Model.Endurance.Value",
        }),
        max: new fields.NumberField({
          ...requiredInteger,
          initial: utils.default_values.character.endurance,
          min: 0,
          label: "ATORIA.Model.Endurance.Max",
        }),
      },
      { label: "ATORIA.Ruleset.Endurance" },
    );

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

    schema.favorite_god = new fields.StringField({
      required: true,
      nullable: false,
      blank: true,
      label: "ATORIA.Model.Favorite_god",
    });

    schema.unit_type = new fields.StringField({
      required: true,
      nullable: false,
      blank: true,
      label: "ATORIA.Model.Unit_type",
    });

    schema.language = new fields.StringField({
      required: true,
      nullable: false,
      blank: true,
      label: "ATORIA.Model.Language",
    });

    schema.ration = new fields.NumberField({
      ...requiredInteger,
      initial: 0,
      min: 0,
      label: "ATORIA.Model.Ration",
    });

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
}
