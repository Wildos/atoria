import * as atoria_models from "../../module.mjs";

export default class AtoriaActableModifierItem extends atoria_models.AtoriaItemBase {
  static defineSchema() {
    const fields = foundry.data.fields;
    const schema = super.defineSchema();

    schema.cost = atoria_models.helpers.defineCostField();

    schema.limitation = atoria_models.helpers.defineTimePhaseLimitation();

    schema.restriction = new fields.StringField({
      required: true,
      label: "ATORIA.Ruleset.Actable.Restriction",
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

    return schema;
  }

  /**
   * Migrate candidate source data for this DataModel which may require initial cleaning or transformations.
   * @param {object} source           The candidate source data from which the model will be constructed
   * @returns {object}                Migrated source data, if necessary
   */
  static migrateData(source) {
    const old_skill_alteration =
      foundry.utils.deepClone(source.skill_alteration) ?? undefined;

    if (old_skill_alteration) {
      source.alteration = {
        dos_mod: 0,
        adv_amount: 0,
        disadv_amount: 0,
      };
      switch (old_skill_alteration.skill_alteration_type) {
        case "hand_handled":
          break;
        case "one_degree_of_success_gain":
          source.alteration.dos_mod = 1;
          break;
        case "one_degree_of_success_loss":
          source.alteration.dos_mod = -1;
          break;
        case "two_degree_of_success_gain":
          source.alteration.dos_mod = 2;
          break;
        case "two_degree_of_success_loss":
          source.alteration.dos_mod = -2;
          break;
        case "advantage":
          source.alteration.adv_amount = 1;
          break;
        case "disadvantage":
          source.alteration.disadv_amount = 1;
          break;
        case "advantage_n_one_degree_of_success_gain":
          source.alteration.dos_mod = 1;
          source.alteration.adv_amount = 1;
          break;
        case "disadvantage_n_one_degree_of_success_loss":
          source.alteration.dos_mod = -1;
          source.alteration.disadv_amount = 1;
          break;
      }
      source.skill_alteration = "hand_handled";
      delete source.skill_alteration;
    }
    return super.migrateData(source);
  }
}
