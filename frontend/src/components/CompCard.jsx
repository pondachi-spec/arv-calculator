function fmt(n) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
}

function fmtDate(d) {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function CompCard({ comp, conditionAdj }) {
  const adjColor = conditionAdj >= 0 ? 'text-emerald-400' : 'text-red-400';
  const adjSign = conditionAdj >= 0 ? '+' : '';

  return (
    <div className="glass-dark p-4 space-y-3 hover:bg-white/5 transition-colors">
      {/* Address */}
      <p className="text-slate-200 text-sm font-medium leading-tight line-clamp-2">{comp.address}</p>

      {/* Sale info */}
      <div className="flex items-center justify-between text-xs text-slate-500">
        <span>{fmtDate(comp.saleDate)}</span>
        <span>{comp.distance} mi away</span>
      </div>

      {/* Price row */}
      <div className="flex items-center justify-between">
        <span className="text-lg font-bold text-slate-100">{fmt(comp.salePrice)}</span>
        <div className="text-right">
          <p className="text-xs text-slate-500">Year Built</p>
          <p className="text-slate-300 text-sm">{comp.yearBuilt || '—'}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 text-xs text-center">
        <div className="glass p-1.5 rounded-lg">
          <p className="text-slate-600">Sqft</p>
          <p className="text-slate-300 font-semibold">{comp.sqft?.toLocaleString()}</p>
        </div>
        <div className="glass p-1.5 rounded-lg">
          <p className="text-slate-600">Beds/Ba</p>
          <p className="text-slate-300 font-semibold">{comp.beds}/{comp.baths}</p>
        </div>
        <div className="glass p-1.5 rounded-lg">
          <p className="text-slate-600">$/sqft</p>
          <p className="text-slate-300 font-semibold">${comp.pricePerSqft}</p>
        </div>
      </div>

      {/* Adjusted PPSF */}
      <div className="flex items-center justify-between text-xs border-t border-white/5 pt-2">
        <span className="text-slate-500">Adj $/sqft ({adjSign}{(conditionAdj * 100).toFixed(0)}%)</span>
        <span className={`font-semibold ${adjColor}`}>${comp.adjustedPricePerSqft}</span>
      </div>
    </div>
  );
}
