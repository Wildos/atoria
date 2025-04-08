import * as atoria_models from "../module.mjs";
import * as utils from "../../utils/module.mjs";

export default class AtoriaNPC extends atoria_models.AtoriaActorBase {

  static defineSchema() {
    const fields = foundry.data.fields;
    const requiredInteger = { required: true, nullable: false, integer: true };
    const schema = super.defineSchema();

    schema.movement = new fields.NumberField({ ...requiredInteger, initial: utils.default_values.character.movement, min: 0, label: "ATORIA.Ruleset.Movement" });

    schema.armor = atoria_models.helpers.armorField();

    schema.resistance = atoria_models.helpers.resistanceField();

    schema.skills = new fields.SchemaField(this._catLimitedSkillSchema(utils.default_values.character.skills, "skills"), { label: "ATORIA.Model.Skills" });

    schema.knowledges = new fields.SchemaField(this._catLimitedSkillSchema(utils.default_values.character.knowledges, "knowledges"), { label: "ATORIA.Model.Knowledges" });

    return schema
  }

}