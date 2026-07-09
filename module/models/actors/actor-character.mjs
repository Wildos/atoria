import * as atoria_models from "../module.mjs";
import * as utils from "../../utils/module.mjs";

export default class AtoriaPC extends atoria_models.AtoriaActorBase {
  static type = "player-character";

  static defineSchema() {
    const fields = foundry.data.fields;
    const requiredInteger = { required: true, nullable: false, integer: true };
    const schema = super.defineSchema();

    schema.sanity = new fields.SchemaField(
      {
        value: new fields.NumberField({
          ...requiredInteger,
          initial: utils.default_values.character.sanity,
          label: "ATORIA.Model.Sanity.Value",
        }),
        max: new fields.NumberField({
          ...requiredInteger,
          initial: utils.default_values.character.sanity,
          min: 0,
          label: "ATORIA.Model.Sanity.Max",
        }),
        regain_inactive: new fields.BooleanField({
          required: true,
          nullable: false,
          initial: false,
          label: "ATORIA.Model.Sanity.Regain_inactive",
        }),
      },
      { label: "ATORIA.Ruleset.Sanity" },
    );
    schema.endurance = new fields.SchemaField(
      {
        value: new fields.NumberField({
          ...requiredInteger,
          initial: utils.default_values.character.endurance,
          label: "ATORIA.Model.Endurance.Value",
        }),
        max: new fields.NumberField({
          ...requiredInteger,
          initial: utils.default_values.character.endurance,
          min: 0,
          label: "ATORIA.Model.Endurance.Max",
        }),
        regain_inactive: new fields.BooleanField({
          required: true,
          nullable: false,
          initial: false,
          label: "ATORIA.Model.Endurance.Regain_inactive",
        }),
      },
      { label: "ATORIA.Ruleset.Endurance" },
    );

    schema.offense = new fields.SchemaField(
      {
        amount: new fields.NumberField({
          ...requiredInteger,
          initial: 0,
          min: 0,
          label: "ATORIA.Model.Offense.Amount",
        }),
        type: new fields.StringField({
          required: true,
          nullable: false,
          blank: false,
          initial: "minus",
          choices: { minus: "-", plus: "+" },
          label: "ATORIA.Model.Offense.Type",
        }),
        description: new fields.StringField({
          required: true,
          nullable: false,
          blank: true,
          label: "ATORIA.Model.Offense.Description",
        }),
      },
      { label: "ATORIA.Ruleset.Offense" },
    );
    schema.defense = new fields.SchemaField(
      {
        amount: new fields.NumberField({
          ...requiredInteger,
          initial: 0,
          min: 0,
          label: "ATORIA.Model.Defense.Amount",
        }),
        type: new fields.StringField({
          required: true,
          nullable: false,
          blank: false,
          initial: "minus",
          choices: { minus: "-", plus: "+" },
          label: "ATORIA.Model.Offense.Type",
        }),
        description: new fields.StringField({
          required: true,
          nullable: false,
          blank: true,
          label: "ATORIA.Model.Defense.Description",
        }),
      },
      { label: "ATORIA.Ruleset.Defense" },
    );

    schema.luck = new fields.NumberField({
      ...requiredInteger,
      initial: utils.default_values.character.luck,
      max: 100,
      label: "ATORIA.Ruleset.Luck",
    });

    return schema;
  }
}
