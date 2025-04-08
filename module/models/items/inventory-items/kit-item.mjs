import * as atoria_models from "../../module.mjs";

export default class AtoriaKitItem extends atoria_models.AtoriaInventoryItem {

    static defineSchema() {
        const fields = foundry.data.fields;
        const schema = super.defineSchema();

        schema.quantity = new fields.NumberField({ required: true, nullable: false, initial: 0, label: "ATORIA.Model.Quantity" });

        schema.has_usage_limit = new fields.BooleanField({ required: true, nullable: false, initial: false, label: "ATORIA.Model.Usage_limitation.Has_usage_limit" })
        schema.usage_left = new fields.NumberField({ required: true, nullable: false, initial: 0, label: "ATORIA.Model.Usage_limitation.Usage_left" });
        schema.usage_max = new fields.NumberField({ required: true, nullable: false, initial: 0, label: "ATORIA.Model.Usage_limitation.Usage_max" });

        return schema;
    }
}