import * as atoria_models from "../../module.mjs";

export default class AtoriaActionItem extends atoria_models.AtoriaActableItem {
  static defineSchema() {
    const fields = foundry.data.fields;
    const schema = super.defineSchema();

    schema.cost_list = new fields.ArrayField(
      atoria_models.helpers.defineCostField(),
      { required: true, label: "ATORIA.Model.Action.Cost_list" },
    );

    schema.associated_skill = new fields.StringField({
      required: true,
      nullable: false,
      blank: true,
      initial: "",
      label: "ATORIA.Model.Action.Associated_skill",
    });

    schema.is_magic = new fields.BooleanField({
      required: true,
      nullable: false,
      initial: false,
      label: "ATORIA.Ruleset.Action.Is_magic",
    });
    schema.limitation = atoria_models.helpers.defineTimePhaseLimitation();

    return schema;
  }
}
