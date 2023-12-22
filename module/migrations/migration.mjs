const FIRST_BREAKING_CHANGE = "0.1.11";

export async function migrateData() {
    if (isNewerVersion(FIRST_BREAKING_CHANGE, game.settings.get("atoria", "systemMigrationVersion"))) {
        await _apply_first_change();
    }

    game.settings.set("atoria", "systemMigrationVersion", game.system.version);
}


async function _apply_first_change() {
    // Apply atoria version 0.3.5
    ui.notifications.info(game.i18n.format("MIGRATION.Begin", {version: FIRST_BREAKING_CHANGE}), {permanent: true});

    // Migrate World Actors
    let migration_failed = 0;

    const actors = game.actors;
    for ( const actor of actors ) {
        try {
            var updateData = _update_actor(actor);

            if ( !foundry.utils.isEmpty(updateData) ) {
                console.log(`Migrating Actor document ${actor.name}`);
                await actor.update(updateData, {enforceTypes: false, diff: true, keepEmbeddedIds: true});
            }
        } catch(err) {
            err.message = `Failed atoria system migration for Actor ${actor.name}: ${err.message}`;
            console.error(err);
            migration_failed += 1;
        }
    }

    ui.notifications.info(game.i18n.format("MIGRATION.Complete", {version: FIRST_BREAKING_CHANGE, numberOfFailure: migration_failed}), {permanent: true});
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
        updateData["system.skills.trickery.provocation"] =  foundry.utils.deepClone(actor.system.skills.eloquence.provocation);
        updateData["system.skills.eloquence.-=provocation"] = null;
        

        // Marchandage devient Négociation et va dans la catégorie Éloquence.
        updateData["system.skills.eloquence.negotiation"] =  foundry.utils.deepClone(actor.system.skills.negotiation.bargaining);
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
            new_nature_knowledge.sub_skills.push( foundry.utils.deepClone(actor.system.knowledges.harvest.herbalist.sub_skills[sub_s]) );
        }
        for (let sub_s in actor.system.knowledges.harvest.farming.sub_skills) {
            new_nature_knowledge.sub_skills.push( foundry.utils.deepClone(actor.system.knowledges.harvest.farming.sub_skills[sub_s]) );
        }
        updateData["system.knowledges.utilitarian.nature"] = new_nature_knowledge;
        updateData["system.knowledges.harvest.-=farming"] = null;
        updateData["system.knowledges.harvest.-=herbalist"] = null;


        // Plante devient Sauvage.
        // --- Nothing to do, sub_knowledge are entered by the user ---

        // Minage voit ses connaissances fusionner et va dans Construction.
        let new_construction_knowledge = foundry.utils.deepClone(actor.system.knowledges.utilitarian.construction);
        for (let sub_s in actor.system.knowledges.harvest.mining.sub_skills) {
            new_construction_knowledge.sub_skills.push( foundry.utils.deepClone(actor.system.knowledges.harvest.mining.sub_skills[sub_s]) );
        }
        updateData["system.knowledges.utilitarian.construction"] = new_construction_knowledge;
        updateData["system.knowledges.harvest.-=mining"] = null;


        // Dressage, Nature et Pêche vont dans la grande catégorie utilitaire.
        updateData["system.knowledges.utilitarian.fishing"] = foundry.utils.deepClone(actor.system.knowledges.harvest.fishing );
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
