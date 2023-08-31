import BaseConfigSheet from "./base-config.mjs";

/**
 * A form for configuring actor hit points and bonuses.
 */
export default class ActorMagicConfig extends BaseConfigSheet {
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
      classes: ["atoria", "actor-magic-config"],
      template: "systems/atoria/templates/apps/configurators/actor-magic-config.hbs",
      width: 250,
      height: "auto",
      sheetConfig: false
    });
  }

  /* -------------------------------------------- */

  /** @inheritdoc */
  get title() {
    return `Actor magic config: ${this.document.name}`;
  }

  /* -------------------------------------------- */

  /** @inheritdoc */
  getData(options) {
    const magics_names = {};
    for (let cat_key in this.clone.system.magics) {
      this.clone.system.magics[cat_key]["name"] = game.i18n.localize(CONFIG.ATORIA.MAGICS_LABEL[cat_key])
    }
    return {
      magics: this.clone.system.magics
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
        "system.magics": form_var.magics
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