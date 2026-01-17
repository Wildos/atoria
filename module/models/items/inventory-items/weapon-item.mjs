import * as atoria_models from "../../module.mjs";

export default class AtoriaWeaponItem extends atoria_models.AtoriaInventoryItem {
  static defineSchema() {
    const fields = foundry.data.fields;
    const schema = super.defineSchema();

    schema.associated_skill = new fields.StringField({
      required: true,
      nullable: false,
      blank: true,
      initial: "",
      label: "ATORIA.Model.Weapon.Associated_skill",
    });
    schema.damage_roll = atoria_models.helpers.defineRollField(
      "ATORIA.Model.Weapon.Damage_formula",
      "ATORIA.Model.Weapon.Damage_name",
    );

    schema.critical_effect = new fields.StringField({
      required: true,
      nullable: false,
      blank: true,
      label: "ATORIA.Model.Critical_effect",
    });

    schema.is_focuser = new fields.BooleanField({
      required: true,
      nullable: false,
      initial: false,
      label: "ATORIA.Model.Weapon.Is_focuser",
    });
    schema.focuser_damage_roll = atoria_models.helpers.defineRollField(
      "ATORIA.Model.Weapon.Focuser_damage_formula",
      "ATORIA.Model.Weapon.Focuser_damage_name",
    );

    schema.modificators = new fields.SchemaField(
      {
        success: new fields.NumberField({
          required: true,
          nullable: false,
          initial: 0,
          label: "ATORIA.Model.Weapon.Modifier.Success",
        }),
        critical_success: new fields.NumberField({
          required: true,
          nullable: false,
          initial: 0,
          label: "ATORIA.Model.Weapon.Modifier.Critical_success",
        }),
        critical_fumble: new fields.NumberField({
          required: true,
          nullable: false,
          initial: 0,
          label: "ATORIA.Model.Weapon.Modifier.Critical_fumble",
        }),
      },
      { label: "ATORIA.Model.Weapon.Modificators" },
    );

    schema.usable_actable_modifiers_typed = new fields.ArrayField(
      new fields.SchemaField(
        {
          uuid: new fields.StringField({
            required: true,
            label: "ATORIA.Model.Actable.Actable_modifiers",
          }),
          main: new fields.BooleanField({
            required: true,
            initial: false,
            label: "ATORIA.Model.Actable.Actable_modifiers_main",
          }),
          focuser: new fields.BooleanField({
            required: true,
            initial: false,
            label: "ATORIA.Model.Actable.Actable_modifiers_focuser",
          }),
          throw: new fields.BooleanField({
            required: true,
            initial: false,
            label: "ATORIA.Model.Actable.Actable_modifiers_throw",
          }),
        },
        { label: "ATORIA.Model.Spell.Supplementaries.Label" },
      ),
      {
        required: true,
        label: "ATORIA.Model.Actable.Usable_actable_modifiers",
      },
    );

    schema.is_worn = new fields.BooleanField({
      required: true,
      initial: false,
      label: "ATORIA.Sheet.Inventory.Worn",
    });

    schema.is_secondary_weapon = new fields.BooleanField({
      required: true,
      initial: false,
      label: "ATORIA.Sheet.Inventory.Secondary_weapon",
    });

    schema.range = new fields.StringField({
      required: true,
      nullable: false,
      blank: true,
      initial: "",
      label: "ATORIA.Model.Weapon.Range",
    });

    return schema;
  }

  /**
   * Migrate candidate source data for this DataModel which may require initial cleaning or transformations.
   * @param {object} source           The candidate source data from which the model will be constructed
   * @returns {object}                Migrated source data, if necessary
   */
  static migrateData(source) {
    const old_usable_actable_modifiers =
      foundry.utils.deepClone(source.usable_actable_modifiers) ?? [];

    if (
      old_usable_actable_modifiers.length > 0 &&
      typeof old_usable_actable_modifiers[0] == "string"
    ) {
      source.usable_actable_modifiers_typed = [];
      for (let uuid of old_usable_actable_modifiers) {
        source.usable_actable_modifiers_typed.push({
          uuid: uuid,
          main: true,
          throw: false,
          focuser: false,
        });
      }
      source.usable_actable_modifiers = [];
      delete source.usable_actable_modifiers;
    }
    return super.migrateData(source);
  }
}
