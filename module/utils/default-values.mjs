import * as models from "../models/module.mjs";
import RULESET from "./ruleset.mjs";
import * as utils from "../utils/module.mjs";

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
      environment: ["climbing", "nage", "fortitude"],
      reflex: ["dodge", "parry", "opportuneness"],
      sturdiness: ["force", "tenacity"],
    },
    social: {
      analyse: ["insight", "investigation"],
      charisma: ["intimidation", "presence", "seduction"],
      eloquence: ["persuasion", "calming", "negotiation"],
      spirit: ["will", "guarding"],
      trickery: ["acting", "lying", "provocation"],
    },
    combative: {
      weapon: [
        "brawl",
        "blade",
        "haft-slashing",
        "haft-bludgeonning-piercing",
        "polearm",
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
      alchemy: ["mixture", "transformation"],
      artistic: ["ceramic", "sculpture", "graphic"],
      jewellery: ["finery", "seaming", "glassware"],
      sewing: ["fashion", "domestic"],
      cuisine: ["meal", "baking"],
      "cabinet-making": ["gear", "woodworking"],
      forge: ["weaponry", "armoury", "goldsmithery"],
      engineering: ["mechanism", "siege"],
      leatherworking: ["tanning", "manufacture"],
    },
    erudition: {
      civilisation: [],
      language: [],
      medecine: ["treatment", "mortuary"],
      monstrology: [],
      runic: ["enchantment", "inscription", "tattoo"],
      science: ["astronomy", "geology", "mathematic"],
      strategy: ["battle", "expedition"],
      symbolism: ["heraldry", "cryptography", "cartography"],
      zoology: [],
    },
    utilitarian: {
      song: ["entertaining", "martial"],
      hunting: ["tracking", "cutting"],
      construction: ["masonry", "carpentry"],
      dance: ["aesthetics", "spinning"],
      dressage: ["taming", "war"],
      theft: ["pickpocketing", "lock-picking"],
      nature: ["farming", "herbalist", "fungus"],
      fishing: ["bank", "high-sea"],
      transport: ["mounting", "land", "sea"],
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

DEFAULT_VALUES["models"] = models;

export default DEFAULT_VALUES;
