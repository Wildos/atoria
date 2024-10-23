import BaseConfigSheet from "./base-config.mjs";

/**
 * A form for configuring actor hit points and bonuses.
 */
export default class ActorSkillConfig extends BaseConfigSheet {
  constructor(...args) {
    super(...args);

    /**
     * Cloned copy of the actor for previewing changes.
     * @type {AtoriaActor}
     */
    this.clone = this.object.clone();
  }

  /* -------------------------------------------- */

  /** @override */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["atoria", "actor-skill-config"],
      template: "systems/atoria/templates/apps/configurators/actor-skill-config.hbs",
      width: 350,
      height: "auto",
      sheetConfig: false
    });
  }

  /* -------------------------------------------- */

  /** @inheritdoc */
  get title() {
    return `Actor config: ${this.document.name}`;
  }

  /* -------------------------------------------- */

  /** @inheritdoc */
  getData(options) {
    const sorted_skills = {
      "agility": ["balance", "dexterity"],
      "athletic": ["hiking", "running", "jump"],
      "slyness": ["silence", "stealth", "concealment"],
      "climbing": ["scale", "fall"],
      "swiming": ["ease", "breath-holding"],
      "sturdiness": ["force", "tenacity", "fortitude"],
      "analyse": ["insight", "identification", "investigation"],
      "charisma": ["presence", "seduction"],
      "eloquence": ["persuasion", "calming", "negotiation"],
      "spirit": ["will", "guarding"],
      "intimidation": ["fear", "authority"],
      "trickery": ["acting", "lying", "provocation"],
      "reflex": ["evasion", "parade", "opportuneness"],
      "combat": ["brawl", "blade", "polearm", "haft-slashing-piercing", "haft-bludgeonning", "shield", "shooting", "throw", "focus", "instrument"],
    };

    const sorting_subskill = function (proper_order_array, elem_a, elem_b) {
      return proper_order_array.indexOf(elem_a.id) < proper_order_array.indexOf(elem_b.id);
    };


    const skill_cats = this.clone.system.skills;


    const formatted_skills = {};
    for (const cat_key in sorted_skills) {
      formatted_skills[cat_key] = {
        name: game.i18n.localize(CONFIG.ATORIA.SKILLS_LABEL[cat_key]),
        sub_skills: []
      };
      const sub_skills = [];
      for (const sub_skill_key in skill_cats[cat_key]) {
        const skill_data = skill_cats[cat_key][sub_skill_key];
        skill_data.id = sub_skill_key;
        skill_data.name = game.i18n.localize(CONFIG.ATORIA.SKILLS_LABEL[sub_skill_key]);
        formatted_skills[cat_key].sub_skills.push(skill_data);
      }
      let tmp_sorting_subskill = sorting_subskill.bind(null, sorted_skills[cat_key]);
      formatted_skills[cat_key].sub_skills.sort(tmp_sorting_subskill)
    }
    return {
      skills: formatted_skills
    };
  }

  /* -------------------------------------------- */

  /** @inheritdoc */
  _getActorOverrides() {
    return Object.keys(foundry.utils.flattenObject(this.object.overrides?.system || {}));
  }

  /* -------------------------------------------- */

  /** @inheritdoc */
  async _updateObject(event, formData) {
    const form_var = foundry.utils.expandObject(formData);
    const updated_skills = this.clone.system.skills;

    for (const cat_key in form_var.skills) {
      const sub_skills = [];
      for (const sub_skill in form_var.skills[cat_key].sub_skills) {
        const sub_skill_key = sub_skill.id;
        const skill_data = updated_skills[cat_key][sub_skill_key];
        skill_data.success_value = sub_skill.success_value;
        skill_data.critical_mod = sub_skill.critical_mod;
        skill_data.fumble_mod = sub_skill.fumble_mod;
      }
    }
    return this.document.update({
      "system.skills": updated_skills,
    });
  }

  /* -------------------------------------------- */
  /*  Event Listeners and Handlers                */
  /* -------------------------------------------- */

  /** @inheritDoc */
  activateListeners(html) {
    super.activateListeners(html);
  }

  /* -------------------------------------------- */

  /** @inheritdoc */
  async _onChangeInput(event) {
    await super._onChangeInput(event);
    const t = event.currentTarget;
    // Update clone with new data & re-render
    if (t.name === "name") this.clone.updateSource({ [`${t.name}`]: t.value || null });
    else this.clone.updateSource({ [`system.${t.name}`]: t.value || null });
    this.render();
  }
}