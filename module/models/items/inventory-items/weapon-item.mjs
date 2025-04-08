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

    schema.is_worn = new fields.BooleanField({
      required: true,
      initial: false,
      label: "ATORIA.Sheet.Inventory.Worn",
    });

    return schema;
  }
}
