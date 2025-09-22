import * as atoria_models from "../module.mjs";
import * as utils from "../../utils/module.mjs";

export default class AtoriaPC extends atoria_models.AtoriaActorBase {
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
        description: new fields.StringField({
          required: true,
          nullable: false,
          blank: true,
          label: "ATORIA.Model.Defense.Description",
        }),
      },
      { label: "ATORIA.Ruleset.Defense" },
    );

    schema.healing_inactive = new fields.SchemaField(
      {
        amount: new fields.NumberField({
          ...requiredInteger,
          initial: 0,
          min: 0,
          label: "ATORIA.Ruleset.Healing_inactive.Amount",
        }),
        medical: new fields.BooleanField({
          required: true,
          nullable: false,
          initial: false,
          label: "ATORIA.Ruleset.Healing_inactive.Medical",
        }),
        medical_2: new fields.BooleanField({
          required: true,
          nullable: false,
          initial: false,
          label: "ATORIA.Ruleset.Healing_inactive.Medical",
        }),
        resurrection: new fields.BooleanField({
          required: true,
          nullable: false,
          initial: false,
          label: "ATORIA.Ruleset.Healing_inactive.Resurrection",
        }),
      },
      { label: "ATORIA.Model.Healing_inactive" },
    );

    schema.luck = new fields.NumberField({
      ...requiredInteger,
      initial: utils.default_values.character.luck,
      max: 100,
      label: "ATORIA.Ruleset.Luck",
    });

    schema.skills = new fields.SchemaField(
      this._fullSkillSchema(utils.default_values.character.skills, "skills"),
      { label: "ATORIA.Model.Skills" },
    );

    schema.knowledges = new fields.SchemaField(
      this._fullSkillSchema(
        utils.default_values.character.knowledges,
        "knowledges",
      ),
      { label: "ATORIA.Model.Knowledges" },
    );

    return schema;
  }
}
