/**
 * A type of Roll specific roll in the Atoria system.
 * @param {string} formula                       The string formula to parse
 * @param {object} data                          The data object against which to parse attributes within the formula
 * @param {object} [options={}]                  Extra optional arguments which describe or modify the EffectRoll
 * @param {number} [options.advantageMode]       What advantage modifier to apply to the roll (none, advantage,
 *                                               disadvantage)
 * @param {number} [options.critical]            The value of d100 result which represents a critical success
 * @param {number} [options.fumble]              The value of d100 result which represents a critical failure
 * @param {(number)} [options.targetValue]       Assign a target value against which the result of this roll should be
 *                                               compared
 */
export default class EffectRoll extends Roll {
    constructor(formula, data, options) {
      super(formula, data, options);
    }
  
    /* -------------------------------------------- */
  
    /**
     * Create a EffectRoll from a standard Roll instance.
     * @param {Roll} roll
     * @returns {EffectRoll}
     */
    static fromRoll(roll) {
      const newRoll = new this(roll.formula, roll.data, roll.options);
      Object.assign(newRoll, roll);
      return newRoll;
    }
  
    /* -------------------------------------------- */
  
    /**
     * Determine whether a roll should be fast-forwarded, and whether advantage or disadvantage should be applied.
     * @param {object} [options]
     * @param {Event} [options.event]                               The Event that triggered the roll.
     * @param {boolean} [options.advantage]                         Is something granting this roll advantage?
     * @param {boolean} [options.disadvantage]                      Is something granting this roll disadvantage?
     * @param {boolean} [options.fastForward]                       Should the roll dialog be skipped?
     * @returns {{advantageMode: EffectRoll.ADV_MODE, isFF: boolean}}  Whether the roll is fast-forwarded, and its advantage
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
     * Advantage mode of a Atoria roll
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
    static DISPLAY_TEMPLATE = "systems/atoria/templates/chat/rolls/effect-roll.hbs";
    /* -------------------------------------------- */
  
    /**
     * Does this roll start with a d100?
     * @type {boolean}
     */
    get validRoll() {
      return (this.terms[0] instanceof Die);
    }
  
    /* -------------------------------------------- */
  
    /**
     * A convenience reference for whether this EffectRoll has advantage
     * @type {boolean}
     */
    get hasAdvantage() {
      return this.options.advantageMode === EffectRoll.ADV_MODE.ADVANTAGE;
    }
  
    /* -------------------------------------------- */
  
    /**
     * A convenience reference for whether this EffectRoll has disadvantage
     * @type {boolean}
     */
    get hasDisadvantage() {
      return this.options.advantageMode === EffectRoll.ADV_MODE.DISADVANTAGE;
    }
  
    /* -------------------------------------------- */
  
    /**
     * Is this roll a critical success? Returns undefined if roll isn't evaluated.
     * @type {boolean|void}
     */
    get isCritical() {
      if ( !this.validRoll || !this._evaluated ) return undefined;
      if ( !Number.isNumeric(this.options.critical) ) return false;
      return this.dice[0].total <= this.options.critical;
    }
  
    /* -------------------------------------------- */
  
    /**
     * Is this roll a critical failure? Returns undefined if roll isn't evaluated.
     * @type {boolean|void}
     */
    get isFumble() {
      if ( !this.validRoll || !this._evaluated ) return undefined;
      if ( !Number.isNumeric(this.options.fumble) ) return false;
      return this.dice[0].total >= this.options.fumble;
    }
  
    /* -------------------------------------------- */
    /*  Roll Methods                            */
    /* -------------------------------------------- */

    /** @inheritdoc */
    async evaluate(option) {
      await super.evaluate(option);
    }

    /* -------------------------------------------- */
  
    /** @inheritdoc */
    async toMessage(messageData={}, options={}) {
  
      // Evaluate the roll now so we have the results available to determine whether reliable talent came into play
      if ( !this._evaluated ) await this.evaluate({async: true});
  


      const content = await renderTemplate(this.constructor.DISPLAY_TEMPLATE, {
        roll: this.result,
      });

      messageData.content = content;

      // Add appropriate advantage mode message flavor and atoria roll flags
      messageData.flavor = messageData.flavor || this.options.flavor;
      if ( this.hasAdvantage ) messageData.flavor += ` (${game.i18n.localize("ATORIA.Advantage")})`;
      else if ( this.hasDisadvantage ) messageData.flavor += ` (${game.i18n.localize("ATORIA.Disadvantage")})`;
    
      // Record the preferred rollMode
      options.rollMode = options.rollMode ?? this.options.rollMode;
      return super.toMessage(messageData, options);
    }
  
    /* -------------------------------------------- */
    /*  Configuration Dialog                        */
    /* -------------------------------------------- */
  
    /**
     * Create a Dialog prompt used to configure evaluation of an existing EffectRoll instance.
     * @param {object} data                     Dialog configuration data
     * @param {string} [data.title]             The title of the shown dialog window
     * @param {number} [data.defaultRollMode]   The roll mode that the roll mode select element should default to
     * @param {number} [data.defaultAction]     The button marked as default
     * @param {string} [data.template]          A custom path to an HTML template to use instead of the default
     * @param {object} options                  Additional Dialog customization options
     * @returns {Promise<EffectRoll|null>}         A resulting EffectRoll object constructed with the dialog, or null if the
     *                                          dialog was closed
     */
    async configureDialog({title, defaultRollMode, defaultAction=EffectRoll.ADV_MODE.NORMAL,
      template}={}, options={}) {
  

      let available_rollmodes = CONFIG.Dice.rollModes;
      if (options.force_rollmode) {
        available_rollmodes = {};
        available_rollmodes[options.forced_rollmode] = CONFIG.Dice.rollModes[options.forced_rollmode];
      }
      // Render the Dialog inner HTML
      const content = await renderTemplate(template ?? this.constructor.EVALUATION_TEMPLATE, {});
  
      let defaultButton = "normal";
      switch ( defaultAction ) {
        case EffectRoll.ADV_MODE.ADVANTAGE: defaultButton = "advantage"; break;
        case EffectRoll.ADV_MODE.DISADVANTAGE: defaultButton = "disadvantage"; break;
      }
  
      // Create the Dialog window and await submission of the form
      return new Promise(resolve => {
        new Dialog({
          title,
          content,
          buttons: {
            advantage: {
            label: game.i18n.localize("ATORIA.Advantage"),
              callback: html => resolve(this._onDialogSubmit(html, EffectRoll.ADV_MODE.ADVANTAGE))
            },
            normal: {
              label: game.i18n.localize("ATORIA.Normal"),
              callback: html => resolve(this._onDialogSubmit(html, EffectRoll.ADV_MODE.NORMAL))
            },
            disadvantage: {
              label: game.i18n.localize("ATORIA.Disadvantage"),
              callback: html => resolve(this._onDialogSubmit(html, EffectRoll.ADV_MODE.DISADVANTAGE))
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
     * @returns {EffectRoll}              This damage roll.
     * @private
     */
    _onDialogSubmit(html, advantageMode) {
      const form = html[0].querySelector("form");
    
      // Apply advantage or disadvantage
      this.options.advantageMode = advantageMode;
      this.options.rollMode = form.rollMode.value;
      return this;
    }

}
  