import * as atoria_models from "../../module.mjs";

export default class AtoriaSpellItem extends atoria_models.AtoriaActableItem {

    static defineSchema() {
        const fields = foundry.data.fields;
        const requiredInteger = { required: true, nullable: false, integer: true };
        const schema = super.defineSchema();

        schema.cost = atoria_models.helpers.defineCostField();

        schema.success = new fields.NumberField({ ...requiredInteger, initial: 10, label: "ATORIA.Model.Spell.Success" });
        schema.critical_success = new fields.NumberField({ ...requiredInteger, initial: 0, label: "ATORIA.Model.Spell.Critical_success" });
        schema.critical_fumble = new fields.NumberField({ ...requiredInteger, initial: 0, label: "ATORIA.Model.Spell.Critical_fumble" });

        schema.markers = new fields.SchemaField({
            is_canalisation: new fields.BooleanField({ required: true, initial: false, label: "ATORIA.Ruleset.Spell.Markers.Is_canalisation" }),
            is_evocation: new fields.BooleanField({ required: true, initial: false, label: "ATORIA.Ruleset.Spell.Markers.Is_evocation" }),
            is_attack: new fields.BooleanField({ required: true, initial: false, label: "ATORIA.Ruleset.Spell.Markers.Is_attack" }),
            is_trap: new fields.BooleanField({ required: true, initial: false, label: "ATORIA.Ruleset.Spell.Markers.Is_trap" }),
        }, { label: "ATORIA.Model.Spell.Markers" });

        schema.critical_effect = new fields.StringField({ required: true, label: "ATORIA.Model.Spell.Critical_effect" });

        schema.supplementaries_list = new fields.ArrayField(
            new fields.SchemaField({
                cost: atoria_models.helpers.defineCostField(),
                usage_max: new fields.NumberField({ ...requiredInteger, initial: 1, label: "ATORIA.Model.Spell.Supplementaries.Cumul_max" }),
                description: new fields.StringField({ required: true, label: "ATORIA.Model.Spell.Supplementaries.Description" }),
                limitation: atoria_models.helpers.defineTimePhaseLimitation(),
            }, { label: "ATORIA.Model.Spell.Supplementaries.Label" }),
            { required: true, label: "ATORIA.Model.Spell.Supplementaries_list" }
        );

        return schema;
    }
}