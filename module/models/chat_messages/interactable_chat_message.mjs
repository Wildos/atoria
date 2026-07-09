export default class AtoriaInteractableChatMessage
  extends foundry.abstract.DataModel
{
  static defineSchema() {
    const fields = foundry.data.fields;
    let schema = {};

    schema.used_perks = new fields.ArrayField(
      new fields.SchemaField(
        {
          name: new fields.StringField({
            required: true,
            nullable: false,
            blank: false,
            initial: "<Unamed related item>",
            label: "ATORIA.Model.Chat_message.Related_item_data.Name",
          }),
          description: new fields.StringField({
            required: true,
            nullable: false,
            blank: true,
            initial: "",
            label: "ATORIA.Model.Chat_message.Related_item_data.Description",
          }),
        },
        {
          required: false,
          label: "ATORIA.Model.Chat_message.Related_item_data.Label",
        },
      ),
      {
        required: false,
        initial: [],
        label: "ATORIA.Model.Chat_message.Related_item",
      },
    );

    schema.saves_asked = new fields.ArrayField(
      new fields.SchemaField(
        {
          name: new fields.StringField({
            required: true,
            nullable: false,
            blank: false,
            initial: "<Unamed related item>",
            label: "ATORIA.Model.Chat_message.Saves_Asked.Name",
          }),
          skill_path: new fields.StringField({
            required: true,
            nullable: false,
            blank: true,
            initial: "",
            label: "ATORIA.Model.Chat_message.Saves_Asked.Description",
          }),
        },
        {
          required: false,
          label: "ATORIA.Model.Chat_message.Saves_Asked.Label",
        },
      ),
      { required: false, label: "ATORIA.Model.Magic.Saves_asked" },
    );

    return schema;
  }
}
