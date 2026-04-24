export default function Header() {
  return (
    <div className="flex items-center gap-4">
      <div className="w-11 h-11 rounded-xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center text-2xl">
        🏠
      </div>
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-violet-300 via-indigo-300 to-slate-200 bg-clip-text text-transparent">
          AI ARV Calculator
        </h1>
        <p className="text-slate-500 text-sm">Comp-based valuation · AI condition analysis · MAO & deal scoring</p>
      </div>
    </div>
  );
}
