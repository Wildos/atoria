import * as atoria_models from "../../module.mjs";

export default class AtoriaWeaponItem
  extends atoria_models.AtoriaInventoryItem
{
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
          contact: new fields.BooleanField({
            required: true,
            initial: false,
            label: "ATORIA.Model.Actable.Actable_modifiers_contact",
          }),
          apart: new fields.BooleanField({
            required: true,
            initial: false,
            label: "ATORIA.Model.Actable.Actable_modifiers_apart",
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

    schema.secondary_weapon_keyword = new fields.StringField({
      required: true,
      nullable: false,
      blank: true,
      initial: "",
      choices: {
        guard: "ATORIA.Ruleset.Keywords.Guard",
        brute: "ATORIA.Ruleset.Keywords.Brute",
        smash: "ATORIA.Ruleset.Keywords.Smash",
      },
      label: "ATORIA.Model.Weapon.SecondaryWeaponKeyword",
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

  static migrateData(source, options) {
    const current_version = game.settings.get(
      "atoria",
      "worldLastMigrationVersion",
    );
    const version = game.system.version;
    if (current_version === version) {
      return super.migrateData(source, options);
    }
    if (foundry.utils.isNewerVersion("0.3.29", current_version)) {
      source.associated_skill = "";
    }
    return super.migrateData(source, options);
  }
}
