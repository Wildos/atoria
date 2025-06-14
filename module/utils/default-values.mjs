import * as utils from "../models/module.mjs";

const DEFAULT_VALUES = {};

DEFAULT_VALUES["character"] = {
  health: 20,
  absorption: 0,
  stamina: 10,
  mana: 20,

  sanity: 10,
  endurance: 100,

  encumbrance: 20,

  armor: 0,
  resistance: 0,
  movement: 6,
  initiative: "1d2",

  luck: 0,

  perceptions: {
    sight: 50,
    earing: 50,
    smell: 50,
    taste: 50,
    instinct: 25,
    magice: 15,
  },

  skill: {
    success: 10,
    get_success: (group) => {
      if (group === "magic") {
        return 0;
      }
      return 10;
    },
  },
  skills: {
    physical: {
      agility: ["balance", "dexterity"],
      athletic: ["hiking", "running", "jump"],
      slyness: ["silence", "stealth", "concealment"],
      climbing: ["scale", "fall"],
      swiming: ["ease", "breath-holding"],
      sturdiness: ["force", "tenacity", "fortitude"],
    },
    social: {
      analyse: ["insight", "identification", "investigation"],
      charisma: ["presence", "seduction"],
      eloquence: ["persuasion", "calming", "negotiation"],
      spirit: ["will", "guarding"],
      intimidation: ["fear", "authority"],
      trickery: ["acting", "lying", "provocation"],
    },
    combative: {
      reflex: ["dodge", "parry", "opportuneness"],
      weapon: [
        "brawl",
        "blade",
        "polearm",
        "haft-slashing",
        "haft-bludgeonning-piercing",
        "shield",
        "shooting",
        "throw",
        "focuser",
        "instrument",
      ],
    },
  },
  knowledges: {
    craftmanship: {
      alchemy: ["potion", "poison", "transformation"],
      jewellery: ["finery", "seaming"],
      sewing: ["fashion", "domestic"],
      cuisine: ["meal", "baking", "licor"],
      "cabinet-making": ["gear", "woodworking"],
      forge: ["weaponry", "armoury", "goldsmithery"],
      engineering: ["mechanism", "siege", "glassware"],
      leatherworking: ["tanning", "clothing", "object"],
    },
    artistic: {
      song: ["entertaining", "battle"],
      dance: ["aesthetics", "combat", "spiritual"],
      graphic: ["work", "tattoo"],
      music: ["repertoire", "theory"],
      sculpture: ["ceramic", "decoration"],
    },
    erudition: {
      civilisation: [],
      language: [],
      medecine: ["treatment", "mortuary"],
      monstrology: [],
      runic: ["enchantment", "inscription"],
      science: ["mathematic", "astronomy", "geology"],
      symbolism: ["heraldry", "cryptography"],
      zoology: [],
    },
    utilitarian: {
      hunting: ["tracking", "cutting"],
      construction: ["masonry", "carpentry"],
      dressage: ["taming", "war"],
      nature: ["farming", "herbalist", "fungus"],
      fishing: ["bank", "high-sea"],
      strategy: ["tactics", "logistics", "cartography"],
      transport: ["mounting", "land", "sea"],
      theft: ["pickpocketing", "lock-picking"],
    },
    magic: {
      air: ["dazzling", "breeze", "lightning"],
      mental: ["kinetic", "illusion", "power", "enchanted"],
      druidic: ["astral", "solicitude", "changeforme", "mutation"],
      water: ["ablution", "source", "ice"],
      fire: ["torch", "ignition", "destruction"],
      occult: ["toxic", "curse", "ethereal", "necromancy"],
      holy: ["blessing", "piety", "glory", "purification"],
      blood: ["sacrifice", "puncture", "drain"],
      earth: ["bastion", "telluric", "metallic"],
    },
  },
};

DEFAULT_VALUES["associated_skills"] = {
  "system.skills.physical.agility.balance":
    "ATORIA.Ruleset.Skills.Physical.Agility.Balance.Label",
  "system.skills.physical.agility.dexterity":
    "ATORIA.Ruleset.Skills.Physical.Agility.Dexterity.Label",
  "system.skills.physical.athletic.hiking":
    "ATORIA.Ruleset.Skills.Physical.Athletic.Hiking.Label",
  "system.skills.physical.athletic.running":
    "ATORIA.Ruleset.Skills.Physical.Athletic.Running.Label",
  "system.skills.physical.athletic.jump":
    "ATORIA.Ruleset.Skills.Physical.Athletic.Jump.Label",
  "system.skills.physical.slyness.silence":
    "ATORIA.Ruleset.Skills.Physical.Slyness.Silence.Label",
  "system.skills.physical.slyness.stealth":
    "ATORIA.Ruleset.Skills.Physical.Slyness.Stealth.Label",
  "system.skills.physical.slyness.concealment":
    "ATORIA.Ruleset.Skills.Physical.Slyness.Concealment.Label",
  "system.skills.physical.climbing.scale":
    "ATORIA.Ruleset.Skills.Physical.Climbing.Scale.Label",
  "system.skills.physical.climbing.fall":
    "ATORIA.Ruleset.Skills.Physical.Climbing.Fall.Label",
  "system.skills.physical.swiming.ease":
    "ATORIA.Ruleset.Skills.Physical.Swiming.Ease.Label",
  "system.skills.physical.swiming.breath-holding":
    "ATORIA.Ruleset.Skills.Physical.Swiming.Breath-holding.Label",
  "system.skills.physical.sturdiness.force":
    "ATORIA.Ruleset.Skills.Physical.Sturdiness.Force.Label",
  "system.skills.physical.sturdiness.tenacity":
    "ATORIA.Ruleset.Skills.Physical.Sturdiness.Tenacity.Label",
  "system.skills.physical.sturdiness.fortitude":
    "ATORIA.Ruleset.Skills.Physical.Sturdiness.Fortitude.Label",
  "system.skills.social.analyse.insight":
    "ATORIA.Ruleset.Skills.Social.Analyse.Insight.Label",
  "system.skills.social.analyse.identification":
    "ATORIA.Ruleset.Skills.Social.Analyse.Identification.Label",
  "system.skills.social.analyse.investigation":
    "ATORIA.Ruleset.Skills.Social.Analyse.Investigation.Label",
  "system.skills.social.charisma.presence":
    "ATORIA.Ruleset.Skills.Social.Charisma.Presence.Label",
  "system.skills.social.charisma.seduction":
    "ATORIA.Ruleset.Skills.Social.Charisma.Seduction.Label",
  "system.skills.social.eloquence.persuasion":
    "ATORIA.Ruleset.Skills.Social.Eloquence.Persuasion.Label",
  "system.skills.social.eloquence.calming":
    "ATORIA.Ruleset.Skills.Social.Eloquence.Calming.Label",
  "system.skills.social.eloquence.negotiation":
    "ATORIA.Ruleset.Skills.Social.Eloquence.Negotiation.Label",
  "system.skills.social.spirit.will":
    "ATORIA.Ruleset.Skills.Social.Spirit.Will.Label",
  "system.skills.social.spirit.guarding":
    "ATORIA.Ruleset.Skills.Social.Spirit.Guarding.Label",
  "system.skills.social.intimidation.fear":
    "ATORIA.Ruleset.Skills.Social.Intimidation.Fear.Label",
  "system.skills.social.intimidation.authority":
    "ATORIA.Ruleset.Skills.Social.Intimidation.Authority.Label",
  "system.skills.social.trickery.acting":
    "ATORIA.Ruleset.Skills.Social.Trickery.Acting.Label",
  "system.skills.social.trickery.lying":
    "ATORIA.Ruleset.Skills.Social.Trickery.Lying.Label",
  "system.skills.social.trickery.provocation":
    "ATORIA.Ruleset.Skills.Social.Trickery.Provocation.Label",
  "system.skills.combative.reflex.dodge":
    "ATORIA.Ruleset.Skills.Combative.Reflex.Dodge.Label",
  "system.skills.combative.reflex.parry":
    "ATORIA.Ruleset.Skills.Combative.Reflex.Parry.Label",
  "system.skills.combative.reflex.opportuneness":
    "ATORIA.Ruleset.Skills.Combative.Reflex.Opportuneness.Label",
  "system.skills.combative.weapon.brawl":
    "ATORIA.Ruleset.Skills.Combative.Weapon.Brawl.Label",
  "system.skills.combative.weapon.blade":
    "ATORIA.Ruleset.Skills.Combative.Weapon.Blade.Label",
  "system.skills.combative.weapon.polearm":
    "ATORIA.Ruleset.Skills.Combative.Weapon.Polearm.Label",
  "system.skills.combative.weapon.haft-slashing":
    "ATORIA.Ruleset.Skills.Combative.Weapon.Haft-slashing.Label",
  "system.skills.combative.weapon.haft-bludgeonning-piercing":
    "ATORIA.Ruleset.Skills.Combative.Weapon.Haft-bludgeonning-piercing.Label",
  "system.skills.combative.weapon.shield":
    "ATORIA.Ruleset.Skills.Combative.Weapon.Shield.Label",
  "system.skills.combative.weapon.shooting":
    "ATORIA.Ruleset.Skills.Combative.Weapon.Shooting.Label",
  "system.skills.combative.weapon.throw":
    "ATORIA.Ruleset.Skills.Combative.Weapon.Throw.Label",
  "system.skills.combative.weapon.focuser":
    "ATORIA.Ruleset.Skills.Combative.Weapon.Focuser.Label",
  "system.skills.combative.weapon.instrument":
    "ATORIA.Ruleset.Skills.Combative.Weapon.Instrument.Label",
  "system.knowledges.craftmanship.alchemy.potion":
    "ATORIA.Ruleset.Knowledges.Craftmanship.Alchemy.Potion.Label",
  "system.knowledges.craftmanship.alchemy.poison":
    "ATORIA.Ruleset.Knowledges.Craftmanship.Alchemy.Poison.Label",
  "system.knowledges.craftmanship.alchemy.transformation":
    "ATORIA.Ruleset.Knowledges.Craftmanship.Alchemy.Transformation.Label",
  "system.knowledges.craftmanship.jewellery.finery":
    "ATORIA.Ruleset.Knowledges.Craftmanship.Jewellery.Finery.Label",
  "system.knowledges.craftmanship.jewellery.seaming":
    "ATORIA.Ruleset.Knowledges.Craftmanship.Jewellery.Seaming.Label",
  "system.knowledges.craftmanship.sewing.fashion":
    "ATORIA.Ruleset.Knowledges.Craftmanship.Sewing.Fashion.Label",
  "system.knowledges.craftmanship.sewing.domestic":
    "ATORIA.Ruleset.Knowledges.Craftmanship.Sewing.Domestic.Label",
  "system.knowledges.craftmanship.cuisine.meal":
    "ATORIA.Ruleset.Knowledges.Craftmanship.Cuisine.Meal.Label",
  "system.knowledges.craftmanship.cuisine.baking":
    "ATORIA.Ruleset.Knowledges.Craftmanship.Cuisine.Baking.Label",
  "system.knowledges.craftmanship.cuisine.licor":
    "ATORIA.Ruleset.Knowledges.Craftmanship.Cuisine.Licor.Label",
  "system.knowledges.craftmanship.cabinet-making.gear":
    "ATORIA.Ruleset.Knowledges.Craftmanship.Cabinet-making.Gear.Label",
  "system.knowledges.craftmanship.cabinet-making.woodworking":
    "ATORIA.Ruleset.Knowledges.Craftmanship.Cabinet-making.Woodworking.Label",
  "system.knowledges.craftmanship.forge.weaponry":
    "ATORIA.Ruleset.Knowledges.Craftmanship.Forge.Weaponry.Label",
  "system.knowledges.craftmanship.forge.armoury":
    "ATORIA.Ruleset.Knowledges.Craftmanship.Forge.Armoury.Label",
  "system.knowledges.craftmanship.forge.goldsmithery":
    "ATORIA.Ruleset.Knowledges.Craftmanship.Forge.Goldsmithery.Label",
  "system.knowledges.craftmanship.engineering.mechanism":
    "ATORIA.Ruleset.Knowledges.Craftmanship.Engineering.Mechanism.Label",
  "system.knowledges.craftmanship.engineering.siege":
    "ATORIA.Ruleset.Knowledges.Craftmanship.Engineering.Siege.Label",
  "system.knowledges.craftmanship.engineering.glassware":
    "ATORIA.Ruleset.Knowledges.Craftmanship.Engineering.Glassware.Label",
  "system.knowledges.craftmanship.leatherworking.tanning":
    "ATORIA.Ruleset.Knowledges.Craftmanship.Leatherworking.Tanning.Label",
  "system.knowledges.craftmanship.leatherworking.clothing":
    "ATORIA.Ruleset.Knowledges.Craftmanship.Leatherworking.Clothing.Label",
  "system.knowledges.artistic.song.entertaining":
    "ATORIA.Ruleset.Knowledges.Artistic.Song.Entertaining.Label",
  "system.knowledges.artistic.song.battle":
    "ATORIA.Ruleset.Knowledges.Artistic.Song.Battle.Label",
  "system.knowledges.artistic.dance.aesthetics":
    "ATORIA.Ruleset.Knowledges.Artistic.Dance.Aesthetics.Label",
  "system.knowledges.artistic.dance.combat":
    "ATORIA.Ruleset.Knowledges.Artistic.Dance.Combat.Label",
  "system.knowledges.artistic.dance.spiritual":
    "ATORIA.Ruleset.Knowledges.Artistic.Dance.Spiritual.Label",
  "system.knowledges.artistic.graphic.work":
    "ATORIA.Ruleset.Knowledges.Artistic.Graphic.Work.Label",
  "system.knowledges.artistic.graphic.tattoo":
    "ATORIA.Ruleset.Knowledges.Artistic.Graphic.Tattoo.Label",
  "system.knowledges.artistic.music.repertoire":
    "ATORIA.Ruleset.Knowledges.Artistic.Music.Repertoire.Label",
  "system.knowledges.artistic.music.theory":
    "ATORIA.Ruleset.Knowledges.Artistic.Music.Theory.Label",
  "system.knowledges.artistic.sculpture.ceramic":
    "ATORIA.Ruleset.Knowledges.Artistic.Sculpture.Ceramic.Label",
  "system.knowledges.artistic.sculpture.decoration":
    "ATORIA.Ruleset.Knowledges.Artistic.Sculpture.Decoration.Label",
  "system.knowledges.erudition.medecine.treatment":
    "ATORIA.Ruleset.Knowledges.Erudition.Medecine.Treatment.Label",
  "system.knowledges.erudition.medecine.mortuary":
    "ATORIA.Ruleset.Knowledges.Erudition.Medecine.Mortuary.Label",
  "system.knowledges.erudition.runic.enchantment":
    "ATORIA.Ruleset.Knowledges.Erudition.Runic.Enchantment.Label",
  "system.knowledges.erudition.runic.inscription":
    "ATORIA.Ruleset.Knowledges.Erudition.Runic.Inscription.Label",
  "system.knowledges.erudition.science.mathematic":
    "ATORIA.Ruleset.Knowledges.Erudition.Science.Mathematic.Label",
  "system.knowledges.erudition.science.astronomy":
    "ATORIA.Ruleset.Knowledges.Erudition.Science.Astronomy.Label",
  "system.knowledges.erudition.science.geology":
    "ATORIA.Ruleset.Knowledges.Erudition.Science.Geology.Label",
  "system.knowledges.erudition.symbolism.heraldry":
    "ATORIA.Ruleset.Knowledges.Erudition.Symbolism.Heraldry.Label",
  "system.knowledges.erudition.symbolism.cryptography":
    "ATORIA.Ruleset.Knowledges.Erudition.Symbolism.Cryptography.Label",
  "system.knowledges.utilitarian.hunting.tracking":
    "ATORIA.Ruleset.Knowledges.Utilitarian.Hunting.Tracking.Label",
  "system.knowledges.utilitarian.hunting.cutting":
    "ATORIA.Ruleset.Knowledges.Utilitarian.Hunting.Cutting.Label",
  "system.knowledges.utilitarian.construction.masonry":
    "ATORIA.Ruleset.Knowledges.Utilitarian.Construction.Masonry.Label",
  "system.knowledges.utilitarian.construction.carpentry":
    "ATORIA.Ruleset.Knowledges.Utilitarian.Construction.Carpentry.Label",
  "system.knowledges.utilitarian.dressage.taming":
    "ATORIA.Ruleset.Knowledges.Utilitarian.Dressage.Taming.Label",
  "system.knowledges.utilitarian.dressage.war":
    "ATORIA.Ruleset.Knowledges.Utilitarian.Dressage.War.Label",
  "system.knowledges.utilitarian.nature.farming":
    "ATORIA.Ruleset.Knowledges.Utilitarian.Nature.Farming.Label",
  "system.knowledges.utilitarian.nature.herbalist":
    "ATORIA.Ruleset.Knowledges.Utilitarian.Nature.Herbalist.Label",
  "system.knowledges.utilitarian.nature.fungus":
    "ATORIA.Ruleset.Knowledges.Utilitarian.Nature.Fungus.Label",
  "system.knowledges.utilitarian.fishing.bank":
    "ATORIA.Ruleset.Knowledges.Utilitarian.Fishing.Bank.Label",
  "system.knowledges.utilitarian.fishing.high-sea":
    "ATORIA.Ruleset.Knowledges.Utilitarian.Fishing.High-sea.Label",
  "system.knowledges.utilitarian.strategy.tactics":
    "ATORIA.Ruleset.Knowledges.Utilitarian.Strategy.Tactics.Label",
  "system.knowledges.utilitarian.strategy.logistics":
    "ATORIA.Ruleset.Knowledges.Utilitarian.Strategy.Logistics.Label",
  "system.knowledges.utilitarian.strategy.cartography":
    "ATORIA.Ruleset.Knowledges.Utilitarian.Strategy.Cartography.Label",
  "system.knowledges.utilitarian.transport.mounting":
    "ATORIA.Ruleset.Knowledges.Utilitarian.Transport.Mounting.Label",
  "system.knowledges.utilitarian.transport.land":
    "ATORIA.Ruleset.Knowledges.Utilitarian.Transport.Land.Label",
  "system.knowledges.utilitarian.transport.sea":
    "ATORIA.Ruleset.Knowledges.Utilitarian.Transport.Sea.Label",
  "system.knowledges.utilitarian.theft.pickpocketing":
    "ATORIA.Ruleset.Knowledges.Utilitarian.Theft.Pickpocketing.Label",
  "system.knowledges.utilitarian.theft.lock-picking":
    "ATORIA.Ruleset.Knowledges.Utilitarian.Theft.Lock-picking.Label",
  "system.knowledges.magic.air.dazzling":
    "ATORIA.Ruleset.Knowledges.Magic.Air.Dazzling.Label",
  "system.knowledges.magic.air.breeze":
    "ATORIA.Ruleset.Knowledges.Magic.Air.Breeze.Label",
  "system.knowledges.magic.air.lightning":
    "ATORIA.Ruleset.Knowledges.Magic.Air.Lightning.Label",
  "system.knowledges.magic.druidic.astral":
    "ATORIA.Ruleset.Knowledges.Magic.Druidic.Astral.Label",
  "system.knowledges.magic.druidic.solicitude":
    "ATORIA.Ruleset.Knowledges.Magic.Druidic.Solicitude.Label",
  "system.knowledges.magic.druidic.changeforme":
    "ATORIA.Ruleset.Knowledges.Magic.Druidic.Changeforme.Label",
  "system.knowledges.magic.druidic.mutation":
    "ATORIA.Ruleset.Knowledges.Magic.Druidic.Mutation.Label",
  "system.knowledges.magic.water.ablution":
    "ATORIA.Ruleset.Knowledges.Magic.Water.Ablution.Label",
  "system.knowledges.magic.water.source":
    "ATORIA.Ruleset.Knowledges.Magic.Water.Source.Label",
  "system.knowledges.magic.water.ice":
    "ATORIA.Ruleset.Knowledges.Magic.Water.Ice.Label",
  "system.knowledges.magic.fire.torch":
    "ATORIA.Ruleset.Knowledges.Magic.Fire.Torch.Label",
  "system.knowledges.magic.fire.ignition":
    "ATORIA.Ruleset.Knowledges.Magic.Fire.Ignition.Label",
  "system.knowledges.magic.fire.destruction":
    "ATORIA.Ruleset.Knowledges.Magic.Fire.Destruction.Label",
  "system.knowledges.magic.occult.toxic":
    "ATORIA.Ruleset.Knowledges.Magic.Occult.Toxic.Label",
  "system.knowledges.magic.occult.curse":
    "ATORIA.Ruleset.Knowledges.Magic.Occult.Curse.Label",
  "system.knowledges.magic.occult.ethereal":
    "ATORIA.Ruleset.Knowledges.Magic.Occult.Ethereal.Label",
  "system.knowledges.magic.occult.necromancy":
    "ATORIA.Ruleset.Knowledges.Magic.Occult.Necromancy.Label",
  "system.knowledges.magic.mental.kinetic":
    "ATORIA.Ruleset.Knowledges.Magic.Mental.Kinetic.Label",
  "system.knowledges.magic.mental.illusion":
    "ATORIA.Ruleset.Knowledges.Magic.Mental.Illusion.Label",
  "system.knowledges.magic.mental.power":
    "ATORIA.Ruleset.Knowledges.Magic.Mental.Power.Label",
  "system.knowledges.magic.mental.enchanted":
    "ATORIA.Ruleset.Knowledges.Magic.Mental.Enchanted.Label",
  "system.knowledges.magic.holy.blessing":
    "ATORIA.Ruleset.Knowledges.Magic.Holy.Blessing.Label",
  "system.knowledges.magic.holy.piety":
    "ATORIA.Ruleset.Knowledges.Magic.Holy.Piety.Label",
  "system.knowledges.magic.holy.glory":
    "ATORIA.Ruleset.Knowledges.Magic.Holy.Glory.Label",
  "system.knowledges.magic.holy.purification":
    "ATORIA.Ruleset.Knowledges.Magic.Holy.Purification.Label",
  "system.knowledges.magic.blood.sacrifice":
    "ATORIA.Ruleset.Knowledges.Magic.Blood.Sacrifice.Label",
  "system.knowledges.magic.blood.puncture":
    "ATORIA.Ruleset.Knowledges.Magic.Blood.Puncture.Label",
  "system.knowledges.magic.blood.drain":
    "ATORIA.Ruleset.Knowledges.Magic.Blood.Drain.Label",
  "system.knowledges.magic.earth.bastion":
    "ATORIA.Ruleset.Knowledges.Magic.Earth.Bastion.Label",
  "system.knowledges.magic.earth.telluric":
    "ATORIA.Ruleset.Knowledges.Magic.Earth.Telluric.Label",
  "system.knowledges.magic.earth.metallic":
    "ATORIA.Ruleset.Knowledges.Magic.Earth.Metallic.Label",
};

DEFAULT_VALUES["models"] = utils;

export default DEFAULT_VALUES;
