/*
 * Roll that handle rolled effect value
 */

export default class AtoriaEffectRoll extends Roll {
  constructor(formula = "1d6", data = {}, options = {}) {
    super(formula, data, options);
  }

  static CHAT_TEMPLATE =
    "systems/atoria/templates/v2/chat_messages/effect-roll.hbs";
  static TOOLTIP_TEMPLATE =
    "systems/atoria/templates/v2/chat_messages/roll-tooltip.hbs";

  async getTooltip() {
    const overrall_formula = this._formula;
    const parts = this.dice.map((d) => d.getTooltipData());
    return foundry.applications.handlebars.renderTemplate(
      this.constructor.TOOLTIP_TEMPLATE,
      { overrall_formula, parts },
    );
  }

  async render({
    flavor,
    template = this.constructor.CHAT_TEMPLATE,
    isPrivate = false,
  } = {}) {
    if (!this._evaluated) await this.evaluate();

    // /!\ You can't use "this.options" here only variables inside this as some cache issue seem to appear else
    const user_level = game.actors.get(this._owning_actor_id)?.getUserLevel();

    const chatData = {
      user: game.user.id,
      is_private: isPrivate,
      flavor: isPrivate ? null : (flavor ?? this.options.flavor),
      formula: isPrivate ? "" : this.formula,

      dice_value: isPrivate ? "" : this.total,
      dice_tooltip: isPrivate ? "" : await this.getTooltip(),
      owner_or_gm:
        game.user?.isGM || user_level === CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER,
      observer: user_level === CONST.DOCUMENT_OWNERSHIP_LEVELS.OBSERVER,
      limited: user_level === CONST.DOCUMENT_OWNERSHIP_LEVELS.LIMITED,
    };
    return foundry.applications.handlebars.renderTemplate(template, chatData);
  }
}
