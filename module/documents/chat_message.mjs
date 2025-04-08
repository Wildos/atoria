import * as utils from "../utils/module.mjs";
import AtoriaDOSRoll from "../rolls/atoria_dos_roll.mjs";

export default class AtoriaChatMessage extends ChatMessage {
  async _enricheInlineRolls(rollData, content, options = {}) {
    const rgx = /\[\[(\/[a-zA-Z]+\s)?(.*?)(]{2,3})(?:{([^}]+)})?/gi;
    const html = document.createElement("div");
    html.innerHTML = String(content || "");
    const text = TextEditor._getTextNodes(html);
    const results = await this._extractInlineRoll(text, rgx, (match) =>
      this._createInlineRoll(match, rollData, options),
    );
    $(html).empty();
    for (let res of results) {
      $(html).append(res);
      $(html).append("<br />");
    }
    return html.innerHTML;
  }

  async _extractInlineRoll(text, rgx, func, options = {}) {
    let result_array = [];
    for (const t of text) {
      const matches = t.textContent.matchAll(rgx);
      for (const match of Array.from(matches).reverse()) {
        let result;
        try {
          result = await func(match);
        } catch (err) {
          Hooks.onError("TextEditor.enrichHTML", err, { log: "error" });
        }
        if (result) {
          TextEditor._replaceTextNode(t, match, result, options);
          result_array.push(result);
        }
      }
    }
    return result_array;
  }

  async _createInlineRoll(match, rollData, options = {}) {
    let [command, formula, closing, label] = match.slice(1, 5);
    const rollCls = Roll.defaultImplementation;

    // Handle the possibility of the roll formula ending with a closing bracket
    if (closing.length === 3) formula += "]";

    // If the tag does not contain a command, it may only be an eagerly-evaluated inline roll
    if (!command) {
      if (!rollCls.validate(formula)) return null;
      try {
        const anchorOptions = {
          classes: ["inline-roll", "inline-result"],
          dataset: { tooltip: formula },
          label,
        };
        const roll = await rollCls
          .create(formula, rollData)
          .evaluate({ allowInteractive: false, ...options });
        return roll.toAnchor(anchorOptions);
      } catch {
        return null;
      }
    }

    // Otherwise verify that the tag contains a valid roll command
    const chatCommand = `${command}${formula}`;
    let parsedCommand = null;
    try {
      parsedCommand = ChatLog.parse(chatCommand);
    } catch {
      return null;
    }
    const [cmd, matches] = parsedCommand;
    if (
      !["roll", "gmroll", "blindroll", "selfroll", "publicroll"].includes(cmd)
    )
      return null;

    // Extract components of the matched command
    const matchedCommand = ChatLog.MULTILINE_COMMANDS.has(cmd)
      ? matches.pop()
      : matches;
    const matchedFormula = rollCls.replaceFormulaData(
      matchedCommand[2].trim(),
      rollData || {},
    );
    const matchedFlavor = matchedCommand[3]?.trim();

    // Construct the deferred roll element
    const a = document.createElement("a");
    a.classList.add("inline-roll", parsedCommand[0]);
    a.dataset.mode = parsedCommand[0];
    a.dataset.flavor = matchedFlavor ?? label ?? "";
    a.dataset.formula = matchedFormula;
    a.dataset.tooltip = formula;
    a.innerHTML = `<i class="fas fa-dice-d20"></i>${label || matchedFormula}`;
    return a;
  }

  get is_critical_success() {
    if (this.rolls.length > 0) {
      if (this.rolls[0] instanceof AtoriaDOSRoll)
        return this.rolls[0].is_critical_success;
    }
    return false;
  }

  async getHTML() {
    // Determine some metadata
    const data = this.toObject(false);
    data.content = await TextEditor.enrichHTML(this.content, {
      rollData: this.getRollData(),
    });
    data.system.postContent = await TextEditor.enrichHTML(
      this.system.postContent,
      { rollData: this.getRollData() },
    );
    data.system.effect = await this._enricheInlineRolls(
      this.getRollData(),
      this.system.effect,
      { maximize: this.is_critical_success },
    );
    data.system.critical_effect = await this._enricheInlineRolls(
      this.getRollData(),
      this.system.critical_effect,
      {},
    );

    const isWhisper = this.whisper.length;

    for (let item_data of data.system.related_items ?? []) {
      if ((item_data.items?.length ?? 0) == 0) {
        item_data.items = [];
        for (let item_id of item_data.items_id) {
          item_data.items.push(await fromUuid(item_id));
        }
      }
    }
    data.system.savesAsked =
      data.system.savesAsked?.map((save_str) => {
        return {
          label: utils.getSkillTitle(save_str),
          skill_path: save_str,
        };
      }) ?? [];

    const cssClass = (this.system.additionalCssClass ?? []).concat([
      this.style === CONST.CHAT_MESSAGE_STYLES.IC ? "ic" : null,
      this.style === CONST.CHAT_MESSAGE_STYLES.EMOTE ? "emote" : null,
      isWhisper ? "whisper" : null,
      this.blind ? "blind" : null,
    ]);

    // Construct message data
    const messageData = {
      message: data,
      user: game.user,
      author: this.author,
      alias: this.alias,
      cssClass: cssClass.filterJoin(" "),
      isWhisper: this.whisper.length,
      canDelete: game.user.isGM, // Only GM users are allowed to have the trash-bin icon in the chat log itself
      whisperTo: this.whisper
        .map((u) => {
          let user = game.users.get(u);
          return user ? user.name : null;
        })
        .filterJoin(", "),
      isGM: game.user.isGM,
    };

    // Render message data specifically for ROLL type messages
    if (this.isRoll) await this._renderRollContent(messageData);

    // Define a border color
    if (this.style === CONST.CHAT_MESSAGE_STYLES.OOC)
      messageData.borderColor = this.author?.color.css;

    // Render the chat message
    let html = await renderTemplate(CONFIG.ChatMessage.template, messageData);
    html = $(html);

    // Flag expanded state of dice rolls
    if (this._rollExpanded) html.find(".dice-tooltip").addClass("expanded");
    Hooks.call("renderChatMessage", this, html, messageData);
    return html;
  }

  static async chatListeners(html) {
    html.on("click", "[data-action=rollable]", (event) => {
      event.preventDefault();
      console.log("chatListeners");
      const skill_title = event.currentTarget;
      const { skillPath } = skill_title.dataset;
      if (skillPath === undefined) return;

      const controlled_actors = canvas.tokens.controlled.map((t) => t.actor);

      if (controlled_actors.length == 0) {
        ui.notifications.info(
          game.i18n.format("ATORIA.Error.Require_selected_actor"),
          { permanent: false },
        );
        return;
      }

      for (const actor of controlled_actors) {
        actor.rollSkill(skillPath);
      }
    });
  }
}
