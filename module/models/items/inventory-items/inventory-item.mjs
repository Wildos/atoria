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
        max: utils.ruleset.keywords.max_amount.two_handed,
        label: "ATORIA.Ruleset.Keywords.Two_handed",
      }),
      reach: new fields.NumberField({
        required: true,
        initial: 0,
        min: 0,
        max: utils.ruleset.keywords.max_amount.reach,
        label: "ATORIA.Ruleset.Keywords.Reach",
      }),
      brute: new fields.NumberField({
        required: true,
        initial: 0,
        min: 0,
        max: utils.ruleset.keywords.max_amount.brute,
        label: "ATORIA.Ruleset.Keywords.Brute",
      }),
      equip: new fields.NumberField({
        required: true,
        initial: 0,
        min: 0,
        max: utils.ruleset.keywords.max_amount.equip,
        label: "ATORIA.Ruleset.Keywords.Equip",
      }),
      fluxian: new fields.NumberField({
        required: true,
        initial: 0,
        min: 0,
        max: utils.ruleset.keywords.max_amount.fluxian,
        label: "ATORIA.Ruleset.Keywords.Fluxian",
      }),
      smash: new fields.NumberField({
        required: true,
        initial: 0,
        min: 0,
        max: utils.ruleset.keywords.max_amount.smash,
        label: "ATORIA.Ruleset.Keywords.Smash",
      }),
      guard: new fields.NumberField({
        required: true,
        initial: 0,
        min: 0,
        max: utils.ruleset.keywords.max_amount.guard,
        label: "ATORIA.Ruleset.Keywords.Guard",
      }),
      throwable: new fields.NumberField({
        required: true,
        initial: 0,
        min: 0,
        max: utils.ruleset.keywords.max_amount.throwable,
        label: "ATORIA.Ruleset.Keywords.Throwable",
      }),
      light: new fields.NumberField({
        required: true,
        initial: 0,
        min: 0,
        max: utils.ruleset.keywords.max_amount.light,
        label: "ATORIA.Ruleset.Keywords.Light",
      }),
      heavy: new fields.NumberField({
        required: true,
        initial: 0,
        min: 0,
        max: utils.ruleset.keywords.max_amount.heavy,
        label: "ATORIA.Ruleset.Keywords.Heavy",
      }),
      penetrating: new fields.NumberField({
        required: true,
        initial: 0,
        min: 0,
        max: utils.ruleset.keywords.max_amount.penetrating,
        label: "ATORIA.Ruleset.Keywords.Penetrating",
      }),
      versatile: new fields.NumberField({
        required: true,
        initial: 0,
        min: 0,
        max: utils.ruleset.keywords.max_amount.versatile,
        label: "ATORIA.Ruleset.Keywords.Versatile",
      }),
      protect: new fields.NumberField({
        required: true,
        initial: 0,
        min: 0,
        max: utils.ruleset.keywords.max_amount.protect,
        label: "ATORIA.Ruleset.Keywords.Protect",
      }),
      protection: new fields.NumberField({
        required: true,
        initial: 0,
        min: 0,
        max: utils.ruleset.keywords.max_amount.protection,
        label: "ATORIA.Ruleset.Keywords.Protection",
      }),
      quick: new fields.NumberField({
        required: true,
        initial: 0,
        min: 0,
        max: utils.ruleset.keywords.max_amount.quick,
        label: "ATORIA.Ruleset.Keywords.Quick",
      }),
      recharge: new fields.NumberField({
        required: true,
        initial: 0,
        min: 0,
        max: utils.ruleset.keywords.max_amount.recharge,
        label: "ATORIA.Ruleset.Keywords.Recharge",
      }),
      reserve: new fields.NumberField({
        required: true,
        initial: 0,
        min: 0,
        max: utils.ruleset.keywords.max_amount.reserve,
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
        max: utils.ruleset.keywords.max_amount.sly,
        label: "ATORIA.Ruleset.Keywords.Sly",
      }),
      sly_amount: new fields.NumberField({
        required: true,
        initial: 0,
        min: 0,
        label: "ATORIA.Ruleset.Keywords.Sly_amount",
      }),

      // Armor & Equipment related
      gruff: new fields.NumberField({
        required: true,
        initial: 0,
        min: 0,
        max: utils.ruleset.keywords.max_amount.gruff,
        label: "ATORIA.Ruleset.Keywords.Gruff",
      }),
      noisy: new fields.NumberField({
        required: true,
        initial: 0,
        min: 0,
        max: utils.ruleset.keywords.max_amount.noisy,
        label: "ATORIA.Ruleset.Keywords.Noisy",
      }),
      tough: new fields.NumberField({
        required: true,
        initial: 0,
        min: 0,
        max: utils.ruleset.keywords.max_amount.tough,
        label: "ATORIA.Ruleset.Keywords.Tough",
      }),
      obstruct: new fields.NumberField({
        required: true,
        initial: 0,
        min: 0,
        max: utils.ruleset.keywords.max_amount.obstruct,
        label: "ATORIA.Ruleset.Keywords.Obstruct",
      }),
      grip: new fields.NumberField({
        required: true,
        initial: 0,
        min: 0,
        max: utils.ruleset.keywords.max_amount.grip,
        label: "ATORIA.Ruleset.Keywords.Grip",
      }),
      resistant: new fields.NumberField({
        required: true,
        initial: 0,
        min: 0,
        max: utils.ruleset.keywords.max_amount.resistant,
        label: "ATORIA.Ruleset.Keywords.Resistant",
      }),
      sturdy: new fields.NumberField({
        required: true,
        initial: 0,
        min: 0,
        max: utils.ruleset.keywords.max_amount.sturdy,
        label: "ATORIA.Ruleset.Keywords.Sturdy",
      }),
      stable: new fields.NumberField({
        required: true,
        initial: 0,
        min: 0,
        max: utils.ruleset.keywords.max_amount.stable,
        label: "ATORIA.Ruleset.Keywords.Stable",
      }),
      direct: new fields.NumberField({
        required: true,
        initial: 0,
        min: 0,
        max: utils.ruleset.keywords.max_amount.direct,
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
        max: utils.ruleset.keywords.max_amount.somatic,
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
        label: "ATORIA.Ruleset.Keywords.PreserveMana",
      }),
      preserve_health: new fields.NumberField({
        required: true,
        nullable: false,
        initial: 0,
        label: "ATORIA.Ruleset.Keywords.PreserveHealth",
      }),
      preserve_stamina: new fields.NumberField({
        required: true,
        nullable: false,
        initial: 0,
        label: "ATORIA.Ruleset.Keywords.PreserveStamina",
      }),
      preserve_endurance: new fields.NumberField({
        required: true,
        nullable: false,
        initial: 0,
        step: 5,
        label: "ATORIA.Ruleset.Keywords.PreserveEndurance",
      }),
      preserve_sanity: new fields.NumberField({
        required: true,
        nullable: false,
        initial: 0,
        label: "ATORIA.Ruleset.Keywords.PreserveSanity",
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

    schema.limitation = atoria_models.helpers.defineTimePhaseLimitation();

    schema.skill_alterations =
      atoria_models.helpers.define_skills_alterations_list();

    return schema;
  }
}
