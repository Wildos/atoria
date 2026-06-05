import * as utils from "../utils/module.mjs";
import AtoriaDOSRoll from "../rolls/atoria_dos_roll.mjs";

export default class AtoriaChatMessage extends ChatMessage {
  static async chatListeners(html) {
    html.querySelectorAll('*[data-action="rollable"]').forEach((item, _) => {
      item.addEventListener("click", (event) => {
        event.preventDefault();
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
    });
  }
}
