import { useState, useEffect } from 'react';

const CONDITIONS = ['Excellent', 'Good', 'Fair', 'Poor', 'Gut Rehab'];

const CONDITION_ADJ = {
  Excellent: '+5%',
  Good: '0%',
  Fair: '-8%',
  Poor: '-15%',
  'Gut Rehab': '-25%',
};

const DEFAULTS = {
  address: '',
  zip: '',
  beds: '3',
  baths: '2',
  sqft: '1500',
  yearBuilt: '1990',
  condition: 'Good',
  repairCost: '25000',
  purchasePrice: '',
};

export default function PropertyForm({ onSubmit, loading }) {
  const [form, setForm] = useState(DEFAULTS);

  // Pre-fill form from URL params (when opened from Distress Filter)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const updates = {};
    if (params.get('address')) updates.address = params.get('address');
    if (params.get('zip'))     updates.zip      = params.get('zip');
    if (params.get('sqft'))    updates.sqft     = params.get('sqft');
    if (params.get('yearBuilt')) updates.yearBuilt = params.get('yearBuilt');
    if (params.get('beds'))    updates.beds     = params.get('beds');
    if (params.get('baths'))   updates.baths    = params.get('baths');
    if (Object.keys(updates).length > 0) {
      setForm(f => ({ ...f, ...updates }));
    }
  }, []);

  function set(key, val) {
    setForm((f) => ({ ...f, [key]: val }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    onSubmit({
      address: form.address,
      zip: form.zip,
      beds: Number(form.beds),
      baths: Number(form.baths),
      sqft: Number(form.sqft),
      yearBuilt: Number(form.yearBuilt),
      condition: form.condition,
      repairCost: Number(form.repairCost),
      purchasePrice: form.purchasePrice ? Number(form.purchasePrice) : 0,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <h2 className="text-lg font-semibold text-slate-200">Property Details</h2>

      {/* Address */}
      <div>
        <label className="block text-xs font-medium text-slate-400 mb-1.5">Property Address *</label>
        <input
          className="input-field"
          placeholder="123 Main St, Dallas, TX 75201"
          value={form.address}
          onChange={(e) => set('address', e.target.value)}
          required
        />
      </div>

      {/* Zip Code */}
      <div>
        <label className="block text-xs font-medium text-slate-400 mb-1.5">Zip Code *</label>
        <input
          className="input-field"
          placeholder="33605"
          value={form.zip}
          onChange={(e) => set('zip', e.target.value)}
          maxLength={5}
          required
        />
      </div>

      {/* Beds / Baths / Year */}
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5">Beds</label>
          <input type="number" min="1" max="10" className="input-field" value={form.beds}
            onChange={(e) => set('beds', e.target.value)} required />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5">Baths</label>
          <input type="number" min="1" max="10" step="0.5" className="input-field" value={form.baths}
            onChange={(e) => set('baths', e.target.value)} required />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5">Year Built</label>
          <input type="number" min="1800" max="2025" className="input-field" value={form.yearBuilt}
            onChange={(e) => set('yearBuilt', e.target.value)} />
        </div>
      </div>

      {/* Sqft */}
      <div>
        <label className="block text-xs font-medium text-slate-400 mb-1.5">Square Footage *</label>
        <input type="number" min="100" className="input-field" placeholder="1500"
          value={form.sqft} onChange={(e) => set('sqft', e.target.value)} required />
      </div>

      {/* Condition */}
      <div>
        <label className="block text-xs font-medium text-slate-400 mb-1.5">Current Condition *</label>
        <select className="select-field" value={form.condition}
          onChange={(e) => set('condition', e.target.value)}>
          {CONDITIONS.map((c) => (
            <option key={c} value={c}>{c} ({CONDITION_ADJ[c]} adjustment)</option>
          ))}
        </select>
      </div>

      {/* Repair Cost */}
      <div>
        <label className="block text-xs font-medium text-slate-400 mb-1.5">Estimated Repair Cost *</label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">$</span>
          <input type="number" min="0" className="input-field pl-8" placeholder="25000"
            value={form.repairCost} onChange={(e) => set('repairCost', e.target.value)} required />
        </div>
      </div>

      {/* Purchase Price (optional) */}
      <div>
        <label className="block text-xs font-medium text-slate-400 mb-1.5">
          Purchase Price <span className="text-slate-600">(optional — enables deal scoring)</span>
        </label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">$</span>
          <input type="number" min="0" className="input-field pl-8" placeholder="120000"
            value={form.purchasePrice} onChange={(e) => set('purchasePrice', e.target.value)} />
        </div>
      </div>

      <button type="submit" disabled={loading} className="btn-primary w-full">
        {loading ? 'Calculating…' : '⚡ Calculate ARV'}
      </button>
    </form>
  );
}
