import * as atoria_models from "../../module.mjs";
import * as utils from "../../../utils/module.mjs";

export default class AtoriaArmorItem extends atoria_models.AtoriaInventoryItem {
  static defineSchema() {
    const fields = foundry.data.fields;
    const schema = super.defineSchema();

    schema.worn_encumbrance = new fields.NumberField({
      required: true,
      nullable: false,
      initial: 0,
      label: "ATORIA.Ruleset.Armor.Worn_encumbrance",
    });

    schema.position = new fields.StringField({
      required: true,
      nullable: false,
      blank: false,
      choices: utils.ruleset.armor.positions,
      initial: Object.keys(utils.ruleset.armor.positions)[0],
      label: "ATORIA.Ruleset.Armor.Position.Label",
    });
    schema.armor_type = new fields.StringField({
      required: true,
      nullable: false,
      blank: false,
      choices: utils.ruleset.armor.types,
      initial: Object.keys(utils.ruleset.armor.types)[0],
      label: "ATORIA.Ruleset.Armor.Type.Label",
    });

    schema.is_worn = new fields.BooleanField({
      required: true,
      initial: false,
      label: "ATORIA.Sheet.Inventory.Worn",
    });

    return schema;
  }
}
