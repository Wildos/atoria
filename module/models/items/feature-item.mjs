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

    schema.skill_alterations =
      atoria_models.helpers.define_skills_alterations_list();

    return schema;
  }
}
