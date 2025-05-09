import * as utils from "./module.mjs";
import { helpers } from "../models/module.mjs";

const VERSION_BEFORE_MIGRATION_CODE = "0.3.8";

export async function migrateWorld() {
  const current_version =
    game.settings.get("atoria", "worldLastMigrationVersion") ||
    VERSION_BEFORE_MIGRATION_CODE;
  // 0.3.9: Addition of leatherwork - object
  if (foundry.utils.isNewerVersion("0.3.9", current_version)) {
    await migrateTo_0_3_9();
  }
  game.settings.set("atoria", "worldLastMigrationVersion", game.system.version);
}

async function migrateTo_0_3_9() {
  const version = game.system.version;
  ui.notifications.info(
    game.i18n.format("MIGRATION.AtoriaBegin", { version }),
    {
      permanent: true,
    },
  );

  // Migrate World Actors
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
      const flags = { persistSourceMigration: false };
      let updateData = {
        "system.knowledges.craftmanship.leatherworking.object":
          helpers.skillInitialValue(
            utils.buildLocalizeString(
              "Ruleset",
              "Knowledges",
              "Craftmanship",
              "Leatherworking",
              "Object",
              "Label",
            ),
            utils.default_values.character.skill.get_success("Craftmanship"),
          ),
      };
      console.log(`Migrating Actor document ${actor.name}`);
      await actor.update(updateData, {
        enforceTypes: true,
        diff: valid && !flags.persistSourceMigration,
        recursive: !flags.persistSourceMigration,
        render: false,
      });
    } catch (err) {
      err.message = `Failed dnd5e system migration for Actor ${actor.name}: ${err.message}`;
      console.error(err);
    }
  }
  ui.notifications.info(
    game.i18n.format("MIGRATION.AtoriaComplete", { version }),
    {
      permanent: true,
    },
  );
}
