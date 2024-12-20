const FIRST_BREAKING_CHANGE = "0.1.11";
const SECOND_BREAKING_CHANGE = "0.2.4";

const FIRST_CLEANUP = "0.2.5";

export async function migrateData() {
    if (isNewerVersion(FIRST_BREAKING_CHANGE, game.settings.get("atoria", "systemMigrationVersion"))) {
        await _apply_first_change();
    }
    if (isNewerVersion(SECOND_BREAKING_CHANGE, game.settings.get("atoria", "systemMigrationVersion"))) {
        await _apply_second_change();
    }
    if (isNewerVersion(FIRST_CLEANUP, game.settings.get("atoria", "systemMigrationVersion"))) {
        await _apply_first_cleanup();
    }

    game.settings.set("atoria", "systemMigrationVersion", game.system.version);
}


async function _apply_first_change() {
    // Apply atoria version 0.3.5
    ui.notifications.info(game.i18n.format("MIGRATION.Begin", { version: FIRST_BREAKING_CHANGE }), { permanent: true });

    // Migrate World Actors
    let migration_failed = 0;

    const actors = game.actors;
    for (const actor of actors) {
        try {
            var updateData = _update_actor(actor);

            if (!foundry.utils.isEmpty(updateData)) {
                console.log(`Migrating Actor document ${actor.name}`);
                await actor.update(updateData, { enforceTypes: false, diff: true, keepEmbeddedIds: true });
            }
        } catch (err) {
            err.message = `Failed atoria system migration for Actor ${actor.name}: ${err.message}`;
            console.error(err);
            migration_failed += 1;
        }
    }

    ui.notifications.info(game.i18n.format("MIGRATION.Complete", { version: FIRST_BREAKING_CHANGE, numberOfFailure: migration_failed }), { permanent: true });
}


function _update_actor(actor) {
    try {
        if (actor == undefined || (Object.keys(actor.system).length === 0 && actor.system.constructor === Object)) {
            return;
        }
        if (actor.type !== 'character') {
            return;
        }
        const updateData = {};

        // Suppression de Menace, Diplomatie et Mémoire.
        updateData["system.skills.intimidation.-=threat"] = null;
        updateData["system.skills.negotiation.-=diplomacy"] = null;
        updateData["system.skills.spirit.-=memory"] = null;

        // Souplesse fusionne avec Acrobatie et devient Adresse.
        updateData["system.skills.agility.-=flexibility"] = null;
        updateData["system.skills.agility.-=acrobatics"] = null;
        updateData["system.skills.agility.dexterity"] = {
            "success_value": 10,
            "critical_mod": 0,
            "fumble_mod": 0
        };

        // La catégorie Tromperie devient Ruse
        // --- Change only reflected on the language pack, the name used in code is kept ---

        // Provocation va dans la catégorie Ruse.
        updateData["system.skills.trickery.provocation"] = foundry.utils.deepClone(actor.system.skills.eloquence.provocation);
        updateData["system.skills.eloquence.-=provocation"] = null;


        // Marchandage devient Négociation et va dans la catégorie Éloquence.
        updateData["system.skills.eloquence.negotiation"] = foundry.utils.deepClone(actor.system.skills.negotiation.bargaining);
        updateData["system.skills.-=negotiation"] = null;


        // Suppression de Dressage.
        updateData["system.skills.-=dressage"] = null;


        // La connaissance Véhicule devient Transport.
        updateData["system.knowledges.utilitarian.transport"] = foundry.utils.deepClone(actor.system.knowledges.utilitarian.vehicle);
        updateData["system.knowledges.utilitarian.-=vehicle"] = null;

        // La connaissance Élevage devient Dressage.
        updateData["system.knowledges.utilitarian.dressage"] = foundry.utils.deepClone(actor.system.knowledges.harvest.livestock);
        updateData["system.knowledges.harvest.-=livestock"] = null;


        // Monte va dans la connaissance Transport.
        // --- Nothing to do, sub_knowledge are entered by the user ---

        // Domptage fusionne avec Bétail et devient Domestication.
        // --- Nothing to do, sub_knowledge are entered by the user ---

        // Tannage va dans Maroquinerie
        // --- Nothing to do, sub_knowledge are entered by the user ---

        //  Herboristerie devient Nature. & Culture voit ses connaissances fusionner et va dans Nature.
        let new_nature_knowledge = {
            "known": actor.system.knowledges.harvest.herbalist.known || actor.system.knowledges.harvest.farming.known,
            "sub_skills": []
        };
        for (let sub_s in actor.system.knowledges.harvest.herbalist.sub_skills) {
            new_nature_knowledge.sub_skills.push(foundry.utils.deepClone(actor.system.knowledges.harvest.herbalist.sub_skills[sub_s]));
        }
        for (let sub_s in actor.system.knowledges.harvest.farming.sub_skills) {
            new_nature_knowledge.sub_skills.push(foundry.utils.deepClone(actor.system.knowledges.harvest.farming.sub_skills[sub_s]));
        }
        updateData["system.knowledges.utilitarian.nature"] = new_nature_knowledge;
        updateData["system.knowledges.harvest.-=farming"] = null;
        updateData["system.knowledges.harvest.-=herbalist"] = null;


        // Plante devient Sauvage.
        // --- Nothing to do, sub_knowledge are entered by the user ---

        // Minage voit ses connaissances fusionner et va dans Construction.
        let new_construction_knowledge = foundry.utils.deepClone(actor.system.knowledges.utilitarian.construction);
        for (let sub_s in actor.system.knowledges.harvest.mining.sub_skills) {
            new_construction_knowledge.sub_skills.push(foundry.utils.deepClone(actor.system.knowledges.harvest.mining.sub_skills[sub_s]));
        }
        updateData["system.knowledges.utilitarian.construction"] = new_construction_knowledge;
        updateData["system.knowledges.harvest.-=mining"] = null;


        // Dressage, Nature et Pêche vont dans la grande catégorie utilitaire.
        updateData["system.knowledges.utilitarian.fishing"] = foundry.utils.deepClone(actor.system.knowledges.harvest.fishing);
        updateData["system.knowledges.harvest.-=dressage"] = null;
        updateData["system.knowledges.harvest.-=nature"] = null;
        updateData["system.knowledges.harvest.-=fishing"] = null;

        // Suppression de la grande catégorie de connaissance Récolte.
        updateData["system.knowledges.-=harvest"] = null;


        // Fix typo
        updateData["system.skills.eloquence.persuasion"] = foundry.utils.deepClone(actor.system.skills.eloquence.persusasion);
        updateData["system.skills.eloquence.-=persusasion"] = null;

        return updateData;
    } catch (err) {
        throw new Error(`Error while updating actor ${actor.name}: ${err.message}`);
    }
}


async function _apply_second_change() {
    ui.notifications.info(game.i18n.format("MIGRATION.Begin", { version: SECOND_BREAKING_CHANGE }), { permanent: true });

    // Migrate World Actors
    let migration_failed = 0;

    const actors = game.actors;
    for (const actor of actors) {
        migration_failed += await _fix_feature_list(actor);
    }

    ui.notifications.info(game.i18n.format("MIGRATION.Complete", { version: SECOND_BREAKING_CHANGE, numberOfFailure: migration_failed }), { permanent: true });
}

async function _fix_feature_list(actor) {
    if (actor == undefined || (Object.keys(actor.system).length === 0 && actor.system.constructor === Object)) {
        return 0;
    }
    if (actor.type !== 'character') {
        return 0;
    }
    let migration_failed = 0;
    try {
        console.log(`Migrating Actor document ${actor.name}`);

        const fix_feature_category_items = async function (feature_top_category) {
            for (const feature_list_id in feature_top_category) {
                const item = actor.items.get(feature_top_category[feature_list_id]);
                if (item === undefined)
                    continue

                let new_features = item.system.features;
                if (!Array.isArray(new_features)) {
                    new_features = [];
                    for (const [key, value] of Object.entries(item.system.features)) {
                        if (value !== undefined || value !== null) {
                            new_features.push(value);
                        }
                    }
                } else {
                    new_features = item.system.features.filter((element) => (element !== null && element !== undefined));
                }
                await item.update({
                    "system.features": new_features
                });
            }
        };

        await fix_feature_category_items(actor.system.feature_categories.combat);
        await fix_feature_category_items(actor.system.feature_categories.skill);
        await fix_feature_category_items(actor.system.feature_categories.magic);
        await fix_feature_category_items(actor.system.feature_categories.knowledge);
        await fix_feature_category_items(actor.system.feature_categories.other);

        await actor.update({
            "system.feature_categories": actor.system.feature_categories
        });

    } catch (err) {
        err.message = `Failed atoria system migration for Actor ${actor.name}: ${err.message}`;
        console.error(err);
        migration_failed += 1;
    }
    return migration_failed;
}


async function _apply_first_cleanup() {
    ui.notifications.info(game.i18n.format("MIGRATION.Begin", { version: FIRST_CLEANUP }), { permanent: true });

    // Migrate World Actors
    let migration_failed = 0;

    const actors = game.actors;
    for (const actor of actors) {
        migration_failed += await _fix_feature_list(actor);
    }

    ui.notifications.info(game.i18n.format("MIGRATION.Complete", { version: FIRST_CLEANUP, numberOfFailure: migration_failed }), { permanent: true });
}
