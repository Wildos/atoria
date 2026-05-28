import * as my_rolls from "../rolls/module.mjs";

export async function createInteractableChatMessage(
  message_mode,
  content,
  is_emote,
  flavor_text,
  rolls,
  actor,
  system_data,
) {
  let message_data = {
    content: content,
    emote: is_emote,
    // flags:
    flavor: flavor_text,
    rolls: rolls,
    // sound?:
    speaker: ChatMessage.getSpeaker({ actor: actor }),
    style: CONST.CHAT_MESSAGE_STYLES.IC,
    system: system_data,
    // timestamp: number | null;
    // title?: string;
    type: "interactable",
    user: game.user.id,
    // blind: is_blind,
    // whisper: whisper_target_ids,
  };
  ChatMessage.applyMode(message_data, message_mode);
  ChatMessage.create(message_data);
}

export async function test_chat_message(actor) {
  let skill_roll_data = {
    owning_actor_id: actor._id,
    success_value: 50,
    critical_success_amount: 5,
    critical_fumble_amount: 5,
    title: "test_skill",
    advantage_amount: 0,
    disadvantage_amount: 0,
    luck_applied: 0,
    dos_mod: 0,
    is_danger: false,
  };
  const roll = new my_rolls.AtoriaDOSRoll(actor.getRollData(), skill_roll_data);
  await roll.evaluate();

  let damage_roll = new my_rolls.AtoriaEffectRoll(
    "2d6+1+1d8",
    {},
    {
      flavor: "damage",
    },
  );
  await damage_roll.evaluate();
  let heal_roll = new my_rolls.AtoriaEffectRoll(
    "1d4-2",
    {},
    {
      flavor: "healing is good it keep people alive",
    },
  );
  await heal_roll.evaluate();

  let message_mode = game.settings.get("core", "messageMode");
  let content = "";
  let is_emote = false;
  let flavor_text = "";
  let rolls = [roll, damage_roll, heal_roll];
  let system_data = {};
  createInteractableChatMessage(
    message_mode,
    content,
    is_emote,
    flavor_text,
    rolls,
    actor,
    system_data,
  );
}
