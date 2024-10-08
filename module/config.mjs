// Namespace Configuration Values
const ATORIA = {};


ATORIA.PERCEPTION_LABEL = {
    "sight": "ATORIA.Perception.Sight",
    "taste": "ATORIA.Perception.Taste",
    "hearing": "ATORIA.Perception.Hearing",
    "smell": "ATORIA.Perception.Smell",
    "magice": "ATORIA.Perception.Magice",
    "instinct": "ATORIA.Perception.Instinct",
}
ATORIA.SKILLS_LABEL = {
    "agility": "ATORIA.Agility",
    "balance": "ATORIA.Balance",
    "dexterity": "ATORIA.Dexterity",
    "analyse": "ATORIA.Analyse",
    "insight": "ATORIA.Insight",
    "identification": "ATORIA.Identification",
    "investigation": "ATORIA.Investigation",
    "athletic": "ATORIA.Athletic",
    "hiking": "ATORIA.Hiking",
    "running": "ATORIA.Running",
    "jump": "ATORIA.Jump",
    "charisma": "ATORIA.Charisma",
    "presence": "ATORIA.Presence",
    "seduction": "ATORIA.Seduction",
    "slyness": "ATORIA.Slyness",
    "silence": "ATORIA.Silence",
    "stealth": "ATORIA.Stealth",
    "concealment": "ATORIA.Concealment",
    "eloquence": "ATORIA.Eloquence",
    "persuasion": "ATORIA.Persuasion",
    "calming": "ATORIA.Calming",
    "negociation": "ATORIA.Negociation",
    "provocation": "ATORIA.Provocation",
    "climbing": "ATORIA.Climbing",
    "scale": "ATORIA.Scale",
    "fall": "ATORIA.Fall",
    "spirit": "ATORIA.Spirit",
    "will": "ATORIA.Will",
    "guarding": "ATORIA.Guarding",
    "intimidation": "ATORIA.Intimidation",
    "fear": "ATORIA.Fear",
    "authority": "ATORIA.Authority",
    "swiming": "ATORIA.Swiming",
    "ease": "ATORIA.Ease",
    "breath-holding": "ATORIA.Breath-Holding",
    "negotiation": "ATORIA.Negotiation",
    "bargaining": "ATORIA.Bargaining",
    "reflex": "ATORIA.Reflex",
    "evasion": "ATORIA.Evasion",
    "opportuneness": "ATORIA.Opportuneness",
    "parade": "ATORIA.Parade",
    "sturdiness": "ATORIA.Sturdiness",
    "force": "ATORIA.Force",
    "tenacity": "ATORIA.Tenacity",
    "fortitude": "ATORIA.Fortitude",
    "trickery": "ATORIA.Trickery",
    "acting": "ATORIA.Acting",
    "lying": "ATORIA.Lying",

    "combat": "ATORIA.Combative",
    "brawl": "ATORIA.Brawl",
    "blade": "ATORIA.Blade",
    "polearm": "ATORIA.Polearm",
    "haft-slashing-piercing": "ATORIA.Haft-slashing-piercing",
    "haft-bludgeonning": "ATORIA.Haft-bludgeonning",
    "shield": "ATORIA.Shield",
    "shooting": "ATORIA.Shooting",
    "throw": "ATORIA.Throw",
    "focus": "ATORIA.Focus",
    "instrument": "ATORIA.Instrument",
}

ATORIA.COMBAT_SKILL = {
    "brawl": "ATORIA.Brawl",
    "blade": "ATORIA.Blade",
    "polearm": "ATORIA.Polearm",
    "haft-slashing-piercing": "ATORIA.Haft-slashing-piercing",
    "haft-bludgeonning": "ATORIA.Haft-bludgeonning",
    "shield": "ATORIA.Shield",
    "shooting": "ATORIA.Shooting",
    "throw": "ATORIA.Throw",
    "focus": "ATORIA.Focus",
    "instrument": "ATORIA.Instrument",
};

ATORIA.ACTION_MODIFIER_TYPE = {
    "technique": "ATORIA.Technique",
    "incantatory_addition": "ATORIA.IncantatoryAddition",
};

ATORIA.KNOWLEDGES_LABEL = {
    "artistic": "ATORIA.Artistic",
    "craftmanship": "ATORIA.Craftmanship",
    "erudition": "ATORIA.Erudition",
    "utilitarian": "ATORIA.Utilitarian",

    "alchemy": "ATORIA.Alchemy",
    "jewellery": "ATORIA.Jewellery",
    "sewing": "ATORIA.Sewing",
    "cabinet-making": "ATORIA.Cabinet-making",
    "forge": "ATORIA.Forge",
    "engineering": "ATORIA.Engineering",
    "leatherworking": "ATORIA.Leatherworking",
    "song": "ATORIA.Song",
    "dance": "ATORIA.Dance",
    "graphic": "ATORIA.Graphic",
    "music": "ATORIA.Music",
    "sculpture": "ATORIA.Sculpture",
    "civilisation": "ATORIA.Civilisation",
    "language": "ATORIA.Language",
    "medecine": "ATORIA.Medecine",
    "monstrology": "ATORIA.Monstrology",
    "science": "ATORIA.Science",
    "symbolism": "ATORIA.Symbolism",
    "zoology": "ATORIA.Zoology",
    "farming": "ATORIA.Farming",
    "dressage": "ATORIA.Dressage",
    "nature": "ATORIA.Nature",
    "mining": "ATORIA.Mining",
    "fishing": "ATORIA.Fishing",
    "hunting": "ATORIA.Hunting",
    "construction": "ATORIA.Construction",
    "cuisine": "ATORIA.Cuisine",
    "game": "ATORIA.Game",
    "strategy": "ATORIA.Strategy",
    "transport": "ATORIA.Transport",
    "theft": "ATORIA.Theft",
}
ATORIA.MAGICS_LABEL = {
    "mental": "ATORIA.Mental",
    "holy": "ATORIA.Holy",
    "fire": "ATORIA.Fire",
    "water": "ATORIA.Water",
    "air": "ATORIA.Air",
    "earth": "ATORIA.Earth",
    "blood": "ATORIA.Blood",
    "occult": "ATORIA.Occult",
    "druidic": "ATORIA.Druidic",
    "invoker": "ATORIA.Invoker"
}


export function localize_config() {
    for (let key in ATORIA.COMBAT_SKILL) {
        if (key in ATORIA.COMBAT_SKILL) {
            ATORIA.COMBAT_SKILL[key] = game.i18n.localize(ATORIA.COMBAT_SKILL[key]);
        } else {
            console.error(`Localisation error: Key not found in array: '${key}'`);
        }
    }
    for (let key in ATORIA.ACTION_MODIFIER_TYPE) {
        if (key in ATORIA.ACTION_MODIFIER_TYPE) {
            ATORIA.ACTION_MODIFIER_TYPE[key] = game.i18n.localize(ATORIA.ACTION_MODIFIER_TYPE[key]);
        } else {
            console.error(`Localisation error: Key not found in array: '${key}'`);
        }
    }
}

export default ATORIA;
