import * as atoria_models from "../../module.mjs";
import RULESET from "../../../utils/ruleset.mjs";

export default class AtoriaActableModifierItem
  extends atoria_models.AtoriaItemBase
{
  static defineSchema() {
    const fields = foundry.data.fields;
    const schema = super.defineSchema();

    schema.cost = atoria_models.helpers.defineCostField();

    schema.limitation = atoria_models.helpers.defineTimePhaseLimitation();

    schema.requirement = new fields.StringField({
      required: true,
      label: "ATORIA.Ruleset.Actable.Requirement",
    });
    schema.incompatible = new fields.StringField({
      required: true,
      label: "ATORIA.Ruleset.Actable.Incompatible",
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

    return schema;
  }

  /**
   * Migrate candidate source data for this DataModel which may require initial cleaning or transformations.
   * @param {object} source           The candidate source data from which the model will be constructed
   * @returns {object}                Migrated source data, if necessary
   */
  static migrateData(source, options) {
    const current_version = game.settings.get(
      "atoria",
      "worldLastMigrationVersion",
    );
    const version = game.system.version;
    if (current_version === version) {
      return super.migrateData(source, options);
    }
    if (foundry.utils.isNewerVersion("0.3.31", current_version)) {
      source.requirement = source.restriction;
    }
    return super.migrateData(source, options);
  }
}
