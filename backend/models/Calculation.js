const mongoose = require('mongoose');

const compSchema = new mongoose.Schema({
  address: String,
  saleDate: Date,
  salePrice: Number,
  sqft: Number,
  beds: Number,
  baths: Number,
  pricePerSqft: Number,
  adjustedPricePerSqft: Number,
  distance: Number,
  yearBuilt: Number,
}, { _id: false });

const calculationSchema = new mongoose.Schema({
  property: {
    address: String,
    beds: Number,
    baths: Number,
    sqft: Number,
    yearBuilt: Number,
    condition: String,
    repairCost: Number,
    purchasePrice: Number,
  },
  arv: Number,
  arvLow: Number,
  arvHigh: Number,
  mao: Number,
  dealScore: { type: String, enum: ['HOT', 'MARGINAL', 'PASS'] },
  profitMargin: Number,
  conditionAdjustment: Number,
  weightedAvgPPSF: Number,
  comps: [compSchema],
  conditionAnalysis: String,
  isMockComps: { type: Boolean, default: false },
  isMockAI: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Calculation', calculationSchema);
