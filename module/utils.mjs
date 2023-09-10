/* -------------------------------------------- */
/*  Handlebars Template Helpers                 */
/* -------------------------------------------- */

/**
 * Define a set of template paths to pre-load. Pre-loaded templates are compiled and cached for fast access when
 * rendering. These paths will also be available as Handlebars partials by using the file name
 * (e.g. "atoria.actor-traits").
 * @returns {Promise}
 */
export async function preloadHandlebarsTemplates() {
    const partials = [
      // Shared Partials
      "systems/atoria/templates/common/spell-detail.hbs",
      // Actor Sheet Partials
      "systems/atoria/templates/actors/parts/actor-npc-combat.hbs",
      "systems/atoria/templates/actors/parts/actor-npc-feature.hbs",
      "systems/atoria/templates/actors/parts/actor-npc-skill.hbs",
      "systems/atoria/templates/actors/parts/actor-character-effect.hbs",
      "systems/atoria/templates/actors/parts/actor-character-combat.hbs",
      "systems/atoria/templates/actors/parts/actor-character-skill.hbs",
      "systems/atoria/templates/actors/parts/actor-character-knowledge.hbs",
      "systems/atoria/templates/actors/parts/actor-character-feature.hbs",
      "systems/atoria/templates/actors/parts/actor-character-inventory.hbs",
      "systems/atoria/templates/actors/parts/actor-character-spell.hbs"
      // Item Sheet Partials
  
      // Journal Partials
  
      // Advancement Partials
    ];
  
    const paths = {};
    for ( const path of partials ) {
      paths[path] = path;
      paths[`atoria.${path.split("/").pop().replace(".hbs", "")}`] = path;
    }
  
    return loadTemplates(paths);
}

/* -------------------------------------------- */

// /**
//  * A helper that fetch the appropriate item context from root and adds it to the first block parameter.
//  * @param {object} context  Current evaluation context.
//  * @param {object} options  Handlebars options.
//  * @returns {string}
//  */
// function itemContext(context, options) {
//     if ( arguments.length !== 2 ) throw new Error("#atoria-itemContext requires exactly one argument");
//     if ( foundry.utils.getType(context) === "function" ) context = context.call(this);

//     const ctx = options.data.root.itemContext?.[context.id];
//     if ( !ctx ) {
//         const inverse = options.inverse(this);
//         if ( inverse ) return options.inverse(this);
//     }

//     return options.fn(context, { data: options.data, blockParams: [ctx] });
// }

/* -------------------------------------------- */

// /**
//  * Creates an HTML document link for the provided UUID.
//  * @param {string} uuid  UUID for which to produce the link.
//  * @returns {string}     Link to the item or empty string if item wasn't found.
//  */
// export function linkForUuid(uuid) {
//     return TextEditor._createContentLink(["", "UUID", uuid]).outerHTML;
// }



export function getStyleDisplayValue(should_be_shown) {
  return (should_be_shown) ? "" : "display: none"
}


export function dictLength(dict) {
  return Object.keys(dict).length;
}

/* -------------------------------------------- */

/**
 * Register custom Handlebars helpers used by Atoria.
 */
export function registerHandlebarsHelpers() {
    Handlebars.registerHelper({
      getProperty: foundry.utils.getProperty,
      "atoria-get-style-display-value": getStyleDisplayValue,
      "dict_length": dictLength
    });
}





/**
 * Get critical chance
 * @param {int} success_value Success value for which to produce the critical number.
 * @param {int} critical_mod Critical modifier value for which to produce the critical number.
 * @returns {int}     critical value.
 */
export function get_critical_value(success_value=0, critical_mod=0) {
  return Math.floor(success_value / 10) + critical_mod;
}

/**
 * Get fumble chance
 * @param {int} success_value Success value for which to produce the fumble number.
 * @param {int} fumble_mod Fumble modifier value for which to produce the fumble number.
 * @returns {int}     fumble value.
 */
export function get_fumble_value(success_value=0, fumble_mod=0) {
  return 91 + Math.floor(success_value / 10) - fumble_mod;
}






/**
 * Confirm deletion
 * Ask for confirmation for deletion of something
 * @param {String} name Name of the element to delete
 * @return {boolean} Has the user confirmed the deletion
 */
export async function confirm_deletion(name, callback) {
  const title = game.i18n.format(game.i18n.localize("ATORIA.TitleDeletionDialog"), {name: name});
  const content = game.i18n.format(game.i18n.localize("ATORIA.ContentDeletionDialog"), {name: name});
  await new Dialog({
    title,
    content,
    buttons: {
      confirm: {
      label: game.i18n.localize("ATORIA.ConfirmDeletion"),
        callback: html => {console.log("chose confim");callback(true)}
      },
      cancel: {
        label: game.i18n.localize("ATORIA.CancelDeletion"),
        callback: html => {console.log("chose cancel");callback(false)}
      }
    },
    default: "cancel",
    close: () => {console.log("Closed");callback(false)}
  }, {}).render(true);
}