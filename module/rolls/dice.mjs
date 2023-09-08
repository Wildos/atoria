/**
 * Configuration data for a D100 roll.
 *
 * @typedef {object} SkillRollConfiguration
 *
 * @property {string[]} [parts=[]]  The dice roll component parts, excluding the initial d100.
 * @property {object} [data={}]     Data that will be used when parsing this roll.
 * @property {Event} [event]        The triggering event for this roll.
 *
 * ## D20 Properties
 * @property {boolean} [advantage]     Apply advantage to this roll (unless overridden by modifier keys or dialog)?
 * @property {boolean} [disadvantage]  Apply disadvantage to this roll (unless overridden by modifier keys or dialog)?
 * @property {number|null} [critical=20]  The value of the d100 result which represents a critical success,
 *                                     `null` will prevent critical successes.
 * @property {number|null} [fumble=1]  The value of the d100 result which represents a critical failure,
 *                                     `null` will prevent critical failures.
 * @property {number} [targetValue]    The value of the d100 result which should represent a successful roll.
 *
 * ## Roll Configuration Dialog
 * @property {boolean} [fastForward]           Should the roll configuration dialog be skipped?
 *                                             configurable within that interface?
 * @property {string} [template]               The HTML template used to display the roll configuration dialog.
 * @property {string} [title]                  Title of the roll configuration dialog.
 * @property {object} [dialogOptions]          Additional options passed to the roll configuration dialog.
 *
 * ## Chat Message
 * @property {boolean} [chatMessage=true]  Should a chat message be created for this roll?
 * @property {object} [messageData={}]     Additional data which is applied to the created chat message.
 * @property {string} [rollMode]           Value of `CONST.DICE_ROLL_MODES` to apply as default for the chat message.
 * @property {object} [flavor]             Flavor text to use in the created chat message.
 */

/**
 * A standardized helper function for managing core Atoria d100 rolls.
 * Holding SHIFT, ALT, or CTRL when the attack is rolled will "fast-forward".
 * This chooses the default options of a normal attack with no bonus, Advantage, or Disadvantage respectively
 *
 * @param {SkillRollConfiguration} configuration  Configuration data for the D100 roll.
 * @returns {Promise<SkillRoll|null>}             The evaluated SkillRoll, or null if the workflow was cancelled.
 */
export async function skillRoll({
    parts=[], data={}, event,
    advantage, disadvantage, critical=0, fumble=101, targetValue=0,
    fastForward, template, title, dialogOptions,
    chatMessage=true, messageData={}, rollMode, flavor
  }={}) {
    // Handle input arguments
    const formula = ["1d100"].concat(parts).join(" + ");
    const {advantageMode, isFF} = CONFIG.Dice.SkillRoll.determineAdvantageMode({
      advantage, disadvantage, fastForward, event
    });
    const defaultRollMode = rollMode || game.settings.get("core", "rollMode");
  
    console.log(`skillRoll ${JSON.stringify(data, null, 2)}`);
    // Construct the SkillRoll instance
    const roll = new CONFIG.Dice.SkillRoll(formula, data, {
      flavor: flavor || title,
      advantageMode,
      defaultRollMode,
      rollMode,
      critical,
      fumble,
      targetValue
    });
  
    // Prompt a Dialog to further configure the SkillRoll
    if ( !isFF ) {
      const configured = await roll.configureDialog({
        title,
        defaultRollMode,
        defaultAction: advantageMode,
        template
      }, dialogOptions);
      if ( configured === null ) return null;
    } else roll.options.rollMode ??= defaultRollMode;
  
    // Evaluate the configured roll
    await roll.evaluate({async: true});

    // Create a Chat Message
    if ( roll && chatMessage ) await roll.toMessage(messageData);
    return roll;
  }
