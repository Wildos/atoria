import { AtoriaTestParameterDialog } from "../applications/test-dialog/test-parameter-dialog.mjs"
import { skillRoll } from "../rolls/dice.mjs"
import { get_critical_value, get_fumble_value } from "../utils.mjs"

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
      if (perception_pair.length == 2) {
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



  async _executeRoll(data_type, data_id) {
    switch (data_type) {
      case 'perception': {
        let perception_id = data_id;
        this.rollPerception(perception_id, {});
        break;
      }
      case 'action': {
        let action_id = data_id;
        this.rollAction(action_id, {});
        break;
      }
      case 'skill': {
        let skill_id = data_id;
        this.rollSkill(skill_id, {});
        break;
      }
      case 'initiative': {
        this.rollInitiativeDialog({});
        break;
      }
      case 'spell': {
        let spell_id = data_id;
        this.rollSpell(spell_id, {});
        break;
      }
      case 'spell-detail': {
        let spell_id = data_id;
        await this.sendSpellDetail(spell_id, {});
        break;
      }
      case 'knowledge': {
        let knowledge_id = data_id;
        this.rollKnowledge(knowledge_id, {});
        break;
      }
      case 'magic': {
        let magic_id = data_id;
        this.rollMagic(magic_id, {});
        break;
      }
      case 'gear-weapon': {
        let weapon_id = data_id;
        this.rollWeapon(weapon_id, {});
        break;
      }
    }
  }






  /**
   * Roll a perception check.
   * Prompt the user for input on which variety of roll they want to do.
   * @param {string} perceptionId    The perception id (e.g. "str")
   * @param {object} options      Options which configure how perception tests or saving throws are rolled
   */
  rollPerception(perceptionId, options = {}) {
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
  rollAction(actionId, options = {}) {
    let action_item = this.items.get(actionId);

    const roll_options = foundry.utils.mergeObject(options, {
      critical: get_critical_value(Number(action_item.system.success_value), Number(action_item.system.critical_mod)),
      fumble: get_fumble_value(Number(action_item.system.success_value), Number(action_item.system.fumble_mod)),
    });

    this._roll({
      title: `${action_item.name}`,
      targetValue: action_item.system.success_value,
      effect_roll: action_item.system.effect_roll
    }, roll_options);
  }

  _get_element_with_matching_id_from_list(element_list, wanted_id) {
    let found_element = null;
    Object.entries(element_list).forEach(([k, v]) => {
      if (v._id === wanted_id) {
        found_element = v;
        return
      }
    });
    return found_element;
  }

  rollWeapon(weaponId, options = {}) {
    let weapon_item = this.items.get(weaponId);
    let linked_skill_data = this.system.skills["combat"][weapon_item.system.linked_combative_skill];

    let action_modifiers = {};
    let known_action_modifier = this.get_action_modifiers();
    Object.entries(weapon_item.system.related_techniques).forEach(([k, v]) => {
      if (v) {
        let found_technique = this._get_element_with_matching_id_from_list(known_action_modifier["technique"], k);
        if (found_technique != null) {
          action_modifiers[k] = {
            used: false,
            name: found_technique.name,
            cost: found_technique.system.cost,
            effect: found_technique.system.effect
          }
        }
      }
    });

    const roll_options = foundry.utils.mergeObject(options, {
      critical: get_critical_value(Number(linked_skill_data.success_value), Number(linked_skill_data.critical_mod) + Number(weapon_item.system.critical_mod)),
      fumble: get_fumble_value(Number(linked_skill_data.success_value), Number(linked_skill_data.fumble_mod) + Number(weapon_item.system.fumble_mod)),
      data: {
        action_modifiers: action_modifiers,
      },
    });

    this._roll({
      title: `${weapon_item.name}`,
      targetValue: linked_skill_data.success_value,
      effect_roll: weapon_item.system.damage_roll,
    }, roll_options);
  }


  /**
     * Roll a skill check.
     * Prompt the user for input on which variety of roll they want to do.
     * @param {string} skillId    The skill uuid
     * @param {object} options      Options which configure how perception tests or saving throws are rolled
     */
  rollSkill(skillId, options = {}) {
    switch (this.type) {
      case 'npc': {
        let skill_item = this.items.get(skillId);

        const roll_options = foundry.utils.mergeObject(options, {
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
        let skill_item = this.items.get(skillId);
        if (!skill_item) {
          const [cat_id, skill_id] = skillId.split('.');
          if (!cat_id || !skill_id) return ui.notifications.warn("This actor does not own this skill");
          let skill_data = this.system.skills[cat_id][skill_id];

          const roll_options = foundry.utils.mergeObject(options, {
            critical: get_critical_value(Number(skill_data.success_value), Number(skill_data.critical_mod)),
            fumble: get_fumble_value(Number(skill_data.success_value), Number(skill_data.fumble_mod)),
          });

          const cat_name = `${game.i18n.localize(CONFIG.ATORIA.SKILLS_LABEL[cat_id])}`;
          const skill_name = `${game.i18n.localize(CONFIG.ATORIA.SKILLS_LABEL[skill_id])}`;
          this._roll({
            title: `${cat_name} - ${skill_name}`,
            targetValue: skill_data.success_value
          }, roll_options);
          return;
        }

        const roll_options = foundry.utils.mergeObject(options, {
          critical: get_critical_value(Number(skill_item.system.success_value), Number(skill_item.system.critical_mod)),
          fumble: get_fumble_value(Number(skill_item.system.success_value), Number(skill_item.system.fumble_mod)),
        });

        const skill_item_cat_name = this.get_item_cat_from_knowledge(skillId) + this.get_item_cat_from_magic(skillId);

        this._roll({
          title: `${skill_item_cat_name} - ${skill_item.name}`,
          targetValue: skill_item.system.success_value
        }, roll_options);
        break;
      }
    }
  }

  get_item_cat_from_knowledge(item_id) {
    for (const group_key in this.system.knowledges) {
      const knowledge_cats = this.system.knowledges[group_key];
      for (const cat_key in knowledge_cats) {
        const sub_skills = [];
        for (const sub_skill_key in knowledge_cats[cat_key].sub_skills) {
          const skill_item = this.items.get(knowledge_cats[cat_key].sub_skills[sub_skill_key]);
          console.log(`get_item_cat_from_knowledge`, skill_item);
          if (!skill_item) continue;
          if (skill_item.id == item_id) {
            return game.i18n.localize(CONFIG.ATORIA.KNOWLEDGES_LABEL[cat_key]);
          }
        }
      }
    }
    return "";
  }

  get_item_cat_from_magic(item_id) {
    for (const cat_key in this.system.magics) {
      const sub_skills = [];
      for (const sub_skill_key in this.system.magics[cat_key].sub_skills) {
        const skill_item = this.items.get(this.system.magics[cat_key].sub_skills[sub_skill_key]);
        if (!skill_item) continue;
        if (skill_item && skill_item.id == item_id) {
          return game.i18n.localize(CONFIG.ATORIA.MAGICS_LABEL[cat_key]);
        }
      }
    }
    return "";
  }

  rollKnowledge(knowledge_id, options = {}) {
    const knowledge_id_parts = knowledge_id.split('.');
    const knowledge_group = knowledge_id_parts[0];
    const knowledge_category = knowledge_id_parts[1];
    const sub_knowledge_index = knowledge_id_parts[2];
    const sub_knowledge_id = this.system.knowledges[knowledge_group][knowledge_category].sub_skills[sub_knowledge_index];
    let knowledge_item = this.items.get(sub_knowledge_id);

    const roll_options = foundry.utils.mergeObject(options, {
      critical: get_critical_value(Number(knowledge_item.system.success_value), Number(knowledge_item.system.critical_mod)),
      fumble: get_fumble_value(Number(knowledge_item.system.success_value), Number(knowledge_item.system.fumble_mod)),
    });

    this._roll({
      title: `${game.i18n.localize(CONFIG.ATORIA.KNOWLEDGES_LABEL[knowledge_category])} - ${knowledge_item.name}`,
      targetValue: knowledge_item.system.success_value
    }, roll_options);
  }

  rollMagic(magic_id, options = {}) {
    const magic_id_parts = magic_id.split('.');
    const magic_category = magic_id_parts[0];
    const sub_magic_index = magic_id_parts[1];
    const sub_magic_id = this.system.magics[magic_category].sub_skills[sub_magic_index];
    let magic_item = this.items.get(sub_magic_id);

    const roll_options = foundry.utils.mergeObject(options, {
      critical: get_critical_value(Number(magic_item.system.success_value), Number(magic_item.system.critical_mod)),
      fumble: get_fumble_value(Number(magic_item.system.success_value), Number(magic_item.system.fumble_mod)),
    });

    this._roll({
      title: `${game.i18n.localize(CONFIG.ATORIA.MAGICS_LABEL[magic_category])} - ${magic_item.name}`,
      targetValue: magic_item.system.success_value
    }, roll_options);
  }



  _spell_supp_to_action_modifier(spell_supp_name, spell_supp) {
    return {
      used: false,
      name: spell_supp_name,
      cost: spell_supp.cost,
      effect: spell_supp.effect_description,
    }
  }


  rollSpell(spellId, options = {}) {
    if (this.type !== "character") return;

    let spell_data = this.items.get(spellId);

    let action_modifiers = {};
    Object.entries(spell_data.system.spell_supps).forEach(([k, v]) => {
      action_modifiers[k] = this._spell_supp_to_action_modifier(game.i18n.format(game.i18n.localize("ATORIA.SuppNaming"), { index: k }), v);
    });

    let known_action_modifier = this.get_action_modifiers();
    Object.entries(spell_data.system.related_incantatory_additions).forEach(([k, v]) => {
      if (v) {
        let found_incantatory_addition = this._get_element_with_matching_id_from_list(known_action_modifier["incantatory_addition"], k);
        if (found_incantatory_addition != null) {
          action_modifiers[k] = {
            used: false,
            name: found_incantatory_addition.name,
            cost: found_incantatory_addition.system.cost,
            effect: found_incantatory_addition.system.effect
          }
        }
      }
    });


    const roll_options = foundry.utils.mergeObject(options, {
      critical: spell_data.system.critical_value,
      fumble: 101 - spell_data.system.fumble_value,
      data: {
        action_modifiers: action_modifiers,
      },
    });

    this._roll({
      title: spell_data.name,
      targetValue: spell_data.system.success_value,
      effect_description: spell_data.system.effect_description,
      critical_effect_description: spell_data.system.critical_effect_description,
    }, roll_options);
  }
  // {
  //         "maxi": {
  //           used: false,
  //           cost:  {
  //             health: 1,
  //             mana: 0,
  //             stamina: 0,
  //             endurance: 5,
  //             restriction: "max 3",
  //           },
  //           effect: "Ca fait [bim: 1d2] [bam:2d4] [boum:12d12] !"
  //         },
  //         "target": {
  //           used: false,
  //           cost:  {
  //             health: 0,
  //             mana: 2,
  //             stamina: 1,
  //             endurance: 0,
  //             restriction: "Requiert 3 cibles",
  //           },
  //           effect: "Ca fait [Kadabra: 2d4-2]!"
  //         }
  //       }


  async sendSpellDetail(spellId, options = {}) {
    if (this.type !== "character") return;

    const spell_data = this.items.get(spellId);
    const speaker = ChatMessage.getSpeaker({ actor: this })
    const content = await renderTemplate("systems/atoria/templates/common/spell-detail.hbs", {
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
  async _roll(data, options = {}) {
    let speaker = ChatMessage.getSpeaker({ actor: this });
    speaker.alias = this.name;
    const rollData = foundry.utils.mergeObject({
      data: data,
      title: `${data.title}`,
      flavor: `${data.title}`,
      messageData: {
        speaker: speaker
      },
      related_actor: this,
    }, options);
    let skill_roll = await skillRoll(rollData);

    return skill_roll;
  }

  /* -------------------------------------------- */

  /**
   * Get an un-evaluated EffectRoll instance used to roll initiative for this Actor.
   * @param {object} [options]                        Options which modify the roll
   * @param {EffectRoll.ADV_MODE} [options.advantageMode]    A specific advantage mode to apply
   * @param {string} [options.flavor]                     Special flavor text to apply
   * @returns {EffectRoll}                               The constructed but unevaluated D20Roll
   */
  getInitiativeRoll(options = {}) {
    // Use a temporarily cached initiative roll
    if (this._cachedInitiativeRoll) return this._cachedInitiativeRoll.clone();

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
  async rollInitiativeDialog(rollOptions = {}) {
    // Create and configure the Initiative roll
    const roll = this.getInitiativeRoll(rollOptions);
    // Temporarily cache the configured roll and use it to roll initiative for the Actor
    this._cachedInitiativeRoll = roll;
    await this.rollInitiative({ createCombatants: true });
    delete this._cachedInitiativeRoll;
  }

  /* -------------------------------------------- */

  /** @inheritdoc */
  async rollInitiative(options = {}) {
    /**
     * A hook event that fires before initiative is rolled for an Actor.
     * @function atoria.preRollInitiative
     * @memberof hookEvents
     * @param {Actor5e} actor  The Actor that is rolling initiative.
     * @param {D20Roll} roll   The initiative roll.
     */
    if (Hooks.call("atoria.preRollInitiative", this, this._cachedInitiativeRoll) === false) return;

    const combat = await super.rollInitiative(options);
    const combatants = this.isToken ? this.getActiveTokens(false, true).reduce((arr, t) => {
      const combatant = game.combat.getCombatantByToken(t.id);
      if (combatant) arr.push(combatant);
      return arr;
    }, []) : [game.combat.getCombatantByActor(this.id)];

    /**
     * A hook event that fires after an Actor has rolled for initiative.
     * @function atoria.rollInitiative
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
      this._spells_displayed = this._spells_displayed.filter(e => { return e !== spellId });
    }
    else this._spells_displayed.push(spellId);
  }

  onSortItems(type, filters) {
    console.log("Used function onSortItems from actor.mjs");
    let sort_values = [];
    let valid_items_ids = [];

    for (let [key, element] of this.items.entries()) {
      if (element.type == type) {
        let is_matching = true;

        for (let filter_key in filters) {
          if (filters[filter_key] != element.system[filter_key]) {
            is_matching = false;
            break;
          }
        }

        if (is_matching) {
          sort_values.push(element.sort);
          valid_items_ids.push(key);
        }
      }
    };

    sort_values.sort((a, b) => { return b - a; });
    valid_items_ids.sort((item_a, item_b) => {
      return this.items.get(item_a).name.localeCompare(this.items.get(item_b).name);
    })

    for (let key of valid_items_ids) {
      let new_sort_value = sort_values.pop();
      let item = this.items.get(key)
      item.update({
        "sort": new_sort_value
      });
    }
  }


  get_action_modifiers() {
    const action_modifiers = {
      "technique": [],
      "incantatory_addition": []
    };
    // Iterate through items, allocating to containers
    for (let i of this.items) {
      // Append to action_modifiers.
      if (i.type === 'action-modifier') {
        const parseHTML = new DOMParser().parseFromString(i.system.effect, 'text/html');
        i.system.effect_cleaned = parseHTML.body.textContent || '';
        switch (i.system.subtype) {
          case "technique":
            action_modifiers["technique"].push(i);
            break;
          case "incantatory_addition":
            action_modifiers["incantatory_addition"].push(i);
            break;
          default:
            console.error(`Unknown action modifier subtype found in ${i._id}`);
        }
      }
    }
    return action_modifiers;
  }


  async remove_item_link(item_type, item_id) {
    if (this.type !== "character") return;
    switch (item_type) {
      case "feature-list-item":
        for (const [cat, features] of Object.entries(this.system.feature_categories)) {
          this.system.feature_categories[cat] = features.filter(el => { return el !== item_id });
        }
        await this.update({
          "system.feature_categories": this.system.feature_categories
        });
        break;
      case 'skill-item': {
        const new_knowledges = this.system.knowledges;
        for (const [key, subknowledge] of Object.entries(new_knowledges)) {
          for (const [subkey, knowledge] of Object.entries(subknowledge)) {
            knowledge.sub_skills = knowledge.sub_skills.filter(el => { return el !== item_id });
          }
        }
        const new_magics = this.system.magics;
        for (const [key, magic] of Object.entries(new_magics)) {
          magic.sub_skills = magic.sub_skills.filter(el => { return el !== item_id });
        }
        await this.update({
          "system.knowledges": new_knowledges,
          "system.magics": new_magics
        });
        break;
      }
    }
  }
}