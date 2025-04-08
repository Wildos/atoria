import * as atoria_models from "../module.mjs";

export default class AtoriaItemBase extends atoria_models.AtoriaDataModel {

  static defineSchema() {
    const fields = foundry.data.fields;
    return {
      description: new fields.StringField({ required: true, nullable: false, blank: true, label: "ATORIA.Model.Description" })
    };
  }
}