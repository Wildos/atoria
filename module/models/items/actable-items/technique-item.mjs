import * as atoria_models from "../../module.mjs";

export default class AtoriaTechniqueItem extends atoria_models.AtoriaActableModifierItem {
  static defineSchema() {
    const fields = foundry.data.fields;
    const schema = super.defineSchema();

    schema.charge_compatible = new fields.BooleanField({
      required: true,
      nullable: false,
      initial: false,
      label: "ATORIA.Ruleset.Actable_modifier.Charge_compatible",
    });

    return schema;
  }
}
