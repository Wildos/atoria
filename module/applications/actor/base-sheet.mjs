import ActorConfig from "../configurators/actor-config.mjs"

import {confirm_deletion} from "../../utils.mjs"

/**
 * Extend the basic ActorSheet class to suppose system-specific logic and functionality.
 * @abstract
 */
export default class ActorAtoriaSheet extends ActorSheet {

  _expanded = new Set();

  /** @override */
  /* https://foundryvtt.com/api/interfaces/client.ApplicationOptions.html */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      scrollY: [],
      width: 720,
      height: 680
    });
  }

  /* -------------------------------------------- */

  /**
   * A set of item types that should be prevented from being dropped on this type of actor sheet.
   * @type {Set<string>}
   */
  static unsupportedItemTypes = new Set();

  /* -------------------------------------------- */

  /** @override */
  get template() {
    return `systems/atoria/templates/actors/${this.actor.type}-sheet.hbs`;
  }

  /* -------------------------------------------- */
  /*  Context Preparation                         */
  /* -------------------------------------------- */

  /** @override */
  async getData(options) {
    // The Actor's data
    const source = this.actor.toObject();

    // Basic data
    const context = foundry.utils.mergeObject(super.getData(options), {
      actor: this.actor,
      source: source.system,
      system: this.actor.system,
      isNPC: this.actor.type === "npc",
      isCharacter: this.actor.type === "character"
    });
    

    // Use a safe clone of the actor data for further operations.
    const actorData = this.actor.toObject(false);

    // Add the actor's data to context.data for easier access, as well as flags.
    context.system = actorData.system;
    context.flags = actorData.flags;

    // Prepare items.
    await this._prepareItems(context);

    await this._prepareData(context);

    // Add roll data for TinyMCE editors.
    context.rollData = context.actor.getRollData();
    
    const console_data = foundry.utils.mergeObject(this.actor, {});
    context.effects = this._prepareEffects(this.actor.effects);

    return context;
  }

  /* -------------------------------------------- */

  /** @inheritdoc */
  async activateEditor(name, options={}, initialContent="") {
    options.relativeLinks = true;
    return super.activateEditor(name, options, initialContent);
  }

  /* --------------------------------------------- */
  /*  Property Attribution                         */
  /* --------------------------------------------- */

  /**
   * Prepare the data structure for items which appear on the actor sheet.
   * Each subclass overrides this method to implement type-specific logic.
   * @protected
   */
  _prepareItems(context) {
    for (let i of context.items) {
      i.isExpanded = this._expanded.has(i._id);
    }
  }

  /**
   * Prepare the data structure which appear on the actor sheet.
   * Each subclass overrides this method to implement type-specific logic.
   * @protected
   */
  _prepareData(context) {}
  



  _prepareEffects(effects) {
    const effects_sorted = [];    
    // Iterate over active effects, classifying them into categories
    for ( let e of effects ) {
      e.isExpanded = this._expanded.has(e.id);
      effects_sorted.push(e);
      // if ( e.disabled ) continue;
      // else if ( e.isTemporary ) effects_sorted.temporary.push(e);
      // else effects_sorted.permanent.push(e);
    }
    return effects_sorted;
  }

  /* -------------------------------------------- */
  /*  Event Listeners and Handlers                */
  /* -------------------------------------------- */

  /** @inheritdoc */
  activateListeners(html) {
    html.find(".config-sheet").click(this._onConfigSheet.bind(this));

    html.find(".rollable").click(this._onRoll.bind(this));


    // Display Detail
    html.find('.item-detail').click(this._onItemDetail.bind(this));
    // Display Detail
    html.find('.effect-detail').click(this._onEffectDetail.bind(this));

    if ( this.isEditable ) {
      // Add Item
      html.find('.item-create').click(this._onItemCreate.bind(this));
      // Config Item
      html.find('.item-config').click(this._onItemEdit.bind(this));

      html.find('.item-delete').click(this._onItemDelete.bind(this));

      // // Add Effect
      html.find('.effect-create').click(this._onEffectCreate.bind(this));
      // Config Effect
      html.find('.effect-config').click(this._onEffectEdit.bind(this));

      html.find('.effect-delete').click(ev => {
        const li = $(ev.currentTarget).parents(".effect");
        const effect = this.actor.effects.get(li.data("effectId"));

        confirm_deletion(effect.name, user_confirmed => {
          if (user_confirmed) {
            effect.delete();
            li.slideUp(200, () => this.render(false));
          }
        });
      });
    }
    // Handle default listeners last so system listeners are triggered first
    super.activateListeners(html);
  }


  /**
  * Handle configuration of sheet.
  * @param {Event} event      The originating click event.
  * @private
  */

  _onConfigSheet(event) {
    event.preventDefault();
    event.stopPropagation();
    let app = new ActorConfig(this.actor);
    app?.render(true);
  }

  /**
  * Handle rolling a check.
  * @param {Event} event      The originating click event.
  * @private
  */
  _onRoll(event) {
    event.preventDefault();
    switch (event.currentTarget.dataset.type) {
      case 'perception': 
        let perception_id = event.currentTarget.dataset.id;
        this.actor.rollPerception(perception_id, {event});
        break;
      case 'action':
        let action_id = event.currentTarget.dataset.id;
        this.actor.rollAction(action_id, {event});
        break;
      case 'skill':
        let skill_id = event.currentTarget.dataset.id;
        this.actor.rollSkill(skill_id, {event});
        break;
      case 'initiative':
        this.actor.rollInitiativeDialog({event});
        break;
    }
  }



  /**
   * Handle creating a new Owned Item for the actor using initial data defined in the HTML dataset
   * @param {Event} event   The originating click event
   * @private
   */
  async _onItemCreate(event) {
    event.preventDefault();
    const header = event.currentTarget;
    // Get the type of item to create.
    const type = header.dataset.type;
    // Grab any data associated with this control.
    const data = duplicate(header.dataset);
    // Initialize a default name.
    const name = game.i18n.format(game.i18n.localize("ATORIA.NewItem"), {itemType: type.capitalize()});
    // Prepare the item object.
    const itemData = {
      name: name,
      type: type,
      system: data
    };
    // Remove the type from the dataset since it's in the itemData.type prop.
    delete itemData.system["type"];

    // Finally, create the item!
    return await Item.create(itemData, {parent: this.actor});
  }


  /**
     * Handle display info of an Item for the actor
     * @param {Event} event   The originating click event
     * @private
     */
  async _onItemDetail(event) {
    event.preventDefault();
    const header = event.currentTarget;
    // Get the type of item to create.
    const id = header.dataset.id;
    const item = this.actor.items.get(id);
    const li = $(header).closest(".item");

    const desc_area = li.children(".description")
    if ( li.hasClass("expanded") ) {
      this._expanded.delete(item.id);
    }
    else {
      const item_desc_area = desc_area.children(".item-description");
      const rendered_description = $(item.system.description || "<p></p>");
      item_desc_area.html(rendered_description);
      item_desc_area.slideDown(200);
      this._expanded.add(item.id);
    }
    li.toggleClass("expanded");
  }

  /**
     * Handle editing an existing Owned Item for the Actor.
     * @param {Event} event    The originating click event.
     * @returns {ItemSheet}  The rendered item sheet.
     * @private
     */
  _onItemEdit(event) {
    event.preventDefault();
    const li = event.currentTarget.closest(".item");
    const item = this.actor.items.get(li.dataset.itemId);
    return item.sheet.render(true);
  }
  

  async _onItemDelete(event) {
    const li = $(event.currentTarget).parents(".item");
    const item = this.actor.items.get(li.data("itemId"));

    confirm_deletion(item.name, user_confirmed => {
      if (user_confirmed) {
        item.delete();
        li.slideUp(200, () => this.render(false));
      }
    });
  }



  /**
   * Handle creating a new Effect for the actor using initial data defined in the HTML dataset
   * @param {Event} event   The originating click event
   * @private
   */
  async _onEffectCreate(event) {
    event.preventDefault();
    return this.actor.createEmbeddedDocuments("ActiveEffect", [{
      label: game.i18n.localize("ATORIA.NewEffect"),
      icon: "icons/svg/aura.svg",
      origin: this.actor.uuid,
      "duration.rounds": undefined,
      disabled: false
    }]);
  }


  /**
     * Handle display info of an Effect for the actor
     * @param {Event} event   The originating click event
     * @private
     */
  async _onEffectDetail(event) {
    event.preventDefault();
    const header = event.currentTarget;
    const id = header.dataset.effectId;
    const effect = this.actor.effects.get(id);
    const li = $(header).closest(".effect");


    const desc_area = li.children(".description")
    if ( li.hasClass("expanded") ) {
      this._expanded.delete(id);
    }
    else {
      const effect_desc_area = desc_area.children(".effect-description");
      const rendered_description = $(effect.description || "<p></p>");
      effect_desc_area.html(rendered_description);
      effect_desc_area.slideDown(200);
      this._expanded.add(id);
    }
    li.toggleClass("expanded");
  }

  /**
     * Handle editing an existing Effect for the Actor.
     * @param {Event} event    The originating click event.
     * @returns {ActiveEffect}  The rendered item sheet.
     * @private
     */
  _onEffectEdit(event) {
    event.preventDefault();
    const li = event.currentTarget.closest(".effect");
    const effect = this.actor.effects.get(li.dataset.effectId);
    return effect.sheet.render(true);
  }

}
