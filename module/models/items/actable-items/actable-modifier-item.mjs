import * as atoria_models from "../../module.mjs";

export default class AtoriaActableModifierItem extends atoria_models.AtoriaItemBase {
  static defineSchema() {
    const fields = foundry.data.fields;
    const schema = super.defineSchema();

    schema.cost = atoria_models.helpers.defineCostField();

    schema.limitation = atoria_models.helpers.defineTimePhaseLimitation();

    schema.restriction = new fields.StringField({
      required: true,
      label: "ATORIA.Ruleset.Actable.Restriction",
    });

    schema.effect = new fields.StringField({
      required: true,
      nullable: false,
      blank: true,
      label: "ATORIA.Model.Effect",
    });

    schema.critical_effect = new fields.StringField({
      required: true,
      nullable: false,
      blank: true,
      label: "ATORIA.Model.Critical_effect",
    });

    schema.alteration = atoria_models.helpers.defineAlteration();

    return schema;
  }
}
