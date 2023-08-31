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

  /** @inheritdoc */
  getData(options) {
    const knowledges_names = {};
    for (let group_key in this.clone.system.knowledges){
        const knowledge_group = this.clone.system.knowledges[group_key];
        // console.log(`getData ${JSON.stringify(knowledge_group, null, 2)}`);
        for (let cat_key in knowledge_group) {
            knowledge_group[cat_key]["name"] = game.i18n.localize(CONFIG.ATORIA.KNOWLEDGES_LABEL[cat_key])
        }
    }
    return {
        knowledges: this.clone.system.knowledges
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
    return this.document.update({
        "system.knowledges": form_var.knowledges
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