import * as atoria_models from "../../module.mjs";
import * as utils from "../../../utils/module.mjs";

export default class AtoriaInventoryItem extends atoria_models.AtoriaItemBase {
  static _getKeywordFields() {
    const fields = foundry.data.fields;
    return {
      // Weapon related
      two_handed: new fields.NumberField({
        required: true,
        initial: 0,
        min: 0,
        max: 2,
        label: "ATORIA.Ruleset.Keywords.Two_handed",
      }),
      reach: new fields.NumberField({
        required: true,
        initial: 0,
        min: 0,
        max: 3,
        label: "ATORIA.Ruleset.Keywords.Reach",
      }),
      brutal: new fields.NumberField({
        required: true,
        initial: 0,
        min: 0,
        max: 2,
        label: "ATORIA.Ruleset.Keywords.Brutal",
      }),
      equip: new fields.NumberField({
        required: true,
        initial: 0,
        min: 0,
        max: 1,
        label: "ATORIA.Ruleset.Keywords.Equip",
      }),
      smash: new fields.NumberField({
        required: true,
        initial: 0,
        min: 0,
        max: 3,
        label: "ATORIA.Ruleset.Keywords.Smash",
      }),
      guard: new fields.NumberField({
        required: true,
        initial: 0,
        min: 0,
        max: 2,
        label: "ATORIA.Ruleset.Keywords.Guard",
      }),
      throwable: new fields.NumberField({
        required: true,
        initial: 0,
        min: 0,
        max: 2,
        label: "ATORIA.Ruleset.Keywords.Throwable",
      }),
      light: new fields.NumberField({
        required: true,
        initial: 0,
        min: 0,
        max: 1,
        label: "ATORIA.Ruleset.Keywords.Light",
      }),
      heavy: new fields.NumberField({
        required: true,
        initial: 0,
        min: 0,
        max: 2,
        label: "ATORIA.Ruleset.Keywords.Heavy",
      }),
      penetrating: new fields.NumberField({
        required: true,
        initial: 0,
        min: 0,
        max: 2,
        label: "ATORIA.Ruleset.Keywords.Penetrating",
      }),
      versatile: new fields.NumberField({
        required: true,
        initial: 0,
        min: 0,
        max: 1,
        label: "ATORIA.Ruleset.Keywords.Versatile",
      }),
      protect: new fields.NumberField({
        required: true,
        initial: 0,
        min: 0,
        max: 2,
        label: "ATORIA.Ruleset.Keywords.Protect",
      }),
      protection: new fields.NumberField({
        required: true,
        initial: 0,
        min: 0,
        max: 2,
        label: "ATORIA.Ruleset.Keywords.Protection",
      }),
      quick: new fields.NumberField({
        required: true,
        initial: 0,
        min: 0,
        max: 2,
        label: "ATORIA.Ruleset.Keywords.Quick",
      }),
      recharge: new fields.NumberField({
        required: true,
        initial: 0,
        min: 0,
        max: 1,
        label: "ATORIA.Ruleset.Keywords.Recharge",
      }),
      reserve: new fields.NumberField({
        required: true,
        initial: 0,
        min: 0,
        max: 1,
        label: "ATORIA.Ruleset.Keywords.Reserve",
      }),
      reserve_max: new fields.NumberField({
        required: true,
        initial: 0,
        min: 0,
        label: "ATORIA.Ruleset.Keywords.Reserve_max",
      }),
      reserve_current: new fields.NumberField({
        required: true,
        initial: 0,
        min: 0,
        label: "ATORIA.Ruleset.Keywords.Reserve_current",
      }),
      sly: new fields.NumberField({
        required: true,
        initial: 0,
        min: 0,
        max: 1,
        label: "ATORIA.Ruleset.Keywords.Sly",
      }),

      // Armor & Equipment related
      gruff: new fields.NumberField({
        required: true,
        initial: 0,
        min: 0,
        max: 4,
        label: "ATORIA.Ruleset.Keywords.Gruff",
      }),
      noisy: new fields.NumberField({
        required: true,
        initial: 0,
        min: 0,
        max: 3,
        label: "ATORIA.Ruleset.Keywords.Noisy",
      }),
      tough: new fields.NumberField({
        required: true,
        initial: 0,
        min: 0,
        max: 4,
        label: "ATORIA.Ruleset.Keywords.Tough",
      }),
      obstruct: new fields.NumberField({
        required: true,
        initial: 0,
        min: 0,
        max: 2,
        label: "ATORIA.Ruleset.Keywords.Obstruct",
      }),
      prise: new fields.NumberField({
        required: true,
        initial: 0,
        min: 0,
        max: 4,
        label: "ATORIA.Ruleset.Keywords.Prise",
      }),
      resistant: new fields.NumberField({
        required: true,
        initial: 0,
        min: 0,
        max: 4,
        label: "ATORIA.Ruleset.Keywords.Resistant",
      }),
      sturdy: new fields.NumberField({
        required: true,
        initial: 0,
        min: 0,
        max: 4,
        label: "ATORIA.Ruleset.Keywords.Sturdy",
      }),
      stable: new fields.NumberField({
        required: true,
        initial: 0,
        min: 0,
        max: 4,
        label: "ATORIA.Ruleset.Keywords.Stable",
      }),
      direct: new fields.NumberField({
        required: true,
        initial: 0,
        min: 0,
        max: 2,
        label: "ATORIA.Ruleset.Keywords.Direct",
      }),
      direct_type: new fields.StringField({
        required: true,
        initial: "X",
        label: "ATORIA.Ruleset.Keywords.Direct_type",
      }),

      // global
      somatic: new fields.NumberField({
        required: true,
        initial: 0,
        min: 0,
        max: 1,
        label: "ATORIA.Ruleset.Keywords.Somatic",
      }),
      preserve: new fields.SchemaField(
        {
          active: new fields.BooleanField({
            required: true,
            initial: false,
            label: "ATORIA.Ruleset.Keywords.Preserve.Label",
          }),
          max_amount: new fields.NumberField({
            required: true,
            nullable: false,
            initial: 1,
            label: "ATORIA.Ruleset.Keywords.Preserve.Max_amount",
          }),
          type: new fields.StringField({
            required: true,
            nullable: false,
            blank: false,
            choices: utils.ruleset.keywords.with_type.preserve,
            initial: Object.keys(utils.ruleset.keywords.with_type.preserve)[0],
            label: "ATORIA.Ruleset.Keywords.Preserve.Type",
          }),
          increment: new fields.NumberField({
            required: true,
            nullable: false,
            initial: 1,
            label: "ATORIA.Ruleset.Keywords.Preserve.Increment",
          }),
        },
        { label: "ATORIA.Ruleset.Keywords.Preserve.Label" },
      ),
      preserve_mana: new fields.NumberField({
        required: true,
        nullable: false,
        initial: 0,
        label: "ATORIA.Ruleset.Mana",
      }),
      preserve_health: new fields.NumberField({
        required: true,
        nullable: false,
        initial: 0,
        label: "ATORIA.Ruleset.Health",
      }),
      preserve_stamina: new fields.NumberField({
        required: true,
        nullable: false,
        initial: 0,
        label: "ATORIA.Ruleset.Stamina",
      }),
      preserve_endurance: new fields.NumberField({
        required: true,
        nullable: false,
        initial: 0,
        step: 5,
        label: "ATORIA.Ruleset.Endurance",
      }),
      preserve_sanity: new fields.NumberField({
        required: true,
        nullable: false,
        initial: 0,
        label: "ATORIA.Ruleset.Sanity",
      }),
    };
  }

  static defineSchema() {
    const fields = foundry.data.fields;
    const schema = super.defineSchema();

    schema.encumbrance = new fields.NumberField({
      required: true,
      nullable: false,
      initial: 0,
      label: "ATORIA.Ruleset.Encumbrance",
    });

    schema.keywords = new fields.SchemaField(this._getKeywordFields(), {
      required: true,
      label: "ATORIA.Ruleset.Keywords.Label",
    });

    return schema;
  }
}
