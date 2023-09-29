// Action, Weapon, Knowledge, Magic, Spells
export async function createItemMacro(dropData, slot) {
    const item = await Item.implementation.fromDropData(dropData);
    if ( !item ) return ui.notifications.warn(game.i18n.localize("MACRO.AtrUnownedWarn"));
  
    if (["gear-consumable", "gear-equipment", "gear-ingredient", "feature"].includes(item.type)) return;

    const command = `game.atoria.macro.rollItemMacro("${item.type}", "${item.name}");`;
    const macroData = {
      type: "script",
      scope: "actor",
      name: item.name,
      img: item.img,
      command: command,
      flags: { "atoria.itemMacro": true }
    };

    const macro = game.macros.find(m => (m.name === macroData.name) && (m.command === macroData.command)
    && m.author.isSelf) || await Macro.create(macroData);

    game.user.assignHotbarMacro(macro, slot);
}
  

export async function rollItemMacro(item_type, item_name) {
    let actor;
    const speaker = ChatMessage.getSpeaker();
    if ( speaker.token ) actor = game.actors.tokens[speaker.token];
    actor ??= game.actors.get(speaker.actor);
    if ( !actor ) return ui.notifications.warn(game.i18n.localize("MACRO.AtrNoActorSelected"));

    const collection = actor.items;
    const nameKeyPath = "name";
  
    // Find item in collection
    const documents = collection.filter(i => foundry.utils.getProperty(i, nameKeyPath) === item_name);
    const type = game.i18n.localize(`DOCUMENT.Item`);
    if ( documents.length === 0 ) {
    return ui.notifications.warn(game.i18n.format("MACRO.AtrMissingTargetWarn", { actor: actor.name, type, item_name }));
    }
    if ( documents.length > 1 ) {
      ui.notifications.warn(game.i18n.format("MACRO.AtrMultipleTargetsWarn", { actor: actor.name, type, item_name }));
    }

    await actor._executeRoll(item_type, documents[0]._id);
  }

// Initiative

export async function createInitiativeMacro(dropData, slot) {
  const command = `game.atoria.macro.rollActorMacro("${dropData.type}");`;
  const macroData = {
    type: "script",
    scope: "actor",
    name: dropData.name,
    img: dropData.img,
    command: command,
    flags: { "atoria.itemMacro": true }
  };

  const macro = game.macros.find(m => (m.name === macroData.name) && (m.command === macroData.command)
  && m.author.isSelf) || await Macro.create(macroData);

  game.user.assignHotbarMacro(macro, slot);
}

// Perception, Skill
export async function createSkillMacro(dropData, slot) {
  const command = `game.atoria.macro.rollActorMacro("${dropData.type}", "${dropData.id}");`;
  const macroData = {
    type: "script",
    scope: "actor",
    name: dropData.name,
    img: dropData.img,
    command: command,
    flags: { "atoria.itemMacro": true }
  };

  const macro = game.macros.find(m => (m.name === macroData.name) && (m.command === macroData.command)
  && m.author.isSelf) || await Macro.create(macroData);

  game.user.assignHotbarMacro(macro, slot);
}



export async function rollActorMacro(data_type, rollable_id = "") {
  let actor;
  const speaker = ChatMessage.getSpeaker();
  if ( speaker.token ) actor = game.actors.tokens[speaker.token];
  actor ??= game.actors.get(speaker.actor);
  if ( !actor ) return ui.notifications.warn(game.i18n.localize("MACRO.AtrNoActorSelected"));

  await actor._executeRoll(data_type, rollable_id);
}