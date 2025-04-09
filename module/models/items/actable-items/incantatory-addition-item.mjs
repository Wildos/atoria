import * as atoria_models from "../../module.mjs";
import * as utils from "../../../utils/module.mjs";

export default class AtoriaIncantatoryAdditionItem extends atoria_models.AtoriaActableModifierItem {
  static defineSchema() {
    const fields = foundry.data.fields;
    const schema = super.defineSchema();

    schema.require_immobile = new fields.BooleanField({
      required: true,
      initial: false,
      label: "ATORIA.Ruleset.Actable.Require_immobile",
    });
    schema.travel = new fields.StringField({
      required: true,
      label: "ATORIA.Ruleset.Actable.Travel",
    });
    schema.somatic = new fields.StringField({
      required: true,
      nullable: false,
      blank: false,
      choices: utils.ruleset.actable.somatic_types,
      initial: Object.keys(utils.ruleset.actable.somatic_types)[0],
      label: "ATORIA.Ruleset.Actable.Somatic",
    });

    schema.require_verbal = new fields.BooleanField({
      required: true,
      initial: false,
      label: "ATORIA.Ruleset.Actable.Require_verbal",
    });
    schema.material = new fields.StringField({
      required: true,
      label: "ATORIA.Ruleset.Actable.Material",
    });
    return schema;
  }
}
