import BaseConfigSheet from "./base-config.mjs";

/**
 * A form for configuring actor hit points and bonuses.
 */
export default class ActorBaseAttributeConfig extends BaseConfigSheet {
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
      classes: ["atoria", "actor-config"],
      template: "systems/atoria/templates/apps/configurators/actor-config.hbs",
      width: 250,
      height: "auto",
      sheetConfig: false
    });
  }

  /* -------------------------------------------- */

  /** @inheritdoc */
  get title() {
    return `Actor config: ${this.document.name}`;
  }

  /* -------------------------------------------- */

  /** @inheritdoc */
  getData(options) {
    return {
      name: this.clone.name,
      health: this.clone.system.health,
      stamina: this.clone.system.stamina,
      mana: this.clone.system.mana,
      armor: this.clone.system.armor,
      initiative: this.clone.system.initiative,
      movement: this.clone.system.movement,
      perceptions: this.clone.system.perceptions,

      sanity: this.clone.system.sanity || 0,
      endurance: this.clone.system.endurance || 0,
      encumbrance: this.clone.system.encumbrance || 0,

      isCharacter: this.document.type === "character"
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
      "name": form_var.name,
      "system.health": form_var.health,
      "system.stamina": form_var.stamina,
      "system.mana": form_var.mana,
      "system.armor": form_var.armor,
      "system.initiative": form_var.initiative,
      "system.movement": form_var.movement,
      "system.perceptions": form_var.perceptions,
      "system.sanity": form_var.sanity,
      "system.endurance": form_var.endurance,
      "system.encumbrance": form_var.encumbrance,
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
    await super._onChangeInput(event);
    const t = event.currentTarget;
    // Update clone with new data & re-render
    if (t.name === "name") this.clone.updateSource({ [`${t.name}`]: t.value || null });
    else this.clone.updateSource({ [`system.${t.name}`]: t.value || null });
    this.render();
  }
}