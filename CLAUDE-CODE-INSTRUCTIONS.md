# TREND COMPASS — Claude Code Build Instructions
## Full-Stack Next.js App with Live Market Data

## Overview
Build a strategic intelligence app that tracks mega-trends, analyzes convergences, recommends investment positions with live prices, and uses AI for signal scanning. Deploy on Vercel.

## Tech Stack
- **Framework**: Next.js 14+ (App Router, TypeScript)
- **Styling**: Tailwind CSS (keep the dark theme from source JSX)
- **Database**: Vercel KV (Redis) for persistence — no SQLite on Vercel serverless
- **AI (dual-model routing for cost efficiency)**:
  - **Gemini 2.5 Pro** — for signal scans (high volume, ~$0.01/call)
  - **Claude Sonnet 4.6** — for synthesis & challenge (quality-critical, ~$0.05/call)
- **Market Data**: EODHD API for live stock/ETF prices
- **Auth**: Simple shared password via middleware + cookie
- **Deploy**: Vercel

## Environment Variables (.env.local)
```
ANTHROPIC_API_KEY=sk-ant-...
GEMINI_API_KEY=...
EODHD_API_KEY=...
APP_PASSWORD=your-shared-password
KV_URL=...
KV_REST_API_URL=...
KV_REST_API_TOKEN=...
KV_REST_API_READ_ONLY_TOKEN=...
```

## Project Structure
```
trend-compass/
├── app/
│   ├── layout.tsx
│   ├── page.tsx
│   ├── login/
│   │   └── page.tsx
│   ├── api/
│   │   ├── auth/route.ts
│   │   ├── ai/route.ts            # Smart router: scan→Gemini, synthesis→Claude
│   │   ├── prices/route.ts
│   │   ├── trends/route.ts
│   │   └── scans/route.ts
├── components/
│   ├── TrendCompass.tsx
│   ├── LandscapeTab.tsx
│   ├── AnalysisTab.tsx
│   ├── PositionsTab.tsx
│   └── StrategyLabTab.tsx
├── lib/
│   ├── seed-data.ts
│   ├── ai-router.ts               # Dual-model routing logic
│   ├── eodhd.ts
│   └── types.ts
├── middleware.ts
├── tailwind.config.ts
└── package.json
```

## Step-by-Step Build Plan

### Step 1: Scaffold
```bash
npx create-next-app@latest trend-compass --typescript --tailwind --app --src-dir=false
cd trend-compass
npm install @anthropic-ai/sdk @google/generative-ai @vercel/kv
```

### Step 2: Authentication (middleware.ts)
Simple shared password. No user accounts.
- middleware.ts checks for `tc_auth` cookie
- If missing, redirect to /login
- /login page: single password field
- POST /api/auth: verify against APP_PASSWORD env var
- On success: set HttpOnly cookie, 30-day expiry

### Step 3: EODHD Integration (lib/eodhd.ts)
**This is the killer feature — live market prices.**

EODHD API endpoints:
- Real-time: `GET https://eodhd.com/api/real-time/{SYMBOL}.{EXCHANGE}?api_token={KEY}&fmt=json`
- Search: `GET https://eodhd.com/api/search/{QUERY}?api_token={KEY}&fmt=json`

EODHD exchange codes for our symbols:
- US stocks (NVDA, AVGO, CCJ, GEV, ETN, PWR, BWXT, FCX, OKLO, NBIS): `.US`
- Xetra ETCs (WGLD, OD7C, SPUT, U3O8, WNUC, RARE, GDX, W1TB, WRNA, 3TYS): `.XETRA` — verify exact tickers via search API
- London-listed (SPUT if on LSE): `.LSE`
- Amsterdam (ASML): `.AS`
- VIX: `VIX.INDX`

**IMPORTANT:** Before hardcoding EODHD tickers, use the search endpoint to verify the exact ticker for each EU-listed ETC. These often differ between brokers and EODHD.

Cache prices for 5 minutes via Next.js revalidate. Strategic investing doesn't need real-time.

### Step 4: API Routes

**/api/prices** — GET: fetch batch prices from EODHD for all tracked symbols. Returns `{ NVDA: { close: 166.48, change_p: 1.39, ... }, ... }`

**/api/ai** — POST: smart AI router. Body: `{ system, prompt, tier }`. Routes to different models based on tier:
- `tier: "scan"` → Gemini 2.5 Pro (~$0.01/call) — signal scans, trend suggestions
- `tier: "synthesis"` → Claude Sonnet 4.6 (~$0.05/call) — full synthesis, challenge, convergence analysis

Never expose API keys to browser. Both keys stay server-side.

```typescript
// lib/ai-router.ts
import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const gemini = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function callAI(system: string, prompt: string, tier: 'scan' | 'synthesis') {
  if (tier === 'scan') {
    // Gemini 2.5 Pro — fast, cheap, good for scanning
    const model = gemini.getGenerativeModel({ model: 'gemini-2.5-pro' });
    const result = await model.generateContent({
      systemInstruction: system,
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
    });
    return result.response.text();
  } else {
    // Claude Sonnet 4.6 — best for adversarial analysis and synthesis
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1500,
      system: system,
      messages: [{ role: 'user', content: prompt }],
    });
    return message.content
      .filter(b => b.type === 'text')
      .map(b => b.text)
      .join('\n');
  }
}
```

```typescript
// app/api/ai/route.ts
import { callAI } from '@/lib/ai-router';

export async function POST(req: Request) {
  const { system, prompt, tier = 'scan' } = await req.json();
  try {
    const result = await callAI(system, prompt, tier);
    return Response.json({ result });
  } catch (e: any) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
```

**Frontend call mapping** (which button uses which tier):
| Button | Tab | Tier | Model | Why |
|--------|-----|------|-------|-----|
| ⚡ Scan (per trend) | Analysis | `scan` | Gemini 2.5 Pro | High volume, factual scanning |
| 🔮 Suggest Trends | Analysis | `scan` | Gemini 2.5 Pro | Creative but not adversarial |
| 📊 Full Synthesis | Strategy Lab | `synthesis` | Claude Sonnet 4.6 | Needs deep multi-trend reasoning |
| 🎯 Challenge Framework | Strategy Lab | `synthesis` | Claude Sonnet 4.6 | Adversarial analysis, Claude excels |
| ⚡ Analyze Gaps | Positions | `synthesis` | Claude Sonnet 4.6 | Portfolio-level reasoning |
| Convergence Analysis | Analysis | `synthesis` | Claude Sonnet 4.6 | Second-order effects, needs depth |

**Frontend example:**
```tsx
// Signal scan — uses Gemini (cheap, fast)
const r = await fetch('/api/ai', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ system: '...', prompt: '...', tier: 'scan' }),
});

// Full synthesis — uses Claude (quality-critical)
const r = await fetch('/api/ai', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ system: '...', prompt: '...', tier: 'synthesis' }),
});
```

**Estimated monthly cost at 28 calls/month:**
- 20 scans × Gemini 2.5 Pro = ~$0.20
- 8 synthesis/challenge × Claude Sonnet 4.6 = ~$0.40
- **Total: ~$0.60/month**

**/api/trends** — GET/POST: read/write trends to Vercel KV. Seed with data from seed-data.ts on first read.

**/api/scans** — GET/POST: read/write AI scan results to Vercel KV.

**/api/auth** — POST: verify password, set cookie.

### Step 5: Port the React Component

The source file `trend-compass.jsx` contains everything. Key changes needed:

1. **Replace `window.storage.*`** → `fetch('/api/trends')` and `fetch('/api/scans')`
2. **Replace `callAI()` direct fetch** → `fetch('/api/ai', { method: 'POST', body: JSON.stringify({ system, prompt, tier }) })` — pass `tier: 'scan'` for signal scans and trend suggestions, `tier: 'synthesis'` for full synthesis, challenge, convergence analysis, and gap analysis
3. **Add price fetching** → on mount, `fetch('/api/prices')` and update crash watchlist + position statuses
4. **Dynamic status calculation** — fetch VIX from EODHD, calculate position statuses in real-time instead of hardcoded strings
5. **Split into 4 tab components** for maintainability
6. **Convert inline styles to Tailwind** — keep same colors and dark theme
7. **Show which model is being used** — in the AI result panel header, show "via Gemini 2.5 Pro" or "via Claude Sonnet" so the user knows which model answered

### Step 6: Live Prices in Positions Tab

Replace hardcoded `now: "~$166"` in crash watchlist with live data:

```tsx
// Fetch prices on mount
const [prices, setPrices] = useState({});
useEffect(() => {
  fetch('/api/prices').then(r => r.json()).then(setPrices);
  const interval = setInterval(() => {
    fetch('/api/prices').then(r => r.json()).then(setPrices);
  }, 5 * 60 * 1000); // refresh every 5 min
  return () => clearInterval(interval);
}, []);

// In crash watchlist card, use live price:
const livePrice = prices[w.ticker]?.close;
const offHighPct = livePrice ? ((livePrice / w.highPrice - 1) * 100).toFixed(1) : null;
```

### Step 7: Dynamic Position Status

Fetch VIX and calculate statuses dynamically:

```tsx
const vix = prices['VIX']?.close || null;
const sp500Change = prices['SPY']?.change_p || null;

function getStatus(position) {
  if (position.when === 'Buy now') return { icon: '✅', text: 'GO', detail: 'Anti-correlated, no timing needed' };
  if (position.when.includes('VIX > 30')) {
    if (vix && vix > 30) return { icon: '✅', text: 'TRIGGERED', detail: `VIX at ${vix.toFixed(1)}` };
    return { icon: '⏳', text: 'WAIT', detail: `VIX at ${vix?.toFixed(1) || '?'}` };
  }
  if (position.when.includes('VIX > 35')) {
    if (vix && vix > 35) return { icon: '✅', text: 'TRIGGERED', detail: `VIX at ${vix.toFixed(1)}` };
    return { icon: '⏳', text: 'WAIT', detail: `VIX at ${vix?.toFixed(1) || '?'}` };
  }
  // ... more rules
}
```

### Step 8: Deploy to Vercel

```bash
npm i -g vercel
vercel login
# Go to Vercel Dashboard → Storage → Create KV Database (auto-sets env vars)
# Add remaining env vars in dashboard: ANTHROPIC_API_KEY, GEMINI_API_KEY, EODHD_API_KEY, APP_PASSWORD
vercel --prod
```

## Design Guidelines

Keep the dark theme from the source JSX. Key colors:
- Background: `#0a0c10` (app), `#0d1117` / `#111827` (cards)
- Primary accent: `#00e5ff` (cyan)
- Success/Long: `#00e676`
- Danger/Short: `#ff1744`
- Warning: `#ffea00`
- Purple (convergence/hedge): `#c084fc`
- Pink (crash watchlist): `#e040fb`
- Text: `#e0e4ec` (primary), `#94a3b8` (secondary), `#64748b` (muted)
- Borders: `#1e293b`
- Font: JetBrains Mono for data, DM Sans for body

## EODHD Ticker Mapping

Build this mapping and verify each ticker via EODHD search API before hardcoding:

```typescript
const TICKER_MAP: Record<string, { symbol: string; exchange: string }> = {
  // === POSITIONS ===
  // Physical ETCs (verify these on EODHD — Xetra tickers may differ)
  'SPUT': { symbol: 'SPUT', exchange: 'LSE' },     // HANetf Sprott Physical Uranium
  'OD7C': { symbol: 'OD7C', exchange: 'XETRA' },   // WisdomTree Copper
  'WGLD': { symbol: 'WGLD', exchange: 'XETRA' },   // WisdomTree Core Physical Gold
  'WSLV': { symbol: 'WSLV', exchange: 'XETRA' },   // WisdomTree Core Physical Silver
  
  // Miner/Sector ETFs
  'U3O8': { symbol: 'U3O8', exchange: 'LSE' },     // HANetf Sprott Uranium Miners
  'WNUC': { symbol: 'WNUC', exchange: 'XETRA' },  // WisdomTree Uranium & Nuclear
  'IXJ':  { symbol: 'IXJ', exchange: 'US' },       // iShares Global Healthcare
  'RARE': { symbol: 'RARE', exchange: 'XETRA' },   // WisdomTree Strategic Metals
  'GDX':  { symbol: 'GDX', exchange: 'US' },       // VanEck Gold Miners
  'W1TB': { symbol: 'W1TB', exchange: 'XETRA' },   // WisdomTree Cybersecurity
  
  // Individual stocks
  'CCJ':  { symbol: 'CCJ', exchange: 'US' },
  'NXE':  { symbol: 'NXE', exchange: 'US' },
  
  // Shorts & Hedges
  '3TYS': { symbol: '3TYS', exchange: 'XETRA' },  // WisdomTree 3x Short 10Y
  'XBJA': { symbol: 'XBJA', exchange: 'XETRA' },  // WisdomTree Long CHF Short EUR
  
  // === CRASH WATCHLIST ===
  'NVDA': { symbol: 'NVDA', exchange: 'US' },
  'AVGO': { symbol: 'AVGO', exchange: 'US' },
  'TSM':  { symbol: 'TSM', exchange: 'US' },
  'ASML': { symbol: 'ASML', exchange: 'US' },      // US-listed ADR
  'GEV':  { symbol: 'GEV', exchange: 'US' },
  'ETN':  { symbol: 'ETN', exchange: 'US' },
  'PWR':  { symbol: 'PWR', exchange: 'US' },
  'BWXT': { symbol: 'BWXT', exchange: 'US' },
  'FCX':  { symbol: 'FCX', exchange: 'US' },
  'OKLO': { symbol: 'OKLO', exchange: 'US' },
  'NBIS': { symbol: 'NBIS', exchange: 'US' },
  
  // === MARKET INDICATORS ===
  'VIX':  { symbol: 'VIX', exchange: 'INDX' },
  'SPY':  { symbol: 'SPY', exchange: 'US' },
  'GC':   { symbol: 'GC.COMEX', exchange: 'COMM' }, // Gold futures (verify)
  'SI':   { symbol: 'SI.COMEX', exchange: 'COMM' }, // Silver futures (verify)
  'UX':   { symbol: 'UX', exchange: 'COMM' },       // Uranium spot (may not be available)
};
```

## What NOT to Do

1. Don't use localStorage in the app — use Vercel KV via API routes
2. Don't expose API keys in client code — all external calls go through /api/ routes
3. Don't hardcode prices — always fetch from EODHD
4. Don't use SQLite — Vercel serverless doesn't support persistent filesystem
5. Don't skip the EODHD ticker verification step — EU ETCs often have different tickers
6. Don't send all AI calls to the same model — use the tier routing (scan→Gemini, synthesis→Claude)
7. Don't use Opus or GPT-5 Pro — overkill for this use case, Sonnet and Gemini Pro are optimal

## Token Efficiency Guidelines

Keep AI calls lean:
- **System prompts**: under 100 tokens. "Strategic intelligence analyst. Specific tickers. Recent developments." — not a paragraph.
- **User prompts**: include only the data the model needs. For a single trend scan, send that trend's data only, not all 10 trends.
- **Max output tokens**: set to 1500 for synthesis, 1000 for scans. The models don't need more for this.
- **No web search tools**: adds latency and complexity. EODHD provides live prices. The models' training data is sufficient for macro analysis.
- **Prompt caching**: if using Claude, the system prompt is cached automatically after the first call (90% savings on input). Structure system prompts identically across calls to maximize cache hits.

## Prompt for Claude Code

Copy and paste this:

---

Read CLAUDE-CODE-INSTRUCTIONS.md and trend-compass.jsx in this directory. Build a full Next.js app following the architecture described.

Key requirements:
- Dual AI model routing: signal scans use Gemini 2.5 Pro (cheap), synthesis/challenge use Claude Sonnet 4.6 (quality). See the tier routing table in instructions.
- EODHD live prices for all positions and crash watchlist. Verify every EU-listed ETC ticker via EODHD search API before hardcoding.
- Vercel KV for persistence (trends, scans).
- Simple password auth via middleware.
- Dark theme from source JSX, converted to Tailwind.
- Show which AI model answered in the result panel.
- VIX fetched from EODHD to calculate position statuses dynamically.

Build in order: scaffold → auth → EODHD integration → AI router → KV persistence → port React component into 4 tabs → test locally → prepare for Vercel deploy.

---

## Source Files Attached
- `trend-compass.jsx` — Complete working React component with all seed data, 558 lines
- `CLAUDE-CODE-INSTRUCTIONS.md` — This file
