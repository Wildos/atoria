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
      height: 800,
      dragDrop: [
        {dragSelector: ".item-list .item", dropSelector: null},
        {dragSelector: ".hotbar-able", dropSelector: null},
      ]
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
  async _prepareItems(context) {
    await super._prepareItems(context);
    // Initialize containers.
    const actions = [];
    const combat_items = [];
    const features = [];
    const gear_weapons = [];
    const gear_consumables = [];
    const gear_equipments = [];
    const gear_ingredients = [];
    const spells = [];
    const technique_known = [];
    const incantatory_known = [];
    const displayed_spells = [];

    // Iterate through items, allocating to containers
    for (let i of context.items) {
      // Append to actions.
      if (i.type === 'action') {
        actions.push(i);
        combat_items.push(i);
      }
      // Append to features.
      if (i.type === 'feature') {
        i.system.has_color = i.system.has_color === "TRUE" ? true : false;
        features.push(i);
      }
      // Append to features.
      if (i.type === 'gear-weapon') {
        let linked_skill_data = this.actor.system.skills["combat"][i.system.linked_combative_skill];
        i.system.success_value = linked_skill_data.success_value;

        const parseHTML= new DOMParser().parseFromString(i.system.description, 'text/html');
        i.system.description_cleaned = parseHTML.body.textContent || '';

        gear_weapons.push(i);
        combat_items.push(i);
      }
      // Append to features.
      if (i.type === 'gear-consumable') {
        const parseHTML= new DOMParser().parseFromString(i.system.description, 'text/html');
        i.system.description_cleaned = parseHTML.body.textContent || '';

        gear_consumables.push(i);
      }
      // Append to features.
      if (i.type === 'gear-equipment') {
        const parseHTML= new DOMParser().parseFromString(i.system.description, 'text/html');
        i.system.description_cleaned = parseHTML.body.textContent || '';

        gear_equipments.push(i);
      }
      // Append to features.
      if (i.type === 'gear-ingredient') {
        const parseHTML= new DOMParser().parseFromString(i.system.description, 'text/html');
        i.system.description_cleaned = parseHTML.body.textContent || '';

        gear_ingredients.push(i);
      }

      // Append to action_modifiers.
      if (i.type === 'action-modifier') {
        const parseHTML= new DOMParser().parseFromString(i.system.effect, 'text/html');
        i.system.effect_cleaned = parseHTML.body.textContent || '';
        switch (i.system.subtype) {
          case "technique":
            technique_known.push(i);
            break;
          case "incantatory_addition":
            incantatory_known.push(i);
            break;
          default:
            console.error(`Unknown action modifier subtype found in ${i._id}`);
        }
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
    context.combat_items = combat_items;
    context.features = features;
    context.gear_weapons = gear_weapons;
    context.gear_consumables = gear_consumables;
    context.gear_equipments = gear_equipments;
    context.gear_ingredients = gear_ingredients;
    context.technique_known = technique_known;
    context.incantatory_known = incantatory_known;
    context.spells = spells;
    context.displayed_spells = displayed_spells;
  }


  _sort_item_by_id(item_list, item_id_a, item_id_b) {
    let pos_a = -1;
    let pos_b = -1;
    let cur_pos = 0;
    for (let i of item_list) {
      if (i._id == item_id_a){
        pos_a = cur_pos;
      }
      if (i._id == item_id_b){
        pos_b = cur_pos;
      }
      cur_pos += 1;
    }
    return pos_a - pos_b;
  }

  /** @override */
  _prepareData(context) {
    const left_skills = [
      "agility",
      "athletic",
      "slyness",
      "climbing",
      "swiming",
      "sturdiness",
    ];
    const right_skills = [
      "analyse",
      "charisma",
      "eloquence",
      "spirit",
      "intimidation",
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

    const tmp_sub_skill = [];
    for (const sub_skill_key in skill_cats["reflex"]) {
        const skill_data = skill_cats["reflex"][sub_skill_key];
        tmp_sub_skill.push({
          id: `reflex.${sub_skill_key}`,
          name: game.i18n.localize(CONFIG.ATORIA.SKILLS_LABEL[sub_skill_key]),
          success_value: skill_data.success_value,
          critical_mod: skill_data.critical_mod,
          fumble_mod: skill_data.fumble_mod,
        });
      }
    context.formatted_skill_reflex = {
      name: game.i18n.localize(CONFIG.ATORIA.SKILLS_LABEL["reflex"]),
      sub_skills: tmp_sub_skill
    }


    const formatted_knowledges = {};
    const knowledge_groups = context.system.knowledges;

    let sorted_knowledges_cat = [];
    // console.log(`prepareData ${JSON.stringify(context.system.knowledges, null, 2)}`);
    for (const group_key in knowledge_groups) {
      const knowledge_cats = knowledge_groups[group_key];
      sorted_knowledges_cat = sorted_knowledges_cat.concat(Object.keys(knowledge_cats));
      
      for (const cat_key in knowledge_cats){
        const sub_skills = [];
        for (const sub_skill_key in knowledge_cats[cat_key].sub_skills) {
          const skill_item = this.actor.items.get(knowledge_cats[cat_key].sub_skills[sub_skill_key]);
          if (skill_item === undefined) console.error(`_prepareData:: Invalid item id found: ${cat_key}.${sub_skill_key} : ${JSON.stringify(knowledge_cats[cat_key].sub_skills, null, 2)}`);
          else {
            skill_item["full_id"] = `${group_key}.${cat_key}.${sub_skill_key}`;
            sub_skills.push(skill_item);
          }
          sub_skills.sort((a, b) => {return this._sort_item_by_id(context.items, a.id, b.id);});
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
    sorted_knowledges_cat = sorted_knowledges_cat.filter((el) => {
      return !!game.i18n.localize(CONFIG.ATORIA.KNOWLEDGES_LABEL[el]);
    });
    sorted_knowledges_cat.sort((a, b) => {
      return game.i18n.localize(CONFIG.ATORIA.KNOWLEDGES_LABEL[a]).localeCompare(game.i18n.localize(CONFIG.ATORIA.KNOWLEDGES_LABEL[b]));
    });

    const formatted_magics = {};
    const magic_cats = context.system.magics;
    for (const cat_key in magic_cats){
      const sub_skills = [];
      for (const sub_skill_key in magic_cats[cat_key].sub_skills) {
        const skill_item = this.actor.items.get(magic_cats[cat_key].sub_skills[sub_skill_key]);
        if (skill_item === undefined) console.error(`_prepareData:: Invalid item id found: ${cat_key}.${sub_skill_key} : ${JSON.stringify(magic_cats[cat_key].sub_skills, null, 2)}`);
        else {
          skill_item["full_id"] = `${cat_key}.${sub_skill_key}`;
          sub_skills.push(skill_item);
        }
        sub_skills.sort((a, b) => {return this._sort_item_by_id(context.items, a.id, b.id);});
      }
      formatted_magics[cat_key] = {
        id: cat_key,
        known: magic_cats[cat_key].known,
        name: game.i18n.localize(CONFIG.ATORIA.MAGICS_LABEL[cat_key]),
        sub_skills: sub_skills
      };
    }
    let sorted_magics_cat = Object.keys(magic_cats);
    sorted_magics_cat.sort((a, b) => {
      if (a in CONFIG.ATORIA.MAGICS_LABEL && b in CONFIG.ATORIA.MAGICS_LABEL)
        return game.i18n.localize(CONFIG.ATORIA.MAGICS_LABEL[a]).localeCompare(game.i18n.localize(CONFIG.ATORIA.MAGICS_LABEL[b]));
      return 0;  
    });

    context.formatted_skills = formatted_skills;
    context.sorted_knowledges_cat = sorted_knowledges_cat;
    context.formatted_knowledges = formatted_knowledges;
    context.sorted_magics_cat = sorted_magics_cat;
    context.formatted_magics = formatted_magics;
    // Endurance influence max mana and max stamina
    const endurance_ratio = Math.min(context.system.endurance.value, 100.0) / 100.0;
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

    context.health_regain_inactive_data = [];
    let usable_health_regen_number = Math.min(context.system.endurance.value, 100) / 25 + 1;
    const MAX_INACTIVE_HEALTH_REGAIN = 6;
    for(let step = MAX_INACTIVE_HEALTH_REGAIN - 1; step >= 0; step--) {
      context.health_regain_inactive_data.push({
        "is_usable": step < usable_health_regen_number,
        "is_checked": step < context.system.health_regain_inactive,
        "idx": step,
      })
    }

  }


  getCurrentEncumbrance() {
    let encumbrance_total = 0;
    // equipped armor
    for (let armor_part of ["head", "torso", "shoulders", "arms", "hands", "waist", "legs", "feet"]) {
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
    html.find(".spell-display-detail").click(this._onSpellDisplayDetail.bind(this));

    if ( this.isEditable ) {
      html.find(".config-skill").click(this._onConfigSkill.bind(this));
      html.find(".config-knowledge").click(this._onConfigKnowledge.bind(this));
      html.find(".config-magic").click(this._onConfigMagic.bind(this));
      html.find(".tickable-image").click(this._onTickableImage.bind(this));
    }
  
    // Handle default listeners last so system listeners are triggered first
    super.activateListeners(html);
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



  async _onTickableImage(event) {
    event.preventDefault();
    event.stopPropagation();
    const header = event.currentTarget;
    const tickvalue = header.dataset.tickvalue;
    
    const associated_value = header.dataset.value || "unknown";
    switch (associated_value) {
        case "healing_herbs":
          await this.actor.update({
              "system.healing_herbs_used": !this.actor.system.healing_herbs_used
          });
          break;
        case "healing_medecine":
          await this.actor.update({
              "system.medical_healing_used": !this.actor.system.medical_healing_used
          });
          break;
        case "health_regain_inactive":
          let new_value = Number(tickvalue) + 1
          if (this.actor.system.health_regain_inactive == new_value) { // If click on the already level, disable the click level
            new_value -= 1;
          }
          await this.actor.update({
              "system.health_regain_inactive": new_value
          });
          break;
    }
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
  


  _get_skill_name(full_skill_id) {
    const [cat_id, skill_id] = full_skill_id.split('.');
    const cat_name = `${game.i18n.localize(CONFIG.ATORIA.SKILLS_LABEL[cat_id])}`;
    const skill_name = `${game.i18n.localize(CONFIG.ATORIA.SKILLS_LABEL[skill_id])}`;
    return `${cat_name} - ${skill_name}`;
  }


  /** @inheritdoc */
  _onDragStart(event) {
    switch (event.target.dataset?.type)  {
      case "initiative": {
        const dragData = {
          "type": "initiative",
          "name": "Initiative"
        };
        event.dataTransfer.setData("text/plain", JSON.stringify(dragData));
        break
      }
      case "skill": {
        const dragData = {
          "type": "skill",
          "name": this._get_skill_name(event.target.dataset?.id),
          "id": event.target.dataset?.id
        };
        event.dataTransfer.setData("text/plain", JSON.stringify(dragData));
        break
      }
      case "perception": {
        const dragData = {
          "type": "perception",
          "name":`Perception - ${game.i18n.localize(CONFIG.ATORIA.PERCEPTION_LABEL[event.target.dataset?.id])}`,
          "id": event.target.dataset?.id
        };
        event.dataTransfer.setData("text/plain", JSON.stringify(dragData));
        break
      }
      default:
        return super._onDragStart(event);
    }
  }

}
