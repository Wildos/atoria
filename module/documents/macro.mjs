// Action, Weapon, Knowledge, Magic, Spells
export async function createItemMacro(data, slot) {
    // First, determine if this is a valid owned item.
    if (data.type !== "Item") return;
    if (!data.uuid.includes('Actor.') && !data.uuid.includes('Token.')) {
      return ui.notifications.warn("You can only create macro buttons for owned Items");
    }
    // If it is, retrieve it based on the uuid.
    const item = await Item.fromDropData(data);
  
    if (["gear-consumable", "gear-equipment", "gear-ingredient", "feature"].includes(item.type)) return false;

    // Create the macro command using the uuid.
    const command = `game.atoria.macro.rollItemMacro("${item.type}", "${data.uuid}");`;
    let macro = game.macros.find(m => (m.name === item.name) && (m.command === command));
    if (!macro) {
      macro = await Macro.create({
        name: item.name,
        type: "script",
        img: item.img,
        command: command,
        flags: { "atoria.itemMacro": true }
      });
    }
    game.user.assignHotbarMacro(macro, slot);
    return false;
}
  

export async function rollItemMacro(item_type, item_uuid) {
    const speaker = ChatMessage.getSpeaker();
    let actor;
    if (speaker.token) actor = game.actors.tokens[speaker.token];
    if (!actor) actor = game.actors.get(speaker.actor);
    if (!actor) return ui.notifications.warn(`You do not control a Actor`);
    const item = await fromUuid(item_uuid);
    if (!item) return ui.notifications.warn(`Your controlled Actor does not own this skill`);
    await actor._executeRoll(item_type, item._id);
  }


// Perception, Initiative, Skill