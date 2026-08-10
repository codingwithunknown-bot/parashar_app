// data/rudrakshaLagnaSuggestion.js
//
// Flow this supports:
//   1. User submits DOB + time + place  -> backend computes lagna (ascZodiacNumber)
//   2. Backend finds the matching lagna record in lagna.json (by numberOfLagan)
//   3. This function reads that record's ashubh / subh / maarak / raajyogKarak /
//      ghaatak / parampaapi planet lists and resolves each planet to its
//      Rudraksha mukhi, then attaches the FULL benefit entry from your
//      rudraksha_astrology_database_v2.json.
//
// Example (Aries, ashubh = "Saturn,Mercury,Venus,Jupiter"):
//   Saturn  -> 7 Mukhi Rudraksha
//   Mercury -> 4 Mukhi Rudraksha
//   Venus   -> 6 Mukhi Rudraksha
//   Jupiter -> 5 Mukhi Rudraksha
// Each returned with its full benefits object, ready to render in the app.

// Which lagna.json field maps to which category, and how that category
// should be framed to the user (strengthen vs. pacify vs. caution).
const CATEGORY_CONFIG = {
    ashubh: { field: "ashubhEn", purpose: "pacify", label: { en: "Malefic Planets", hi: "अशुभ ग्रह" } },
    subh: { field: "subhEn", purpose: "strengthen", label: { en: "Benefic Planets", hi: "शुभ ग्रह" } },
    raajyogKarak: { field: "raajyogKarakEn", purpose: "strengthen", label: { en: "Raj Yoga Karak", hi: "राजयोग कारक ग्रह" } },
    maarak: { field: "maarakEn", purpose: "caution", label: { en: "Marak (Killer) Planets", hi: "मारक ग्रह" } },
    ghaatak: { field: "ghaatakEn", purpose: "caution", label: { en: "Ghaatak Planets", hi: "घातक ग्रह" } },
    parampaapi: { field: "parampaapiEn", purpose: "caution", label: { en: "Parampaapi (Greatest Malefic)", hi: "परमपापी ग्रह" } },
};

function parsePlanetList(csvString) {
    if (!csvString || typeof csvString !== "string") return [];
    return csvString
        .split(",")
        .map((p) => p.replace(/\(.*?\)/g, "").replace(/\+.*/g, "").trim()) // strip "(But yoga Karak)", "+Mercury" etc.
        .filter((p) => p.length > 0);
}

/**
 * Resolves one planet name to its full rudraksha database entry.
 * Uses the PRIMARY mukhi number for that planet (first entry in
 * planetary_mapping[planet].rudraksha_numbers).
 */
function resolvePlanetToRudraksha(planet, rudrakshaDB) {
    const mapping = rudrakshaDB.planetary_mapping[planet];
    if (!mapping || !mapping.rudraksha_numbers || mapping.rudraksha_numbers.length === 0) {
        return null;
    }

    const primaryMukhiNumber = mapping.rudraksha_numbers[0];
    const mukhiKey = `${primaryMukhiNumber}_mukhi`;
    const entry = rudrakshaDB.rudraksha_database[mukhiKey];

    if (!entry) return null;

    return {
        planet,
        mukhiNumber: primaryMukhiNumber,
        mukhiKey,
        name: entry.name,
        ruling_deity: entry.ruling_deity,
        chakra: entry.chakra,
        wearing_day: entry.wearing_day,
        mantra: entry.mantra,
        recommended_metal: entry.recommended_metal,
        benefits: entry.benefits,
        who_should_wear: entry.who_should_wear,
    };
}

/**
 * @param {Object} lagnaRecord   one record from lagna.json (matched by numberOfLagan === ascZodiacNumber)
 * @param {Object} rudrakshaDB   the full rudraksha_astrology_database_v2.json object
 * @returns {Object} keyed by category (ashubh, subh, maarak, raajyogKarak, ghaatak, parampaapi),
 *                    each an array of { planet, mukhiNumber, name, benefits, ... , purpose }
 */
export default function getRudrakshaSuggestionsForLagna(lagnaRecord, rudrakshaDB) {
    if (!lagnaRecord) throw new Error("lagnaRecord is required");
    if (!rudrakshaDB) throw new Error("rudrakshaDB is required");

    const result = {
        lagna: {
            numberOfLagan: lagnaRecord.numberOfLagan,
            nameEn: lagnaRecord.nameOfLaganEn,
            nameHi: lagnaRecord.nameOfLagan,
        },
    };

    for (const [category, config] of Object.entries(CATEGORY_CONFIG)) {
        const planets = parsePlanetList(lagnaRecord[config.field]);

        const suggestions = planets
            .map((planet) => resolvePlanetToRudraksha(planet, rudrakshaDB))
            .filter(Boolean)
            .map((suggestion) => ({
                ...suggestion,
                purpose: config.purpose, // "strengthen" | "pacify" | "caution"
            }));

        result[category] = {
            categoryLabel: config.label,
            planets,
            suggestions,
        };
    }

    return result;
}