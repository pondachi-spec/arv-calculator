# AI ARV Calculator

Comp-based After Repair Value calculator with ATTOM Data comps, OpenAI condition analysis, MAO formula, deal scoring, and PDF export.

## Stack

- **Backend** — Node.js + Express on port 3004
- **Database** — MongoDB + Mongoose
- **Frontend** — React + Vite + Tailwind CSS (dark glassmorphism)
- **Comps** — ATTOM Data API (mock fallback on 401/403 or missing key)
- **AI** — OpenAI GPT-4o-mini (mock fallback if key not set)
- **PDF** — jsPDF + autoTable (client-side)

## Quick Start

### 1. Configure `.env`

```env
ATTOM_API_KEY=         # leave blank for mock comps
OPENAI_API_KEY=        # leave blank for mock AI analysis
MONGODB_URI=mongodb+srv://<user>:<pass>@<cluster>.mongodb.net/arv-calculator?appName=Cluster0
PORT=3004
```

### 2. Install

```bash
cd backend && npm install
cd ../frontend && npm install
```

### 3. Run (dev)

```bash
# Terminal 1
cd backend && npm run dev

# Terminal 2
cd frontend && npm run dev
```

- Backend: http://localhost:3004
- Frontend: http://localhost:5174

### 4. Production

```bash
cd frontend && npm run build
cd ../backend && npm start   # serves frontend/dist at :3004
```

## ARV Formula

```
1. Raw $/sqft  = comp sale price ÷ comp sqft
2. Adj $/sqft  = raw $/sqft × (1 + condition adjustment)
3. Weighted avg = Σ(adj $/sqft × weight) ÷ Σ weights
   weights = avg of recency score + sqft similarity score
4. ARV  = weighted avg $/sqft × subject sqft
5. Low  = ARV × 0.90
6. High = ARV × 1.10
```

## Condition Adjustments

| Condition  | Adjustment |
|------------|-----------|
| Excellent  | +5%       |
| Good       | 0%        |
| Fair       | −8%       |
| Poor       | −15%      |
| Gut Rehab  | −25%      |

## MAO & Deal Score

```
MAO = (ARV × 0.70) − Repair Cost

Deal Score (requires Purchase Price):
  HOT      → profit margin > 20%
  MARGINAL → profit margin 10–20%
  PASS     → profit margin < 10%

Profit Margin = (ARV − Purchase Price − Repair Cost) ÷ ARV
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | /api/arv/calculate | Run full ARV analysis |
| GET  | /api/arv/history   | Last 20 calculations |
| GET  | /api/health        | Health check |

## Integrations

- **Shaani** — "Analyze in Shaani" button opens `http://localhost:3001?arv=&mao=&address=`
- **PDF** — Client-side export with comps table and AI analysis
