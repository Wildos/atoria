/**
 * A type of Roll specific to a d100-based roll in the Atoria system.
 * @param {string} formula                       The string formula to parse
 * @param {object} data                          The data object against which to parse attributes within the formula
 * @param {object} [options={}]                  Extra optional arguments which describe or modify the SkillRoll
 * @param {number} [options.advantageMode]       What advantage modifier to apply to the roll (none, advantage,
 *                                               disadvantage)
 * @param {number} [options.critical]            The value of d100 result which represents a critical success
 * @param {number} [options.fumble]              The value of d100 result which represents a critical failure
 * @param {(number)} [options.targetValue]       Assign a target value against which the result of this roll should be
 *                                               compared
 */
export default class SkillRoll extends Roll {
    constructor(formula, data, options) {
      super(formula, data, options);
      if ( !this.options.configured ) this.configureModifiers();
      this.targetValue = Number(data?.targetValue);
      this.effect_description = data?.effect_description;
      this.critical_effect_description = data?.critical_effect_description;
      if ( this.data.effect_roll == undefined ) this.data.effect_roll = false;
      if ( this.data.effect_description == undefined ) this.data.effect_description = "";
    }
  
    /* -------------------------------------------- */
  
    /**
     * Create a SkillRoll from a standard Roll instance.
     * @param {Roll} roll
     * @returns {SkillRoll}
     */
    static fromRoll(roll) {
      const newRoll = new this(roll.formula, roll.data, roll.options);
      Object.assign(newRoll, roll);
      return newRoll;
    }
  
    /* -------------------------------------------- */
  
    /**
     * Determine whether a d100 roll should be fast-forwarded, and whether advantage or disadvantage should be applied.
     * @param {object} [options]
     * @param {Event} [options.event]                               The Event that triggered the roll.
     * @param {boolean} [options.advantage]                         Is something granting this roll advantage?
     * @param {boolean} [options.disadvantage]                      Is something granting this roll disadvantage?
     * @param {boolean} [options.fastForward]                       Should the roll dialog be skipped?
     * @returns {{advantageMode: SkillRoll.ADV_MODE, isFF: boolean}}  Whether the roll is fast-forwarded, and its advantage
     *                                                              mode.
     */
    static determineAdvantageMode({event, advantage=false, disadvantage=false, fastForward}={}) {
      const isFF = fastForward ?? (event?.shiftKey || event?.altKey || event?.ctrlKey || event?.metaKey);
      let advantageMode = this.ADV_MODE.NORMAL;
      if ( advantage || event?.altKey ) advantageMode = this.ADV_MODE.ADVANTAGE;
      else if ( disadvantage || event?.ctrlKey || event?.metaKey ) advantageMode = this.ADV_MODE.DISADVANTAGE;
      return {isFF: !!isFF, advantageMode};
    }
  
    /* -------------------------------------------- */
  
    /**
     * Advantage mode of a Atoria d100 roll
     * @enum {number}
     */
    static ADV_MODE = {
      NORMAL: 0,
      ADVANTAGE: 1,
      DISADVANTAGE: -1
    }
  
    /* -------------------------------------------- */
  
    /**
     * The HTML template path used to configure evaluation of this Roll
     * @type {string}
     */
    static EVALUATION_TEMPLATE = "systems/atoria/templates/apps/test-dialogs/test-dialog.hbs";
    /**
     * The HTML template path used to display roll of this Roll
     * @type {string}
     */
    static DISPLAY_TEMPLATE = "systems/atoria/templates/chat/rolls/roll.hbs";
    /* -------------------------------------------- */
  
    /**
     * Does this roll start with a d100?
     * @type {boolean}
     */
    get validD100Roll() {
      return (this.terms[0] instanceof Die) && (this.terms[0].faces === 100);
    }
  
    /* -------------------------------------------- */
  
    /**
     * A convenience reference for whether this SkillRoll has advantage
     * @type {boolean}
     */
    get hasAdvantage() {
      return this.options.advantageMode === SkillRoll.ADV_MODE.ADVANTAGE;
    }
  
    /* -------------------------------------------- */
  
    /**
     * A convenience reference for whether this SkillRoll has disadvantage
     * @type {boolean}
     */
    get hasDisadvantage() {
      return this.options.advantageMode === SkillRoll.ADV_MODE.DISADVANTAGE;
    }
  
    /* -------------------------------------------- */
  
    /**
     * Is this roll a critical success? Returns undefined if roll isn't evaluated.
     * @type {boolean|void}
     */
    get isCritical() {
      if ( !this.validD100Roll || !this._evaluated ) return undefined;
      if ( !Number.isNumeric(this.options.critical) ) return false;
      return this.dice[0].total <= this.options.critical;
    }
  
    /* -------------------------------------------- */
  
    /**
     * Is this roll a critical failure? Returns undefined if roll isn't evaluated.
     * @type {boolean|void}
     */
    get isFumble() {
      if ( !this.validD100Roll || !this._evaluated ) return undefined;
      if ( !Number.isNumeric(this.options.fumble) ) return false;
      return this.dice[0].total >= this.options.fumble;
    }
  
    /* -------------------------------------------- */
    /*  D100 Roll Methods                            */
    /* -------------------------------------------- */
  
    /**
     * Apply optional modifiers which customize the behavior of the d100term
     * @private
     */
    configureModifiers() {
      if ( !this.validD100Roll ) return;
  
      const d100 = this.terms[0];
      d100.modifiers = [];
  
      // Handle Advantage or Disadvantage
      if ( this.hasAdvantage ) {
        d100.number = 2;
        d100.modifiers.push("kl");
        d100.options.advantage = true;
      }
      else if ( this.hasDisadvantage ) {
        d100.number = 2;
        d100.modifiers.push("kh");
        d100.options.disadvantage = true;
      }
      else d100.number = 1;
  
      // Assign critical and fumble thresholds
      if ( this.options.critical !== undefined ) d100.options.critical = this.options.critical;
      if ( this.options.fumble !== undefined ) d100.options.fumble = this.options.fumble;
      
      // Re-compile the underlying formula
      this._formula = this.constructor.getFormula(this.terms);
  

      if ( this.success_modifier == undefined ) this.success_modifier = 0;
      if ( this.SL_modifier  == undefined ) this.SL_modifier = 0;

      // Mark configuration as complete
      this.options.configured = true;
    }
  
    /* -------------------------------------------- */
  
    /** @inheritdoc */
    async evaluate(option) {
      await super.evaluate(option);
    }

    /* -------------------------------------------- */

    async computeResult()
    {
        this.rollDetail = [];
        for(let dice_result in this.terms[0].results) {
          this.rollDetail.push(this.terms[0].results[dice_result].result);
        }
        
        this.marginOfSuccess = (this.targetValue - this.total) + this.success_modifier;
        this.signedSL = this.calculateSL(this.marginOfSuccess, this.SL_modifier);


        let tmp_full_effect_array = [];

        if (this.data.effect_rolls) {
          for (let i in this.data.effect_rolls) {
            let roll_data = this.data.effect_rolls[i];
            let tmp_roll_name = "";
            let tmp_effect_result = "";
            let tmp_effect_detail = "";

            // const effect_roll_formula = (this.isCritical)? this.data.effect_roll.replace("d", "*") : this.data.effect_roll;
            let effect_roll = new Roll(roll_data["roll_dice_formula"]);
            if (Roll.validate(effect_roll.formula)) {
              await effect_roll.evaluate({"maximize": this.isCritical});
      
              tmp_roll_name = roll_data["roll_name"];
              if (tmp_roll_name.length !== 0) {
                tmp_roll_name += ": ";
              }

              for(let dice_nb in effect_roll.terms) {
                switch (effect_roll.terms[dice_nb].constructor.name) {
                  case "Die":
                    let dice_effect_detail = []
                    for(let dice_result in effect_roll.terms[dice_nb].results) {
                      dice_effect_detail.push(effect_roll.terms[dice_nb].results[dice_result].result);
                    }
                    tmp_effect_detail += "{" + (dice_effect_detail.join(", ")) + "}";
                    break;
                  case "OperatorTerm":
                    tmp_effect_detail += " " + effect_roll.terms[dice_nb].operator + " ";
                    break;
                  case "NumericTerm":
                    tmp_effect_detail += effect_roll.terms[dice_nb].number;
                    break;
                  default:
                    console.log(`skill-roll.mjs::computeResult => Unknown class '${effect_roll.terms[dice_nb].constructor.name}'`);
                    break;
                }
              }
            }

            tmp_full_effect_array.push({
              "result": `${tmp_roll_name}${effect_roll.total}`,
              "detail": tmp_effect_detail
            });
          }
        }

        this.effects_array = tmp_full_effect_array;


        for(let dice_result in this.terms[0].results) {
          this.terms[0].results[dice_result].isCritical = this.terms[0].results[dice_result].result <= this.options.critical;
          this.terms[0].results[dice_result].isFumble = this.terms[0].results[dice_result].result >= this.options.fumble;
        }
    }

    /* -------------------------------------------- */

    calculateSL(marginOfSuccess, modifier=0)
    {
        let op = marginOfSuccess < 0 ? "ceil" : "floor";
        let SL = Math[op](marginOfSuccess / 10);
        SL += modifier;

        if (SL > 0)
        {
            return `+${SL}`;
        }
        else if (SL < 0)
        {
            return `${SL}`;
        }
        // If 0, could be either +0 or -0
        // Two cases, natural roll, or SL modified. Both cases can be solved by looking at the original roll vs target
        else if (SL == 0)
        {
            if (marginOfSuccess > 0)
            {
                return `+${SL}`;
            }
            else if (marginOfSuccess < 0)
            {
                return `-${SL}`;
            }
        }
        return '0';
    }
    /* -------------------------------------------- */
  
    _effect_string_to_effect_roll(effect_string) {
      var result = effect_string.matchAll(/\[([a-zA-ZÀ-ÖØ-öø-ʯ ]*):? *([0-9dD+-]*)\]/g);
      var result_data = [];
      for (let match of result) {
        let [full, roll_name, roll_dice_formula] = match;
        result_data = {
          "roll_name": roll_name,
          "roll_dice_formula": roll_dice_formula
        };
      }
      return result_data // ["<Name>", 1d8]
    }


    _extract_all_rolls(string) {
      return string.match(/\[[a-zA-ZÀ-ÖØ-öø-ʯ ]*:? *[0-9dD+-]*\]/g)
    }


    /** @inheritdoc */
    async toMessage(messageData={}, options={}) {
  
      // Evaluate the roll now so we have the results available to determine whether reliable talent came into play
      if ( !this._evaluated ) await this.evaluate({async: true});
  

      if (!this.data.effect_roll && this.data.effect_description) {
        let effect_rolls_found = this._extract_all_rolls(this.data.effect_description);
        console.dir(effect_rolls_found);
        if (effect_rolls_found && effect_rolls_found.length > 0) {
          this.data.effect_rolls = effect_rolls_found.map((x) => this._effect_string_to_effect_roll(x));
        }
      } else if (this.data.effect_roll) {
        this.data.effect_rolls = [{
          "roll_name": "",
          "roll_dice_formula": this.data.effect_roll
        }]
      }

      await this.computeResult();

      let adv_string = "";
      if ( this.hasAdvantage ) adv_string += `${game.i18n.localize("ATORIA.Advantage")}`;
      else if ( this.hasDisadvantage ) adv_string += `${game.i18n.localize("ATORIA.Disadvantage")}`;

      const content = await renderTemplate(this.constructor.DISPLAY_TEMPLATE, {
        roll_detail: this.rollDetail.join(", "),
        skill_name: this.options.flavor,
        roll: this.result,
        target: this.targetValue,
        signedSL: this.signedSL,
        marginOfSuccess: this.marginOfSuccess,
        success_modifier: (this.success_modifier > 0) ? `+${this.success_modifier}`: `${this.success_modifier}`,
        SL_modifier: (this.SL_modifier > 0) ? `+${this.SL_modifier}`: `${this.SL_modifier}`,


        effects_array : this.effects_array,

        effect_detail: `${this.data.effect_roll} = ${this.effect_detail}`,
        effect_result: this.effect_result,


        isCritical: this.isCritical,
        isFumble: this.isFumble,
        roll_obj: this.terms[0].results,
        adv_string,
        critical_effect_description: await this._roll_string_effect(this.critical_effect_description)
      });

      messageData.content = content;

      // Add appropriate advantage mode message flavor and atoria roll flags
      messageData.flavor = "";//messageData.flavor || `${this.options.flavor}: ${this.targetValue}`;
    
      // Record the preferred rollMode
      options.rollMode = options.rollMode ?? this.options.rollMode;
      return super.toMessage(messageData, options);
    }
  


    async _roll_string_effect(string_to_parse){
      if (!string_to_parse) {
        return "";
      }
      let effect_results = [];

      let roll_formulas = this._extract_all_rolls(string_to_parse);
      if (!roll_formulas) {
        return string_to_parse;
      }

      for (let roll_formula of roll_formulas) {
        let effect_roll = new Roll(this._effect_string_to_effect_roll(roll_formula)["roll_dice_formula"]);
        await effect_roll.evaluate();

        // let effect_detail = [];
        // for(let dice_result in effect_roll.terms[0].results) {
        //   effect_detail.push(effect_roll.terms[0].results[dice_result].result);
        // }
        // effect_results.push(effect_detail.join(", "));

        let effect_detail = '';
        for(let dice_nb in effect_roll.terms) {
          switch (effect_roll.terms[dice_nb].constructor.name) {
            case "Die":
              let dice_effect_detail = []
              for(let dice_result in effect_roll.terms[dice_nb].results) {
                dice_effect_detail.push(effect_roll.terms[dice_nb].results[dice_result].result);
              }
              effect_detail += "{" + (dice_effect_detail.join(", ")) + "}";
              break;
            case "OperatorTerm":
              effect_detail += " " + effect_roll.terms[dice_nb].operator + " ";
              break;
            case "NumericTerm":
              effect_detail += effect_roll.terms[dice_nb].number;
              break;
            default:
              console.log(`skill-roll.mjs::computeResult => Unknown class '${effect_roll.terms[dice_nb].constructor.name}'`);
              break;
          }
        }
        effect_results.push(effect_detail);
        effect_results.push(effect_roll.total);
      }

      let output_string = string_to_parse;
      while (effect_results.length > 1) {
        const roll_effect_detail = '<span class="skill-effect" title="' + effect_results.shift() + '">' + effect_results.shift() + '</span>';
        output_string = output_string.replace(/\[([a-zA-ZÀ-ÖØ-öø-ʯ ]*:? *)[0-9dD+-]*\]/, `$1${roll_effect_detail}`);
      }

      return output_string;
    }


    /* -------------------------------------------- */
    /*  Configuration Dialog                        */
    /* -------------------------------------------- */
  
    /**
     * Create a Dialog prompt used to configure evaluation of an existing SkillRoll instance.
     * @param {object} data                     Dialog configuration data
     * @param {string} [data.title]             The title of the shown dialog window
     * @param {number} [data.defaultRollMode]   The roll mode that the roll mode select element should default to
     * @param {number} [data.defaultAction]     The button marked as default
     * @param {string} [data.template]          A custom path to an HTML template to use instead of the default
     * @param {object} options                  Additional Dialog customization options
     * @returns {Promise<SkillRoll|null>}         A resulting SkillRoll object constructed with the dialog, or null if the
     *                                          dialog was closed
     */
    async configureDialog({title, defaultRollMode, defaultAction=SkillRoll.ADV_MODE.NORMAL,
      template}={}, options={}) {
  

      let available_rollmodes = CONFIG.Dice.rollModes;
      if (options.force_rollmode) {
        available_rollmodes = {};
        available_rollmodes[options.forced_rollmode] = CONFIG.Dice.rollModes[options.forced_rollmode];
      }

      // Render the Dialog inner HTML
      let dialog_roll_data = {
        modifier: 0,
        SL: 0,
        defaultRollMode,
        rollModes: available_rollmodes,
        action_modifiers: {
          "0": {
            used: false,
            restriction: "Max: 3",
            cost: "Pas cher",
            effect: "Ca fait bim bam boum!"
          },
          "1": {
            used: false,
            restriction: "Requiert 3 cibles",
            cost: "Très cher",
            effect: "Ca fait Kadabra!"
          }
        }
      };
      const content = await renderTemplate(template ?? this.constructor.EVALUATION_TEMPLATE, dialog_roll_data);
  
      let defaultButton = "normal";
      switch ( defaultAction ) {
        case SkillRoll.ADV_MODE.ADVANTAGE: defaultButton = "advantage"; break;
        case SkillRoll.ADV_MODE.DISADVANTAGE: defaultButton = "disadvantage"; break;
      }
  
      // Create the Dialog window and await submission of the form
      return new Promise(resolve => {
        new Dialog({
          title,
          content,
          buttons: {
            advantage: {
            label: game.i18n.localize("ATORIA.Advantage"),
              callback: html => resolve(this._onDialogSubmit(html, SkillRoll.ADV_MODE.ADVANTAGE))
            },
            normal: {
              label: game.i18n.localize("ATORIA.Normal"),
              callback: html => resolve(this._onDialogSubmit(html, SkillRoll.ADV_MODE.NORMAL))
            },
            disadvantage: {
              label: game.i18n.localize("ATORIA.Disadvantage"),
              callback: html => resolve(this._onDialogSubmit(html, SkillRoll.ADV_MODE.DISADVANTAGE))
            }
          },
          default: defaultButton,
          close: () => resolve(null)
        }, options).render(true);
      });
    }
  
    /* -------------------------------------------- */
  
    /**
     * Handle submission of the Roll evaluation configuration Dialog
     * @param {jQuery} html            The submitted dialog content
     * @param {number} advantageMode   The chosen advantage mode
     * @returns {SkillRoll}              This damage roll.
     * @private
     */
    _onDialogSubmit(html, advantageMode) {
      const form = html[0].querySelector("form");
    

      // Apply advantage or disadvantage
      this.options.advantageMode = advantageMode;
      this.success_modifier = Number(form.modifier.value);
      this.SL_modifier = Number(form.SL.value);
      this.options.rollMode = form.rollMode.value;

      this.action_modifiers_used = []
      let selected_action_modifiers = {}
      selected_action_modifiers["0"] = form.action_modifiers_0_used.checked;
      selected_action_modifiers["1"] = form.action_modifiers_1_used.checked;

      console.log(`selected_action_modifiers ${JSON.stringify(selected_action_modifiers, null, 2)}`);


      this.configureModifiers();
      return this;
    }

}
  