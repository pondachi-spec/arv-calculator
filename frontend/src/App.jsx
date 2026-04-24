import { useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import Header from './components/Header';
import PropertyForm from './components/PropertyForm';
import ARVResults from './components/ARVResults';
import CompCard from './components/CompCard';
import DealScore from './components/DealScore';

export default function App() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [formData, setFormData] = useState(null);

  async function handleCalculate(data) {
    setLoading(true);
    setResult(null);
    setFormData(data);
    try {
      const { data: res } = await axios.post('/api/arv/calculate', data);
      setResult(res);
      toast.success('ARV calculated successfully');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Calculation failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#080818] relative overflow-x-hidden">
      {/* Background orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-violet-900/25 rounded-full blur-3xl" />
        <div className="absolute top-1/3 -right-32 w-80 h-80 bg-indigo-900/20 rounded-full blur-3xl" />
        <div className="absolute bottom-10 left-1/4 w-72 h-72 bg-blue-900/15 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 py-6 space-y-6">
        <Header />

        <div className="grid lg:grid-cols-[420px_1fr] gap-6 items-start">
          {/* Left: input form */}
          <div className="glass p-6">
            <PropertyForm onSubmit={handleCalculate} loading={loading} />
          </div>

          {/* Right: results */}
          <div className="space-y-5">
            {loading && (
              <div className="glass p-10 flex flex-col items-center gap-4">
                <svg className="animate-spin h-10 w-10 text-indigo-400" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
                <p className="text-slate-400">Fetching comps & running AI analysis…</p>
              </div>
            )}

            {result && !loading && (
              <>
                <ARVResults result={result} property={formData} />
                <DealScore result={result} property={formData} />

                {/* Comp cards */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">
                      Comparable Sales ({result.comps?.length})
                      {result.isMockComps && (
                        <span className="ml-2 text-xs normal-case px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400">
                          Mock
                        </span>
                      )}
                    </h2>
                  </div>
                  <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3">
                    {result.comps?.map((comp, i) => (
                      <CompCard key={i} comp={comp} conditionAdj={result.conditionAdjustment} />
                    ))}
                  </div>
                </div>

                {/* AI condition analysis */}
                {result.conditionAnalysis && (
                  <div className="glass p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-lg">🤖</span>
                      <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500">
                        AI Condition Analysis
                        {result.isMockAI && (
                          <span className="ml-2 normal-case text-xs px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400">
                            Mock
                          </span>
                        )}
                      </h3>
                    </div>
                    <p className="text-slate-300 text-sm leading-relaxed">{result.conditionAnalysis}</p>
                  </div>
                )}
              </>
            )}

            {!result && !loading && (
              <div className="glass p-12 flex flex-col items-center gap-3 text-center">
                <span className="text-5xl opacity-30">🏠</span>
                <p className="text-slate-500">Fill in the property details and click <strong className="text-slate-400">Calculate ARV</strong> to begin.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
