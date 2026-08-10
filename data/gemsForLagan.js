// data/gemsForLagan.js
// Planet-gemstone associations (English + Hindi names)
const planetsAndTheirJewel = {
    Sun: { english: "Ruby", hindi: "माणिक" },
    Moon: { english: "Pearl", hindi: "मोती" },
    Mars: { english: "Red Coral", hindi: "मूंगा" },
    Mercury: { english: "Emerald", hindi: "पन्ना" },
    Jupiter: { english: "Topaz", hindi: "पुखराज" },
    Venus: { english: "Diamond", hindi: "हीरा" },
    Saturn: { english: "Blue Sapphire", hindi: "नीलम" },
    Rahu: { english: "Hessonite (Gomed)", hindi: "गोमेद" },
    Ketu: { english: "Cat's Eye", hindi: "लहसुनिया" }
};

// Category labels in both languages
const categoryLabels = {
    luck: { english: "Luck", hindi: "भाग्य" },
    debt: { english: "Debt / Loans", hindi: "ऋण / कर्ज़" },
    money: { english: "Money Gain", hindi: "धन लाभ" },
    health: { english: "Health", hindi: "स्वास्थ्य" },
    business: { english: "Business", hindi: "व्यापार" },
    children: { english: "Children", hindi: "संतान" },
    marriage: { english: "Marriage", hindi: "विवाह" },
    education: { english: "Education", hindi: "शिक्षा" },
    wifeHealth: { english: "Spouse's Health", hindi: "पत्नी/पति का स्वास्थ्य" },
    prosperity: { english: "Prosperity", hindi: "समृद्धि" },
    mentalPeace: { english: "Mental Peace", hindi: "मानसिक शांति" },
    fatherHealth: { english: "Father's Health", hindi: "पिता का स्वास्थ्य" },
    motherHealth: { english: "Mother's Health", hindi: "माता का स्वास्थ्य" },
    governmentHelp: { english: "Government Help", hindi: "सरकारी सहायता" },
    spiritualGrowth: { english: "Spiritual Growth", hindi: "आध्यात्मिक उन्नति" },
    allRoundedEffect: { english: "Overall Growth", hindi: "सभी प्रकार से वृद्धि" },
};

/**
 * @param {number} ascZodiacNumber 0 = Aries ... 11 = Pisces
 * @returns {Object} map of category -> { planet, englishGem, hindiGem, categoryEnglish, categoryHindi } | null
 */
export default function gemForLagan(ascZodiacNumber) {

    let planetRecommendations = {
        luck: "",
        debt: "",
        money: "",
        health: "",
        business: "",
        children: "",
        marriage: "",
        education: "",
        wifeHealth: "",
        prosperity: "",
        mentalPeace: "",
        fatherHealth: "",
        motherHealth: "",
        governmentHelp: "",
        spiritualGrowth: "",
        allRoundedEffect: "",
    };

    switch (ascZodiacNumber) {
        case 1:
            // Aries (Mesha Lagna)
            planetRecommendations.children = "Sun";
            planetRecommendations.health = "Mars";
            planetRecommendations.debt = "Mercury";
            planetRecommendations.motherHealth = "Moon";
            planetRecommendations.prosperity = "Jupiter";
            planetRecommendations.allRoundedEffect = "Jupiter";
            planetRecommendations.education = "Venus";
            planetRecommendations.money = "Venus";
            planetRecommendations.business = "Venus";
            planetRecommendations.wifeHealth = "Venus";
            planetRecommendations.luck = "Mars";
            planetRecommendations.governmentHelp = "Jupiter";
            break;

        case 2:
            // Taurus (Vrishabha Lagna)
            planetRecommendations.children = "";
            planetRecommendations.health = "Moon";
            planetRecommendations.debt = "Venus";
            planetRecommendations.motherHealth = "";
            planetRecommendations.prosperity = "Mercury";
            planetRecommendations.allRoundedEffect = "Sun";
            planetRecommendations.education = "Mercury";
            planetRecommendations.money = "Mercury";
            planetRecommendations.business = "Jupiter";
            planetRecommendations.wifeHealth = "";
            planetRecommendations.governmentHelp = "Mars";
            planetRecommendations.luck = "Saturn";
            break;

        case 3:
            // Gemini (Mithuna Lagna)
            planetRecommendations.mentalPeace = "Moon";
            planetRecommendations.children = "";
            planetRecommendations.health = "";
            planetRecommendations.debt = "";
            planetRecommendations.motherHealth = "Sun";
            planetRecommendations.prosperity = "Mercury";
            planetRecommendations.allRoundedEffect = "Mercury";
            planetRecommendations.education = "Mercury";
            planetRecommendations.money = "Mercury";
            planetRecommendations.business = "Mars";
            planetRecommendations.wifeHealth = "";
            planetRecommendations.governmentHelp = "Saturn";
            planetRecommendations.luck = "Saturn";
            planetRecommendations.fatherHealth = "Mercury";
            break;

        case 4:
            // Cancer (Karka Lagna)
            planetRecommendations.mentalPeace = "";
            planetRecommendations.children = "Venus";
            planetRecommendations.health = "Moon";
            planetRecommendations.debt = "";
            planetRecommendations.motherHealth = "";
            planetRecommendations.prosperity = "Venus";
            planetRecommendations.allRoundedEffect = "Mercury";
            planetRecommendations.education = "Sun";
            planetRecommendations.money = "Sun";
            planetRecommendations.business = "Venus";
            planetRecommendations.wifeHealth = "";
            planetRecommendations.governmentHelp = "Mars";
            planetRecommendations.luck = "";
            planetRecommendations.fatherHealth = "Mars";
            break;

        case 5:
            // Leo (Singha Lagna)
            planetRecommendations.mentalPeace = "Mars";
            planetRecommendations.children = "Jupiter";
            planetRecommendations.health = "Mercury";
            planetRecommendations.debt = "";
            planetRecommendations.motherHealth = "Mars";
            planetRecommendations.prosperity = "Mars";
            planetRecommendations.allRoundedEffect = "Sun";
            planetRecommendations.education = "Mercury";
            planetRecommendations.money = "Mercury";
            planetRecommendations.business = "Saturn";
            planetRecommendations.wifeHealth = "";
            planetRecommendations.governmentHelp = "Mars";
            planetRecommendations.luck = "Mars";
            planetRecommendations.fatherHealth = "Mars";
            break;

        case 6:
            // Virgo (Kanya Lagna)
            planetRecommendations.mentalPeace = "Jupiter";
            planetRecommendations.children = "Saturn";
            planetRecommendations.health = "Mars";
            planetRecommendations.debt = "";
            planetRecommendations.motherHealth = "";
            planetRecommendations.prosperity = "Venus";
            planetRecommendations.allRoundedEffect = "Jupiter";
            planetRecommendations.education = "Venus";
            planetRecommendations.money = "Moon";
            planetRecommendations.business = "Sun";
            planetRecommendations.wifeHealth = "";
            planetRecommendations.governmentHelp = "Mercury";
            planetRecommendations.luck = "";
            planetRecommendations.fatherHealth = "";
            break;

        case 7:
            // Libra (Tula Lagna)
            planetRecommendations.mentalPeace = "Moon";
            planetRecommendations.children = "";
            planetRecommendations.health = "Venus";
            planetRecommendations.debt = "";
            planetRecommendations.motherHealth = "";
            planetRecommendations.prosperity = "Sun";
            planetRecommendations.allRoundedEffect = "Saturn";
            planetRecommendations.education = "";
            planetRecommendations.money = "Moon";
            planetRecommendations.business = "Sun";
            planetRecommendations.wifeHealth = "";
            planetRecommendations.governmentHelp = "Moon";
            planetRecommendations.luck = "Mercury";
            planetRecommendations.fatherHealth = "";
            break;

        case 8:
            // Scorpio (Vrischika Lagna)
            planetRecommendations.mentalPeace = "Moon";
            planetRecommendations.children = "";
            planetRecommendations.health = "Sun";
            planetRecommendations.debt = "";
            planetRecommendations.motherHealth = "";
            planetRecommendations.prosperity = "Moon";
            planetRecommendations.allRoundedEffect = "Jupiter";
            planetRecommendations.education = "Mercury";
            planetRecommendations.money = "Moon";
            planetRecommendations.business = "Venus";
            planetRecommendations.wifeHealth = "";
            planetRecommendations.governmentHelp = "Jupiter";
            planetRecommendations.luck = "";
            planetRecommendations.fatherHealth = "Moon";
            break;

        case 9:
            // Sagittarius (Dhanu Lagna)
            planetRecommendations.mentalPeace = "Moon";
            planetRecommendations.children = "";
            planetRecommendations.health = "Jupiter";
            planetRecommendations.debt = "";
            planetRecommendations.motherHealth = "";
            planetRecommendations.prosperity = "";
            planetRecommendations.allRoundedEffect = "Jupiter";
            planetRecommendations.education = "Mars";
            planetRecommendations.money = "Moon";
            planetRecommendations.business = "Moon";
            planetRecommendations.wifeHealth = "Venus";
            planetRecommendations.governmentHelp = "Mercury";
            planetRecommendations.luck = "Mars";
            planetRecommendations.fatherHealth = "";
            break;

        case 10:
            // Capricorn (Makara Lagna)
            planetRecommendations.mentalPeace = "Moon";
            planetRecommendations.children = "";
            planetRecommendations.health = "Sun";
            planetRecommendations.debt = "";
            planetRecommendations.motherHealth = "";
            planetRecommendations.prosperity = "";
            planetRecommendations.allRoundedEffect = "Saturn";
            planetRecommendations.education = "Saturn";
            planetRecommendations.money = "Venus";
            planetRecommendations.business = "Moon";
            planetRecommendations.wifeHealth = "";
            planetRecommendations.governmentHelp = "Mercury";
            planetRecommendations.luck = "";
            planetRecommendations.fatherHealth = "";
            break;

        case 11:
            // Aquarius (Kumbha Lagna)
            planetRecommendations.mentalPeace = "";
            planetRecommendations.children = "Saturn";
            planetRecommendations.health = "Moon";
            planetRecommendations.debt = "Saturn";
            planetRecommendations.motherHealth = "";
            planetRecommendations.prosperity = "Venus";
            planetRecommendations.allRoundedEffect = "Venus";
            planetRecommendations.education = "Venus";
            planetRecommendations.money = "Venus";
            planetRecommendations.business = "Venus";
            planetRecommendations.wifeHealth = "Sun";
            planetRecommendations.governmentHelp = "Jupiter";
            planetRecommendations.luck = "";
            planetRecommendations.fatherHealth = "";
            break;

        case 12:
            // Pisces (Meena Lagna)
            planetRecommendations.mentalPeace = "Mercury";
            planetRecommendations.children = "Moon";
            planetRecommendations.health = "Saturn";
            planetRecommendations.debt = "";
            planetRecommendations.prosperity = "Sun";
            planetRecommendations.allRoundedEffect = "Jupiter";
            planetRecommendations.education = "Mars";
            planetRecommendations.money = "Moon";
            planetRecommendations.business = "Venus";
            planetRecommendations.governmentHelp = "Venus";
            planetRecommendations.luck = "Sun";
            planetRecommendations.wifeHealth = "Mercury";
            planetRecommendations.motherHealth = "";
            planetRecommendations.fatherHealth = "Saturn";
            break;

        default:
            throw new Error("Invalid ascendant number. Must be between 0 and 11.");
    }

    // Convert planet -> gemstone + English/Hindi info
    const gemstoneRecommendations = {};

    for (let key in planetRecommendations) {
        const planet = planetRecommendations[key];

        if (planet && planetsAndTheirJewel[planet]) {
            gemstoneRecommendations[key] = {
                planet: planet,
                englishGem: planetsAndTheirJewel[planet].english,
                hindiGem: planetsAndTheirJewel[planet].hindi,
                categoryEnglish: categoryLabels[key].english,
                categoryHindi: categoryLabels[key].hindi,
            };
        } else {
            gemstoneRecommendations[key] = null;
        }
    }

    return gemstoneRecommendations;
}