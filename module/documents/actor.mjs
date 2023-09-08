import {AtoriaTestParameterDialog} from "../applications/test-dialog/test-parameter-dialog.mjs"
import {skillRoll} from "../rolls/dice.mjs"
import {get_critical_value, get_fumble_value} from "../utils.mjs"

/**
 * Extend the base Actor document by defining a custom roll data structure which is ideal for the Simple system.
 * @extends {Actor}
 */
export class AtoriaActor extends Actor {
    _spells_displayed = [];

    /** @override */
    prepareData() {
      // Prepare data for the actor. Calling the super version of this executes
      // the following, in order: data reset (to clear active effects),
      // prepareBaseData(), prepareEmbeddedDocuments() (including active effects),
      // prepareDerivedData().
      super.prepareData();
    }
  
    /** @override */
    prepareBaseData() {
      // Data modifications in this step occur before processing embedded
      // documents or derived data.
    }
  
    /**
     * @override
     * Augment the basic actor data with additional dynamic data. Typically,
     * you'll want to handle most of your calculated/derived data in this step.
     * Data calculated in this step should generally not exist in template.json
     * (such as ability modifiers rather than ability scores) and should be
     * available both inside and outside of character sheets (such as if an actor
     * is queried and has a roll executed directly from it).
     */
    prepareDerivedData() {
      const actorData = this;
      const systemData = actorData.system;
      const flags = actorData.flags.atoria || {};
  
      // Make separate methods for each Actor type (character, npc, etc.) to keep
      // things organized.
      this._prepareCharacterData(actorData);
      this._prepareNpcData(actorData);
    }
  
    /**
     * Prepare Character type specific data
     */
    _prepareCharacterData(actorData) {
      if (actorData.type !== 'character') return;
  
      // Make modifications to data here. For example:
      const systemData = actorData.system;
      systemData.perceptionsListPair = [];
      let perception_pair = [];
      for (let perception in systemData.perceptions) {
        perception_pair.push({
          "id": perception,
          "label": game.i18n.localize(CONFIG.ATORIA.PERCEPTION_LABEL[perception]),
          "success_value": systemData.perceptions[perception].success_value
        });
        if (perception_pair.length == 2){
          systemData.perceptionsListPair.push(perception_pair);
          perception_pair = [];
        }
      }
    }
  
    /**
     * Prepare NPC type specific data.
     */
    _prepareNpcData(actorData) {
      if (actorData.type !== 'npc') return;
  
      // Make modifications to data here. For example:
      const systemData = actorData.system;
      systemData.perceptionsList = [];
      for (let perception in systemData.perceptions) {
        systemData.perceptionsList.push({
          "id": perception,
          "label": game.i18n.localize(CONFIG.ATORIA.PERCEPTION_LABEL[perception]),
          "success_value": systemData.perceptions[perception].success_value
        })
      }
    }
  
    /**
     * Override getRollData() that's supplied to rolls.
     */
    getRollData() {
      const data = super.getRollData();
  
      // Prepare character roll data.
      this._getCharacterRollData(data);
      this._getNpcRollData(data);
  
      return data;
    }
  
    /**
     * Prepare character roll data.
     */
    _getCharacterRollData(data) {
      if (this.type !== 'character') return;
  
    }
  
    /**
     * Prepare NPC roll data.
     */
    _getNpcRollData(data) {
      if (this.type !== 'npc') return;
  
      // Process additional NPC data here.
    }



  /**
   * Roll a perception check.
   * Prompt the user for input on which variety of roll they want to do.
   * @param {string} perceptionId    The perception id (e.g. "str")
   * @param {object} options      Options which configure how perception tests or saving throws are rolled
   */
  rollPerception(perceptionId, options={}) {
    const label = game.i18n.localize(CONFIG.ATORIA.PERCEPTION_LABEL[perceptionId]);
    const perception_options = mergeObject(options, {
      rollMode: "blindroll",
      dialogOptions: {
        force_rollmode: true,
        forced_rollmode: "blindroll"
      },
      critical: get_critical_value(Number(this.system.perceptions[perceptionId].success_value), Number(this.system.perceptions[perceptionId].critical_mod)),
      fumble: get_fumble_value(Number(this.system.perceptions[perceptionId].success_value), Number(this.system.perceptions[perceptionId].fumble_mod)),
    });
    this._roll({
      title: `Perception - ${label}`,
      targetValue: this.system.perceptions[perceptionId].success_value,
    }, perception_options);
  }

  /**
     * Roll an action check.
     * Prompt the user for input on which variety of roll they want to do.
     * @param {string} actionId    The action uuid
     * @param {object} options      Options which configure how perception tests or saving throws are rolled
     */
  rollAction(actionId, options={}) {
    let action_item = this.items.get(actionId);

    const roll_options = foundry.utils.mergeObject(options,  {
      critical: get_critical_value(Number(action_item.system.success_value), Number(action_item.system.critical_mod)),
      fumble: get_fumble_value(Number(action_item.system.success_value), Number(action_item.system.fumble_mod)),
    });

    this._roll({
      title: `${action_item.name}`,
      targetValue: action_item.system.success_value,
      effect_roll: action_item.system.effect_roll
    }, roll_options);
  }

  rollWeapon(weaponId, options={}) {
    let weapon_item = this.items.get(weaponId);

    const roll_options = foundry.utils.mergeObject(options,  {
      critical: get_critical_value(Number(weapon_item.system.success_value), Number(weapon_item.system.critical_mod)),
      fumble: get_fumble_value(Number(weapon_item.system.success_value), Number(weapon_item.system.fumble_mod)),
    });

    this._roll({
      title: `${weapon_item.name}`,
      targetValue: weapon_item.system.success_value,
      effect_roll: weapon_item.system.damage_roll
    }, roll_options);
  }


  /**
     * Roll a skill check.
     * Prompt the user for input on which variety of roll they want to do.
     * @param {string} skillId    The skill uuid
     * @param {object} options      Options which configure how perception tests or saving throws are rolled
     */
  rollSkill(skillId, options={}) {
    switch (this.type){
      case 'npc':{
        let skill_item = this.items.get(skillId);
    
        const roll_options = foundry.utils.mergeObject(options,  {
          critical: get_critical_value(Number(skill_item.system.success_value), Number(skill_item.system.critical_mod)),
          fumble: get_fumble_value(Number(skill_item.system.success_value), Number(skill_item.system.fumble_mod)),
        });
    
        this._roll({
          title: `${skill_item.name}`,
          targetValue: skill_item.system.success_value
        }, roll_options);
        break;
      }
      case 'character': {
        const [cat_id, skill_id] = skillId.split('.');
        let skill_data = this.system.skills[cat_id][skill_id];
    
        const roll_options = foundry.utils.mergeObject(options,  {
          critical: get_critical_value(Number(skill_data.success_value), Number(skill_data.critical_mod)),
          fumble: get_fumble_value(Number(skill_data.success_value), Number(skill_data.fumble_mod)),
        });
    
        const cat_name = `${game.i18n.localize(CONFIG.ATORIA.SKILLS_LABEL[cat_id])}`;
        const skill_name = `${game.i18n.localize(CONFIG.ATORIA.SKILLS_LABEL[skill_id])}`;
        this._roll({
          title: `${cat_name} - ${skill_name}`,
          targetValue: skill_data.success_value
        }, roll_options);
        break;
      }
    }
  }

  rollKnowledge(knowledge_id, options={}) {
    const knowledge_id_parts = knowledge_id.split('.');
    const knowledge_group = knowledge_id_parts[0];
    const knowledge_category = knowledge_id_parts[1];
    const sub_knowledge_index = knowledge_id_parts[2];
    const sub_knowledge_id = this.system.knowledges[knowledge_group][knowledge_category].sub_skills[sub_knowledge_index];
    let knowledge_item = this.items.get(sub_knowledge_id);
    
    const roll_options = foundry.utils.mergeObject(options,  {
      critical: get_critical_value(Number(knowledge_item.system.success_value), Number(knowledge_item.system.critical_mod)),
      fumble: get_fumble_value(Number(knowledge_item.system.success_value), Number(knowledge_item.system.fumble_mod)),
    });

    this._roll({
      title: `${game.i18n.localize(CONFIG.ATORIA.KNOWLEDGES_LABEL[knowledge_category])} - ${knowledge_item.name}`,
      targetValue: knowledge_item.system.success_value
    }, roll_options);
  }

  rollMagic(magic_id, options={}) {
    const magic_id_parts = magic_id.split('.');
    const magic_category = magic_id_parts[0];
    const sub_magic_index = magic_id_parts[1];
    const sub_magic_id = this.system.magics[magic_category].sub_skills[sub_magic_index];
    let magic_item = this.items.get(sub_magic_id);
    
    const roll_options = foundry.utils.mergeObject(options,  {
      critical: get_critical_value(Number(magic_item.system.success_value), Number(magic_item.system.critical_mod)),
      fumble: get_fumble_value(Number(magic_item.system.success_value), Number(magic_item.system.fumble_mod)),
    });

    this._roll({
      title: `${game.i18n.localize(CONFIG.ATORIA.MAGICS_LABEL[magic_category])} - ${magic_item.name}`,
      targetValue: magic_item.system.success_value
    }, roll_options);
  }



  rollSpell(spellId, options={}) {
    if (this.type !== "character") return;
    
    let spell_data = this.items.get(spellId);

    const roll_options = foundry.utils.mergeObject(options,  {
      critical: spell_data.system.critical_value,
      fumble: 101 - spell_data.system.fumble_value,
    });

    this._roll({
      title: spell_data.name,
      targetValue: spell_data.system.success_value,
      effect_description: spell_data.system.effect_description
    }, roll_options);
  }


  async sendSpellDetail(spellId, options={}) {
    if (this.type !== "character") return;
    
    const spell_data = this.items.get(spellId);
    const speaker = ChatMessage.getSpeaker({actor: this})
    const content =  await renderTemplate("systems/atoria/templates/common/spell-detail.hbs", {
      spell: spell_data,
      isChatMessage: true
    });
    ChatMessage.create({
      speaker: speaker,
      whisper: game.users.filter(u => u.isGM),
      blind: false,
      content
    });
  }


  /**
   *
   * @param {any} data data relevant to the specific test (such as what characteristic/item to use)
   * @param {object} options Optional properties to customize the test
   * @param {boolean} roll Whether to evaluate the test or not
   * @returns
   */
  async _roll(data, options={})
  {
    const rollData = foundry.utils.mergeObject({
      data: data,
      title: `${data.title}`,
      flavor: `${data.title}`,
      messageData: {
        speaker: options.speaker || ChatMessage.getSpeaker({actor: this})
      }
    }, options);
    let skill_roll = await skillRoll(rollData);

    return skill_roll;
  }

  /* -------------------------------------------- */

  /**
   * Get an un-evaluated D20Roll instance used to roll initiative for this Actor.
   * @param {object} [options]                        Options which modify the roll
   * @param {D20Roll.ADV_MODE} [options.advantageMode]    A specific advantage mode to apply
   * @param {string} [options.flavor]                     Special flavor text to apply
   * @returns {D20Roll}                               The constructed but unevaluated D20Roll
   */
  getInitiativeRoll(options={}) {
    // Use a temporarily cached initiative roll
    if ( this._cachedInitiativeRoll ) return this._cachedInitiativeRoll.clone();

    // Obtain required data
    const data = this.getRollData();
    options = foundry.utils.mergeObject({
      flavor: options.flavor ?? game.i18n.localize("ATORIA.Initiative"),
      critical: null,
      fumble: null
    }, options);

    // Create the roll
    const formula = this.system.initiative;
    return new CONFIG.Dice.EffectRoll(formula, data, options);
  }

  /* -------------------------------------------- */

  /**
   * Roll initiative for this Actor with a dialog that provides an opportunity to elect advantage or other bonuses.
   * @param {object} [rollOptions]      Options forwarded to the Actor#getInitiativeRoll method
   * @returns {Promise<void>}           A promise which resolves once initiative has been rolled for the Actor
   */
  async rollInitiativeDialog(rollOptions={}) {
    // Create and configure the Initiative roll
    const roll = this.getInitiativeRoll(rollOptions);
    // Temporarily cache the configured roll and use it to roll initiative for the Actor
    this._cachedInitiativeRoll = roll;
    await this.rollInitiative({createCombatants: true});
    delete this._cachedInitiativeRoll;
  }

  /* -------------------------------------------- */

  /** @inheritdoc */
  async rollInitiative(options={}) {
    /**
     * A hook event that fires before initiative is rolled for an Actor.
     * @function atoria.preRollInitiative
     * @memberof hookEvents
     * @param {Actor5e} actor  The Actor that is rolling initiative.
     * @param {D20Roll} roll   The initiative roll.
     */
    if ( Hooks.call("atoria.preRollInitiative", this, this._cachedInitiativeRoll) === false ) return;

    const combat = await super.rollInitiative(options);
    const combatants = this.isToken ? this.getActiveTokens(false, true).reduce((arr, t) => {
      const combatant = game.combat.getCombatantByToken(t.id);
      if ( combatant ) arr.push(combatant);
      return arr;
    }, []) : [game.combat.getCombatantByActor(this.id)];

    /**
     * A hook event that fires after an Actor has rolled for initiative.
     * @function dnd5e.rollInitiative
     * @memberof hookEvents
     * @param {Actor5e} actor           The Actor that rolled initiative.
     * @param {Combatant[]} combatants  The associated Combatants in the Combat.
     */
    Hooks.callAll("atoria.rollInitiative", this, combatants);
    return combat;
  }


  setSpellToDisplayed(spellId) {
    if (this.type !== "character") return;

    if (this._spells_displayed.includes(spellId)) {
      this._spells_displayed = this._spells_displayed.filter(e => {return e !== spellId});
    }
    else this._spells_displayed.push(spellId);
  }


}
