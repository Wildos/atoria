import * as utils from "./module.mjs";
import { helpers } from "../models/module.mjs";
import RULESET from "./ruleset.mjs";
import DEFAULT_VALUES from "./default-values.mjs";

const VERSION_BEFORE_MIGRATION_CODE = "0.3.8";

export async function migrateWorld() {
  const current_version =
    game.settings.get("atoria", "worldLastMigrationVersion") ||
    VERSION_BEFORE_MIGRATION_CODE;

  const version = game.system.version;
  if (current_version === version) {
    return;
  }

  ui.notifications.info(
    game.i18n.format("MIGRATION.AtoriaBegin", { version }),
    {
      permanent: true,
    },
  );
  // 0.3.9: Addition of leatherwork - object
  if (foundry.utils.isNewerVersion("0.3.9", current_version)) {
    await migrateTo_0_3_9();
  }
  // 0.3.13: Rework of knowledges
  if (foundry.utils.isNewerVersion("0.3.13", current_version)) {
    await migrateTo_0_3_13();
  }
  // 0.3.15: Fix of knowledges
  if (foundry.utils.isNewerVersion("0.3.15", current_version)) {
    await migrateTo_0_3_15();
  }
  // 0.3.21: Change of skills
  if (foundry.utils.isNewerVersion("0.3.21", current_version)) {
    await migrateTo_0_3_21();
  }

  game.settings.set("atoria", "worldLastMigrationVersion", game.system.version);
  ui.notifications.info(
    game.i18n.format("MIGRATION.AtoriaComplete", { version }),
    {
      permanent: true,
    },
  );
}

async function migrateTo_0_3_9() {
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
      if (actor.type !== "player-character") {
        continue;
      }
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
      err.message = `Failed atoria system migration for Actor ${actor.name}: ${err.message}`;
      console.error(err);
    }
  }
}

async function migrateTo_0_3_13() {
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

      let updateData = {};
      if (actor.type === "player-character") {
        // add remove action to removed and moved knowledges
        updateData["system.knowledges.-=artistic"] = null;
        updateData["system.knowledges.craftmanship.alchemy.-=potion"] = null;
        updateData["system.knowledges.craftmanship.alchemy.-=poison"] = null;
        updateData["system.knowledges.craftmanship.cuisine.-=licor"] = null;
        updateData["system.knowledges.craftmanship.engineering.-=glassware"] =
          null;
        updateData["system.knowledges.craftmanship.leatherworking.-=clothing"] =
          null;
        updateData["system.knowledges.craftmanship.leatherworking.-=object"] =
          null;
        updateData["system.knowledges.erudition.-=medecine"] = null;
        updateData["system.knowledges.utilitarian.-=strategy"] = null;

        // add add action to new knowledges
        updateData["system.knowledges.craftmanship.alchemy.mixture"] =
          helpers.skillInitialValue(
            utils.buildLocalizeString(
              "Ruleset",
              "Knowledges",
              "Craftmanship",
              "Alchemy",
              "Mixture",
              "Label",
            ),
            utils.default_values.character.skill.get_success("Craftmanship"),
          );
        updateData["system.knowledges.craftmanship.artistic"] = {
          ceramic: helpers.skillInitialValue(
            utils.buildLocalizeString(
              "Ruleset",
              "Knowledges",
              "Craftmanship",
              "Artistic",
              "Ceramic",
              "Label",
            ),
            utils.default_values.character.skill.get_success("Craftmanship"),
          ),
          sculpture: helpers.skillInitialValue(
            utils.buildLocalizeString(
              "Ruleset",
              "Knowledges",
              "Craftmanship",
              "Artistic",
              "Sculpture",
              "Label",
            ),
            utils.default_values.character.skill.get_success("Craftmanship"),
          ),
          graphic: helpers.skillInitialValue(
            utils.buildLocalizeString(
              "Ruleset",
              "Knowledges",
              "Craftmanship",
              "Artistic",
              "Graphic",
              "Label",
            ),
            utils.default_values.character.skill.get_success("Craftmanship"),
          ),
        };

        updateData["system.knowledges.craftmanship.jewellery.glassware"] =
          helpers.skillInitialValue(
            utils.buildLocalizeString(
              "Ruleset",
              "Knowledges",
              "Craftmanship",
              "Jewellery",
              "Glassware",
              "Label",
            ),
            utils.default_values.character.skill.get_success("Craftmanship"),
          );

        updateData[
          "system.knowledges.craftmanship.leatherworking.manufacture"
        ] = helpers.skillInitialValue(
          utils.buildLocalizeString(
            "Ruleset",
            "Knowledges",
            "Craftmanship",
            "Leatherworking",
            "Manufacture",
            "Label",
          ),
          utils.default_values.character.skill.get_success("Craftmanship"),
        );
        updateData["system.knowledges.erudition.runic.tattoo"] =
          helpers.skillInitialValue(
            utils.buildLocalizeString(
              "Ruleset",
              "Knowledges",
              "Erudition",
              "Runic",
              "Tattoo",
              "Label",
            ),
            utils.default_values.character.skill.get_success("Craftmanship"),
          );
        updateData["system.knowledges.erudition.music"] = {
          repertoire: helpers.skillInitialValue(
            utils.buildLocalizeString(
              "Ruleset",
              "Knowledges",
              "Erudition",
              "Music",
              "Repertoire",
              "Label",
            ),
            utils.default_values.character.skill.get_success("Craftmanship"),
          ),
          theory: helpers.skillInitialValue(
            utils.buildLocalizeString(
              "Ruleset",
              "Knowledges",
              "Erudition",
              "Music",
              "Theory",
              "Label",
            ),
            utils.default_values.character.skill.get_success("Craftmanship"),
          ),
        };
        updateData["system.knowledges.erudition.strategy"] = {
          battle: helpers.skillInitialValue(
            utils.buildLocalizeString(
              "Ruleset",
              "Knowledges",
              "Erudition",
              "Strategy",
              "Battle",
              "Label",
            ),
            utils.default_values.character.skill.get_success("Craftmanship"),
          ),
          expedition: helpers.skillInitialValue(
            utils.buildLocalizeString(
              "Ruleset",
              "Knowledges",
              "Erudition",
              "Strategy",
              "Expedition",
              "Label",
            ),
            utils.default_values.character.skill.get_success("Craftmanship"),
          ),
        };

        updateData["system.knowledges.erudition.symbolism.cartography"] =
          helpers.skillInitialValue(
            utils.buildLocalizeString(
              "Ruleset",
              "Knowledges",
              "Erudition",
              "Symbolism",
              "Cartography",
              "Label",
            ),
            utils.default_values.character.skill.get_success("Craftmanship"),
          );

        updateData["system.knowledges.utilitarian.song"] = {
          entertaining: helpers.skillInitialValue(
            utils.buildLocalizeString(
              "Ruleset",
              "Knowledges",
              "Utilitarian",
              "Song",
              "Entertaining",
              "Label",
            ),
            utils.default_values.character.skill.get_success("Craftmanship"),
          ),
          martial: helpers.skillInitialValue(
            utils.buildLocalizeString(
              "Ruleset",
              "Knowledges",
              "Utilitarian",
              "Song",
              "Martial",
              "Label",
            ),
            utils.default_values.character.skill.get_success("Craftmanship"),
          ),
        };

        updateData["system.knowledges.utilitarian.dance"] = {
          aesthetics: helpers.skillInitialValue(
            utils.buildLocalizeString(
              "Ruleset",
              "Knowledges",
              "Utilitarian",
              "Dance",
              "Aesthetics",
              "Label",
            ),
            utils.default_values.character.skill.get_success("Craftmanship"),
          ),
          spinning: helpers.skillInitialValue(
            utils.buildLocalizeString(
              "Ruleset",
              "Knowledges",
              "Utilitarian",
              "Dance",
              "Spinning",
              "Label",
            ),
            utils.default_values.character.skill.get_success("Utilitarian"),
          ),
        };

        updateData["system.knowledges.utilitarian.medecine"] = {
          treatment: helpers.skillInitialValue(
            utils.buildLocalizeString(
              "Ruleset",
              "Knowledges",
              "Utilitarian",
              "Medecine",
              "Treatment",
              "Label",
            ),
            utils.default_values.character.skill.get_success("Utilitarian"),
          ),
          mortuary: helpers.skillInitialValue(
            utils.buildLocalizeString(
              "Ruleset",
              "Knowledges",
              "Utilitarian",
              "Medecine",
              "Mortuary",
              "Label",
            ),
            utils.default_values.character.skill.get_success("Utilitarian"),
          ),
        };
      }
      if (actor.type === "non-player-character") {
        updateData["system.knowledges.-=artistic"] = null;
        updateData["system.knowledges.erudition.-=medecine"] = null;
        updateData["system.knowledges.utilitarian.-=strategy"] = null;

        updateData["system.knowledges.craftmanship.artistic"] =
          helpers.skillInitialValue(
            utils.buildLocalizeString(
              "Ruleset",
              "Knowledges",
              "Craftmanship",
              "Artistic",
              "Label",
            ),
            utils.default_values.character.skill.get_success("Craftmanship"),
          );
        updateData["system.knowledges.erudition.music"] =
          helpers.skillInitialValue(
            utils.buildLocalizeString(
              "Ruleset",
              "Knowledges",
              "Erudition",
              "Music",
              "Label",
            ),
            utils.default_values.character.skill.get_success("Erudition"),
          );

        updateData["system.knowledges.erudition.strategy"] =
          helpers.skillInitialValue(
            utils.buildLocalizeString(
              "Ruleset",
              "Knowledges",
              "Erudition",
              "Strategy",
              "Label",
            ),
            utils.default_values.character.skill.get_success("Craftmanship"),
          );

        updateData["system.knowledges.utilitarian.song"] =
          helpers.skillInitialValue(
            utils.buildLocalizeString(
              "Ruleset",
              "Knowledges",
              "Utilitarian",
              "Song",
              "Label",
            ),
            utils.default_values.character.skill.get_success("Utilitarian"),
          );
        updateData["system.knowledges.utilitarian.dance"] =
          helpers.skillInitialValue(
            utils.buildLocalizeString(
              "Ruleset",
              "Knowledges",
              "Utilitarian",
              "Dance",
              "Label",
            ),
            utils.default_values.character.skill.get_success("Utilitarian"),
          );
        updateData["system.knowledges.utilitarian.medecine"] =
          helpers.skillInitialValue(
            utils.buildLocalizeString(
              "Ruleset",
              "Knowledges",
              "Utilitarian",
              "Medecine",
              "Label",
            ),
            utils.default_values.character.skill.get_success("Utilitarian"),
          );
      }

      if (actor.type === "hero") {
        updateData["system.knowledges.-=graphic"] = null;
        updateData["system.knowledges.-=sculpture"] = null;

        updateData["system.knowledges.artistic"] = helpers.skillInitialValue(
          utils.buildLocalizeString(
            "Ruleset",
            "Knowledges",
            "Craftmanship",
            "Artistic",
            "Label",
          ),
          utils.default_values.character.skill.get_success("Craftmanship"),
        );
        updateData["system.knowledges.medecine.label"] =
          utils.buildLocalizeString(
            "Ruleset",
            "Knowledges",
            "Utilitarian",
            "Medecine",
            "Label",
          );
        updateData["system.knowledges.strategy.label"] =
          utils.buildLocalizeString(
            "Ruleset",
            "Knowledges",
            "Erudition",
            "Strategy",
            "Label",
          );

        updateData["system.knowledges.song.label"] = utils.buildLocalizeString(
          "Ruleset",
          "Knowledges",
          "Utilitarian",
          "Song",
          "Label",
        );
        updateData["system.knowledges.dance.label"] = utils.buildLocalizeString(
          "Ruleset",
          "Knowledges",
          "Utilitarian",
          "Dance",
          "Label",
        );
        updateData["system.knowledges.music.label"] = utils.buildLocalizeString(
          "Ruleset",
          "Knowledges",
          "Erudition",
          "Music",
          "Label",
        );
      }

      if (actor.type in ["player-character", "non-player-character", "hero"]) {
        for (const feature of actor.items) {
          switch (feature.type) {
            case "feature":
              if (
                feature.system.skill_alteration.associated_skill in
                [
                  "system.knowledges.artistic.song",
                  "system.knowledges.artistic.song.entertaining",
                  "system.knowledges.artistic.song.battle",

                  "system.knowledges.artistic.dance",
                  "system.knowledges.artistic.dance.aesthetics",
                  "system.knowledges.artistic.dance.combat",
                  "system.knowledges.artistic.dance.spiritual",

                  "system.knowledges.graphic",
                  "system.knowledges.artistic.graphic",
                  "system.knowledges.artistic.graphic.work",
                  "system.knowledges.artistic.graphic.tattoo",

                  "system.knowledges.artistic.music",
                  "system.knowledges.artistic.music.repertoire",
                  "system.knowledges.artistic.music.theory",

                  "system.knowledges.sculpture",
                  "system.knowledges.artistic.sculpture",
                  "system.knowledges.artistic.sculpture.ceramic",
                  "system.knowledges.artistic.sculpture.decoration",

                  "system.knowledges.erudition.medecine",
                  "system.knowledges.erudition.medecine.treatment",
                  "system.knowledges.erudition.medecine.mortuary",

                  "system.knowledges.utilitarian.strategy",
                  "system.knowledges.utilitarian.strategy.tactics",
                  "system.knowledges.utilitarian.strategy.logistics",
                  "system.knowledges.utilitarian.strategy.cartography",

                  "system.knowledges.craftmanship.alchemy.potion",
                  "system.knowledges.craftmanship.alchemy.poison",
                  "system.knowledges.craftmanship.cuisine.licor",
                  "system.knowledges.craftmanship.engineering.glassware",
                  "system.knowledges.craftmanship.leatherworking.clothing",
                  "system.knowledges.craftmanship.leatherworking.object",
                ]
              ) {
                feature.update(
                  { "system.skill_alteration.associated_skill": "" },
                  {
                    enforceTypes: true,
                    diff: valid && !flags.persistSourceMigration,
                    recursive: !flags.persistSourceMigration,
                    render: false,
                  },
                );
              }
          }
        }
      }

      console.log(`Migrating Actor document ${actor.name}`);
      await actor.update(updateData, {
        enforceTypes: true,
        diff: valid && !flags.persistSourceMigration,
        recursive: !flags.persistSourceMigration,
        render: false,
        performDeletions: true,
      });
    } catch (err) {
      err.message = `Failed atoria system migration for Actor ${actor.name}: ${err.message}`;
      console.error(err);
    }
  }
}

async function migrateTo_0_3_15() {
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

      let deleteData = {};
      let updateData = {};
      if (actor.type === "player-character") {
        // add remove action to removed and moved knowledges
        deleteData["system.knowledges.utilitarian.-=medecine"] = null;
        deleteData["system.knowledges.erudtion.-=music"] = null;

        // add add action to new knowledges
        updateData["system.knowledges.erudition.medecine"] = {
          treatment: helpers.skillInitialValue(
            utils.buildLocalizeString(
              "Ruleset",
              "Knowledges",
              "Erudition",
              "Medecine",
              "Treatment",
              "Label",
            ),
            utils.default_values.character.skill.get_success("Erudition"),
          ),
          mortuary: helpers.skillInitialValue(
            utils.buildLocalizeString(
              "Ruleset",
              "Knowledges",
              "Erudition",
              "Medecine",
              "Mortuary",
              "Label",
            ),
            utils.default_values.character.skill.get_success("Erudition"),
          ),
        };
      }
      if (actor.type === "non-player-character") {
        deleteData["system.knowledges.utilitarian.-=medecine"] = null;
        deleteData["system.knowledges.erudtion.-=music"] = null;

        updateData["system.knowledges.erudition.medecine"] =
          helpers.skillInitialValue(
            utils.buildLocalizeString(
              "Ruleset",
              "Knowledges",
              "Erudition",
              "Medecine",
              "Label",
            ),
            utils.default_values.character.skill.get_success("Erudition"),
          );
      }

      if (actor.type === "hero") {
        deleteData["system.knowledges.-=music"] = null;
      }

      if (actor.type in ["player-character", "non-player-character", "hero"]) {
        for (const feature of actor.items) {
          switch (feature.type) {
            case "feature":
              if (
                feature.system.skill_alteration.associated_skill in
                [
                  "system.knowledges.music",
                  "system.knowledges.erudition.music",
                  "system.knowledges.erudition.music.repertoire",
                  "system.knowledges.erudition.music.theory",

                  "system.knowledges.utilitarian.medecine",
                  "system.knowledges.utilitarian.medecine.treatment",
                  "system.knowledges.utilitarian.medecine.mortuary",
                ]
              ) {
                feature.update(
                  { "system.skill_alteration.associated_skill": "" },
                  {
                    enforceTypes: true,
                    diff: valid && !flags.persistSourceMigration,
                    recursive: !flags.persistSourceMigration,
                    render: false,
                  },
                );
              }
          }
        }
      }

      console.log(`Migrating Actor document ${actor.name}`);
      await actor.update(deleteData, {
        enforceTypes: false,
        diff: valid && !flags.persistSourceMigration,
        recursive: !flags.persistSourceMigration,
        render: false,
        performDeletions: true,
      });
      await actor.update(updateData);
      if (actor.type === "player-character") {
        await actor.debug_fix_knowledges();
      }
    } catch (err) {
      err.message = `Failed atoria system migration for Actor ${actor.name}: ${err.message}`;
      console.error(err);
    }
  }
}

async function migrateTo_0_3_21() {
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

      // let updateSchema = {};
      let deleteData = {};
      let updateData = {};
      if (actor.type === "player-character") {
        deleteData["system.-=skills"] = null;
        updateData["system.skills.social.charisma.intimidation"] =
          actor.system.schema.fields.skills.fields.social.fields.charisma.initial.intimidation;
      }
      if (actor.type === "non-player-character") {
        deleteData["system.-=skills"] = null;
      }

      console.log(`Migrating Actor document ${actor.name}`);
      await actor.update(deleteData, {
        enforceTypes: false,
        diff: valid && !flags.persistSourceMigration,
        recursive: !flags.persistSourceMigration,
        render: false,
        performDeletions: true,
      });
      await actor.update(updateData);
    } catch (err) {
      err.message = `Failed atoria system migration for Actor ${actor.name}: ${err.message}`;
      console.error(err);
    }
  }
}
