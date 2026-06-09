import * as my_rolls from "../rolls/module.mjs";

export async function createInteractableChatMessage(
  message_mode,
  actor,
  content,
  rolls,
  system_data,
  flavor_text = "",
  is_emote = false,
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

export async function create_rolls_with_effect(
  actor,
  roll_data,
  effects_data,
  critical_effects_data,
) {
  const roll = new my_rolls.AtoriaDOSRoll(actor.getRollData(), roll_data);
  await roll.evaluate();

  let rolls = [roll];

  for (let effect_data of effects_data) {
    let effect_roll = new my_rolls.AtoriaEffectRoll(
      effect_data.formula,
      {},
      {
        flavor: effect_data.flavor,
      },
    );
    await effect_roll.evaluate({ maximize: roll.is_critical_success });
    rolls.push(effect_roll);
  }
  if (roll.is_critical_success) {
    for (let effect_data of critical_effects_data) {
      let effect_roll = new my_rolls.AtoriaEffectRoll(
        effect_data.formula,
        {},
        {
          flavor: effect_data.flavor,
        },
      );
      await effect_roll.evaluate();
      rolls.push(effect_roll);
    }
  }
  return rolls;
}

export async function create_simple_effect_rolls(effects_data) {
  let rolls = [];

  for (let effect_data of effects_data) {
    let effect_roll = new my_rolls.AtoriaEffectRoll(
      effect_data.formula,
      {},
      {
        flavor: effect_data.flavor,
      },
    );
    await effect_roll.evaluate({});
    rolls.push(effect_roll);
  }
  return rolls;
}

export async function chat_message_from_roll(
  actor,
  message_mode,
  rolls,
  system_data,
) {
  let content = "";
  let is_emote = false;
  let flavor_text = "";

  return createInteractableChatMessage(
    message_mode,
    actor,
    content,
    rolls,
    system_data,
    flavor_text,
    is_emote,
  );
}

export async function chat_message_from_non_roll(
  actor,
  message_mode,
  message_content,
  rolls,
  system_data,
) {
  let content = message_content;
  let is_emote = false;
  let flavor_text = "";

  return createInteractableChatMessage(
    message_mode,
    actor,
    content,
    rolls,
    system_data,
    flavor_text,
    is_emote,
  );
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

  let effects_data = [
    {
      formula: "1d6+2",
      flavor: "Dégat",
    },
    {
      formula: "2d4-1",
      flavor: "Santé",
    },
  ];

  let system_data = {
    used_perks: [{ name: "supp one", description: "check this out" }],
    saves_asked: [
      {
        name: "ATORIA.Ruleset.Skills.Combative.Reflex.Dodge.Label",
        skill_path: "system.skills.combative.reflex.dodge",
      },
    ],
  };

  let message_mode = game.settings.get("core", "messageMode");

  await chat_message_from_roll(
    actor,
    message_mode,
    skill_roll_data,
    effects_data,
    system_data,
  );
}
