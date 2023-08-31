/**
 * Override the core method for obtaining a Roll instance used for the Combatant.
 * @see {Actor#getInitiativeRoll}
 * @param {string} [formula]  A formula to use if no Actor is defined
 * @returns {EffectRoll}         The Roll instance which is used to determine initiative for the Combatant
 */
export function getInitiativeRoll(formula="1d2") {
    if ( !this.actor ) return new CONFIG.Dice.EffectRoll(formula ?? "1d2", {});
    return this.actor.getInitiativeRoll();
  }
  