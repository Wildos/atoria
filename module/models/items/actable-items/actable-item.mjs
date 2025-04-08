import * as atoria_models from "../../module.mjs";
import * as utils from "../../../utils/module.mjs";
import RULESET from "../../../utils/ruleset.mjs";

export default class AtoriaActableItem extends atoria_models.AtoriaItemBase {
  static defineSchema() {
    const fields = foundry.data.fields;
    const schema = super.defineSchema();

    schema.effect = new fields.StringField({
      required: true,
      label: "ATORIA.Model.Effect",
    });

    schema.require_immobile = new fields.BooleanField({
      required: true,
      initial: false,
      label: "ATORIA.Ruleset.Actable.Require_immobile",
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

    schema.duration = new fields.StringField({
      required: true,
      label: "ATORIA.Ruleset.Actable.Duration",
    });

    schema.range = new fields.StringField({
      required: true,
      label: "ATORIA.Ruleset.Actable.Range",
    });
    schema.target = new fields.StringField({
      required: true,
      label: "ATORIA.Ruleset.Actable.Target",
    });
    schema.area = new fields.StringField({
      required: true,
      label: "ATORIA.Ruleset.Actable.Area",
    });

    schema.saves_asked = new fields.ArrayField(
      new fields.StringField({
        required: true,
        nullable: false,
        blank: false,
        initial: RULESET.character.getOpposingSaves()[0],
        label: "ATORIA.Model.Magic.Save_asked",
      }),
      { required: true, label: "ATORIA.Model.Magic.Saves_asked" },
    );

    schema.usable_actable_modifiers = new fields.ArrayField(
      new fields.StringField({
        required: true,
        label: "ATORIA.Model.Actable.Actable_modifiers",
      }),
      {
        required: true,
        label: "ATORIA.Model.Actable.Usable_actable_modifiers",
      },
    );

    return schema;
  }
}
