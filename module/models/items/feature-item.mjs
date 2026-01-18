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
  /**
   * Migrate candidate source data for this DataModel which may require initial cleaning or transformations.
   * @param {object} source           The candidate source data from which the model will be constructed
   * @returns {object}                Migrated source data, if necessary
   */
  static migrateData(source) {
    const old_skill_alteration =
      foundry.utils.deepClone(source.skill_alteration) ?? undefined;

    if (old_skill_alteration && source.skill_alterations === undefined) {
      let new_alteration = {
        associated_skill: old_skill_alteration.associated_skill,
        dos_mod: 0,
        adv_amount: 0,
        disadv_amount: 0,
      };
      switch (old_skill_alteration.skill_alteration_type) {
        case "hand_handled":
          break;
        case "one_degree_of_success_gain":
          new_alteration.dos_mod = 1;
          break;
        case "one_degree_of_success_loss":
          new_alteration.dos_mod = -1;
          break;
        case "two_degree_of_success_gain":
          new_alteration.dos_mod = 2;
          break;
        case "two_degree_of_success_loss":
          new_alteration.dos_mod = -2;
          break;
        case "advantage":
          new_alteration.adv_amount = 1;
          break;
        case "disadvantage":
          new_alteration.disadv_amount = 1;
          break;
        case "advantage_n_one_degree_of_success_gain":
          new_alteration.dos_mod = 1;
          new_alteration.adv_amount = 1;
          break;
        case "disadvantage_n_one_degree_of_success_loss":
          new_alteration.dos_mod = -1;
          new_alteration.disadv_amount = 1;
          break;
      }
      source.skill_alterations = [new_alteration];
      source.skill_alteration = "hand_handled";
      delete source.skill_alteration;
    }
    return super.migrateData(source);
  }
}
