import BaseConfigSheet from "./base-config.mjs";

/**
 * A form for configuring actor hit points and bonuses.
 */
export default class ActorKnowledgeConfig extends BaseConfigSheet {
  constructor(...args) {
    super(...args);

    /**
     * Cloned copy of the actor for previewing changes.
     * @type {AtoriaActor}
     */
    this.clone = this.object.clone();
  }

  /* -------------------------------------------- */

  /** @override */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["atoria", "actor-knowledge-config"],
      template: "systems/atoria/templates/apps/configurators/actor-knowledge-config.hbs",
      width: 250,
      height: "auto",
      sheetConfig: false
    });
  }

  /* -------------------------------------------- */

  /** @inheritdoc */
  get title() {
    return `Actor knowledge config: ${this.document.name}`;
  }

  /* -------------------------------------------- */

  _character_data_to_handlebar(character_knowledges) {
    let handlebar_knowledges = {};
    for (let group_key in character_knowledges){
        const knowledge_group = character_knowledges[group_key];
        handlebar_knowledges[group_key] = {
          "name": game.i18n.localize(CONFIG.ATORIA.KNOWLEDGES_LABEL[group_key]),
          "sub_knowledges": {}
        };
        let sorted_knowledges_cat = [];
        for (let cat_key in knowledge_group) {
          sorted_knowledges_cat.push(cat_key);
          handlebar_knowledges[group_key]["sub_knowledges"][cat_key] = knowledge_group[cat_key];
          handlebar_knowledges[group_key]["sub_knowledges"][cat_key]["name"] = game.i18n.localize(CONFIG.ATORIA.KNOWLEDGES_LABEL[cat_key]);
        }
        sorted_knowledges_cat.sort((a, b) => {
          return game.i18n.localize(CONFIG.ATORIA.KNOWLEDGES_LABEL[a]).localeCompare(game.i18n.localize(CONFIG.ATORIA.KNOWLEDGES_LABEL[b]));
        });
        handlebar_knowledges[group_key]["sorted_knowledges_cat"] = sorted_knowledges_cat
    }
    return handlebar_knowledges;
  }

  _form_to_character_data(form_knowledges) {
    var character_knowledges = {};
    for (let group_key in form_knowledges){
        character_knowledges[group_key] = form_knowledges[group_key];
    }
    return character_knowledges;
  }





  /** @inheritdoc */
  getData(options) {
    const knowledges_names = {};
    for (let group_key in this.clone.system.knowledges){
        const knowledge_group = this.clone.system.knowledges[group_key];
        for (let cat_key in knowledge_group) {
            knowledge_group[cat_key]["name"] = game.i18n.localize(CONFIG.ATORIA.KNOWLEDGES_LABEL[cat_key])
        }
    }
    // console.log(`getData ${JSON.stringify(this.clone.system.knowledges, null, 2)}`);
    return {
        knowledges: this._character_data_to_handlebar(this.clone.system.knowledges)
    };
  }

  /* -------------------------------------------- */

  /** @inheritdoc */
  _getActorOverrides() {
    return Object.keys(foundry.utils.flattenObject(this.object.overrides?.system || {}));
  }

  /* -------------------------------------------- */

  /** @inheritdoc */
  async _updateObject(event, formData) {
    const form_var = foundry.utils.expandObject(formData);
    // console.log(`${JSON.stringify(form_var.knowledges, null, 2)}`);
    // console.log(`${JSON.stringify(this._form_to_character_data(form_var.knowledges), null, 2)}`);
    
    return this.document.update({
        "system.knowledges": this._form_to_character_data(form_var.knowledges)
    });
  }

  /* -------------------------------------------- */
  /*  Event Listeners and Handlers                */
  /* -------------------------------------------- */

  /** @inheritDoc */
  activateListeners(html) {
    super.activateListeners(html);
  }

  /* -------------------------------------------- */

  /** @inheritdoc */
  async _onChangeInput(event) {
    // await super._onChangeInput(event);
    const t = event.currentTarget;
    // Update clone with new data & re-render
    if (t.type === 'checkbox') this.clone.updateSource({ [`system.${t.name}`]: t.value === "false"});
    else this.clone.updateSource({ [`system.${t.name}`]: t.value || null });
    this.render();
  }
}