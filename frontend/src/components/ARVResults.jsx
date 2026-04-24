import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import toast from 'react-hot-toast';

function fmt(n) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
}

function fmtDate(d) {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function ARVResults({ result, property }) {
  const adjPct = result.conditionAdjustment >= 0
    ? `+${(result.conditionAdjustment * 100).toFixed(0)}%`
    : `${(result.conditionAdjustment * 100).toFixed(0)}%`;

  function openShaani() {
    const url = `http://localhost:3001?arv=${result.arv}&mao=${result.mao}&address=${encodeURIComponent(property?.address || '')}`;
    window.open(url, '_blank');
    toast.success('Opened in Shaani');
  }

  function exportPDF() {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'letter' });
    const pageW = doc.internal.pageSize.getWidth();

    // Title
    doc.setFontSize(20);
    doc.setTextColor(80, 60, 200);
    doc.text('AI ARV Calculator Report', 40, 50);

    doc.setFontSize(10);
    doc.setTextColor(100, 100, 120);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 40, 68);
    doc.text(`Property: ${property?.address || ''}`, 40, 82);

    // ARV summary box
    doc.setFillColor(245, 243, 255);
    doc.roundedRect(40, 100, pageW - 80, 90, 6, 6, 'F');

    doc.setFontSize(11);
    doc.setTextColor(60, 50, 120);
    const summaryRows = [
      ['ARV (Estimated)', fmt(result.arv)],
      ['ARV Range', `${fmt(result.arvLow)} – ${fmt(result.arvHigh)}`],
      ['MAO (70% Rule)', fmt(result.mao)],
      ['Weighted Avg $/sqft', `$${result.weightedAvgPPSF}`],
      ['Condition Adjustment', adjPct],
      ['Repair Cost', fmt(property?.repairCost || 0)],
    ];
    summaryRows.forEach(([label, val], i) => {
      const y = 118 + i * 13;
      doc.text(label, 55, y);
      doc.text(val, pageW - 55, y, { align: 'right' });
    });

    // Comps table
    doc.setFontSize(13);
    doc.setTextColor(40, 40, 60);
    doc.text('Comparable Sales', 40, 210);

    autoTable(doc, {
      startY: 222,
      head: [['Address', 'Sale Date', 'Sale Price', 'Sqft', '$/sqft', 'Adj $/sqft', 'Distance']],
      body: (result.comps || []).map((c) => [
        c.address,
        fmtDate(c.saleDate),
        fmt(c.salePrice),
        c.sqft.toLocaleString(),
        `$${c.pricePerSqft}`,
        `$${c.adjustedPricePerSqft}`,
        `${c.distance} mi`,
      ]),
      styles: { fontSize: 8, cellPadding: 4 },
      headStyles: { fillColor: [80, 60, 200], textColor: 255 },
      alternateRowStyles: { fillColor: [248, 247, 255] },
      margin: { left: 40, right: 40 },
    });

    // AI analysis
    if (result.conditionAnalysis) {
      const finalY = doc.lastAutoTable.finalY + 20;
      doc.setFontSize(12);
      doc.setTextColor(40, 40, 60);
      doc.text('AI Condition Analysis', 40, finalY);
      doc.setFontSize(9);
      doc.setTextColor(80, 80, 100);
      const lines = doc.splitTextToSize(result.conditionAnalysis, pageW - 80);
      doc.text(lines, 40, finalY + 16);
    }

    doc.save(`ARV-${(property?.address || 'report').replace(/[^a-z0-9]/gi, '-')}.pdf`);
    toast.success('PDF exported');
  }

  return (
    <div className="glass p-6 space-y-5">
      {/* Top row: action buttons */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-lg font-semibold text-slate-200">ARV Results</h2>
        <div className="flex gap-2">
          <button onClick={openShaani}
            className="text-sm px-4 py-2 rounded-xl bg-violet-600/20 hover:bg-violet-600/40 border border-violet-500/30 text-violet-300 transition-all">
            🔮 Analyze in Shaani
          </button>
          <button onClick={exportPDF} className="btn-ghost text-sm">
            📄 Export PDF
          </button>
        </div>
      </div>

      {/* ARV hero */}
      <div className="glass-dark p-5 text-center">
        <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-1">After Repair Value</p>
        <p className="text-5xl font-bold text-violet-300">{fmt(result.arv)}</p>
        <p className="text-slate-500 text-sm mt-2">
          Range: <span className="text-slate-300">{fmt(result.arvLow)}</span>
          {' – '}
          <span className="text-slate-300">{fmt(result.arvHigh)}</span>
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="stat-card">
          <span className="stat-label">MAO (70% Rule)</span>
          <span className="stat-value text-emerald-300">{fmt(result.mao)}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Avg $/sqft</span>
          <span className="stat-value">${result.weightedAvgPPSF}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Condition Adj.</span>
          <span className={`stat-value ${result.conditionAdjustment >= 0 ? 'text-emerald-300' : 'text-red-300'}`}>
            {adjPct}
          </span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Repair Cost</span>
          <span className="stat-value text-amber-300">{fmt(property?.repairCost || 0)}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Comps Found</span>
          <span className="stat-value">{result.comps?.length || 0}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Condition</span>
          <span className="stat-value text-sm mt-1">{property?.condition}</span>
        </div>
      </div>
    </div>
  );
}
