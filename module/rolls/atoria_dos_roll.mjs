/*
 * Roll that handle Degree of Sucess, critical success and fumble
 */

const defaultOptions = {
  owning_actor_id: undefined,
  success_value: 10,
  critical_success_amount: 0,
  critical_fumble_amount: 0,
  title: "",
  advantage_amount: 0,
  disadvantage_amount: 0,
  luck_applied: 0,
  dos_mod: 0,
};

export default class AtoriaDOSRoll extends Roll {
  constructor(data = {}, options = {}) {
    options = foundry.utils.mergeObject(defaultOptions, options);
    const adv_minus_disadv =
      (options.advantage_amount ?? 0) - (options.disadvantage_amount ?? 0);
    const dice_keep_rule =
      adv_minus_disadv === 0 ? "" : adv_minus_disadv > 0 ? "kl" : "kh";
    super(
      `${Math.abs(adv_minus_disadv) + 1}d100${dice_keep_rule}`,
      data,
      options,
    );
    this._margin_of_success = undefined;
    this._success_value = options.success_value;
    this._critical_success_amount = options.critical_success_amount;
    this._critical_fumble_amount = options.critical_fumble_amount;
    this._title = options.title;
    this._advantage_amount = options.advantage_amount;
    this._disadvantage_amount = options.disadvantage_amount;
    this._luck_applied = options.luck_applied;
    this._dos_mod = options.dos_mod;

    this._owning_actor_id = options.owning_actor_id;
  }

  static CHAT_TEMPLATE =
    "systems/atoria/templates/v2/chat_messages/dos-roll.hbs";
  static TOOLTIP_TEMPLATE =
    "systems/atoria/templates/v2/chat_messages/roll-tooltip.hbs";

  get degree_of_success() {
    return Math.trunc(this.margin_of_success / 10) + this._dos_mod;
  }

  get margin_of_success() {
    return this._margin_of_success + this._luck_applied;
  }

  get is_critical_success() {
    return this.is_success && this.is_critical;
  }

  get is_success() {
    return this.degree_of_success >= 0;
  }

  get is_critical() {
    return (
      this.total <= this._critical_success_amount ||
      this.total >= 101 - this._critical_fumble_amount
    );
  }

  static fromData(data) {
    const roll = new this(data.data, data.options);

    roll.terms = data.terms.map((t) => {
      if (t.class) {
        if (t.class === "DicePool") t.class = "PoolTerm"; // Backwards compatibility
        return foundry.dice.terms.RollTerm.fromData(t);
      }
      return t;
    });

    if (data.evaluated ?? true) {
      roll._total = data.total;
      roll._dice = (data.dice || []).map((t) => DiceTerm.fromData(t));
      roll._margin_of_success = data.margin_of_success;
      roll._evaluated = true;
      roll._success_value = data.success_value;
      roll._critical_success_amount = data.critical_success_amount;
      roll._critical_fumble_amount = data.critical_fumble_amount;
      roll._title = data.title;
      roll._advantage_amount = data.advantage_amount;
      roll._disadvantage_amount = data.disadvantage_amount;
      roll._luck_applied = data.luck_applied;
      roll._dos_mod = data.dos_mod;

      roll._owning_actor_id = data.owning_actor_id;
    }
    return roll;
  }

  toJSON() {
    return {
      class: this.constructor.name,
      options: this.options,
      dice: this._dice,
      terms: this.terms.map((t) => t.toJSON()),
      total: this._total,
      evaluated: this._evaluated,
      margin_of_success: this._margin_of_success,
      success_value: this._success_value,
      critical_success_amount: this._critical_success_amount,
      critical_fumble_amount: this._critical_fumble_amount,
      title: this._title,
      advantage_amount: this._advantage_amount,
      disadvantage_amount: this._disadvantage_amount,
      luck_applied: this._luck_applied,
      dos_mod: this._dos_mod,
      owning_actor_id: this._owning_actor_id,
    };
  }

  async evaluate({
    minimize = false,
    maximize = false,
    allowStrings = false,
    allowInteractive = true,
    ...options
  } = {}) {
    const result = await super.evaluate({
      minimize,
      maximize,
      allowStrings,
      allowInteractive,
      ...options,
    });
    this._margin_of_success = this.options.success_value - this._total;
    return result;
  }

  async render({
    flavor,
    template = this.constructor.CHAT_TEMPLATE,
    isPrivate = false,
  } = {}) {
    if (!this._evaluated) await this.evaluate();

    // /!\ You can't use "this.options" here only variables inside this as some cache issue seem to appear else
    const adv_minus_disadv = this._advantage_amount - this._disadvantage_amount;
    const adv_disadv_localize_string =
      adv_minus_disadv === 0
        ? ""
        : adv_minus_disadv > 0
          ? "ATORIA.Chat_message.Dice.Advantage"
          : "ATORIA.Chat_message.Dice.Disadvantage";
    const adv_disadv_amount = Math.abs(adv_minus_disadv);
    const adv_disadv_localize_string_plural =
      adv_minus_disadv === 0 || adv_disadv_amount === 1 ? "" : "s";
    const adv_disadv_string = game.i18n.format(
      game.i18n.localize(
        adv_disadv_localize_string.concat(adv_disadv_localize_string_plural),
      ),
      { amount: adv_disadv_amount },
    );
    const user_level = game.actors.get(this._owning_actor_id)?.getUserLevel();

    const chatData = {
      user: game.user.id,
      is_private: isPrivate,
      flavor: isPrivate ? null : (flavor ?? this.options.flavor),
      formula: isPrivate ? "" : this._formula,
      title: isPrivate ? "" : this._title,
      dice_value: isPrivate ? "" : Math.round(this.total * 100) / 100,
      dice_tooltip: isPrivate ? "" : await this.getTooltip(),
      margin_of_success: isPrivate ? "" : this.margin_of_success,
      degree_of_success: isPrivate ? "" : this.degree_of_success,
      success_value: isPrivate ? "" : this._success_value,
      is_success: isPrivate ? "" : this.is_success,
      is_critical: isPrivate ? "" : this.is_critical,
      adv_disadv: isPrivate ? "" : adv_disadv_string,
      luck_applied: isPrivate ? "" : this._luck_applied,
      dos_mod: isPrivate ? "" : this._dos_mod,
      owner_or_gm:
        game.user?.isGM || user_level === CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER,
      observer: user_level === CONST.DOCUMENT_OWNERSHIP_LEVELS.OBSERVER,
      limited: user_level === CONST.DOCUMENT_OWNERSHIP_LEVELS.LIMITED,
    };
    return renderTemplate(template, chatData);
  }
}
