import * as utils from "../utils/module.mjs";

export function skillInitialValue(
  skill_label,
  initial_value = utils.default_values.character.skill.success,
) {
  return {
    type: "skill",
    label: skill_label,
    success: initial_value,
    critical_success_modifier: 0,
    critical_fumble_modifier: 0,
  };
}

export function skillField(skill_label, initial_value, required = true) {
  return new foundry.data.fields.SchemaField(
    {
      type: new foundry.data.fields.StringField({
        required: true,
        nullable: false,
        trim: false,
        blank: false,
        textSearch: false,
        initial: "skill",
        label: "Skill",
      }),
      label: new foundry.data.fields.StringField({
        required: true,
        nullable: false,
        blank: false,
        trim: false,
        textSearch: false,
        initial: skill_label,
        label: "ATORIA.Model.Skill.Label",
      }),
      success: new foundry.data.fields.NumberField({
        required: true,
        nullable: false,
        integer: true,
        min: 0,
        max: 100,
        initial: initial_value,
        label: "ATORIA.Model.Skill.Success",
      }),
      critical_success_modifier: new foundry.data.fields.NumberField({
        required: true,
        nullable: false,
        integer: true,
        initial: 0,
        label: "ATORIA.Model.Skill.Modifier.Critical_success",
      }),
      critical_fumble_modifier: new foundry.data.fields.NumberField({
        required: true,
        nullable: false,
        integer: true,
        initial: 0,
        label: "ATORIA.Model.Skill.Modifier.Critical_fumble",
      }),
    },
    { label: skill_label, required: required, nullable: false },
  );
}

export function isSkill(data) {
  const skill_field = skillField("<SkillValidator>", 10);
  return skill_field.validate(data) === undefined;
}

export function armorField() {
  return new foundry.data.fields.SchemaField(
    {
      main: new foundry.data.fields.NumberField({
        required: true,
        nullable: false,
        integer: true,
        initial: 0,
        label: "ATORIA.Ruleset.Armor.Main",
      }),
      bludgeoning: new foundry.data.fields.NumberField({
        required: true,
        nullable: false,
        integer: true,
        initial: 0,
        label: "ATORIA.Ruleset.Armor.Bludgeoning",
      }),
      piercing: new foundry.data.fields.NumberField({
        required: true,
        nullable: false,
        integer: true,
        initial: 0,
        label: "ATORIA.Ruleset.Armor.Piercing",
      }),
      slashing: new foundry.data.fields.NumberField({
        required: true,
        nullable: false,
        integer: true,
        initial: 0,
        label: "ATORIA.Ruleset.Armor.Slashing",
      }),
    },
    {
      label: "ATORIA.Ruleset.Armor",
      required: true,
      nullable: false,
    },
  );
}

export function resistanceField() {
  return new foundry.data.fields.SchemaField(
    {
      main: new foundry.data.fields.NumberField({
        required: true,
        nullable: false,
        integer: true,
        initial: 0,
        label: "ATORIA.Ruleset.Resistance.Main",
      }),
      acid: new foundry.data.fields.NumberField({
        required: true,
        nullable: false,
        integer: true,
        initial: 0,
        label: "ATORIA.Ruleset.Resistance.Acid",
      }),
      arcanic: new foundry.data.fields.NumberField({
        required: true,
        nullable: false,
        integer: true,
        initial: 0,
        label: "ATORIA.Ruleset.Resistance.Arcanic",
      }),
      fire: new foundry.data.fields.NumberField({
        required: true,
        nullable: false,
        integer: true,
        initial: 0,
        label: "ATORIA.Ruleset.Resistance.Fire",
      }),
      lightning: new foundry.data.fields.NumberField({
        required: true,
        nullable: false,
        integer: true,
        initial: 0,
        label: "ATORIA.Ruleset.Resistance.Lightning",
      }),
      cold: new foundry.data.fields.NumberField({
        required: true,
        nullable: false,
        integer: true,
        initial: 0,
        label: "ATORIA.Ruleset.Resistance.Cold",
      }),
      necrotic: new foundry.data.fields.NumberField({
        required: true,
        nullable: false,
        integer: true,
        initial: 0,
        label: "ATORIA.Ruleset.Resistance.Necrotic",
      }),
      poison: new foundry.data.fields.NumberField({
        required: true,
        nullable: false,
        integer: true,
        initial: 0,
        label: "ATORIA.Ruleset.Resistance.Poison",
      }),
      psychic: new foundry.data.fields.NumberField({
        required: true,
        nullable: false,
        integer: true,
        initial: 0,
        label: "ATORIA.Ruleset.Resistance.Psychic",
      }),
      radiant: new foundry.data.fields.NumberField({
        required: true,
        nullable: false,
        integer: true,
        initial: 0,
        label: "ATORIA.Ruleset.Resistance.Radiant",
      }),
    },
    {
      label: "ATORIA.Ruleset.Resistance",
      required: true,
      nullable: false,
    },
  );
}

export function defineTimePhaseLimitation() {
  const fields = foundry.data.fields;
  const requiredInteger = { required: true, nullable: false, integer: true };

  return new fields.SchemaField(
    {
      regain_type: new fields.StringField({
        required: true,
        nullable: false,
        blank: false,
        label: "ATORIA.Model.Time_phase_limitation.Regain_type",
        choices: utils.ruleset.time_phases,
        initial: Object.keys(utils.ruleset.time_phases)[0],
      }),
      usage_left: new fields.NumberField({
        ...requiredInteger,
        initial: 0,
        label: "ATORIA.Model.Time_phase_limitation.Usage_left",
      }),
      usage_max: new fields.NumberField({
        ...requiredInteger,
        initial: 1,
        min: 1,
        label: "ATORIA.Model.Time_phase_limitation.Usage_max",
      }),
    },
    {
      required: true,
      nullable: false,
      label: "ATORIA.Model.Time_phase_limitation.Label",
    },
  );
}

export function defineSkillAlteration() {
  const fields = foundry.data.fields;

  return new fields.SchemaField(
    {
      has_skill_alteration: new fields.BooleanField({
        required: true,
        nullable: false,
        initial: false,
        label: "ATORIA.Model.Skill_alteration.Has_skill_alteration",
      }),
      associated_skill: new fields.StringField({
        required: true,
        nullable: false,
        blank: true,
        initial: "",
        label: "ATORIA.Model.Skill_alteration.Skill_associated",
      }),
      skill_alteration_type: new fields.StringField({
        required: true,
        nullable: false,
        blank: false,
        choices: utils.ruleset.skill_alterations,
        initial: Object.keys(utils.ruleset.skill_alterations)[0],
        label: "ATORIA.Model.Skill_alteration.Type",
      }),
    },
    {
      required: true,
      nullable: false,
      label: "ATORIA.Model.Skill_alteration.Label",
    },
  );
}

export function defineCostField() {
  const fields = foundry.data.fields;
  const requiredInteger = { required: true, nullable: false, integer: true };
  let main_time_units = foundry.utils.deepClone(utils.ruleset.time_units);
  delete main_time_units.second;
  const initial_main_unit = Object.keys(main_time_units)[0];

  return new fields.SchemaField(
    {
      time: new fields.SchemaField(
        {
          main_amount: new fields.NumberField({
            ...requiredInteger,
            initial: 0,
            label: "ATORIA.Model.Cost.Time.Main_amount",
          }),
          main_type: new fields.StringField({
            required: true,
            nullable: false,
            blank: false,
            choices: main_time_units,
            initial: initial_main_unit,
            label: "ATORIA.Model.Cost.Time.Main_type",
          }),
          second_amount: new fields.NumberField({
            ...requiredInteger,
            initial: 0,
            label: "ATORIA.Ruleset.Time_unit.Seconds",
          }),
        },
        {
          required: true,
          nullable: false,
          label: "ATORIA.Model.Cost.Time.Label",
        },
      ),
      health: new fields.NumberField({
        ...requiredInteger,
        initial: 0,
        label: "ATORIA.Ruleset.Health",
      }),
      mana: new fields.NumberField({
        ...requiredInteger,
        initial: 0,
        label: "ATORIA.Ruleset.Mana",
      }),
      stamina: new fields.NumberField({
        ...requiredInteger,
        initial: 0,
        label: "ATORIA.Ruleset.Stamina",
      }),
      endurance: new fields.NumberField({
        ...requiredInteger,
        initial: 0,
        label: "ATORIA.Ruleset.Endurance",
      }),
      movement: new fields.NumberField({
        ...requiredInteger,
        initial: 0,
        label: "ATORIA.Model.Cost.Movement",
      }),
      material: new fields.StringField({
        required: true,
        nullable: false,
        blank: true,
        label: "ATORIA.Model.Cost.Material",
      }),
    },
    { required: true, nullable: false, label: "ATORIA.Model.Cost.Label" },
  );
}

export function defineRollField(
  field_label = "ATORIA.Model.Roll_field.Label",
  name_label = "ATORIA.Model.Roll_field.Name",
) {
  const fields = foundry.data.fields;

  return new fields.SchemaField(
    {
      name: new fields.StringField({
        required: true,
        nullable: false,
        blank: true,
        initial: game.i18n.localize(name_label),
        label: name_label,
      }),
      formula: new fields.StringField({
        required: true,
        nullable: false,
        blank: true,
        initial: "1d4",
        label: "ATORIA.Model.Roll_field.Formula",
      }),
      types: new fields.SchemaField(
        {
          table: new fields.BooleanField({
            required: true,
            initial: false,
            label: "ATORIA.Model.Roll_field.Table",
          }),
          acid: new fields.BooleanField({
            required: true,
            initial: false,
            label: "ATORIA.Ruleset.Damage_type.Acid",
          }),
          arcanic: new fields.BooleanField({
            required: true,
            initial: false,
            label: "ATORIA.Ruleset.Damage_type.Arcanic",
          }),
          bludgeoning: new fields.BooleanField({
            required: true,
            initial: false,
            label: "ATORIA.Ruleset.Damage_type.Bludgeoning",
          }),
          fire: new fields.BooleanField({
            required: true,
            initial: false,
            label: "ATORIA.Ruleset.Damage_type.Fire",
          }),
          lightning: new fields.BooleanField({
            required: true,
            initial: false,
            label: "ATORIA.Ruleset.Damage_type.Lightning",
          }),
          cold: new fields.BooleanField({
            required: true,
            initial: false,
            label: "ATORIA.Ruleset.Damage_type.Cold",
          }),
          necrotic: new fields.BooleanField({
            required: true,
            initial: false,
            label: "ATORIA.Ruleset.Damage_type.Necrotic",
          }),
          piercing: new fields.BooleanField({
            required: true,
            initial: false,
            label: "ATORIA.Ruleset.Damage_type.Piercing",
          }),
          poison: new fields.BooleanField({
            required: true,
            initial: false,
            label: "ATORIA.Ruleset.Damage_type.Poison",
          }),
          psychic: new fields.BooleanField({
            required: true,
            initial: false,
            label: "ATORIA.Ruleset.Damage_type.Psychic",
          }),
          radiant: new fields.BooleanField({
            required: true,
            initial: false,
            label: "ATORIA.Ruleset.Damage_type.Radiant",
          }),
          slashing: new fields.BooleanField({
            required: true,
            initial: false,
            label: "ATORIA.Ruleset.Damage_type.Slashing",
          }),
          health: new fields.BooleanField({
            required: true,
            initial: false,
            label: "ATORIA.Ruleset.Health",
          }),
          absorption: new fields.BooleanField({
            required: true,
            initial: false,
            label: "ATORIA.Ruleset.Absorption",
          }),
          mana: new fields.BooleanField({
            required: true,
            initial: false,
            label: "ATORIA.Ruleset.Mana",
          }),
          stamina: new fields.BooleanField({
            required: true,
            initial: false,
            label: "ATORIA.Ruleset.Stamina",
          }),
          endurance: new fields.BooleanField({
            required: true,
            initial: false,
            label: "ATORIA.Ruleset.Endurance",
          }),
          sanity: new fields.BooleanField({
            required: true,
            initial: false,
            label: "ATORIA.Ruleset.Sanity",
          }),
        },
        {
          required: true,
          nullable: false,
          label: "ATORIA.Model.Roll_field.Types",
        },
      ),
    },
    { required: true, label: field_label },
  );
}

export function getInitialFullSkillSchema(skill_type_data, skill_holder_label) {
  const skill_type_schema = {};
  Object.keys(skill_type_data).map(function (skill_group_key, _) {
    const skill_group_list = skill_type_data[skill_group_key];
    const skill_list = {};

    Object.keys(skill_group_list).forEach(function (skill_category_key, _) {
      const skill_category_list = skill_group_list[skill_category_key];
      const skill_list_initial = {};

      skill_category_list.forEach((skill_key) => {
        skill_list_initial[skill_key] = skillInitialValue(
          utils.buildLocalizeString(
            "Ruleset",
            skill_holder_label,
            skill_group_key,
            skill_category_key,
            skill_key,
            "Label",
          ),
          utils.default_values.character.skill.get_success(skill_group_key),
        );
      });
      skill_list[skill_category_key] = skill_list_initial;
    });
    skill_type_schema[skill_group_key] = skill_list;
  });
  return skill_type_schema;
}
