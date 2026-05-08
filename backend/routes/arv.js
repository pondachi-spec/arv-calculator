const express = require('express');
const router = express.Router();
const Calculation = require('../models/Calculation');
const { fetchComps } = require('../services/attom');
const { analyzeCondition } = require('../services/openaiService');
const { calculate, calcMAO, dealScore } = require('../services/arvEngine');

// POST /api/arv/calculate
router.post('/calculate', async (req, res) => {
  try {
    const { address, beds, baths, sqft, yearBuilt, condition, repairCost, purchasePrice, zip } = req.body;

    if (!address || !sqft || !condition) {
      return res.status(400).json({ error: 'address, sqft, and condition are required' });
    }

    const repairNum = Number(repairCost) || 0;
    const purchaseNum = Number(purchasePrice) || 0;
    const sqftNum = Number(sqft);

    // Fetch comps & AI analysis in parallel
    const [{ comps, isMock: isMockComps }, { analysis: conditionAnalysis, isMock: isMockAI }] =
      await Promise.all([
        fetchComps({ address, zip: zip || '', beds: Number(beds), baths: Number(baths), sqft: sqftNum }),
        analyzeCondition(condition, address),
      ]);

    // ARV calculation
    const arvResult = calculate({ sqft: sqftNum, condition }, comps);
    const mao = calcMAO(arvResult.arv, repairNum);
    const { score, margin } = dealScore(arvResult.arv, purchaseNum, repairNum);

    // Persist
    const saved = await Calculation.create({
      property: { address, beds: Number(beds), baths: Number(baths), sqft: sqftNum, yearBuilt: Number(yearBuilt), condition, repairCost: repairNum, purchasePrice: purchaseNum },
      arv: arvResult.arv,
      arvLow: arvResult.arvLow,
      arvHigh: arvResult.arvHigh,
      mao,
      dealScore: score || undefined,
      profitMargin: margin,
      conditionAdjustment: arvResult.conditionAdjustment,
      weightedAvgPPSF: arvResult.weightedAvgPPSF,
      comps: arvResult.comps,
      conditionAnalysis,
      isMockComps,
      isMockAI,
    });

    res.json({
      id: saved._id,
      arv: arvResult.arv,
      arvLow: arvResult.arvLow,
      arvHigh: arvResult.arvHigh,
      mao,
      dealScore: score,
      profitMargin: margin,
      conditionAdjustment: arvResult.conditionAdjustment,
      weightedAvgPPSF: arvResult.weightedAvgPPSF,
      comps: arvResult.comps,
      conditionAnalysis,
      isMockComps,
      isMockAI,
    });
  } catch (err) {
    console.error('ARV calculate error:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/arv/history — last 20 calculations
router.get('/history', async (req, res) => {
  try {
    const history = await Calculation.find({})
      .sort({ createdAt: -1 })
      .limit(20)
      .select('property arv mao dealScore createdAt');
    res.json(history);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
