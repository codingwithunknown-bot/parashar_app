const nakAksh = {
    "अश्विनी": ["चू", "चे", "चो", "ला"],
    "भरणी": ["ली", "लू", "ले", "लो"],
    "कृत्तिका": ["अ", "ई", "उ", "ए"],
    "रोहिणी": ["ओ", "वा", "वी", "वु"],
    "मृगशिरा": ["वे", "वो", "का", "की"],
    "आर्द्रा": ["कू", "घ", "ङ", "छ"],
    "पुनर्वसू": ["के", "को", "हा", "ही"],
    "पुष्य": ["हू", "हे", "हो", "डा"],
    "अश्लेषा": ["डी", "डू", "डे", "डो"],
    "मघा": ["मा", "मी", "मू", "मे"],
    "पूर्वाफाल्गुनी": ["मो", "टा", "टी", "टू"],
    "उत्तराफाल्गुनी": ["टे", "टो", "पा", "पी"],
    "हस्त": ["पू", "ष", "ण", "ठ"],
    "चित्रा": ["पे", "पो", "रा", "री"],
    "स्वाती": ["रू", "रे", "रो", "ता"],
    "विशाखा": ["ती", "तू", "ते", "तो"],
    "अनुराधा": ["ना", "नी", "नू", "ने"],
    "ज्येष्ठा": ["नो", "या", "यी", "यू"],
    "मूला": ["ये", "यो", "भा", "भी"],
    "पूर्वाषाढ़ा": ["भू", "धा", "फा", "ढा"],
    "उत्तराषाढ़ा": ["भे", "भो", "जा", "जी"],
    "श्रवण": ["जू", "जे", "जो", "गु"],
    "धनिष्ठा": ["गा", "गी", "गू", "गे"],
    "शतभिषा": ["गो", "सा", "सी", "सू"],
    "पूर्वाभाद्रपदा": ["से", "सो", "दा", "दी"],
    "उत्तराभाद्रपदा": ["दू", "थ", "झ", "ञ"],
    "रेवती": ["दे", "दो", "चा", "ची"],
};

// English mirror, same order/index as nakAksh so pada numbers line up.
const nakAkshEn = {
    "अश्विनी": { en: "Ashwini", syll: ["Chu", "Che", "Cho", "La"] },
    "भरणी": { en: "Bharani", syll: ["Li", "Lu", "Le", "Lo"] },
    "कृत्तिका": { en: "Krittika", syll: ["A", "I", "U", "E"] },
    "रोहिणी": { en: "Rohini", syll: ["O", "Va", "Vi", "Vu"] },
    "मृगशिरा": { en: "Mrigashira", syll: ["Ve", "Vo", "Ka", "Ki"] },
    "आर्द्रा": { en: "Ardra", syll: ["Ku", "Gha", "Nga", "Chha"] },
    "पुनर्वसू": { en: "Punarvasu", syll: ["Ke", "Ko", "Ha", "Hi"] },
    "पुष्य": { en: "Pushya", syll: ["Hu", "He", "Ho", "Da"] },
    "अश्लेषा": { en: "Ashlesha", syll: ["Di", "Du", "De", "Do"] },
    "मघा": { en: "Magha", syll: ["Ma", "Mi", "Mu", "Me"] },
    "पूर्वाफाल्गुनी": { en: "Purva Phalguni", syll: ["Mo", "Ta", "Ti", "Tu"] },
    "उत्तराफाल्गुनी": { en: "Uttara Phalguni", syll: ["Te", "To", "Pa", "Pi"] },
    "हस्त": { en: "Hasta", syll: ["Pu", "Sha", "Ṇa", "Tha"] },
    "चित्रा": { en: "Chitra", syll: ["Pe", "Po", "Ra", "Ri"] },
    "स्वाती": { en: "Swati", syll: ["Ru", "Re", "Ro", "Ta"] },
    "विशाखा": { en: "Vishakha", syll: ["Ti", "Tu", "Te", "To"] },
    "अनुराधा": { en: "Anuradha", syll: ["Na", "Ni", "Nu", "Ne"] },
    "ज्येष्ठा": { en: "Jyeshtha", syll: ["No", "Ya", "Yi", "Yu"] },
    "मूला": { en: "Mula", syll: ["Ye", "Yo", "Bha", "Bhi"] },
    "पूर्वाषाढ़ा": { en: "Purva Ashadha", syll: ["Bhu", "Dha", "Pha", "Dha"] },
    "उत्तराषाढ़ा": { en: "Uttara Ashadha", syll: ["Bhe", "Bho", "Ja", "Ji"] },
    "श्रवण": { en: "Shravana", syll: ["Ju", "Je", "Jo", "Gu"] },
    "धनिष्ठा": { en: "Dhanishtha", syll: ["Ga", "Gi", "Gu", "Ge"] },
    "शतभिषा": { en: "Shatabhisha", syll: ["Go", "Sa", "Si", "Su"] },
    "पूर्वाभाद्रपदा": { en: "Purva Bhadrapada", syll: ["Se", "So", "Da", "Di"] },
    "उत्तराभाद्रपदा": { en: "Uttara Bhadrapada", syll: ["Du", "Tha", "Jha", "Gya"] },
    "रेवती": { en: "Revati", syll: ["De", "Do", "Cha", "Chi"] },
};

// Ordered list of nakshatras (already in correct astrological sequence).
const NAKSHATRA_ORDER = Object.keys(nakAksh);

// --- Devanagari character ranges ---
const DEVANAGARI_VOWEL_SIGNS = /[\u093E-\u094C\u0955\u0956\u0962\u0963]/; // matras
const DEVANAGARI_VOWEL_SIGNS_STRIP = /[\u093E-\u094C\u0955\u0956\u0962\u0963]/g;
const DEVANAGARI_MODIFIERS = /[\u0900-\u0903\u093C]/; // anusvara, visarga, chandrabindu, nukta
const DEVANAGARI_VIRAMA = '\u094D';
const DEVANAGARI_INDEPENDENT_VOWEL = /[\u0904-\u0914]|\u0905/;
const DEVANAGARI_RANGE = /[\u0900-\u097F]/;

function isDevanagari(text) {
    return DEVANAGARI_RANGE.test(text);
}

/**
 * Extracts the first "naming syllable" from a Devanagari name.
 * Handles: independent vowels (अ, ई...), consonant + matra (चू, ला...),
 * bare consonants with implicit 'a' (घ, ष...), and virama-joined clusters.
 */
function getFirstHindiSyllable(name) {
    const chars = Array.from(name.trim());
    if (chars.length === 0) return null;

    let i = 0;
    let syllable = '';

    if (DEVANAGARI_INDEPENDENT_VOWEL.test(chars[0])) {
        syllable += chars[0];
        i++;
        if (i < chars.length && DEVANAGARI_MODIFIERS.test(chars[i])) {
            syllable += chars[i];
        }
        return syllable;
    }

    syllable += chars[i];
    i++;

    while (i + 1 < chars.length && chars[i] === DEVANAGARI_VIRAMA) {
        syllable += chars[i] + chars[i + 1];
        i += 2;
    }

    if (i < chars.length && DEVANAGARI_VOWEL_SIGNS.test(chars[i])) {
        syllable += chars[i];
        i++;
    }

    if (i < chars.length && DEVANAGARI_MODIFIERS.test(chars[i])) {
        syllable += chars[i];
    }

    return syllable;
}

// Exact Hindi syllable -> { nakshatra, pada }
const HINDI_SYLLABLE_TO_NAKSHATRA = (() => {
    const map = {};
    Object.entries(nakAksh).forEach(([nakshatraName, syllables]) => {
        syllables.forEach((syll, idx) => {
            map[syll] = { nakshatra: nakshatraName, pada: idx + 1 };
        });
    });
    return map;
})();

// Vowel-length-normalized Hindi syllable -> { nakshatra, pada }
// (so दी / दि, ती / ति etc. resolve the same way)
function normalizeHindiVowelLength(str) {
    return str.replace(/ी/g, 'ि').replace(/ू/g, 'ु');
}
const HINDI_SYLLABLE_TO_NAKSHATRA_NORM = (() => {
    const map = {};
    Object.entries(nakAksh).forEach(([nakshatraName, syllables]) => {
        syllables.forEach((syll, idx) => {
            const key = normalizeHindiVowelLength(syll);
            if (!map[key]) map[key] = { nakshatra: nakshatraName, pada: idx + 1 };
        });
    });
    return map;
})();

// Bare consonant (matra stripped) -> { nakshatra, pada }, last-resort match
const CONSONANT_TO_NAKSHATRA = (() => {
    const map = {};
    Object.entries(nakAksh).forEach(([nakshatraName, syllables]) => {
        syllables.forEach((syll, idx) => {
            const base = syll.replace(DEVANAGARI_VOWEL_SIGNS_STRIP, '');
            if (base && !map[base]) {
                map[base] = { nakshatra: nakshatraName, pada: idx + 1 };
            }
        });
    });
    return map;
})();

// Flat list of English syllables, longest first, so "Bha" beats "Bh" beats "B".
const ENGLISH_SYLLABLE_LIST = (() => {
    const list = [];
    Object.entries(nakAkshEn).forEach(([hindiName, data]) => {
        data.syll.forEach((syll, idx) => {
            list.push({
                syll,
                nakshatra: hindiName,
                nakshatraEnglish: data.en,
                pada: idx + 1,
            });
        });
    });
    return list.sort((a, b) => b.syll.length - a.syll.length);
})();

function normalizeEnglishVowelSpelling(str) {
    return str.toLowerCase()
        .replace(/ee/g, 'i')
        .replace(/oo/g, 'u')
        .replace(/aa/g, 'a');
}

// Rough first-letter -> Devanagari-consonant map, for last-resort English matching
const ENGLISH_CONSONANT_TO_DEVANAGARI = {
    a: 'अ', b: 'ब', c: 'क', d: 'द', e: 'ए', f: 'फ', g: 'ग', h: 'ह', i: 'इ',
    j: 'ज', k: 'क', l: 'ल', m: 'म', n: 'न', o: 'ओ', p: 'प', q: 'क', r: 'र',
    s: 'स', t: 'त', u: 'उ', v: 'व', w: 'व', x: 'क', y: 'य', z: 'ज',
};

// Deterministic last-resort fallback so a name NEVER fails to resolve.
function hashFallbackNakshatra(name) {
    let hash = 0;
    for (const ch of name) hash = (hash * 31 + ch.charCodeAt(0)) % NAKSHATRA_ORDER.length;
    const nakshatraName = NAKSHATRA_ORDER[Math.abs(hash) % NAKSHATRA_ORDER.length];
    return {
        nakshatra: nakshatraName,
        nakshatraEnglish: nakAkshEn[nakshatraName]?.en,
        pada: 1,
        matchedSyllable: null,
        matchType: 'fallback',
        alternates: [],
    };
}

function getNakshatraFromHindiName(name) {
    const syllable = getFirstHindiSyllable(name);
    if (!syllable) return hashFallbackNakshatra(name);

    let found = HINDI_SYLLABLE_TO_NAKSHATRA[syllable];
    let matchType = 'exact';

    if (!found) {
        found = HINDI_SYLLABLE_TO_NAKSHATRA_NORM[normalizeHindiVowelLength(syllable)];
        matchType = 'normalized';
    }

    if (!found) {
        const base = syllable.replace(DEVANAGARI_VOWEL_SIGNS_STRIP, '');
        found = CONSONANT_TO_NAKSHATRA[base];
        matchType = 'consonant';
    }

    if (!found) return hashFallbackNakshatra(name);

    return {
        nakshatra: found.nakshatra,
        nakshatraEnglish: nakAkshEn[found.nakshatra]?.en,
        pada: found.pada,
        matchedSyllable: syllable,
        matchType,
        alternates: [],
    };
}

function getNakshatraFromEnglishName(name) {
    const clean = name.trim().toLowerCase();
    if (!clean) return hashFallbackNakshatra(name || 'x');

    let matches = ENGLISH_SYLLABLE_LIST.filter(entry =>
        clean.startsWith(entry.syll.toLowerCase())
    );

    if (matches.length === 0) {
        const normClean = normalizeEnglishVowelSpelling(clean);
        matches = ENGLISH_SYLLABLE_LIST.filter(entry =>
            normClean.startsWith(normalizeEnglishVowelSpelling(entry.syll))
        );
    }

    if (matches.length > 0) {
        const bestLength = matches[0].syll.length;
        const bestMatches = matches.filter(m => m.syll.length === bestLength);
        return {
            nakshatra: bestMatches[0].nakshatra,
            nakshatraEnglish: bestMatches[0].nakshatraEnglish,
            pada: bestMatches[0].pada,
            matchedSyllable: bestMatches[0].syll,
            matchType: 'phonetic',
            alternates: bestMatches.length > 1 ? bestMatches.slice(1) : [],
        };
    }

    const firstLetter = clean[0];
    const devConsonant = ENGLISH_CONSONANT_TO_DEVANAGARI[firstLetter];
    if (devConsonant) {
        const found = CONSONANT_TO_NAKSHATRA[devConsonant];
        if (found) {
            return {
                nakshatra: found.nakshatra,
                nakshatraEnglish: nakAkshEn[found.nakshatra]?.en,
                pada: found.pada,
                matchedSyllable: null,
                matchType: 'consonant',
                alternates: [],
            };
        }
    }

    return hashFallbackNakshatra(clean);
}

/**
 * Main entry point: pass any name (Hindi or English script) as a STRING,
 * get back the nakshatra it belongs to. Always resolves to a result for
 * any non-empty string — only truly empty input returns null.
 */
export function getNakshatraFromName(name) {
    if (!name || typeof name !== 'string' || !name.trim()) return null;

    return isDevanagari(name)
        ? getNakshatraFromHindiName(name)
        : getNakshatraFromEnglishName(name);
}

// ===================== City -> Nakshatra (curated lookup) =====================
//
// Places don't follow the "first syllable of the name" naming convention that
// people's names do (e.g. "Delhi" phonetically matches अश्लेषा, but the place
// Delhi is traditionally assigned पूर्वाभाद्रपदा). So city nakshatras are NOT
// derived from the phonetic algorithm above — they're looked up from this
// explicit, hand-curated map instead.
//
// Add more cities here over time. Each entry maps a city name to the Hindi
// nakshatra name (must be a key that exists in `nakAksh`). You can add both a
// Hindi-script key and an English-script key for the same city if you want it
// to be searchable either way.
const CITY_NAKSHATRA_MAP = {
    // --- Hindi keys ---
    "दिल्ली": "पूर्वाभाद्रपदा",

    // --- English keys (matched case-insensitively) ---
    "delhi": "पूर्वाभाद्रपदा",
    "new delhi": "पूर्वाभाद्रपदा",

    // Add more cities below, e.g.:
    // "mumbai": "...",
    // "मुंबई": "...",
};

function normalizeCityKey(str) {
    return str.trim().toLowerCase();
}

/**
 * Looks up the nakshatra for a place/city name.
 *
 * 1. First checks CITY_NAKSHATRA_MAP (exact curated match, Hindi or English,
 *    case-insensitive for English). This always wins when present.
 * 2. If the city isn't in the map yet, falls back to the phonetic
 *    name-matching algorithm (getNakshatraFromName) and flags the result as
 *    an unverified guess, so you know to go add a proper entry for it.
 *
 * Returns null only for empty input.
 */
export function getNakshatraForCity(cityName) {
    if (!cityName || typeof cityName !== 'string' || !cityName.trim()) return null;

    const trimmed = cityName.trim();

    // Try exact Hindi key, then case-normalized English key.
    const nakshatraName =
        CITY_NAKSHATRA_MAP[trimmed] ?? CITY_NAKSHATRA_MAP[normalizeCityKey(trimmed)];

    if (nakshatraName) {
        return {
            city: trimmed,
            nakshatra: nakshatraName,
            nakshatraEnglish: nakAkshEn[nakshatraName]?.en,
            matchType: 'city-lookup',
            verified: true,
        };
    }

    // Not curated yet — fall back to the phonetic algorithm but mark it
    // clearly as an unverified guess rather than a real place assignment.
    const phoneticResult = getNakshatraFromName(trimmed);
    if (!phoneticResult) return null;

    return {
        city: trimmed,
        ...phoneticResult,
        matchType: 'phonetic-fallback-unverified',
        verified: false,
    };
}

// ===================== Sthaan Fal (place-suitability) =====================

// Checked top-to-bottom, first match wins. `to` is inclusive.
const STHAAN_FAL_RULES = [
    { from: 1, to: 5, hi: 'लाभदायक', en: 'Labhdayak (Beneficial)' },
    { from: 6, to: 8, hi: 'धनहानि', en: 'Dhanhani (Financial Loss)' },
    { from: 9, to: 13, hi: 'धन-धान्य की वृद्धि', en: 'Dhan-Dhanya ki Vridhi (Growth in Wealth & Grain)' },
    { from: 14, to: 19, hi: 'जीवनसाथी को कष्ट', en: 'Jeevansathi ko Kasht (Distress to Spouse)' },
    { from: 20, to: 20, hi: 'कष्ट', en: 'Kasht (Distress)' },
    { from: 21, to: 24, hi: 'सम्पत्ति की बढ़ोतरी', en: 'Sampatti ki Badhotari (Increase in Property)' },
    { from: 25, to: 25, hi: 'भय, कष्ट, पीड़ा और अशांति', en: 'Fear, Distress, Pain & Unrest' },
    { from: 26, to: 26, hi: 'वाद-विवाद', en: 'Baad-Vivaad (Dispute/Conflict)' },
    { from: 27, to: 27, hi: 'शोक', en: 'Shok (Mourning)' },
];

/**
 * Counts from `placeNakshatraName` (inclusive) forward to `personNakshatraName`
 * (inclusive), wrapping through the 27-nakshatra cycle. Returns 1-27.
 */
function getNakshatraDifference(placeNakshatraName, personNakshatraName) {
    const placeIndex = NAKSHATRA_ORDER.indexOf(placeNakshatraName);
    const personIndex = NAKSHATRA_ORDER.indexOf(personNakshatraName);

    if (placeIndex === -1 || personIndex === -1) {
        return null;
    }

    return (((personIndex - placeIndex) % 27) + 27) % 27 + 1;
}

/**
 * Pass the Hindi nakshatra name of the place and of the person,
 * get back the diff count plus the resulting category (Hindi + English).
 */
function getSthaanFalResult(placeNakshatraName, personNakshatraName) {
    const diff = getNakshatraDifference(placeNakshatraName, personNakshatraName);
    if (diff === null) return null;

    const rule = STHAAN_FAL_RULES.find(r => diff >= r.from && diff <= r.to);

    return {
        diff,
        category: rule?.hi ?? null,
        categoryEnglish: rule?.en ?? null,
    };
}

export {
    nakAksh,
    nakAkshEn,
    NAKSHATRA_ORDER,
    CITY_NAKSHATRA_MAP,
    getNakshatraDifference,
    getSthaanFalResult,
};