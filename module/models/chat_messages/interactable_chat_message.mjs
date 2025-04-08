export default class AtoriaInteractableChatMessage extends foundry.abstract
  .DataModel {
  static defineSchema() {
    const fields = foundry.data.fields;
    let schema = {};

    schema.additionalCssClass = new fields.ArrayField(
      new fields.StringField({
        required: true,
        nullable: false,
        blank: false,
        initial: "",
        label: "ATORIA.Model.Additional_css_class",
      }),
      { required: true, label: "ATORIA.Model.Additional_css_class" },
    );
    schema.postContent = new fields.HTMLField({ textSearch: true });

    schema.effect = new fields.HTMLField({ textSearch: true });
    schema.critical_effect = new fields.HTMLField({ textSearch: true });

    schema.related_items = new fields.ArrayField(
      new fields.SchemaField(
        {
          type: new fields.StringField({
            required: true,
            nullable: false,
            blank: true,
            initial: "",
            label: "ATORIA.Model.Chat_message.Related_item_data.Type",
          }),
          items_id: new fields.ArrayField(
            new fields.StringField({
              required: true,
              nullable: false,
              blank: false,
              initial: "",
              label: "ATORIA.Model.Chat_message.Related_item_data.Item_id",
            }),
            {
              required: false,
              label: "ATORIA.Model.Chat_message.Related_item_data.Items_id",
            },
          ),
          items: new fields.ArrayField(
            new fields.ObjectField({
              required: true,
              label: "ATORIA.Model.Chat_message.Related_item_data.Item",
            }),
            {
              required: false,
              label: "ATORIA.Model.Chat_message.Related_item_data.Items",
            },
          ),
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

    schema.savesAsked = new fields.ArrayField(
      new fields.StringField({
        required: true,
        nullable: false,
        blank: false,
        initial: "",
        label: "ATORIA.Model.Magic.Save_data.Skill_path",
      }),
      { required: false, label: "ATORIA.Model.Magic.Saves_asked" },
    );

    return schema;
  }
}
