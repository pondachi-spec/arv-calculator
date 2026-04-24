const axios = require('axios');

const BASE_URL = 'https://api.attomdata.com/propertyapi/v1.0.0';

const STREET_NAMES = ['Oak', 'Maple', 'Pine', 'Cedar', 'Elm', 'Birch', 'Willow', 'Walnut'];
const STREET_TYPES = ['St', 'Ave', 'Dr', 'Ln', 'Blvd', 'Ct', 'Way', 'Pl'];

function generateMockComps(subject) {
  const { sqft = 1500, beds = 3, baths = 2, address = '' } = subject;
  const basePrice = sqft * 140; // ~$140/sqft baseline

  const count = Math.floor(Math.random() * 3) + 3; // 3-5 comps
  const comps = [];
  const now = new Date();

  for (let i = 0; i < count; i++) {
    const daysAgo = Math.floor(Math.random() * 335) + 7; // 7-342 days ago
    const saleDate = new Date(now.getTime() - daysAgo * 86400000);

    const sqftVariance = sqft * (0.85 + Math.random() * 0.30); // ±15%
    const compSqft = Math.round(sqftVariance / 50) * 50;

    const priceFactor = 0.88 + Math.random() * 0.24; // ±12% price variance
    const salePrice = Math.round((basePrice * priceFactor) / 1000) * 1000;
    const pricePerSqft = Math.round((salePrice / compSqft) * 100) / 100;

    const streetNum = Math.floor(Math.random() * 8900) + 100;
    const streetName = STREET_NAMES[Math.floor(Math.random() * STREET_NAMES.length)];
    const streetType = STREET_TYPES[Math.floor(Math.random() * STREET_TYPES.length)];

    // Extract city/state from subject address
    const cityStateMatch = address.match(/,\s*([^,]+),\s*([A-Z]{2})/);
    const city = cityStateMatch?.[1]?.trim() || 'Springfield';
    const state = cityStateMatch?.[2]?.trim() || 'TX';
    const zip = address.match(/\b\d{5}\b/)?.[0] || '75201';

    comps.push({
      address: `${streetNum} ${streetName} ${streetType}, ${city}, ${state} ${zip}`,
      saleDate,
      salePrice,
      sqft: compSqft,
      beds: beds + (Math.random() > 0.7 ? (Math.random() > 0.5 ? 1 : -1) : 0),
      baths: baths + (Math.random() > 0.8 ? 0.5 : 0),
      pricePerSqft,
      distance: Math.round(Math.random() * 18 + 2) / 10, // 0.2 - 2.0 miles
      yearBuilt: Math.floor(Math.random() * 40) + 1975,
    });
  }

  return comps;
}

async function fetchComps(subject) {
  const apiKey = process.env.ATTOM_API_KEY;
  if (!apiKey) return { comps: generateMockComps(subject), isMock: true };

  try {
    const twelveMonthsAgo = new Date(Date.now() - 365 * 86400000).toISOString().split('T')[0];
    const today = new Date().toISOString().split('T')[0];

    const addrParts = subject.address.split(',');
    const address1 = addrParts[0]?.trim() || subject.address;
    const address2 = addrParts.slice(1).join(',').trim();

    const response = await axios.get(`${BASE_URL}/sale/snapshot`, {
      headers: { apikey: apiKey, accept: 'application/json' },
      params: {
        address1,
        address2,
        radius: 1,
        startcloseddate: twelveMonthsAgo,
        endcloseddate: today,
        minbeds: Math.max(1, (subject.beds || 3) - 1),
        maxbeds: (subject.beds || 3) + 1,
        minbuildingsize: Math.round((subject.sqft || 1500) * 0.75),
        maxbuildingsize: Math.round((subject.sqft || 1500) * 1.25),
        pagesize: 5,
      },
      timeout: 10000,
    });

    const properties = response.data?.property || [];
    if (!properties.length) return { comps: generateMockComps(subject), isMock: true };

    const comps = properties.map((p) => {
      const saleAmt = p.sale?.saleAmountData?.saleAmt || 0;
      const sqft = p.building?.size?.livingSize || subject.sqft;
      const saleDate = p.sale?.salesHistory?.[0]?.saleTransDate
        ? new Date(p.sale.salesHistory[0].saleTransDate)
        : new Date();

      return {
        address: p.address?.oneLine || '',
        saleDate,
        salePrice: saleAmt,
        sqft,
        beds: p.building?.rooms?.beds || subject.beds,
        baths: p.building?.rooms?.bathsTotal || subject.baths,
        pricePerSqft: sqft ? Math.round((saleAmt / sqft) * 100) / 100 : 0,
        distance: p.location?.distance || 0,
        yearBuilt: p.summary?.yearBuilt || 0,
      };
    }).filter((c) => c.salePrice > 0 && c.sqft > 0);

    if (!comps.length) return { comps: generateMockComps(subject), isMock: true };
    return { comps, isMock: false };
  } catch (err) {
    const status = err.response?.status;
    if (status === 401 || status === 403) {
      console.warn('ATTOM API auth failed — using mock comps');
    } else {
      console.error('ATTOM API error:', err.message);
    }
    return { comps: generateMockComps(subject), isMock: true };
  }
}

module.exports = { fetchComps };
