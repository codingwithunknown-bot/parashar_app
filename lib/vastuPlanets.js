export default function vastuPlanets({ kundali, d9 }) {
    let nav = d9?.planets;
    let kun = kundali?.planets;

    const rules = [
        { planet: 'Sun', house: 2, hi: "लंगर या मुफ्त का भोजन करना हानिकारक होता है।", en: "Eating Langar or free food is harmful." },
        { planet: 'Sun', house: 2, hi: "घर में फ्री या गिफ्ट में दी गई वस्तुएँ, जैसे तस्वीर, गमला, या फोटो आदि रखने से परेशानियाँ होती हैं।", en: "Keeping free or gifted items, such as pictures, flower pots, or photos, in the house can lead to problems." },
        { planet: 'Sun', house: 4, hi: "घर में फ्री या गिफ्ट में दी गई वस्तुएँ, जैसे तस्वीर, गमला, या फोटो आदि रखने से परेशानियाँ होती हैं।", en: "Keeping free or gifted items, such as pictures, flower pots, or photos, in the house can lead to problems." },
        { planet: 'Sun', house: 5, hi: "साउथ फेसिंग मकान में रहने से अशुभ प्रभाव अधिक मिलते हैं।", en: "Living in a south-facing house can result in greater inauspicious effects." },
        { planet: 'Sun', house: 8, hi: "साउथ फेसिंग मकान में रहने से अशुभ प्रभाव अधिक मिलते हैं।", en: "Living in a south-facing house can result in greater inauspicious effects." },
        { planet: 'Sun', house: 9, hi: "चांदी, दूध, और दही मुफ्त में लेना कष्टकारी होता है।", en: "Accepting silver, milk, or curd for free is troublesome." },
        { planet: 'Sun', house: 11, hi: "सूर्य की दशा में दक्षिण या पूर्व दिशा में पैर रखकर सोने से बुरे सपने आना या सपने में नाग दिखाई देना जैसे फल होते हैं।", en: "During the Sun's dasha, sleeping with your feet towards the south or east is believed to result in effects such as nightmares or seeing a snake in your dreams." },
        { planet: 'Sun', house: 11, hi: "साउथ फेसिंग मकान में परेशानी होती है, जबकि ईस्ट फेसिंग में लाभ होता है।", en: "South-facing houses cause difficulty; East-facing brings gains." },
        { planet: 'Moon', house: 1, hi: "कांच के गिलास में पीने योग्य तरल पदार्थ लेना कष्टकारी होता है।", en: "Drinking liquids in glass tumblers is troublesome." },
        { planet: 'Moon', house: 2, hi: "घर में खाली या सूखा कुआं, टंकी, या नलका होना हानिकारक होता है।", en: "Having a dry well, tank, or handpump in the house is harmful." },
        { planet: 'Moon', house: 2, hi: "घर में शिव जी से संबंधित वस्तुएँ, जैसे शिवलिंग, बेलपत्र का पेड़, रुद्राक्ष, डमरू, त्रिशूल आदि रखना कलह व हानि का कारण होता है।", en: "Keeping items associated with Lord Shiva, such as a Shivling, a bel (bael) tree, Rudraksha beads, a damru, or a trident, in the house is believed to cause conflict and loss." },
        { planet: 'Moon', house: 2, hi: "टूटी केतली, खराब मिक्सर या खराब बिजली के उपकरण धन और व्यापार में हानि का कारण होता है।", en: "Broken kettles or faulty electrical appliances cause losses in wealth and business." },
        { planet: 'Moon', house: 4, hi: "दूध या पानी के व्यापार से हानि होने की आशंका रहती है।", en: "There is a possibility of financial loss in the business of milk or water." },
        { planet: 'Moon', house: 6, hi: "अपने घर में सीढ़ी के नीचे समर्सिबल/नलका लगवाना हानि या माता के स्वास्थ्य पर बुरा असर डालता है।", en: "Installing a submersible pump or hand pump beneath the staircase in your home is believed to cause financial loss or negatively affect the mother's health." },
        { planet: 'Moon', house: 7, hi: "दूध या पानी के व्यापार से हानि होने की आशंका रहती है।", en: "There is a possibility of financial loss in the business of milk or water." },
        { planet: 'Moon', house: 11, hi: "घर में टूटी माला रखना आपसी कलह का कारण बन सकता है।", en: "Keeping broken beads in the house causes conflict." },
        { planet: 'Moon', house: 11, hi: "पत्थर के टुकड़े या हरिद्वार के पत्थर घर में रखना अशुभ व कलह का कारण होता है।", en: "Keeping stone pieces or stones from Haridwar in the house causes conflict." },
        { planet: 'Mars', house: 1, hi: "घर में हाथी दांत (Ivory) से बनी वस्तुएं रखना हानि का कारण बन सकता है।", en: "Keeping items made of ivory is prohibited." },
        { planet: 'Mars', house: 3, hi: "घर में हाथी दांत (Ivory) से बनी वस्तुएं रखना हानि का कारण बन सकता है।", en: "Keeping items made of ivory is prohibited." },
        { planet: 'Mars', house: 3, hi: "गौमुखी मकान में निवास करना शुभ और शेरमुखी मकान से बचना उचित होता है।", en: "Prefer Gau-mukhi houses; avoid Sher-mukhi houses." },
        { planet: 'Mars', house: 4, hi: "शेरमुखी मकान में रहना कानूनी विवाद या लोहे की वस्तु से चोट का कारण बन सकता है।", en: "Living in Sher-mukhi house causes legal issues or injuries from iron objects." },
        { planet: 'Mars', house: 4, hi: "जमीन की माप में 3, 8, 13, 18 का अंक या श्मशान के समीप मकान कष्टकारी होता है।", en: "Inauspicious plot measurements or proximity to a graveyard is troublesome." },
        { planet: 'Mars', house: 5, hi: "घर के आसपास बेर या इमली का पेड़ होना हानिकारक होता है।", en: "Having Ber or Tamarind trees near the house is harmful." },
        { planet: 'Mars', house: 6, hi: "घर के आसपास बेर या इमली का पेड़ होना हानिकारक होता है।", en: "Having Ber or Tamarind trees near the house is harmful." },
        { planet: 'Mars', house: 8, hi: "घर में जितना चूल्हा इस्तेमाल होगा उतना बढ़िया और अगर खराब पड़ा हो तो उतना ही खराब फल देता है।", en: "The more the kitchen stove is used the better; if it remains broken it is equally harmful." },
        { planet: 'Mars', house: 8, hi: "उपयोग में आने वाला चूल्हा घर की छत पर रखना शुभ होता है।", en: "Keeping a functional kitchen stove on the terrace is auspicious." },
        { planet: 'Mercury', house: 1, hi: "घर में तबला आदि संगीत वाद्य यंत्र रखने से हानि होती है।", en: "Keeping musical instruments like tabla in the house causes loss." },
        { planet: 'Mercury', house: 3, hi: "घर के आस पास शहतूत या बेलदार पेड़ या इमली, कीकर कांटेदार हो तो बुरा प्रभाव पड़ता है।", en: "Having mulberry, creeper trees, tamarind, or thorny kikar near the house has a bad effect." },
        { planet: 'Mercury', house: 5, hi: "घर के आस पास शहतूत या बेलदार पेड़ या इमली, कीकर कांटेदार हो तो बुरा प्रभाव पड़ता है।", en: "Having mulberry, creeper trees, tamarind, or thorny kikar near the house has a bad effect." },
        { planet: 'Mercury', house: 5, hi: "घर का मुख्य द्वार उत्तर दिशा की तरफ ना रखें।", en: "Do not keep the main entrance of the house facing north." },
        { planet: 'Jupiter', house: 9, hi: "घर का अंदर मंदिर कोने में ना रखें।", en: "Do not keep the indoor temple in a corner." },
        { planet: 'Venus', house: 2, hi: "शेर मुखी घर में ना रहें नहीं तो समय अच्छा नहीं रहता।", en: "Do not live in a Sher-mukhi (lion-faced) house, otherwise times remain unfavorable." },
        { planet: 'Venus', house: 3, hi: "अपने नाम से मकान ना बनवाया ना ही खरीदें।", en: "Do not build or buy a house in your own name." },
        { planet: 'Venus', house: 3, hi: "घर में तबला आदि संगीत वाद्य यंत्र रखने से हानि होती है।", en: "Keeping musical instruments like tabla in the house causes loss." },
        { planet: 'Saturn', house: 1, hi: "ईस्ट फेसिंग मकान में ना रहें।", en: "Do not live in an east-facing house." },
        { planet: 'Saturn', house: 3, hi: "साउथ फेसिंग मकान में ना रहें।", en: "Do not live in a south-facing house." },
        { planet: 'Saturn', house: 4, hi: "बना बनाया मकान लें नया मकान ना बनवाएं।", en: "Buy a ready-made house; do not construct a new one." },
        { planet: 'Saturn', house: 5, hi: "ईस्ट फेसिंग मकान में ना रहें।", en: "Do not live in an east-facing house." },
        { planet: 'Saturn', house: 5, hi: "अपने नाम से मकान ना बनवाया ना ही खरीदें।", en: "Do not build or buy a house in your own name." },
        { planet: 'Saturn', house: 9, hi: "अपने घर की छत को साफ रखें।", en: "Keep the roof of your house clean." },
        { planet: 'Saturn', house: 10, hi: "अपने नाम से नया मकान ना बनवाएं।", en: "Do not construct a new house in your own name." },
        { planet: 'Saturn', house: 11, hi: "साउथ फेसिंग मकान में ना रहें।", en: "Do not live in a south-facing house." },
        { planet: 'Rahu', house: 5, hi: "कोने के मकान में ना रहें।", en: "Do not live in a corner house." },
        { planet: 'Rahu', house: 5, hi: "घर के अंदर या बाहर शहतूत या बेलदार पेड़ या इमली, कीकर कांटेदार हो तो बुरा प्रभाव पड़ता है।", en: "Having mulberry, creeper trees, tamarind, or thorny kikar inside or outside the house has a bad effect." },
        { planet: 'Rahu', house: 6, hi: "घर या ऑफिस की खिड़की में काले शीशे लगाएं।", en: "Install black glasses in the windows of the house or office." },
        { planet: 'Rahu', house: 8, hi: "घर की छत पर लकड़ी, लोहे या कोई और कबाड़ का सामान ना रखें।", en: "Do not keep wood, iron, or any other junk items on the roof of the house." }
    ];

    let result = [];
    const checkAndPush = (planetName, houseNumber) => {
        rules.forEach(rule => {
            if (rule.planet.toLowerCase() === planetName.toLowerCase() && rule.house === houseNumber) {
                result.push({ vastuHi: rule.hi, vastuEn: rule.en });
            }
        });
    };

    [kun, nav].forEach(obj => {
        if (obj) Object.keys(obj).forEach(p => obj[p]?.house && checkAndPush(p, obj[p].house));
    });

    return result;
};