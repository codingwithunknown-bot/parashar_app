//routes/functions.js
import express from 'express';
import fs from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';
import vastuPlanets from '../lib/vastuPlanets.js';
import gemForLagan from '../data/gemsForLagan.js';
import getRudrakshaSuggestionsForLagna from '../data/rudrakshaLagnaSuggestion.js';
import { getNakshatraFromName, getSthaanFalResult } from '../lib/place.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const lagans = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/lagans.json'), 'utf8'));
const rudrakshaDB = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/rudraksha.json'), 'utf8'));
const remedies = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/remedies.json'), 'utf8'));
const planetsInNakshatras = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/planetsinnakshatras.json'), 'utf8'));
const business = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/business.json'), 'utf8'));
const education = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/education.json'), 'utf8'));
const career = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/career.json'), 'utf8'));
const kaalsarpyogs = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/kaalsarpyogs.json'), 'utf8'));
const nakshatras = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/nakshatras.json'), 'utf8'));
const lagansData = lagans;

const router = express.Router();

router.post('/vastuplanet', async (req, res) => {
  try {
    const { kundali, d9 } = req.body;
    const result = vastuPlanets({ kundali, d9 });
    return res.json(result);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
});

router.get('/remedies', (req, res) => res.json(remedies));
router.get('/planetInNakshatara', (req, res) => res.json(planetsInNakshatras));
router.get('/business', (req, res) => res.json(business));
router.get('/education', (req, res) => res.json(education));
router.get('/lagan', (req, res) => res.json(lagansData));
router.get('/career', (req, res) => res.json(career));
router.get('/kaalsarpyogs', (req, res) => res.json(kaalsarpyogs));
router.get('/nakshatara', (req, res) => res.json(nakshatras));

router.get('/gems', (req, res) => {
  const ascParam = req.query.asc;
  const asc = Number(ascParam) + 1;

  try {
    const r = gemForLagan(asc);
    return res.json(r);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
});

function computeRudrakshaSuggestion(ascInput) {
  const ascNum = Number(ascInput);
  if (Number.isNaN(ascNum) || ascNum < 0 || ascNum > 11) {
    throw new Error('Invalid ascendant number. Must be between 0 and 11.');
  }

  const lagnaRecord = lagans.find((l) => l.numberOfLagan === ascNum);
  if (!lagnaRecord) {
    throw new Error('No lagna record found for the provided ascendant number.');
  }

  return getRudrakshaSuggestionsForLagna(lagnaRecord, rudrakshaDB);
}

router.get('/rudraksha', (req, res) => {
  try {
    const result = computeRudrakshaSuggestion(req.query.asc);
    return res.json(result);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
});

router.post('/rudraksha', (req, res) => {
  try {
    const result = computeRudrakshaSuggestion(req.body.asc);
    return res.json(result);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
});

router.put('/rudraksha', (req, res) => {
  try {
    const result = computeRudrakshaSuggestion(req.body.asc);
    return res.json(result);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
});

const handlePlaceRequest = (req, res) => {
  const { personName, currentCity, movingToCity } = req.body;
  const personNakshatra = getNakshatraFromName(personName);
  const currentCityNakshatra = getNakshatraFromName(currentCity);
  const movingCityNakshatra = getNakshatraFromName(movingToCity);

  const currentCitySthaanFal = getSthaanFalResult(
    currentCityNakshatra.nakshatra,
    personNakshatra.nakshatra
  );
  const movingCitySthaanFal = getSthaanFalResult(
    movingCityNakshatra.nakshatra,
    personNakshatra.nakshatra
  );

  return res.json({ personNakshatra, currentCityNakshatra, movingCityNakshatra, currentCitySthaanFal, movingCitySthaanFal });
};

router.post('/places', handlePlaceRequest);
router.post('/place', handlePlaceRequest);

export default router;
