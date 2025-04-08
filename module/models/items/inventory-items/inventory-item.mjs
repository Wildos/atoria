import * as atoria_models from "../../module.mjs";
import * as utils from "../../../utils/module.mjs";

export default class AtoriaInventoryItem extends atoria_models.AtoriaItemBase {

    static _getKeywordFields() {
        const fields = foundry.data.fields;
        return {
            noisy: new fields.BooleanField({ required: true, initial: false, label: "ATORIA.Ruleset.Keywords.Noisy" }),
            noisy_more: new fields.BooleanField({ required: true, initial: false, label: "ATORIA.Ruleset.Keywords.Noisy_more" }),
            obstruct: new fields.BooleanField({ required: true, initial: false, label: "ATORIA.Ruleset.Keywords.Obstruct" }),
            obstruct_more: new fields.BooleanField({ required: true, initial: false, label: "ATORIA.Ruleset.Keywords.Obstruct_more" }),
            preserve: new fields.BooleanField({ required: true, initial: false, label: "ATORIA.Ruleset.Keywords.Preserve.Label" }),
            preserve_data: new fields.SchemaField({
                max_amount: new fields.NumberField({ required: true, nullable: false, initial: 1, label: "ATORIA.Ruleset.Keywords.Preserve.Max_amount" }),
                type: new fields.StringField({
                    required: true, nullable: false, blank: false, choices: utils.ruleset.keywords.with_type.preserve,
                    initial: Object.keys(utils.ruleset.keywords.with_type.preserve)[0], label: "ATORIA.Ruleset.Keywords.Preserve.Type"
                }),
                increment: new fields.NumberField({ required: true, nullable: false, initial: 1, label: "ATORIA.Ruleset.Keywords.Preserve.Increment" }),
            }, { label: "ATORIA.Ruleset.Keywords.Preserve.Label" }),
            equip: new fields.BooleanField({ required: true, initial: false, label: "ATORIA.Ruleset.Keywords.Equip" }),
            two_handed: new fields.BooleanField({ required: true, initial: false, label: "ATORIA.Ruleset.Keywords.Two_handed" }),
            two_handed_more: new fields.BooleanField({ required: true, initial: false, label: "ATORIA.Ruleset.Keywords.Two_handed_more" }),
            light: new fields.BooleanField({ required: true, initial: false, label: "ATORIA.Ruleset.Keywords.Light" }),
            heavy: new fields.BooleanField({ required: true, initial: false, label: "ATORIA.Ruleset.Keywords.Heavy" }),
            heavy_more: new fields.BooleanField({ required: true, initial: false, label: "ATORIA.Ruleset.Keywords.Heavy_more" }),
            quick: new fields.BooleanField({ required: true, initial: false, label: "ATORIA.Ruleset.Keywords.Quick" }),
            quick_more: new fields.BooleanField({ required: true, initial: false, label: "ATORIA.Ruleset.Keywords.Quick_more" }),
            somatic: new fields.BooleanField({ required: true, initial: false, label: "ATORIA.Ruleset.Keywords.Somatic" }),

            // Armor related
            gruff: new fields.BooleanField({ required: true, initial: false, label: "ATORIA.Ruleset.Keywords.Gruff" }),
            gruff_more: new fields.BooleanField({ required: true, initial: false, label: "ATORIA.Ruleset.Keywords.Gruff_more" }),
            tough: new fields.BooleanField({ required: true, initial: false, label: "ATORIA.Ruleset.Keywords.Tough" }),
            tough_more: new fields.BooleanField({ required: true, initial: false, label: "ATORIA.Ruleset.Keywords.Tough_more" }),
            sturdy: new fields.BooleanField({ required: true, initial: false, label: "ATORIA.Ruleset.Keywords.Sturdy" }),
            sturdy_more: new fields.BooleanField({ required: true, initial: false, label: "ATORIA.Ruleset.Keywords.Sturdy_more" }),

            // Weapon related
            guard: new fields.BooleanField({ required: true, initial: false, label: "ATORIA.Ruleset.Keywords.Guard" }),
            guard_more: new fields.BooleanField({ required: true, initial: false, label: "ATORIA.Ruleset.Keywords.Guard_more" }),
            protect: new fields.BooleanField({ required: true, initial: false, label: "ATORIA.Ruleset.Keywords.Protect" }),
            protect_more: new fields.BooleanField({ required: true, initial: false, label: "ATORIA.Ruleset.Keywords.Protect_more" }),
            protection: new fields.BooleanField({ required: true, initial: false, label: "ATORIA.Ruleset.Keywords.Protection" }),
            protection_more: new fields.BooleanField({ required: true, initial: false, label: "ATORIA.Ruleset.Keywords.Protection_more" }),
            brutal: new fields.BooleanField({ required: true, initial: false, label: "ATORIA.Ruleset.Keywords.Brutal" }),
            brutal_more: new fields.BooleanField({ required: true, initial: false, label: "ATORIA.Ruleset.Keywords.Brutal_more" }),
            smash: new fields.BooleanField({ required: true, initial: false, label: "ATORIA.Ruleset.Keywords.Smash" }),
            smash_more: new fields.BooleanField({ required: true, initial: false, label: "ATORIA.Ruleset.Keywords.Smash_more" }),
            penetrating: new fields.BooleanField({ required: true, initial: false, label: "ATORIA.Ruleset.Keywords.Penetrating" }),
            penetrating_more: new fields.BooleanField({ required: true, initial: false, label: "ATORIA.Ruleset.Keywords.Penetrating_more" }),
            sly: new fields.BooleanField({ required: true, initial: false, label: "ATORIA.Ruleset.Keywords.Sly" }),
            direct: new fields.BooleanField({ required: true, initial: false, label: "ATORIA.Ruleset.Keywords.Direct" }),
            direct_more: new fields.BooleanField({ required: true, initial: false, label: "ATORIA.Ruleset.Keywords.Direct_more" }),
            versatile: new fields.BooleanField({ required: true, initial: false, label: "ATORIA.Ruleset.Keywords.Versatile" }),
            reach: new fields.BooleanField({ required: true, initial: false, label: "ATORIA.Ruleset.Keywords.Reach" }),
            reach_more: new fields.BooleanField({ required: true, initial: false, label: "ATORIA.Ruleset.Keywords.Reach_more" }),
            throwable: new fields.BooleanField({ required: true, initial: false, label: "ATORIA.Ruleset.Keywords.Throwable" }),
            throwable_more: new fields.BooleanField({ required: true, initial: false, label: "ATORIA.Ruleset.Keywords.Throwable_more" }),
            recharge: new fields.BooleanField({ required: true, initial: false, label: "ATORIA.Ruleset.Keywords.Recharge" }),
        }
    }

    static defineSchema() {
        const fields = foundry.data.fields;
        const schema = super.defineSchema();

        schema.encumbrance = new fields.NumberField({ required: true, nullable: false, initial: 0, label: "ATORIA.Ruleset.Encumbrance" });

        schema.keywords = new fields.SchemaField(this._getKeywordFields(), { required: true, label: "ATORIA.Ruleset.Keywords.Label" });

        return schema;
    }
}