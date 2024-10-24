import ActorAtoriaSheet from "./base-sheet.mjs";

import ActorSkillConfig from "../configurators/actor-skill-config.mjs"
import ActorKnowledgeConfig from "../configurators/actor-knowledge-config.mjs";
import ActorMagicConfig from "../configurators/actor-magic-config.mjs";

import { confirm_deletion, confirm_dialog } from "../../utils.mjs"

/**
 * An Actor sheet for player character type actors.
 */
export default class ActorAtoriaSheetCharacter extends ActorAtoriaSheet {

  _feature_list_cat_expended = new Set();

  /** @inheritDoc */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["atoria", "sheet", "actor", "character"],
      tabs: [{ navSelector: ".tabs", contentSelector: ".sheet-body", initial: "character" }],
      width: 1026 + 16,
      height: 800,
      dragDrop: [
        { dragSelector: ".item-list .item", dropSelector: ".item-list" },
        { dragSelector: ".custom-item-list .custom-item", dropSelector: ".custom-item-list" },
        { dragSelector: ".hotbar-able", dropSelector: null },
      ]
    });
  }

  /* -------------------------------------------- */
  /*  Context Preparation                         */
  /* -------------------------------------------- */

  /** @inheritDoc */
  async getData(options = {}) {
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
    // const features = [];
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
      // if (i.type === 'feature') {
      //   i.system.has_color = i.system.has_color === "TRUE" ? true : false;
      //   features.push(i);
      // }
      // Append to weapon & combat_items.
      if (i.type === 'gear-weapon') {
        let linked_skill_data = this.actor.system.skills["combat"][i.system.linked_combative_skill];
        i.system.success_value = linked_skill_data.success_value;

        const parseHTML = new DOMParser().parseFromString(i.system.description, 'text/html');
        i.system.description_cleaned = parseHTML.body.textContent || '';

        if (i._id !== this.actor.system.related_pugilat_item) {
          gear_weapons.push(i);
          combat_items.push(i);
        }
      }
      // Append to gear_consumable.
      if (i.type === 'gear-consumable') {
        const parseHTML = new DOMParser().parseFromString(i.system.description, 'text/html');
        i.system.description_cleaned = parseHTML.body.textContent || '';

        gear_consumables.push(i);
      }
      // Append to gear_equipment.
      if (i.type === 'gear-equipment') {
        const parseHTML = new DOMParser().parseFromString(i.system.description, 'text/html');
        i.system.description_cleaned = parseHTML.body.textContent || '';

        gear_equipments.push(i);
      }
      // Append to gear_ingredient.
      if (i.type === 'gear-ingredient') {
        const parseHTML = new DOMParser().parseFromString(i.system.description, 'text/html');
        i.system.description_cleaned = parseHTML.body.textContent || '';

        gear_ingredients.push(i);
      }

      // Append to action_modifiers.
      if (i.type === 'action-modifier') {
        const parseHTML = new DOMParser().parseFromString(i.system.effect, 'text/html');
        i.system.effect_cleaned = parseHTML.body.textContent || '';
        switch (i.system.subtype) {
          case "technique":
            console.log(`technique ${i.name}`);
            technique_known.push(i);
            break;
          case "incantatory_addition":
            console.log(`ajout ${i.name}`);
            incantatory_known.push(i);
            break;
          default:
            console.error(`Unknown action modifier subtype found in ${i._id}`);
        }
      }

      // Append to spells.
      if (i.type === 'spell') {
        if (this.actor._spells_displayed.includes(i._id)) {
          displayed_spells.push(i);
          i.is_displayed = true;
        }
        spells.push(i);
      }
    }

    // Create features categories
    const map_feature_cat_func = (feature_top_category) => {
      let top_category_formatted = [];
      for (const feature_list_id in feature_top_category) {
        const item = this.actor.items.get(feature_top_category[feature_list_id]);
        if (item === undefined)
          continue
        item.isExpanded = this._expanded.has(item._id);
        item.description_formatted =
          top_category_formatted.push(item);
      }
      return top_category_formatted;
    };

    const features_category_combat = context.system.feature_categories.combat;
    const combat_features = map_feature_cat_func(features_category_combat)
    combat_features.sort((a, b) => { return this._sort_item_by_id(context.items, a.id, b.id); });

    const features_category_skill = context.system.feature_categories.skill;
    const skill_features = map_feature_cat_func(features_category_skill)
    skill_features.sort((a, b) => { return this._sort_item_by_id(context.items, a.id, b.id); });

    const features_category_magic = context.system.feature_categories.magic;
    const magic_features = map_feature_cat_func(features_category_magic)
    magic_features.sort((a, b) => { return this._sort_item_by_id(context.items, a.id, b.id); });

    const features_category_knowledge = context.system.feature_categories.knowledge;
    const knowledge_features = map_feature_cat_func(features_category_knowledge)
    knowledge_features.sort((a, b) => { return this._sort_item_by_id(context.items, a.id, b.id); });

    const features_category_other = context.system.feature_categories.other;
    const other_features = map_feature_cat_func(features_category_other)
    other_features.sort((a, b) => { return this._sort_item_by_id(context.items, a.id, b.id); });



    context.combat_features = combat_features;
    context.skill_features = skill_features;
    context.magic_features = magic_features;
    context.knowledge_features = knowledge_features;
    context.other_features = other_features;


    // Assign and return
    context.actions = actions;
    context.combat_items = combat_items;
    // context.features = features;
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
      if (i._id == item_id_a) {
        pos_a = cur_pos;
      }
      if (i._id == item_id_b) {
        pos_b = cur_pos;
      }
      cur_pos += 1;
    }
    return pos_a - pos_b;
  }


  _get_special_css_class_for_sub_skill(sub_skill_key) {
    // console.log(`_get_special_css_class_for_sub_skill : ${sub_skill_key}`);
    if (["silence", "stealth"].includes(sub_skill_key)) {
      const current_encumbrance = this.getCurrentEncumbrance();
      if (current_encumbrance >= (this.actor.system.encumbrance.max - 4.0)) {
        if (current_encumbrance > this.actor.system.encumbrance.max) {
          // above max
          return "encumbrance-above-max";
        }
        else {
          // stealth malus 
          return "encumbrance-stealth-malus";
        }
      }
      else {
        if (current_encumbrance < 9) {
          // stealth bonus 
          return "encumbrance-stealth-bonus";
        }
        else {
          // normal
          return "encumbrance-normal";
        }
      }
    }

    return ""
  }


  /** @override */
  async _prepareData(context) {
    const left_skills = {
      "agility": ["balance", "dexterity"],
      "athletic": ["hiking", "running", "jump"],
      "slyness": ["silence", "stealth", "concealment"],
      "climbing": ["scale", "fall"],
      "swiming": ["ease", "breath-holding"],
      "sturdiness": ["force", "tenacity", "fortitude"],
    };
    const right_skills = {
      "analyse": ["insight", "identification", "investigation"],
      "charisma": ["presence", "seduction"],
      "eloquence": ["persuasion", "calming", "negotiation"],
      "spirit": ["will", "guarding"],
      "intimidation": ["fear", "authority"],
      "trickery": ["acting", "lying", "provocation"],
    };

    const sorting_subskill = function (proper_order_array, elem_a, elem_b) {
      return proper_order_array.indexOf(elem_a.sub_skill_key) < proper_order_array.indexOf(elem_b.sub_skill_key);
    };


    const reflex = ["evasion", "parade", "opportuneness"];

    const formatted_skills = {
      left: [],
      right: []
    };
    const skill_cats = context.system.skills;
    for (const cat_key in skill_cats) {
      const sub_skills = [];
      for (const sub_skill_key in skill_cats[cat_key]) {
        const skill_data = skill_cats[cat_key][sub_skill_key];
        sub_skills.push({
          id: `${cat_key}.${sub_skill_key}`,
          sub_skill_key: sub_skill_key,
          name: game.i18n.localize(CONFIG.ATORIA.SKILLS_LABEL[sub_skill_key]),
          success_value: skill_data.success_value,
          critical_mod: skill_data.critical_mod,
          fumble_mod: skill_data.fumble_mod,
          special_css_class: this._get_special_css_class_for_sub_skill(sub_skill_key),
        });
      }
      if (Object.keys(left_skills).includes(cat_key)) {
        let tmp_sorting_subskill = sorting_subskill.bind(null, left_skills[cat_key]);
        formatted_skills.left.push({
          name: game.i18n.localize(CONFIG.ATORIA.SKILLS_LABEL[cat_key]),
          sub_skills: sub_skills.sort(tmp_sorting_subskill)
        });
      }
      if (Object.keys(right_skills).includes(cat_key)) {
        let tmp_sorting_subskill = sorting_subskill.bind(null, right_skills[cat_key]);
        formatted_skills.right.push({
          name: game.i18n.localize(CONFIG.ATORIA.SKILLS_LABEL[cat_key]),
          sub_skills: sub_skills.sort(tmp_sorting_subskill)
        });
      }
    }

    const tmp_sub_skill = [];
    for (const sub_skill_key in skill_cats["reflex"]) {
      const skill_data = skill_cats["reflex"][sub_skill_key];
      tmp_sub_skill.push({
        id: `reflex.${sub_skill_key}`,
        sub_skill_key: sub_skill_key,
        name: game.i18n.localize(CONFIG.ATORIA.SKILLS_LABEL[sub_skill_key]),
        success_value: skill_data.success_value,
        critical_mod: skill_data.critical_mod,
        fumble_mod: skill_data.fumble_mod,
      });
    }
    let reflex_sorting_subskill = sorting_subskill.bind(null, reflex);
    context.formatted_skill_reflex = {
      name: game.i18n.localize(CONFIG.ATORIA.SKILLS_LABEL["reflex"]),
      sub_skills: tmp_sub_skill.sort(reflex_sorting_subskill)
    }


    const formatted_knowledges = {};
    const knowledge_groups = context.system.knowledges;

    let sorted_knowledges_cat = [];
    // console.log(`prepareData ${JSON.stringify(context.system.knowledges, null, 2)}`);
    for (const group_key in knowledge_groups) {
      const knowledge_cats = knowledge_groups[group_key];
      sorted_knowledges_cat = sorted_knowledges_cat.concat(Object.keys(knowledge_cats));

      for (const cat_key in knowledge_cats) {
        const sub_skills = [];
        for (const sub_skill_key in knowledge_cats[cat_key].sub_skills) {
          const skill_item = this.actor.items.get(knowledge_cats[cat_key].sub_skills[sub_skill_key]);
          if (skill_item === undefined) console.error(`_prepareData:: Invalid item id found: ${cat_key}.${sub_skill_key} : ${JSON.stringify(knowledge_cats[cat_key].sub_skills, null, 2)}`);
          else {
            skill_item["full_id"] = `${group_key}.${cat_key}.${sub_skill_key}`;
            sub_skills.push(skill_item);
          }
          sub_skills.sort((a, b) => { return this._sort_item_by_id(context.items, a.id, b.id); });
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
    for (const cat_key in magic_cats) {
      const sub_skills = [];
      for (const sub_skill_key in magic_cats[cat_key].sub_skills) {
        const skill_item = this.actor.items.get(magic_cats[cat_key].sub_skills[sub_skill_key]);
        if (skill_item === undefined) console.error(`_prepareData:: Invalid item id found: ${cat_key}.${sub_skill_key} : ${JSON.stringify(magic_cats[cat_key].sub_skills, null, 2)}`);
        else {
          skill_item["full_id"] = `${cat_key}.${sub_skill_key}`;
          sub_skills.push(skill_item);
        }
        sub_skills.sort((a, b) => { return this._sort_item_by_id(context.items, a.id, b.id); });
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

    context.health_regain_inactive_data = [];
    let usable_health_regen_number = Math.min(context.system.endurance.value, 100) / 25 + 1;
    const MAX_INACTIVE_HEALTH_REGAIN = 6;
    for (let step = MAX_INACTIVE_HEALTH_REGAIN - 1; step >= 0; step--) {
      context.health_regain_inactive_data.push({
        "is_usable": step < usable_health_regen_number,
        "is_checked": step < context.system.health_regain_inactive,
        "idx": step,
      })
    }

    // handle pugilat item
    let pugilat_item = this.actor.items.get(context.system.related_pugilat_item);
    if (pugilat_item === undefined || pugilat_item === null) {
      const type = "gear-weapon";
      const name = game.i18n.format(game.i18n.localize("ATORIA.NewItem"), { itemType: type.capitalize() });
      const itemData = {
        name: game.i18n.localize("ATORIA.Brawl"),
        type: type,
        system: {
          "encumbrance": 0,
          "description": "",
          "linked_combative_skill": "brawl",
          "critical_mod": 0,
          "fumble_mod": 0,
          "damage_roll": "1d4",
          "related_techniques": []
        }
      };
      pugilat_item = await Item.create(itemData, { parent: this.actor });

      this.actor.update({
        "system.related_pugilat_item": pugilat_item._id
      });
    }

    let linked_skill_data = this.actor.system.skills["combat"][pugilat_item.system.linked_combative_skill];
    pugilat_item.system.success_value = linked_skill_data.success_value;

    const parseHTML = new DOMParser().parseFromString(pugilat_item.system.description, 'text/html');
    pugilat_item.system.description_cleaned = parseHTML.body.textContent || '';

    context.pugilat_item = pugilat_item;


    const offenseHTML = new DOMParser().parseFromString(this.actor.system.offense, 'text/html');
    context.offenseHTML = offenseHTML.body.textContent || '';
    const defenseHTML = new DOMParser().parseFromString(this.actor.system.defense, 'text/html');
    context.defenseHTML = defenseHTML.body.textContent || '';

    context.feature_list_cat_expandlist = {};
    context.feature_list_cat_expandlist["combat"] = {
      isExpanded: this._feature_list_cat_expended.has("combat")
    };
    context.feature_list_cat_expandlist["skill"] = {
      isExpanded: this._feature_list_cat_expended.has("skill")
    };
    context.feature_list_cat_expandlist["magic"] = {
      isExpanded: this._feature_list_cat_expended.has("magic")
    };
    context.feature_list_cat_expandlist["knowledge"] = {
      isExpanded: this._feature_list_cat_expended.has("knowledge")
    };

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
    html.find(".toggle-feature-list-category-visibility").click(this._toggleFeatureListCategoryVisibility.bind(this));

    if (this.isEditable) {
      html.find(".config-skill").click(this._onConfigSkill.bind(this));
      html.find(".config-knowledge").click(this._onConfigKnowledge.bind(this));
      html.find(".config-magic").click(this._onConfigMagic.bind(this));
      html.find(".tickable-image").click(this._onTickableImage.bind(this));

      html.find('input[data-update-item]').change(this._onUpdateItem.bind(this));
      html.find('.time-phase').click(this._onTimePhase.bind(this));
    }

    // Handle default listeners last so system listeners are triggered first
    super.activateListeners(html);
  }


  /**
   * Handle update of item from character sheet
   * 
   */
  _onUpdateItem(event) {
    event.preventDefault();
    const { itemId, updateItem } = event.currentTarget.dataset;
    const item = this.actor.items.get(itemId);
    item.update({ [updateItem]: event.target.value });
  }



  _onTimePhase(event) {
    event.preventDefault();
    const time_phase_type = event.currentTarget.dataset.regainType;
    const title = game.i18n.localize("ATORIA.ConfirmTitle");
    const message = game.i18n.format(game.i18n.localize("ATORIA.ApplyRegainPhase"), { subject: CONFIG.ATORIA.TIME_PHASES_LABEL[time_phase_type] });
    confirm_dialog(title, message, async user_confirmed => {
      if (user_confirmed) {
        this.actor.apply_regain_phase(time_phase_type);
      }
    });
  }

  _toggleFeatureListCategoryVisibility(event) {
    event.preventDefault();
    const header = event.currentTarget;
    const li = $(header).closest(".feature-list-category");
    const cat_name = li.data("catName");
    if (li.hasClass("expanded")) {
      this._feature_list_cat_expended.delete(cat_name);
    }
    else {
      this._feature_list_cat_expended.add(cat_name);
    }
    li.toggleClass("expanded");
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
      case 'feature-list-item': {
        const parent_id = header.dataset.parent;
        const new_feature_categories = this.actor.system.feature_categories;
        new_feature_categories[parent_id].push(item._id);
        this.actor.update({
          "system.feature_categories": new_feature_categories
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
    switch (event.target.dataset?.type) {
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
          "name": `Perception - ${game.i18n.localize(CONFIG.ATORIA.PERCEPTION_LABEL[event.target.dataset?.id])}`,
          "id": event.target.dataset?.id
        };
        event.dataTransfer.setData("text/plain", JSON.stringify(dragData));
        break
      }
      default:
        const target = event.target;

        if (target.className.includes("custom-item")) {
          const custom_item_list = $(target).parents(".custom-item-list");
          const custom_item_list_item_id = custom_item_list.data("itemId");
          const custom_item_list_item_variable = custom_item_list.data("variable");
          const custom_item_id = $(target).data("key");
          const dragData = {
            "item_id": custom_item_list_item_id,
            "item_variable": custom_item_list_item_variable,
            "previous_id": custom_item_id
          };
          event.dataTransfer.setData("custom_data", JSON.stringify(dragData));
          return;
        }
        return super._onDragStart(event);
    }
  }

  async _onDrop(event) {
    if (!this.actor.isOwner) return false;

    const target = event.target;
    if (target.className.includes("custom-item")) { // Handle custom-items
      const custom_drag_data = JSON.parse(event.dataTransfer.getData("custom_data"));
      const main_item = this.actor.items.get(custom_drag_data.item_id);
      const main_item_variable = custom_drag_data.item_variable;
      const old_item_id = custom_drag_data.previous_id;
      const desired_item_id = $(target).data("key");

      const access = (path, object) => {
        return path.split('.').reduce((o, i) => o[i], object)
      }

      let new_variable = access(main_item_variable, main_item);
      let tmp_value = new_variable[desired_item_id];
      new_variable[desired_item_id] = new_variable[old_item_id];
      new_variable[old_item_id] = tmp_value;
      await main_item.update({
        [`${main_item_variable}`]: new_variable
      });
    }

    return await super._onDrop(event);
  }


}

