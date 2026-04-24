const OpenAI = require('openai');

const MOCK_ANALYSES = {
  Excellent: 'Property is in excellent condition with modern finishes, updated systems, and strong curb appeal. Expect top-of-market pricing with minimal buyer resistance. Command a premium over neighborhood averages.',
  Good: 'Property is in good condition with no major deferred maintenance. Cosmetic updates may boost value marginally. Well-positioned competitively within the market — expect standard comp-based pricing.',
  Fair: 'Property shows visible wear with outdated finishes and some deferred maintenance. Buyers will likely negotiate discounts. Strategic updates to kitchen and baths could recover value quickly.',
  Poor: 'Significant repairs needed: likely outdated mechanicals, cosmetic overhaul required. Investor buyers will apply steep discounts. Properly pricing to the rehab market is critical for a timely sale.',
  'Gut Rehab': 'Property requires a complete renovation — structural, mechanical, cosmetic, and possibly code compliance issues. Value is driven purely by land and location. Target cash buyers and developers only.',
};

async function analyzeCondition(condition, address) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return { analysis: MOCK_ANALYSES[condition] || MOCK_ANALYSES.Good, isMock: true };

  try {
    const client = new OpenAI({ apiKey });
    const completion = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content:
            'You are a real estate appraisal expert. Provide a concise 2-3 sentence analysis of how a property\'s condition affects its ARV. Be specific about market implications. No bullet points.',
        },
        {
          role: 'user',
          content: `Property at ${address} is in "${condition}" condition. Explain how this condition affects the After Repair Value and what buyers/investors should expect.`,
        },
      ],
      max_tokens: 150,
      temperature: 0.7,
    });

    return {
      analysis: completion.choices[0].message.content.trim(),
      isMock: false,
    };
  } catch (err) {
    console.error('OpenAI error:', err.message);
    return { analysis: MOCK_ANALYSES[condition] || MOCK_ANALYSES.Good, isMock: true };
  }
}

module.exports = { analyzeCondition };
