import * as utils from "./module.mjs";
import { helpers } from "../models/module.mjs";
import RULESET from "./ruleset.mjs";
import DEFAULT_VALUES from "./default-values.mjs";

export async function migrateWorld() {
  const current_version = game.settings.get(
    "atoria",
    "worldLastMigrationVersion",
  );
  const version = game.system.version;
  if (current_version === version) {
    return;
  }

  if (foundry.utils.isNewerVersion("0.3.40", current_version)) {
    console.debug("isNewerVersion 0.3.40");
    const removed_skillsPath = [
      "system.knowledges.utilitarian.song",
      "system.knowledges.utilitarian.dance",
      "system.knowledges.song",
      "system.knowledges.dance",
    ];
    const actors = game.actors
      .map((a) => [a, true])
      .concat(
        Array.from(game.actors.invalidDocumentIds).map((id) => [
          game.actors.getInvalid(id),
          false,
        ]),
      );

    for (const [actor, valid] of actors) {
      try {
        console.debug(actor);
        const hidden_skills = actor.getFlag("atoria", "hidden_skills") ?? [];
        for (const removed_path of removed_skillsPath) {
          if (hidden_skills.includes(removed_path))
            hidden_skills.splice(hidden_skills.indexOf(removed_path), 1);
        }
        actor.setFlag("atoria", "hidden_skills", hidden_skills);
      } catch (err) {
        err.message = `Failed atoria system migration for Actor ${actor.name}: ${err.message}`;
        console.error(err);
      }
    }

    const scenes = game.scenes;
    for (const scene of scenes) {
      for (const [token, valid] of scene.tokens.map((a) => [a, true])) {
        const actor = token.actor;
        try {
          const hidden_skills = actor.getFlag("atoria", "hidden_skills") ?? [];
          for (const removed_path of removed_skillsPath) {
            if (hidden_skills.includes(removed_path))
              hidden_skills.splice(hidden_skills.indexOf(removed_path), 1);
          }
          actor.setFlag("atoria", "hidden_skills", hidden_skills);
        } catch (err) {
          err.message = `Failed atoria system migration for Actor ${actor.name}: ${err.message}`;
          console.error(err);
        }
      }
    }
  }
}
