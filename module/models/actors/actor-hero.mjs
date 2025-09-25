import * as atoria_models from "../module.mjs";
import * as utils from "../../utils/module.mjs";

export default class AtoriaHero extends atoria_models.AtoriaDataModel {
  static defineSchema() {
    const fields = foundry.data.fields;
    const requiredInteger = { required: true, nullable: false, integer: true };
    const schema = {};

    schema.health = new fields.NumberField({
      ...requiredInteger,
      initial: utils.default_values.character.health,
      label: "ATORIA.Ruleset.Health",
    });

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

    schema.perceptions = atoria_models.helpers.skillField(
      "ATORIA.Ruleset.Perception",
      10,
    );

    schema.skills = new fields.SchemaField(
      {
        physical: atoria_models.helpers.skillField(
          "ATORIA.Ruleset.Skills.Physical.Label",
          10,
        ),
        social: atoria_models.helpers.skillField(
          "ATORIA.Ruleset.Skills.Social.Label",
          10,
        ),
        combative: atoria_models.helpers.skillField(
          "ATORIA.Ruleset.Skills.Combative.Label",
          10,
        ),
      },
      { label: "ATORIA.Model.Skills" },
    );

    schema.knowledges = new fields.SchemaField(
      {
        alchemy: atoria_models.helpers.skillField(
          "ATORIA.Ruleset.Knowledges.Craftmanship.Alchemy.Label",
          10,
        ),
        artistic: atoria_models.helpers.skillField(
          "ATORIA.Ruleset.Knowledges.Craftmanship.Artistic.Label",
          10,
        ),
        jewellery: atoria_models.helpers.skillField(
          "ATORIA.Ruleset.Knowledges.Craftmanship.Jewellery.Label",
          10,
        ),
        sewing: atoria_models.helpers.skillField(
          "ATORIA.Ruleset.Knowledges.Craftmanship.Sewing.Label",
          10,
        ),
        cuisine: atoria_models.helpers.skillField(
          "ATORIA.Ruleset.Knowledges.Craftmanship.Cuisine.Label",
          10,
        ),
        "cabinet-making": atoria_models.helpers.skillField(
          "ATORIA.Ruleset.Knowledges.Craftmanship.Cabinet-making.Label",
          10,
        ),
        forge: atoria_models.helpers.skillField(
          "ATORIA.Ruleset.Knowledges.Craftmanship.Forge.Label",
          10,
        ),
        engineering: atoria_models.helpers.skillField(
          "ATORIA.Ruleset.Knowledges.Craftmanship.Engineering.Label",
          10,
        ),
        leatherworking: atoria_models.helpers.skillField(
          "ATORIA.Ruleset.Knowledges.Craftmanship.Leatherworking.Label",
          10,
        ),
        song: atoria_models.helpers.skillField(
          "ATORIA.Ruleset.Knowledges.Utilitarian.Song.Label",
          10,
        ),
        dance: atoria_models.helpers.skillField(
          "ATORIA.Ruleset.Knowledges.Utilitarian.Dance.Label",
          10,
        ),
        music: atoria_models.helpers.skillField(
          "ATORIA.Ruleset.Knowledges.Erudition.Music.Label",
          10,
        ),
        civilisation: atoria_models.helpers.skillField(
          "ATORIA.Ruleset.Knowledges.Erudition.Civilisation.Label",
          10,
        ),
        language: atoria_models.helpers.skillField(
          "ATORIA.Ruleset.Knowledges.Erudition.Language.Label",
          10,
        ),
        monstrology: atoria_models.helpers.skillField(
          "ATORIA.Ruleset.Knowledges.Erudition.Monstrology.Label",
          10,
        ),
        runic: atoria_models.helpers.skillField(
          "ATORIA.Ruleset.Knowledges.Erudition.Runic.Label",
          10,
        ),
        science: atoria_models.helpers.skillField(
          "ATORIA.Ruleset.Knowledges.Erudition.Science.Label",
          10,
        ),
        symbolism: atoria_models.helpers.skillField(
          "ATORIA.Ruleset.Knowledges.Erudition.Symbolism.Label",
          10,
        ),
        zoology: atoria_models.helpers.skillField(
          "ATORIA.Ruleset.Knowledges.Erudition.Zoology.Label",
          10,
        ),
        strategy: atoria_models.helpers.skillField(
          "ATORIA.Ruleset.Knowledges.Erudition.Strategy.Label",
          10,
        ),
        hunting: atoria_models.helpers.skillField(
          "ATORIA.Ruleset.Knowledges.Utilitarian.Hunting.Label",
          10,
        ),
        construction: atoria_models.helpers.skillField(
          "ATORIA.Ruleset.Knowledges.Utilitarian.Construction.Label",
          10,
        ),
        dressage: atoria_models.helpers.skillField(
          "ATORIA.Ruleset.Knowledges.Utilitarian.Dressage.Label",
          10,
        ),
        nature: atoria_models.helpers.skillField(
          "ATORIA.Ruleset.Knowledges.Utilitarian.Nature.Label",
          10,
        ),
        fishing: atoria_models.helpers.skillField(
          "ATORIA.Ruleset.Knowledges.Utilitarian.Fishing.Label",
          10,
        ),
        transport: atoria_models.helpers.skillField(
          "ATORIA.Ruleset.Knowledges.Utilitarian.Transport.Label",
          10,
        ),
        theft: atoria_models.helpers.skillField(
          "ATORIA.Ruleset.Knowledges.Utilitarian.Theft.Label",
          10,
        ),
        medecine: atoria_models.helpers.skillField(
          "ATORIA.Ruleset.Knowledges.Utilitarian.Medecine.Label",
          10,
        ),
        air: atoria_models.helpers.skillField(
          "ATORIA.Ruleset.Knowledges.Magic.Air.Label",
          0,
        ),
        druidic: atoria_models.helpers.skillField(
          "ATORIA.Ruleset.Knowledges.Magic.Druidic.Label",
          0,
        ),
        water: atoria_models.helpers.skillField(
          "ATORIA.Ruleset.Knowledges.Magic.Water.Label",
          0,
        ),
        fire: atoria_models.helpers.skillField(
          "ATORIA.Ruleset.Knowledges.Magic.Fire.Label",
          0,
        ),
        occult: atoria_models.helpers.skillField(
          "ATORIA.Ruleset.Knowledges.Magic.Occult.Label",
          0,
        ),
        mental: atoria_models.helpers.skillField(
          "ATORIA.Ruleset.Knowledges.Magic.Mental.Label",
          0,
        ),
        holy: atoria_models.helpers.skillField(
          "ATORIA.Ruleset.Knowledges.Magic.Holy.Label",
          0,
        ),
        blood: atoria_models.helpers.skillField(
          "ATORIA.Ruleset.Knowledges.Magic.Blood.Label",
          0,
        ),
        earth: atoria_models.helpers.skillField(
          "ATORIA.Ruleset.Knowledges.Magic.Earth.Label",
          0,
        ),
      },
      { label: "ATORIA.Model.Knowledges" },
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
