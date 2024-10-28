/**
 * Extend the basic Item with some very simple modifications.
 * @extends {Item}
 */
export class AtoriaItem extends Item {
  /**
   * Augment the basic Item data model with additional dynamic data.
   */
  prepareData() {
    // As with the actor class, items are documents that can have their data
    // preparation methods overridden (such as prepareBaseData()).
    super.prepareData();

    if (this.type == "feature-list") {
      for (let element of this.system.features) {
        element.show_usage_limits = element.regain_type !== CONFIG.ATORIA.TIME_PHASES_PERMANENT;
      }
    }
  }

  /**
   * Prepare a data object which is passed to any Roll formulas which are created related to this Item
   * @private
   */
  getRollData() {
    // If present, return the actor's roll data.
    if (!this.actor) return null;
    const rollData = this.actor.getRollData();
    // Grab the item's system data as well.
    rollData.item = foundry.utils.deepClone(this.system);

    return rollData;
  }

  // /**
  //  * Handle clickable rolls.
  //  * @param {Event} event   The originating click event
  //  * @private
  //  */
  // async roll() {
  //   const item = this;

  //   // Initialize chat data.
  //   const speaker = ChatMessage.getSpeaker({ actor: this.actor });
  //   const rollMode = game.settings.get('core', 'rollMode');
  //   const label = `[${item.type}] ${item.name}`;

  //   // If there's no roll data, send a chat message.
  //   if (!this.system.formula) {
  //     ChatMessage.create({
  //       speaker: speaker,
  //       rollMode: rollMode,
  //       flavor: label,
  //       content: item.system.description ?? ''
  //     });
  //   }
  //   // Otherwise, create a roll and send a chat message from it.
  //   else {
  //     // Retrieve roll data.
  //     const rollData = this.getRollData();
  //     // Invoke the roll and submit it to chat.
  //     const roll = new Roll(rollData.item.formula, rollData);
  //     // If you need to store the value first, uncomment the next line.
  //     // let result = await roll.roll({async: true});
  //     roll.toMessage({
  //       speaker: speaker,
  //       rollMode: rollMode,
  //       flavor: label,
  //     });
  //     return roll;
  //   }
  // }

  async addSpellSupp() {
    if (this.type !== "spell") return

    let key_id = "0";
    while (Object.keys(this.system.spell_supps).includes(key_id)) {
      key_id = String(Number(key_id) + 1);
    }
    this.system.spell_supps[key_id] = {
      cost: {
        health: 0,
        mana: 0,
        stamina: 0,
        endurance: 0,
        restriction: ""
      },
      effect_description: ""
    };
    await this.update({
      "system.spell_supps": this.system.spell_supps
    });
  }

  async removeSpellSupp(key_id) {
    if (this.type !== "spell") return

    await this.update({ [`system.spell_supps.-=${key_id}`]: null });
  }


  async apply_feature_regain(time_phase_type, log) {
    if (this.type !== "feature-list") return

    let modification = {};

    let new_features = this.system.features;
    for (let key in this.system.features) {
      let subfeature = this.system.features[key];
      if (subfeature.regain_type === time_phase_type) {
        const old_amount = subfeature.usage_left || 0;
        const new_amount = subfeature.usage_max || 0;
        if (old_amount !== new_amount) {
          log.push(game.i18n.format(game.i18n.localize("ATORIA.FeatureRegained"), { name: subfeature.name, amount: new_amount - old_amount }));
          new_features[key].usage_left = subfeature.usage_max;
        }
      }
    }
    modification["system.features"] = new_features;
    await this.update(modification);
  }
}
