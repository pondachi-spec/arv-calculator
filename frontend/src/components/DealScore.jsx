function fmt(n) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
}

const SCORE_CONFIG = {
  HOT:      { emoji: '🔥', label: 'HOT DEAL',  bg: 'bg-emerald-500/15', border: 'border-emerald-500/30', text: 'text-emerald-300', bar: 'bg-emerald-500' },
  MARGINAL: { emoji: '⚠️', label: 'MARGINAL',   bg: 'bg-yellow-500/15',  border: 'border-yellow-500/30',  text: 'text-yellow-300',  bar: 'bg-yellow-500' },
  PASS:     { emoji: '🚫', label: 'PASS',       bg: 'bg-red-500/15',     border: 'border-red-500/30',     text: 'text-red-300',     bar: 'bg-red-500'    },
};

export default function DealScore({ result, property }) {
  const { dealScore, profitMargin, arv, mao } = result;
  const repairCost = property?.repairCost || 0;
  const purchasePrice = property?.purchasePrice || 0;

  // If no purchase price, show MAO-based info only (no score)
  if (!dealScore || !purchasePrice) {
    return (
      <div className="glass p-5 space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">MAO Analysis</h2>
        <div className="flex flex-wrap gap-4 text-sm">
          <div>
            <span className="text-slate-500">MAO = </span>
            <span className="text-slate-200 font-semibold">(ARV × 70%) − Repair Cost</span>
          </div>
          <div>
            <span className="text-slate-500">= </span>
            <span className="text-slate-200">{fmt(arv)} × 0.70 − {fmt(repairCost)}</span>
            <span className="text-emerald-300 font-bold"> = {fmt(mao)}</span>
          </div>
        </div>
        <p className="text-slate-500 text-xs">Add a Purchase Price to see your deal score and profit margin.</p>
      </div>
    );
  }

  const cfg = SCORE_CONFIG[dealScore] || SCORE_CONFIG.PASS;
  const profit = arv - purchasePrice - repairCost;
  const barWidth = Math.min(100, Math.max(0, profitMargin));

  return (
    <div className={`glass p-5 border ${cfg.border} ${cfg.bg} space-y-4`}>
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">Deal Score</h2>
        <span className={`text-2xl font-bold ${cfg.text} flex items-center gap-2`}>
          {cfg.emoji} {cfg.label}
        </span>
      </div>

      {/* Profit bar */}
      <div>
        <div className="flex justify-between text-xs text-slate-500 mb-1.5">
          <span>Profit Margin</span>
          <span className={`font-semibold ${cfg.text}`}>{profitMargin?.toFixed(1)}%</span>
        </div>
        <div className="h-2.5 bg-white/5 rounded-full overflow-hidden">
          <div className={`h-full rounded-full transition-all duration-700 ${cfg.bar}`}
            style={{ width: `${Math.min(barWidth * 3, 100)}%` }} />
        </div>
        <div className="flex justify-between text-xs text-slate-600 mt-1">
          <span>0%</span><span>10%</span><span>20%+</span>
        </div>
      </div>

      {/* Numbers */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
        {[
          { label: 'ARV', value: fmt(arv), cls: 'text-slate-200' },
          { label: 'Purchase Price', value: fmt(purchasePrice), cls: 'text-slate-200' },
          { label: 'Repair Cost', value: fmt(repairCost), cls: 'text-amber-300' },
          { label: 'Est. Profit', value: fmt(profit), cls: profit >= 0 ? 'text-emerald-300' : 'text-red-300' },
        ].map(({ label, value, cls }) => (
          <div key={label} className="glass-dark p-3">
            <p className="text-xs text-slate-500 mb-0.5">{label}</p>
            <p className={`font-semibold ${cls}`}>{value}</p>
          </div>
        ))}
      </div>

      <p className="text-xs text-slate-600">
        HOT &gt;20% · MARGINAL 10–20% · PASS &lt;10% profit margin on ARV
      </p>
    </div>
  );
}
