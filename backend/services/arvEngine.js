const CONDITION_ADJUSTMENTS = {
  Excellent: 0.05,
  Good: 0.00,
  Fair: -0.08,
  Poor: -0.15,
  'Gut Rehab': -0.25,
};

function calculate(subject, comps) {
  const adjustment = CONDITION_ADJUSTMENTS[subject.condition] ?? 0;

  // 1. Compute raw price per sqft for each comp
  // 2. Apply condition adjustment (relative to Good=baseline)
  const annotatedComps = comps.map((comp) => {
    const ppsf = comp.salePrice / comp.sqft;
    const adjustedPPSF = ppsf * (1 + adjustment);
    return { ...comp, pricePerSqft: Math.round(ppsf * 100) / 100, adjustedPricePerSqft: Math.round(adjustedPPSF * 100) / 100 };
  });

  // 3. Weighted average PPSF (recency + sqft similarity)
  const now = Date.now();
  const weights = annotatedComps.map((comp) => {
    const daysSinceSale = (now - new Date(comp.saleDate).getTime()) / 86400000;
    const recencyWeight = Math.max(0.1, 1 - daysSinceSale / 365);
    const sqftDiff = Math.abs(comp.sqft - subject.sqft) / subject.sqft;
    const sqftWeight = Math.max(0.1, 1 - sqftDiff);
    return (recencyWeight + sqftWeight) / 2;
  });

  const totalWeight = weights.reduce((a, b) => a + b, 0);
  const weightedAvgPPSF =
    annotatedComps.reduce((sum, c, i) => sum + c.adjustedPricePerSqft * weights[i], 0) / totalWeight;

  // 4. ARV = weighted avg PPSF × subject sqft
  const arv = weightedAvgPPSF * subject.sqft;

  return {
    arv: Math.round(arv),
    arvLow: Math.round(arv * 0.9),
    arvHigh: Math.round(arv * 1.1),
    weightedAvgPPSF: Math.round(weightedAvgPPSF * 100) / 100,
    conditionAdjustment: adjustment,
    comps: annotatedComps,
  };
}

function calcMAO(arv, repairCost) {
  return Math.round(arv * 0.7 - repairCost);
}

function dealScore(arv, purchasePrice, repairCost) {
  if (!purchasePrice || purchasePrice <= 0) return { score: null, margin: null };
  const profit = arv - purchasePrice - repairCost;
  const margin = profit / arv;
  let score;
  if (margin > 0.2) score = 'HOT';
  else if (margin > 0.1) score = 'MARGINAL';
  else score = 'PASS';
  return { score, margin: Math.round(margin * 1000) / 10 }; // as %
}

module.exports = { calculate, calcMAO, dealScore };
