import ActorAtoriaSheet from "./base-sheet.mjs";

import ActorSkillConfig from "../configurators/actor-skill-config.mjs"
import ActorKnowledgeConfig from "../configurators/actor-knowledge-config.mjs";
import ActorMagicConfig from "../configurators/actor-magic-config.mjs";

import {confirm_deletion} from "../../utils.mjs"

/**
 * An Actor sheet for player character type actors.
 */
export default class ActorAtoriaSheetCharacter extends ActorAtoriaSheet {

  /** @inheritDoc */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["atoria", "sheet", "actor", "character"],
      tabs: [{navSelector: ".tabs", contentSelector: ".sheet-body", initial: "character"}],
      width: 1025,
      height: 800
    });
  }

  /* -------------------------------------------- */
  /*  Context Preparation                         */
  /* -------------------------------------------- */

  /** @inheritDoc */
  async getData(options={}) {
    const context = await super.getData(options);

    return foundry.utils.mergeObject(context, {});
  }

  /* -------------------------------------------- */

  /** @override */
  _prepareItems(context) {
    // Initialize containers.
    const actions = [];
    const features = [];
    const gear_weapons = [];
    const gear_consumables = [];
    const gear_equipments = [];
    const gear_ingredients = [];
    const spells = [];
    const displayed_spells = [];

    // Iterate through items, allocating to containers
    for (let i of context.items) {
      // Append to actions.
      if (i.type === 'action') {
        if (i.system.show_detail) {
          i.display_value = 'display: inline-block';
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
      // Append to features.
      if (i.type === 'gear-weapon') {
        gear_weapons.push(i);
      }
      // Append to features.
      if (i.type === 'gear-consumable') {
        gear_consumables.push(i);
      }
      // Append to features.
      if (i.type === 'gear-equipment') {
        gear_equipments.push(i);
      }
      // Append to features.
      if (i.type === 'gear-ingredient') {
        gear_ingredients.push(i);
      }
      // Append to features.
      if (i.type === 'spell') {
        if (this.actor._spells_displayed.includes(i._id)) {
          displayed_spells.push(i);
          i.is_displayed = true;
        }
        spells.push(i);
      }
    }

    // Assign and return
    context.actions = actions;
    context.features = features;
    context.gear_weapons = gear_weapons;
    context.gear_consumables = gear_consumables;
    context.gear_equipments = gear_equipments;
    context.gear_ingredients = gear_ingredients;
    context.spells = spells;
    context.displayed_spells = displayed_spells;
  }

  /** @override */
  _prepareData(context) {
    const left_skills = [
      "agility",
      "analyse",
      "athletic",
      "charisma",
      "slyness",
      "dressage",
      "eloquence",
    ];
    const right_skills = [
      "climbing",
      "spirit",
      "intimidation",
      "swiming",
      "negotiation",
      "reflex",
      "sturdiness",
      "trickery",
    ];


    const formatted_skills = {
      left: [],
      right: []
    };
    const skill_cats = context.system.skills;
    for (const cat_key in skill_cats){
      const sub_skills = [];
      for (const sub_skill_key in skill_cats[cat_key]) {
        const skill_data = skill_cats[cat_key][sub_skill_key];
        sub_skills.push({
          id: `${cat_key}.${sub_skill_key}`,
          name: game.i18n.localize(CONFIG.ATORIA.SKILLS_LABEL[sub_skill_key]),
          success_value: skill_data.success_value,
          critical_mod: skill_data.critical_mod,
          fumble_mod: skill_data.fumble_mod,
        });
      }
      if (left_skills.includes(cat_key)) {
        formatted_skills.left.push({
          name: game.i18n.localize(CONFIG.ATORIA.SKILLS_LABEL[cat_key]),
          sub_skills: sub_skills
        });
      }
      if (right_skills.includes(cat_key)) {
        formatted_skills.right.push({
          name: game.i18n.localize(CONFIG.ATORIA.SKILLS_LABEL[cat_key]),
          sub_skills: sub_skills
        });
      }
    }

    const formatted_knowledges = {};
    const knowledge_groups = context.system.knowledges;

    // console.log(`prepareData ${JSON.stringify(context.system.knowledges, null, 2)}`);
    for (const group_key in knowledge_groups) {
      const knowledge_cats = knowledge_groups[group_key];
      for (const cat_key in knowledge_cats){
        const sub_skills = [];
        for (const sub_skill_key in knowledge_cats[cat_key].sub_skills) {
          const skill_item = this.actor.items.get(knowledge_cats[cat_key].sub_skills[sub_skill_key]);
          if (skill_item === undefined) console.log(`_prepareData:: Invalid item id found: ${knowledge_cats[cat_key].sub_skills[sub_skill_key]}`);
          else {
            skill_item["full_id"] = `${group_key}.${cat_key}.${sub_skill_key}`;
            sub_skills.push(skill_item);
          }
        }
        // console.log(`getData ${JSON.stringify(knowledge_cats[cat_key].sub_skills, null, 2)}`);
        formatted_knowledges[cat_key] = {
          id: `${group_key}.${cat_key}`,
          known: knowledge_cats[cat_key].known,
          name: game.i18n.localize(CONFIG.ATORIA.KNOWLEDGES_LABEL[cat_key]),
          sub_skills: sub_skills
        };
      }
    }

    const formatted_magics = {};
    const magic_cats = context.system.magics;
    for (const cat_key in magic_cats){
      const sub_skills = [];
      for (const sub_skill_key in magic_cats[cat_key].sub_skills) {
        const skill_item = this.actor.items.get(magic_cats[cat_key].sub_skills[sub_skill_key]);
        if (skill_item === undefined) console.log(`_prepareData:: Invalid item id found: ${magic_cats[cat_key].sub_skills[sub_skill_key]}`);
          else {
            skill_item["full_id"] = `${cat_key}.${sub_skill_key}`;
            sub_skills.push(skill_item);
          }
      }
      formatted_magics[cat_key] = {
        id: cat_key,
        known: magic_cats[cat_key].known,
        name: game.i18n.localize(CONFIG.ATORIA.MAGICS_LABEL[cat_key]),
        sub_skills: sub_skills
      };
    }

    context.formatted_skills = formatted_skills;
    context.formatted_knowledges = formatted_knowledges;
    context.formatted_magics = formatted_magics;
    // Endurance influence max mana and max stamina
    const endurance_ratio = context.system.endurance.value / context.system.endurance.max;
    context.system.stamina.current_max = Math.floor(context.system.stamina.max * endurance_ratio);
    context.system.mana.current_max = Math.floor(context.system.mana.max * endurance_ratio);
    // Encumbrance
    const current_encumbrance = this.getCurrentEncumbrance();
    context.system.encumbrance.value = parseFloat(current_encumbrance.toFixed(2));
    if (current_encumbrance >= (context.system.encumbrance.max - 4.0)) {
      if (current_encumbrance >= context.system.encumbrance.max) {
        // above max
        context.encumbrance_level_display_class = "encumbrance-above-max";
      }
      else {
        // stealth malus 
        context.encumbrance_level_display_class = "encumbrance-stealth-malus";
      }
    }
    else {
      if (current_encumbrance >= 7) {
        // normal
        context.encumbrance_level_display_class = "encumbrance-normal";
      }
      else {
        // stealth bonus 
        context.encumbrance_level_display_class = "encumbrance-stealth-bonus";
      }
    }
  }


  getCurrentEncumbrance() {
    let encumbrance_total = 0;
    // equipped armor
    for (let armor_part of ["torso", "shoulders", "arms", "hands", "waist", "legs", "feet"]) {
      encumbrance_total += Number(this.actor.system.equipped_armor[armor_part].encumbrance);
    }
    // weapons and bag
    for (let i of this.actor.items) {
      switch (i.type) {
        case 'gear-weapon':
          encumbrance_total += Number(i.system.encumbrance);
          break;
        case 'gear-consumable':
        case 'gear-equipment':
        case 'gear-ingredient':
          encumbrance_total += Number(i.system.encumbrance) * Number(i.system.quantity);
          break;
      }
    }
    return encumbrance_total;
  }


  /* -------------------------------------------- */
  /*  Event Listeners and Handlers
  /* -------------------------------------------- */

  /** @inheritDoc */
  activateListeners(html) {
    super.activateListeners(html);
    
    html.find(".spell-display-detail").click(this._onSpellDisplayDetail.bind(this));

    if ( this.isEditable ) {
      html.find(".config-skill").click(this._onConfigSkill.bind(this));
      html.find(".config-knowledge").click(this._onConfigKnowledge.bind(this));
      html.find(".config-magic").click(this._onConfigMagic.bind(this));
    }
  }


  /**
  * Handle configuration of skill.
  * @param {Event} event      The originating click event.
  * @private
  */

  _onConfigSkill(event) {
    event.preventDefault();
    event.stopPropagation();
    let app = new ActorSkillConfig(this.actor);
    app?.render(true);
  }

  /**
  * Handle configuration of knowledge.
  * @param {Event} event      The originating click event.
  * @private
  */

  _onConfigKnowledge(event) {
    event.preventDefault();
    event.stopPropagation();
    let app = new ActorKnowledgeConfig(this.actor);
    app?.render(true);
  }


  /**
  * Handle configuration of knowledge.
  * @param {Event} event      The originating click event.
  * @private
  */

  _onConfigMagic(event) {
    event.preventDefault();
    event.stopPropagation();
    let app = new ActorMagicConfig(this.actor);
    app?.render(true);
  }


  _onSpellDisplayDetail(event) {
    event.preventDefault();
    event.stopPropagation();
    const header = event.currentTarget;
    const li = $(header).parents(".item");
    const item_id = li.data("itemId");
    this.actor.setSpellToDisplayed(item_id);
    this.render();
  }

  /**
   * @inheritdoc
   */
  async _onItemCreate(event) {
    const header = event.currentTarget;
    const item = await super._onItemCreate(event);
    switch (header.dataset.action) {
      case 'knowledge-skill-item': {
        const parent_id = header.dataset.parent;
        const parent_ids = parent_id.split('.');
        const new_knowledges = this.actor.system.knowledges;
        new_knowledges[parent_ids[0]][parent_ids[1]].sub_skills.push(item._id);
        this.actor.update({
          "system.knowledges": new_knowledges
        });
        break;
      }
      case 'magic-skill-item': {
        const parent_id = header.dataset.parent;
        const new_magics = this.actor.system.magics;
        new_magics[parent_id].sub_skills.push(item._id);
        this.actor.update({
          "system.magics": new_magics
        });
        break;
      }
    }
    return item;
  }

  async _onItemDelete(event) {
    const header = event.currentTarget;
    const li = $(header).parents(".item");
    const item = this.actor.items.get(li.data("itemId"));

    confirm_deletion(item.name, async user_confirmed => {
      if (user_confirmed) {
        switch (header.dataset.action) {
          case 'knowledge-skill-item': {
            const parent_id = header.dataset.parent;
            const parent_ids = parent_id.split('.');
            const new_knowledges = this.actor.system.knowledges;
            new_knowledges[parent_ids[0]][parent_ids[1]].sub_skills = new_knowledges[parent_ids[0]][parent_ids[1]].sub_skills.filter(el => {return el !== item._id});
            await this.actor.update({
              "system.knowledges": new_knowledges
            });
            break;
          }
          case 'magic-skill-item': {
            const parent_id = header.dataset.parent;
            const new_magics = this.actor.system.magics;
            new_magics[parent_id].sub_skills = new_magics[parent_id].sub_skills.filter(el => {return el !== item._id});
            await this.actor.update({
              "system.magics": new_magics
            });
            break;
          }
        }

        item.delete();
        li.slideUp(200, () => this.render(false));
      }
    });
  } 
  

    /**
  * @inheritdoc
  */
  async _onRoll(event) {
    super._onRoll(event);
    switch (event.currentTarget.dataset.type) {
      case 'spell':{
        let spell_id = event.currentTarget.dataset.id;
        this.actor.rollSpell(spell_id, {event});
        break;
      }
      case 'spell-detail': {
        let spell_id = event.currentTarget.dataset.id;
        await this.actor.sendSpellDetail(spell_id, {event});
        break;
      }
      case 'knowledge': {
        let knowledge_id = event.currentTarget.dataset.id;
        this.actor.rollKnowledge(knowledge_id, {event});
        break;
      }
      case 'magic': {
        let magic_id = event.currentTarget.dataset.id;
        this.actor.rollMagic(magic_id, {event});
        break;
      }
      case 'gear-weapon': {
        let weapon_id = event.currentTarget.dataset.id;
        this.actor.rollWeapon(weapon_id, {event});
        break;
      }
    }
  }
}
