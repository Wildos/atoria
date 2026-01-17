import * as atoria_models from "../../module.mjs";
import * as utils from "../../../utils/module.mjs";

export default class AtoriaSpellItem extends atoria_models.AtoriaActableItem {
  static defineSchema() {
    const fields = foundry.data.fields;
    const requiredInteger = { required: true, nullable: false, integer: true };
    const schema = super.defineSchema();

    schema.associated_magic_school = new fields.StringField({
      required: true,
      nullable: false,
      blank: false,
      choices: utils.ruleset.actable.associated_magic_schools,
      initial: Object.keys(utils.ruleset.actable.associated_magic_schools)[0],
      label: "ATORIA.Model.Action.Associated_magic_school",
    });

    schema.cost = atoria_models.helpers.defineCostField();

    schema.success = new fields.NumberField({
      ...requiredInteger,
      initial: 10,
      label: "ATORIA.Model.Spell.Success",
    });
    schema.critical_success = new fields.NumberField({
      ...requiredInteger,
      initial: 0,
      label: "ATORIA.Model.Spell.Critical_success",
    });
    schema.critical_fumble = new fields.NumberField({
      ...requiredInteger,
      initial: 0,
      label: "ATORIA.Model.Spell.Critical_fumble",
    });

    schema.markers = new fields.SchemaField(
      {
        is_canalisation: new fields.BooleanField({
          required: true,
          initial: false,
          label: "ATORIA.Ruleset.Spell.Markers.Is_canalisation",
        }),
        is_evocation: new fields.BooleanField({
          required: true,
          initial: false,
          label: "ATORIA.Ruleset.Spell.Markers.Is_evocation",
        }),
        is_attack: new fields.BooleanField({
          required: true,
          initial: false,
          label: "ATORIA.Ruleset.Spell.Markers.Is_attack",
        }),
        is_trap: new fields.BooleanField({
          required: true,
          initial: false,
          label: "ATORIA.Ruleset.Spell.Markers.Is_trap",
        }),
      },
      { label: "ATORIA.Model.Spell.Markers" },
    );

    schema.versatile = new fields.BooleanField({
      required: true,
      initial: false,
      label: "ATORIA.Ruleset.Keywords.Versatile",
    });

    schema.critical_effect = new fields.StringField({
      required: true,
      label: "ATORIA.Model.Spell.Critical_effect",
    });

    schema.supplementaries_list = new fields.ArrayField(
      new fields.SchemaField(
        {
          name: new fields.StringField({
            required: true,
            nullable: false,
            blank: true,
            label: "ATORIA.Model.Name",
          }),
          cost: atoria_models.helpers.defineCostField(),
          usage_max: new fields.NumberField({
            ...requiredInteger,
            initial: 1,
            label: "ATORIA.Model.Spell.Supplementaries.Cumul_max",
          }),
          effect: new fields.StringField({
            required: true,
            label: "ATORIA.Model.Effect",
          }),
          limitation: atoria_models.helpers.defineTimePhaseLimitation(),
        },
        { label: "ATORIA.Model.Spell.Supplementaries.Label" },
      ),
      { required: true, label: "ATORIA.Model.Spell.Supplementaries_list" },
    );

    return schema;
  }

  /**
   * Migrate source data from some prior format into a new specification.
   * The source parameter is either original data retrieved from disk or provided by an update operation.
   * @inheritDoc
   */
  static migrateData(source) {
    const supplementaries_list = source.supplementaries_list ?? [];
    for (let supp of supplementaries_list) {
      if (!("effect" in Object.keys(supp))) {
        supp.effect = foundry.utils.deepClone(supp.description);
      }
    }
    return super.migrateData(source);
  }
}
