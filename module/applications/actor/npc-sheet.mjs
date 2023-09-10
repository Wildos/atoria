import ActorAtoriaSheet from "./base-sheet.mjs";

/**
 * An Actor sheet for non player character type actors.
 */
export default class ActorAtoriaSheetNPC extends ActorAtoriaSheet {

  /** @inheritDoc */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["atoria", "sheet", "actor", "npc"],
      width: 510,
      height: 620
    });
  }

  /* -------------------------------------------- */
  /*  Context Preparation                         */
  /* -------------------------------------------- */

  /** @inheritDoc */
  async getData(options={}) {
    const context = await super.getData(options);

    return context;
  }

  /* -------------------------------------------- */

  /** @override */
  _prepareItems(context) {
    super._prepareItems(context);
    // Initialize containers.
    const actions = [];
    const features = [];
    const skills = [];

    // Iterate through items, allocating to containers
    for (let i of context.items) {
      // Append to actions.
      if (i.type === 'action') {
        if (i.system.show_detail) {
          i.display_value = 'display: block';
        }
        else {
          i.display_value = 'display: none';
        }
        actions.push(i);
      }
      // Append to features.
      if (i.type === 'feature') {
        if (i.system.show_detail) {
          i.display_value = 'display: block';
        }
        else {
          i.display_value = 'display: none';
        }
        features.push(i);
      }
      // Append to skills.
      if (i.type === 'skill') {
        skills.push(i);
      }
    }

    // Assign and return
    context.actions = actions;
    context.features = features;
    context.skills = skills;
  }

  /* -------------------------------------------- */
  /*  Event Listeners and Handlers
  /* -------------------------------------------- */

  /** @inheritDoc */
  activateListeners(html) {
    super.activateListeners(html);
  }
  
}
