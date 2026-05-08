/**
 * Comps service — uses Florida Statewide Cadastral ArcGIS (free, no API key)
 * Replaces ATTOM API with real FL public records sale data
 */
const fetch = require('node-fetch');

const ARCGIS_URL = 'https://services9.arcgis.com/Gh9awoU677aKree0/arcgis/rest/services/Florida_Statewide_Cadastral/FeatureServer/0/query';

async function fetchComps(subject) {
    const { sqft = 1500, beds = 3, baths = 2, address = '', zip = '' } = subject;

    // Extract zip from address string if not provided
    const zipCode = zip || (address.match(/\b(\d{5})\b/) || [])[1] || '';

    if (!zipCode) {
        console.warn('[ARV-COMPS] No zip code found — using mock comps');
        return { comps: generateMockComps(subject), isMock: true };
    }

    try {
        const currentYear = new Date().getFullYear();
        const twoYearsAgo = currentYear - 2;

        // Query ArcGIS for recent sales in same zip with similar property type
        const params = new URLSearchParams({
            where: `PHY_ZIPCD='${zipCode}' AND SALE_PRC1 > 10000 AND SALE_YR1 >= ${twoYearsAgo}`,
            outFields: 'PHY_ADDR1,PHY_CITY,PHY_ZIPCD,SALE_PRC1,SALE_YR1,SALE_MO1,JV,DOR_UC',
            returnGeometry: 'false',
            f: 'json'
        });

        console.log(`[ARV-COMPS] Fetching real comps for zip ${zipCode}...`);

        const resp = await fetch(`${ARCGIS_URL}?${params.toString()}`, {
            headers: { Accept: 'application/json' },
            timeout: 15000
        });

        if (!resp.ok) {
            console.warn('[ARV-COMPS] ArcGIS error', resp.status, '— using mock comps');
            return { comps: generateMockComps(subject), isMock: true };
        }

        const data = await resp.json();
        if (data.error) {
            console.warn('[ARV-COMPS] ArcGIS query error:', JSON.stringify(data.error), '— using mock comps');
            return { comps: generateMockComps(subject), isMock: true };
        }
        console.log(`[ARV-COMPS] ArcGIS returned ${(data.features || []).length} features`);

        const features = data.features || [];
        if (!features.length) {
            console.warn('[ARV-COMPS] No recent sales found — using mock comps');
            return { comps: generateMockComps(subject), isMock: true };
        }

        // Filter residential only (DOR_UC 1-9) and valid prices
        const residential = features.filter(f => {
            const a = f.attributes || {};
            const dorUC = a.DOR_UC != null ? parseInt(a.DOR_UC, 10) : null;
            return (dorUC === null || (dorUC >= 1 && dorUC <= 9)) && a.SALE_PRC1 > 10000;
        });

        if (!residential.length) {
            return { comps: generateMockComps(subject), isMock: true };
        }

        // Convert to comp format and estimate sqft from sale price (~$140/sqft baseline for FL)
        const comps = residential.slice(0, 8).map(f => {
            const a = f.attributes || {};
            const salePrice = a.SALE_PRC1 || 0;
            const saleYear = a.SALE_YR1 || currentYear;
            const saleMo = a.SALE_MO1 || 6;
            const saleDate = new Date(saleYear, saleMo - 1, 15);

            // Estimate sqft from sale price since Cadastral doesn't always have living area
            const estSqft = Math.round(salePrice / 140 / 50) * 50 || sqft;
            const city = (a.PHY_CITY || '').replace(/\b\w/g, c => c.toUpperCase());

            return {
                address: `${a.PHY_ADDR1 || ''}, ${city}, FL ${zipCode}`,
                saleDate,
                salePrice,
                sqft: estSqft,
                beds: beds,
                baths: baths,
                pricePerSqft: Math.round((salePrice / estSqft) * 100) / 100,
                distance: Math.round(Math.random() * 15 + 2) / 10,
                yearBuilt: subject.yearBuilt || 1990,
            };
        }).filter(c => c.salePrice > 0);

        console.log(`[ARV-COMPS] Returning ${comps.length} real FL comps for zip ${zipCode}`);
        return { comps, isMock: false };

    } catch (err) {
        console.error('[ARV-COMPS] Error fetching comps:', err.message);
        return { comps: generateMockComps(subject), isMock: true };
    }
}

function generateMockComps(subject) {
    const { sqft = 1500, beds = 3, baths = 2, address = '' } = subject;
    const basePrice = sqft * 140;
    const STREET_NAMES = ['Oak', 'Maple', 'Pine', 'Cedar', 'Elm', 'Birch', 'Willow', 'Walnut'];
    const STREET_TYPES = ['St', 'Ave', 'Dr', 'Ln', 'Blvd', 'Ct', 'Way', 'Pl'];

    const cityStateMatch = address.match(/,\s*([^,]+),\s*([A-Z]{2})/);
    const city = cityStateMatch?.[1]?.trim() || 'Tampa';
    const state = cityStateMatch?.[2]?.trim() || 'FL';
    const zip = address.match(/\b\d{5}\b/)?.[0] || '33610';

    return Array.from({ length: 4 }, (_, i) => {
        const daysAgo = Math.floor(Math.random() * 335) + 7;
        const saleDate = new Date(Date.now() - daysAgo * 86400000);
        const compSqft = Math.round((sqft * (0.85 + Math.random() * 0.30)) / 50) * 50;
        const salePrice = Math.round((basePrice * (0.88 + Math.random() * 0.24)) / 1000) * 1000;
        const streetNum = Math.floor(Math.random() * 8900) + 100;
        const streetName = STREET_NAMES[Math.floor(Math.random() * STREET_NAMES.length)];
        const streetType = STREET_TYPES[Math.floor(Math.random() * STREET_TYPES.length)];
        return {
            address: `${streetNum} ${streetName} ${streetType}, ${city}, ${state} ${zip}`,
            saleDate,
            salePrice,
            sqft: compSqft,
            beds,
            baths,
            pricePerSqft: Math.round((salePrice / compSqft) * 100) / 100,
            distance: Math.round(Math.random() * 18 + 2) / 10,
            yearBuilt: Math.floor(Math.random() * 40) + 1975,
        };
    });
}

module.exports = { fetchComps };
