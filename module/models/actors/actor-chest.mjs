import { AtoriaDataModel } from "../module.mjs";

export default class AtoriaChest extends AtoriaDataModel {

    static defineSchema() {
        const fields = foundry.data.fields;
        const requiredInteger = { required: true, nullable: false, integer: true };
        const schema = {};

        schema.description = new fields.StringField({ required: true, nullable: false, blank: true, label: "ATORIA.Model.Description" })

        schema.encumbrance = new fields.SchemaField({
            max: new fields.NumberField({ ...requiredInteger, initial: 1, min: 0, label: "ATORIA.Model.Encumbrance.Max" })
        }, { label: "ATORIA.Ruleset.Encumbrance" });

        schema.coins = new fields.SchemaField({
            copper: new fields.NumberField({ ...requiredInteger, initial: 0, min: 0, label: "ATORIA.Ruleset.Coins.Copper" }),
            silver: new fields.NumberField({ ...requiredInteger, initial: 0, min: 0, label: "ATORIA.Ruleset.Coins.Silver" }),
            electrum: new fields.NumberField({ ...requiredInteger, initial: 0, min: 0, label: "ATORIA.Ruleset.Coins.Electrum" }),
            gold: new fields.NumberField({ ...requiredInteger, initial: 0, min: 0, label: "ATORIA.Ruleset.Coins.Gold" })
        }, { label: "ATORIA.Model.Coins" });

        return schema
    }

}