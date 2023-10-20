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
    const knowledges = [];

    // Iterate through items, allocating to containers
    for (let i of context.items) {
      // Append to actions.
      if (i.type === 'action') {
        actions.push(i);
      }
      // Append to features.
      if (i.type === 'feature') {
        features.push(i);
      }
      // Append to skills.
      if (i.type === 'skill') {
        //TODO: separate skill from knowledge
        switch (i.system.action) {
          case "skill-item":
            skills.push(i);
            break;
          case "knowledge-item":
            knowledges.push(i);
            break;
        }
      }
    }

    // Assign and return
    context.actions = actions;
    context.features = features;
    context.skills = skills;
    context.knowledges = knowledges;
  }

  /* -------------------------------------------- */
  /*  Event Listeners and Handlers
  /* -------------------------------------------- */

  /** @inheritDoc */
  activateListeners(html) {
    super.activateListeners(html);
  }
  
}
