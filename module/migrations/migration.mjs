const FIRST_BREAKING_CHANGE = "0.1.11";

export async function migrateData() {
    if (isNewerVersion(FIRST_BREAKING_CHANGE, game.settings.get("atoria", "systemMigrationVersion"))) {
        await _apply_first_change();
    }
}


// /!\WARNING: I use shallow cloning, check everything is properly transfered (and not half deleted)
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
                await actor.update(updateData, {enforceTypes: false, diff: true});
            }
        } catch(err) {
            err.message = `Failed atoria system migration for Actor ${actor.name}: ${err.message}`;
            console.error(err);
            migration_failed += 1;
        }
    }


    //Migrate Actor Override Tokens
    for ( let s of game.scenes ) {
        try {
            const updateData = migrateSceneData(s);
            if ( !foundry.utils.isEmpty(updateData) ) {
                console.log(`Migrating Scene document ${s.name}`);
                await s.update(updateData, {enforceTypes: false});
                // If we do not do this, then synthetic token actors remain in cache
                // with the un-updated actorData.
                s.tokens.forEach(t => t._actor = null);
            }
        } catch(err) {
            err.message = `Failed atoria system migration for Scene ${s.name}: ${err.message}`;
            console.error(err);
        }
    }

    ui.notifications.info(game.i18n.format("MIGRATION.Complete", {version: FIRST_BREAKING_CHANGE, numberOfFailure: migration_failed}), {permanent: true});
}




function _update_actor(actor) {
    try {
        if (actor == undefined) {
            return;
        }
        if (actor.type !== 'character') {
            return;
        }
        const updateData = {};

        // Suppression de Menace, Diplomatie et Mémoire.
        delete actor.system.skills.intimidation["threat"];
        delete actor.system.skills.negotiation["diplomacy"];
        delete actor.system.skills.spirit["memory"];

        // Souplesse fusionne avec Acrobatie et devient Adresse.
        delete actor.system.skills.agility["flexibility"];
        delete actor.system.skills.agility["acrobatics"];
        updateData["system.skills.agility.dexterity"] = {
            "success_value": 10,
            "critical_mod": 0,
            "fumble_mod": 0
        };

        // La catégorie Tromperie devient Ruse
        // --- Change only reflected on the language pack, the name used in code is kept ---

        // Provocation va dans la catégorie Ruse.
        updateData["system.skills.trickery.provocation"] = { ...actor.system.skills.eloquence.provocation };
        delete actor.system.skills.eloquence["provocation"];
        

        // Marchandage devient Négociation et va dans la catégorie Éloquence.
        updateData["system.skills.eloquence.negotiation"] = { ...actor.system.skills.negotiation.bargaining };
        delete actor.system.skills["negotiation"];


        // Suppression de Dressage.
        delete actor.system.skills["dressage"];


        // La connaissance Véhicule devient Transport.
        updateData["system.knowledges.utilitarian.transport"] = { ...actor.system.knowledges.utilitarian.vehicle };
        delete actor.system.knowledges.utilitarian["vehicle"];

        // La connaissance Élevage devient Dressage.
        updateData["system.knowledges.harvest.dressage"] = { ...actor.system.knowledges.harvest.livestock };
        delete actor.system.knowledges.harvest["livestock"];


        // Monte va dans la connaissance Transport.
        // --- Nothing to do, sub_knowledge are entered by the user ---

        // Domptage fusionne avec Bétail et devient Domestication.
        // --- Nothing to do, sub_knowledge are entered by the user ---

        // Tannage va dans Maroquinerie
        // --- Nothing to do, sub_knowledge are entered by the user ---

        //  Herboristerie devient Nature. & Culture voit ses connaissances fusionner et va dans Nature.
        let new_nature_knowledge = {
            "known": false,
            "sub_skills": []
        };
        for (sub_s in actor.system.knowledges.harvest.herbalist.sub_skills) {
            new_nature_knowledge.sub_skills.push({ ...sub_s });
        }
        for (sub_s in actor.system.knowledges.harvest.farming.sub_skills) {
            new_nature_knowledge.sub_skills.push({ ...sub_s });
        }
        updateData["system.knowledges.harvest.nature"] = new_nature_knowledge;
        delete actor.system.knowledges.harvest["farming"];
        delete actor.system.knowledges.harvest["herbalist"];


        // Plante devient Sauvage.
        // --- Nothing to do, sub_knowledge are entered by the user ---

        // Minage voit ses connaissances fusionner et va dans Construction.
        let new_construction_knowledge = { ...actor.system.knowledges.utilitarian.construction }
        for (sub_s in actor.system.knowledges.harvest.mining.sub_skills) {
            new_construction_knowledge.sub_skills.push({ ...sub_s });
        }
        updateData["system.knowledges.utilitarian.construction"] = new_nature_knowledge;
        delete actor.system.knowledges.harvest["mining"];


        // Dressage, Nature et Pêche vont dans la grande catégorie utilitaire.
        updateData["system.knowledges.utilitarian.dressage"] = { ...actor.system.knowledges.harvest.dressage };
        updateData["system.knowledges.utilitarian.nature"] = { ...actor.system.knowledges.harvest.nature };
        updateData["system.knowledges.utilitarian.fishing"] = { ...actor.system.knowledges.harvest.fishing };
        delete actor.system.knowledges.harvest["dressage"];
        delete actor.system.knowledges.harvest["nature"];
        delete actor.system.knowledges.harvest["fishing"];

        // Suppression de la grande catégorie de connaissance Récolte.
        delete actor.system.knowledges["harvest"];


        // Fix typo
        updateData["system.skills.eloquence.persuasion"] = { ...actor.system.skills.eloquence.persusasion };
        delete actor.system.skills.eloquence["persusasion"];

        return updateData;
    } catch (err) {
        throw new Error(`Error while updating actor ${actor.name}: ${err.message}`);
    }
}



/**
 * Migrate a single Scene document to incorporate changes to the data model of it's actor data overrides
 * Return an Object of updateData to be applied
 * @param {object} scene            The Scene data to Update
 * @returns {object}                The updateData to apply
 */
function migrateSceneData(scene) {
    try {
        const tokens = scene.tokens.map(token => {
            try {
                const t = token instanceof foundry.abstract.DataModel ? token.toObject() : token;
                const update = {};
                if ( Object.keys(update).length ) foundry.utils.mergeObject(t, update);
                if ( !game.actors.has(t.actorId) ) t.actorId = null;
                if ( !t.actorId || t.actorLink ) t.actorData = {};
                else if ( !t.actorLink ) {
                    const actorData = token.delta?.toObject() ?? foundry.utils.deepClone(t.actorData);
                    actorData.type = token.actor?.type;

                    const update = _update_actor(actorData);
                    t.delta = update;
                }
                return t;
            } catch (err) {
                throw err;
            }
        });
        return {tokens};
    } catch (err) {
        console.error("LOL WTF");
        throw err;
    }
  };