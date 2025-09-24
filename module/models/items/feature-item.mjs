import * as atoria_models from "../module.mjs";
import * as utils from "../../utils/module.mjs";

export default class AtoriaFeatureItem extends atoria_models.AtoriaItemBase {
  static defineSchema() {
    const fields = foundry.data.fields;
    const schema = super.defineSchema();

    schema.use_color = new fields.BooleanField({
      required: true,
      nullable: false,
      initial: false,
      label: "ATORIA.Model.Color.Use_color",
    });
    schema.color = new fields.ColorField({
      required: true,
      nullable: false,
      initial: "#000000",
      label: "ATORIA.Model.Color.Label",
    });

    schema.limitation = atoria_models.helpers.defineTimePhaseLimitation();

    schema.skill_alteration = atoria_models.helpers.defineSkillAlteration();

    return schema;
  }
}
