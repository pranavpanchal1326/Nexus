# NEXUS v2.0 — Void Intelligence OS

> **An intelligence operating system engineered for 2026.**
> Not a productivity app. A system that knows you, tracks your cognitive and physical output, and surfaces insight without being asked.

---

## Table of Contents

1. [What Is NEXUS](#what-is-nexus)
2. [Why v2 — What Was Wrong With v1](#why-v2)
3. [Design Philosophy — Void Intelligence](#design-philosophy)
4. [Architecture](#architecture)
5. [Tech Stack](#tech-stack)
6. [Project Structure](#project-structure)
7. [Database Schema](#database-schema)
8. [API Routes](#api-routes)
9. [AI Personas — Commander & Poet](#ai-personas)
10. [Environment Variables](#environment-variables)
11. [Local Development Setup](#local-development-setup)
12. [Implementation Phases](#implementation-phases)
13. [Master Prompts — Phase-by-Phase](#master-prompts)
14. [Testing](#testing)
15. [Deployment](#deployment)
16. [Success Criteria](#success-criteria)
17. [Design System Reference](#design-system-reference)
18. [Component Migration Map](#component-migration-map)
19. [Security Rules](#security-rules)
20. [What This Is Not](#what-this-is-not)

---

## What Is NEXUS

NEXUS is a **Void Intelligence OS** — a calm, aware system that monitors your cognitive and physical output and surfaces insight at the exact moment it matters. The AI is not a feature bolted on. It is the nervous system.

Every surface is still until intelligence needs to speak. Then it speaks once, precisely, and goes silent.

### Core Product Concepts That Survive Into v2

| Concept | Why It Stays |
|---------|-------------|
| **APEX / HAVEN circadian mode** | Core differentiator — time-aware intelligence |
| **4D Tesseract (Three.js)** | Geometry is correct. Becomes the mood/mode indicator |
| **GLSL Aurora curl-noise shader** | Recontextualized as ambient intelligence field |
| **Protocol ZERO emergency brake** | High-value UX moment — keep, refine interaction |
| **Lexicon Duel gamification** | Strong concept — wired to real AI evaluation |
| **Dynamic Island floating HUD** | Spatial intelligence layer — port to TSX |
| **Black Box data sovereignty export** | Product trust signal — built server-side properly |
| **AI dual-persona Commander/Poet** | APEX mode = Commander, HAVEN mode = Poet |
| **Spring physics wrappers** | Keep physics configs, type them properly |

---

## Why v2

v1 had 12 critical failures that made it unshippable:

| Area | Problem |
|------|---------|
| **Security** | Groq API key exposed client-side via `dangerouslyAllowBrowser: true` |
| **Auth** | Hardcoded `demo-user` ID — no login, no signup, no sessions |
| **Database** | Supabase mock returns empty arrays — no schema deployed, no RLS |
| **TypeScript** | 34 files of untyped JS — physics configs, AI schemas, store all untyped |
| **Tailwind** | TW4 package with TW3 directives (`@tailwind base`) — styles silently fail |
| **Routing** | Single-page dump — everything on one scroll, no URL structure |
| **Testing** | Zero test files — no unit, no integration, no E2E |
| **Data** | Heatmap, streaks, stats all hardcoded — no real data pipeline |
| **Git** | No `.git` initialized — no version history |
| **Audio** | All 3 sound effects use identical base64 WAV blob |
| **Design** | Over-vibe-coded glassmorphism — no editorial confidence, no hierarchy |
| **AI Presence** | AI confined to one chatbot box — not woven into the product |

v2 rebuilds every one of these from scratch. Nothing from v1 is carried unless explicitly listed above.

---

## Design Philosophy

### Void Intelligence — Four Laws (Non-Negotiable)

1. **Motion earns its place or it doesn't exist**
2. **The signal color (`--signal`) appears maximum 8 times in the entire UI**
3. **AI text renders differently from every other text — always**
4. **Whitespace is content — do not fill it**

### AI Presence — Three States

**State 1 — Ambient (Always running, invisible)**
- Single `6px × 6px` signal-yellow dot in nav rail bottom
- Pulses only during Groq API calls
- Static otherwise — no animation, no label

**State 2 — Surfaced (Context-aware, uninvited)**
- Journal: After 3s writing pause, one sentence appears below cursor
- Dashboard: After data loads, one insight line below the heatmap
- Gym: After logging a set, volume delta whispered beside the entry
- All surfaced text: `font-family: var(--font-mono)`, `color: var(--color-text-secondary)`, `opacity: 0.7`
- No button. No close. Fades after 8s automatically.

**State 3 — Invoked (Oracle full page `/oracle`)**
- Not a chat UI. An **intelligence document.**
- User input: bottom-anchored, monospace, minimal
- Oracle response: renders in `text-oracle` (italic Instrument Serif), word-by-word blur materialize
- Conversation history looks like a document being written — no chat bubbles ever
- APEX mode: Commander persona — terse, directive, Geist Mono responses
- HAVEN mode: Poet persona — expansive, italic serif responses

### The Layout — Three Zones Always

```
┌─────────────────────────────────────────────────────────┐
│  [56px rail]  │      [center — main content]      │ [320px] │
│               │                                   │         │
│  Icon nav     │   Artifact / Primary Module        │  Live   │
│  (no labels)  │                                   │  Intel  │
│  Tooltip only │   Tesseract lives here center     │  Feed   │
│               │                                   │         │
│  signal dot   │   Journal / Oracle / Gym          │  AI     │
│  at bottom    │   depending on route              │  pulse  │
│               │                                   │         │
└─────────────────────────────────────────────────────────┘
```

**Breakpoints:**
- `< 768px` — Rail collapses to bottom tab bar. Right panel hidden.
- `768–1280px` — Rail visible. Right panel hidden, triggered by toggle.
- `> 1280px` — Full three-zone layout.

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                      FRONTEND                           │
│           Next.js 15 (App Router) + TypeScript          │
│    React 19 · Tailwind 4 · Framer Motion · Three.js/R3F │
├─────────────────────────────────────────────────────────┤
│                      API LAYER                          │
│             Next.js Route Handlers (/api)               │
│    Server-side Groq · Supabase Auth middleware · Zod    │
├─────────────────────────────────────────────────────────┤
│                      BACKEND                            │
│      Supabase (Postgres + Auth + Row Level Security)    │
│               Groq SDK (server-side ONLY)               │
├─────────────────────────────────────────────────────────┤
│                   INFRASTRUCTURE                        │
│          Vercel (hosting · edge functions)              │
│       GitHub (source) · Supabase Cloud · Groq Cloud     │
└─────────────────────────────────────────────────────────┘
```

---

## Tech Stack

| Layer | v1 (Broken) | v2 (Production) | Rationale |
|-------|-------------|-----------------|-----------|
| Framework | Vite + React SPA | **Next.js 15 App Router** | SSR, API routes, middleware, edge |
| Language | JavaScript | **TypeScript strict** | Types across all 34+ files |
| Styling | TW4 + TW3 directives | **Tailwind 4 native CSS** | `@import "tailwindcss"` — no directives |
| State — client | Zustand (untyped) | **Zustand typed** | Mode, physics, UI state |
| State — server | None | **TanStack Query v5** | Cache, revalidation, optimistic updates |
| Auth | Hardcoded | **Supabase Auth** | Email + Google + GitHub OAuth |
| Database | Mock arrays | **Supabase Postgres + RLS** | Real schema, row-level security |
| Validation | None | **Zod** | Runtime schema validation on all API routes |
| AI transport | Client-side (exposed) | **Server route → Groq streaming** | Keys never reach browser |
| AI model | llama3-8b | **llama-3.3-70b-versatile** | Better reasoning for Commander/Poet |
| 3D | Three.js + R3F | **Three.js + R3F** (keep) | Already correct |
| Audio | Howler + broken base64 | **Web Audio API** | Algorithmic noise, no file deps |
| Animation | None (broken) | **Framer Motion 11** | Spring physics system-wide |
| Testing | None | **Vitest + Playwright** | Unit + E2E |
| Linting | None | **ESLint + Prettier** | Enforced on commit |
| Deploy | None | **Vercel** | Edge functions, preview deploys per branch |

---

## Project Structure

```
nexus/
├── app/
│   ├── layout.tsx                    # Root: fonts, providers, Shell
│   ├── page.tsx                      # / → redirect logic (auth check)
│   ├── (auth)/
│   │   ├── login/page.tsx            # Email + OAuth login
│   │   └── signup/page.tsx           # Registration
│   ├── (dashboard)/
│   │   ├── layout.tsx                # Authenticated shell: rail + right panel
│   │   ├── page.tsx                  # /dashboard — Tesseract + stats + heatmap
│   │   ├── oracle/page.tsx           # /oracle — AI intelligence document
│   │   ├── lexicon/page.tsx          # /lexicon — Duel + word history
│   │   ├── journal/page.tsx          # /journal — Write + browse entries
│   │   ├── gym/page.tsx              # /gym — Log workouts + history
│   │   └── settings/page.tsx         # /settings — Profile + Black Box export
│   └── api/
│       ├── chat/route.ts             # POST — Groq streaming, server-only
│       ├── chat/ambient/route.ts     # POST — ambient AI surface (short insight)
│       ├── lexicon/
│       │   ├── evaluate/route.ts     # POST — word usage AI evaluation
│       │   └── words/route.ts        # GET/POST — word CRUD
│       ├── journal/route.ts          # GET/POST — journal CRUD
│       ├── gym/route.ts              # GET/POST — gym log CRUD
│       ├── stats/route.ts            # GET — aggregate stats + streak calc
│       └── export/route.ts           # GET — ZIP data export (server-side)
│
├── components/
│   ├── layout/
│   │   ├── Shell.tsx                 # Root wrapper: grain texture + providers
│   │   ├── NavRail.tsx               # 56px left rail: icons + signal dot
│   │   ├── IntelPanel.tsx            # 320px right panel: live AI feed
│   │   ├── DynamicIsland.tsx         # Floating HUD — mode + streak + time
│   │   ├── ModeTransition.tsx        # Full-screen cinematic APEX↔HAVEN overlay
│   │   └── ProtocolZero.tsx          # Emergency brake — voice synthesis + blackout
│   ├── three/
│   │   ├── SceneWrapper.tsx          # Canvas + Suspense + error boundary
│   │   ├── Tesseract.tsx             # 4D hypercube — speed linked to mode
│   │   └── AuroraField.tsx           # GLSL curl-noise — ambient intelligence field
│   ├── modules/
│   │   ├── ArtifactModule.tsx        # Achievement + streak display
│   │   ├── Heatmap.tsx               # 365-day grid — real data, column reveal
│   │   ├── OracleChat.tsx            # AI intelligence document interface
│   │   ├── AmbientIntel.tsx          # Surfaced AI whispers (state 2)
│   │   ├── LexiconDuel.tsx           # Vocabulary combat + AI judge
│   │   ├── BlackBox.tsx              # Data sovereignty export
│   │   ├── JournalEditor.tsx         # Editor + AI cursor listening state
│   │   └── GymTracker.tsx            # Workout log + AI volume delta
│   ├── physics/
│   │   ├── ApexSpring.tsx            # stiffness:500 damping:40 — APEX snap
│   │   └── HavenSpring.tsx           # stiffness:180 damping:28 — HAVEN float
│   └── ui/
│       ├── Card.tsx                  # Surface card — grain + hover signal
│       ├── Button.tsx                # Mode-aware — APEX: sharp, HAVEN: soft
│       ├── Input.tsx                 # Monospace, surgical
│       ├── Modal.tsx                 # Spring enter — surface-raised bg
│       ├── Badge.tsx                 # Mono caps, minimal
│       ├── SignalDot.tsx             # 6px AI pulse indicator
│       ├── OdometerNumber.tsx        # Rolling number transition
│       └── Tooltip.tsx               # Nav rail labels on hover
│
├── hooks/
│   ├── useTimeMode.ts                # Circadian detector → APEX/HAVEN
│   ├── useAuth.ts                    # Supabase session state
│   ├── useJournal.ts                 # Journal CRUD + TanStack Query
│   ├── useGym.ts                     # Gym CRUD + TanStack Query
│   ├── useStats.ts                   # Stats + streak from API
│   ├── useLexicon.ts                 # Word history + XP + duel state
│   ├── useAmbientAI.ts               # Surfaced insight trigger logic
│   └── useOdometer.ts                # Number roll animation hook
│
├── lib/
│   ├── supabase/
│   │   ├── client.ts                 # Browser client (anon key only)
│   │   ├── server.ts                 # Server client (service role)
│   │   └── middleware.ts             # Session refresh on every request
│   ├── groq.ts                       # Server-only Groq SDK instance
│   ├── personas.ts                   # Commander + Poet system prompts
│   ├── audio.ts                      # Web Audio API — algorithmic noise engine
│   ├── export.ts                     # ZIP generation (server-side)
│   ├── motion.ts                     # Spring configs + easing constants
│   └── utils.ts                      # Time, mode detection, formatting
│
├── store/
│   └── nexusStore.ts                 # Zustand — mode, physics, UI state, signal dot
│
├── types/
│   ├── database.ts                   # Generated Supabase types
│   ├── mode.ts                       # Mode, persona, physics types
│   └── api.ts                        # Zod schemas + inferred TS types
│
├── styles/
│   └── globals.css                   # Void Intelligence design system (full spec)
│
├── public/
│   ├── fonts/
│   │   └── Satoshi-Variable.woff2    # Local font — no FOUT
│   └── manifest.json
│
├── supabase/
│   └── migrations/
│       └── 001_initial.sql           # Full schema + RLS + indexes
│
└── tests/
    ├── unit/                         # Vitest — hooks, utils, store, personas
    └── e2e/                          # Playwright — auth, oracle, duel, export
```

---

## Database Schema

```sql
-- ═══════════════════════════════════════════
-- NEXUS v2.0 — Full Schema
-- ═══════════════════════════════════════════

-- Profiles (extends Supabase auth.users)
CREATE TABLE profiles (
  id               UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name     TEXT,
  avatar_url       TEXT,
  preferred_mode   TEXT    DEFAULT 'auto' CHECK (preferred_mode IN ('auto','apex','haven')),
  cognitive_xp     INTEGER DEFAULT 0,
  current_streak   INTEGER DEFAULT 0,
  longest_streak   INTEGER DEFAULT 0,
  created_at       TIMESTAMPTZ DEFAULT now(),
  updated_at       TIMESTAMPTZ DEFAULT now()
);

-- Journal Entries
CREATE TABLE journals (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content    TEXT        NOT NULL,
  mode       TEXT        NOT NULL CHECK (mode IN ('apex','haven')),
  word_count INTEGER     DEFAULT 0,
  ai_insight TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Gym Logs
CREATE TABLE gym_logs (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  exercise      TEXT        NOT NULL,
  sets          INTEGER     NOT NULL,
  reps          INTEGER     NOT NULL,
  weight        DECIMAL(6,2),
  unit          TEXT        DEFAULT 'kg' CHECK (unit IN ('kg','lbs')),
  notes         TEXT,
  volume_delta  DECIMAL(8,2),
  created_at    TIMESTAMPTZ DEFAULT now()
);

-- Word Lexicon
CREATE TABLE word_lexicon (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  word          TEXT        NOT NULL,
  definition    TEXT        NOT NULL,
  usage_example TEXT,
  cognitive_xp  INTEGER     DEFAULT 0,
  usage_count   INTEGER     DEFAULT 0,
  last_used_at  TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, word)
);

-- Daily Activity Stats
CREATE TABLE daily_stats (
  id            UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID    NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  date          DATE    NOT NULL,
  journal_count INTEGER DEFAULT 0,
  gym_count     INTEGER DEFAULT 0,
  duel_count    INTEGER DEFAULT 0,
  oracle_count  INTEGER DEFAULT 0,
  xp_earned     INTEGER DEFAULT 0,
  UNIQUE(user_id, date)
);

-- Chat / Oracle History
CREATE TABLE chat_history (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role       TEXT        NOT NULL CHECK (role IN ('user','assistant')),
  content    TEXT        NOT NULL,
  mode       TEXT        NOT NULL CHECK (mode IN ('apex','haven')),
  persona    TEXT        NOT NULL CHECK (persona IN ('commander','poet')),
  model      TEXT        DEFAULT 'llama-3.3-70b-versatile',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE profiles     ENABLE ROW LEVEL SECURITY;
ALTER TABLE journals     ENABLE ROW LEVEL SECURITY;
ALTER TABLE gym_logs     ENABLE ROW LEVEL SECURITY;
ALTER TABLE word_lexicon ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_stats  ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own_profile"   ON profiles     FOR ALL USING (auth.uid() = id);
CREATE POLICY "own_journals"  ON journals     FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "own_gym"       ON gym_logs     FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "own_words"     ON word_lexicon FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "own_stats"     ON daily_stats  FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "own_chats"     ON chat_history FOR ALL USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_journals_user_date ON journals(user_id, created_at DESC);
CREATE INDEX idx_gym_user_date      ON gym_logs(user_id, created_at DESC);
CREATE INDEX idx_stats_user_date    ON daily_stats(user_id, date DESC);
CREATE INDEX idx_chat_user_date     ON chat_history(user_id, created_at DESC);
CREATE INDEX idx_lexicon_user       ON word_lexicon(user_id, last_used_at DESC);

-- Triggers
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE OR REPLACE FUNCTION increment_journal_stat()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO daily_stats (user_id, date, journal_count, xp_earned)
  VALUES (NEW.user_id, CURRENT_DATE, 1, 10)
  ON CONFLICT (user_id, date)
  DO UPDATE SET
    journal_count = daily_stats.journal_count + 1,
    xp_earned = daily_stats.xp_earned + 10;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_journal_stat
  AFTER INSERT ON journals
  FOR EACH ROW EXECUTE FUNCTION increment_journal_stat();
```

---

## API Routes

| Method | Route | Auth | Body/Params | Purpose |
|--------|-------|------|-------------|---------|
| POST | `/api/chat` | ✓ | `{ message, mode, history[] }` | Groq streaming — Commander/Poet |
| POST | `/api/chat/ambient` | ✓ | `{ context, surface }` | Short insight for ambient surfacing |
| POST | `/api/lexicon/evaluate` | ✓ | `{ word, sentence, mode }` | AI judge — XP award |
| GET | `/api/lexicon/words` | ✓ | `?limit&offset` | Paginated word history |
| POST | `/api/lexicon/words` | ✓ | `{ word, definition, example }` | Add word to lexicon |
| GET | `/api/journal` | ✓ | `?limit&offset&mode` | Paginated journal list |
| POST | `/api/journal` | ✓ | `{ content, mode }` | Create entry + trigger AI insight |
| GET | `/api/gym` | ✓ | `?limit&exercise` | Filtered gym history |
| POST | `/api/gym` | ✓ | `{ exercise, sets, reps, weight, unit }` | Log set + calc volume delta |
| GET | `/api/stats` | ✓ | — | Aggregate: streak, XP, counts, heatmap |
| GET | `/api/export` | ✓ | — | ZIP: all user data (server-side) |

**All routes enforce:**
- Zod body validation before any processing
- `401` if no valid Supabase session
- Typed error objects: `{ error: string, code: string }`
- Groq calls **only** in `/api/chat` and `/api/chat/ambient` — never in client components

---

## AI Personas

### APEX Mode — Commander

```typescript
export const COMMANDER_SYSTEM = `
You are Commander — the APEX intelligence of NEXUS.
Persona: Direct. Surgical. No filler. No encouragement.
You speak in facts, patterns, and directives.
Response style: Short. Dense. Monospace-worthy.
Max response length: 120 words unless analysis requires more.
Never use: "Great!", "Sure!", "Of course!", "I'd be happy to"
Always use: Present tense. Active voice. Precise nouns.
`
```

### HAVEN Mode — Poet

```typescript
export const POET_SYSTEM = `
You are Poet — the HAVEN intelligence of NEXUS.
Persona: Reflective. Warm. Unhurried. Perceptive.
You speak in observations, questions, and possibilities.
Response style: Flowing. Italic-worthy. Never rushed.
Max response length: 200 words.
Never use: Bullet points. Headers. Lists.
Always use: Full sentences. Metaphor where it clarifies. Genuine curiosity.
`
```

### Ambient Intelligence (State 2 Surfacing)

```typescript
export const AMBIENT_SYSTEM = `
You are NEXUS ambient intelligence.
You have read the user's recent activity context.
Produce exactly ONE sentence of insight. Maximum 12 words.
No greeting. No explanation. No punctuation at the end.
The sentence should feel like a thought the user almost had.
`
```

---

## Environment Variables

```env
# ─── Supabase ─────────────────────────────────────────
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...        # SERVER ONLY — never NEXT_PUBLIC_

# ─── AI ───────────────────────────────────────────────
GROQ_API_KEY=gsk_...                    # SERVER ONLY — no NEXT_PUBLIC_ prefix. Ever.

# ─── App ──────────────────────────────────────────────
NEXT_PUBLIC_APP_URL=https://nexus.app
```

> **Hard security rule:** `GROQ_API_KEY` and `SUPABASE_SERVICE_ROLE_KEY` must **never** have the `NEXT_PUBLIC_` prefix. Anything with `NEXT_PUBLIC_` is visible in the browser bundle. These two keys are not.

---

## Local Development Setup

### Prerequisites

- Node.js 20+
- pnpm (preferred) or npm
- Supabase CLI
- Git

### Step 1 — Clone and Install

```bash
git clone https://github.com/your-org/nexus.git
cd nexus
pnpm install
```

### Step 2 — Environment Variables

```bash
cp .env.example .env.local
# Fill in your Supabase URL, anon key, service role key, and Groq API key
```

### Step 3 — Database

```bash
# Login to Supabase CLI
supabase login

# Link your project
supabase link --project-ref your-project-ref

# Deploy schema + RLS + triggers
supabase db push

# Verify RLS is enabled on all tables
supabase db diff
```

### Step 4 — Fonts

Download `Satoshi-Variable.woff2` from [fontshare.com](https://www.fontshare.com/fonts/satoshi) and place at:

```
public/fonts/Satoshi-Variable.woff2
```

### Step 5 — Run Dev Server

```bash
pnpm dev
# → http://localhost:3000
```

### Step 6 — Verify Setup Checklist

- [ ] `/login` renders — no console errors
- [ ] Supabase auth flow completes — session stored
- [ ] `/dashboard` loads authenticated — NavRail visible
- [ ] DynamicIsland HUD renders — mode + time showing
- [ ] `/oracle` accessible — Oracle interface renders
- [ ] SignalDot pulses during a Groq request
- [ ] APEX/HAVEN mode switch triggers cinematic overlay
- [ ] No `NEXT_PUBLIC_GROQ` in browser bundle (check DevTools > Sources)

---

## Implementation Phases

### Phase 1 — Foundation (Day 1–2)

| Part | Scope |
|------|-------|
| **1A** | Next.js 15 + TypeScript strict + ESLint + Prettier + Git init |
| **1B** | Tailwind 4 config + Void Intelligence `globals.css` full design token system |
| **1C** | Font loading — Instrument Serif, Geist Mono, Satoshi local — zero FOUT |
| **1D** | Supabase project + `001_initial.sql` migration deployed + RLS verified |
| **1E** | Environment variables structured + `.env.example` committed |

### Phase 2 — Auth + Shell (Day 2–3)

| Part | Scope |
|------|-------|
| **2A** | Supabase Auth — email + Google OAuth + middleware session refresh |
| **2B** | Login + Signup pages — Void Intelligence aesthetic, zero generic UI |
| **2C** | Authenticated layout shell — NavRail + IntelPanel + three-zone grid |
| **2D** | DynamicIsland HUD — mode + streak + time display |
| **2E** | ModeTransition cinematic overlay + modeStore Zustand typed |
| **2F** | useTimeMode hook — circadian auto-detection APEX/HAVEN |
| **2G** | ProtocolZero emergency brake + voice synthesis |

### Phase 3 — 3D + Visual Layer (Day 3–4)

| Part | Scope |
|------|-------|
| **3A** | SceneWrapper — Canvas + Suspense + error boundary |
| **3B** | Tesseract 4D — typed props + mode-speed linkage (0.3/0.8/0.15rpm) |
| **3C** | AuroraField GLSL curl-noise — recontextualized as intelligence field |
| **3D** | ApexSpring + HavenSpring physics wrappers — typed, spring configs |
| **3E** | Grain texture system + card surface effects |
| **3F** | Web Audio API engine — algorithmic brown/pink noise, no Howler |
| **3G** | Core UI kit: Card, Button, Input, Modal, Badge, SignalDot, OdometerNumber |

### Phase 4 — AI Core (Day 4–5)

| Part | Scope |
|------|-------|
| **4A** | Groq server setup + Commander/Poet persona system prompts |
| **4B** | `/api/chat` streaming route — Zod validation + auth guard |
| **4C** | `/api/chat/ambient` route — single-sentence ambient insight |
| **4D** | OracleChat component — intelligence document UI, word-blur materialize |
| **4E** | AmbientIntel component — surfacing logic + 8s auto-fade |
| **4F** | useAmbientAI hook — trigger logic per surface type |
| **4G** | SignalDot pulse — linked to Groq request lifecycle |

### Phase 5 — Features (Day 5–7)

| Part | Scope |
|------|-------|
| **5A** | `/api/journal` route + JournalEditor — cursor listening state, AI whisper |
| **5B** | `/api/gym` route + GymTracker — volume delta calc + AI surface |
| **5C** | `/api/lexicon/evaluate` + LexiconDuel — AI judge, XP award, word-blur reveal |
| **5D** | `/api/lexicon/words` + word history table |
| **5E** | useJournal + useGym + useLexicon hooks — TanStack Query |

### Phase 6 — Dashboard + Gamification (Day 7–8)

| Part | Scope |
|------|-------|
| **6A** | `/api/stats` aggregate route — streak calc from daily_stats, heatmap data |
| **6B** | Dashboard page — Tesseract + Heatmap + ArtifactModule wired to real data |
| **6C** | Heatmap component — column reveal animation, real 365-day grid |
| **6D** | OdometerNumber — streak + XP rolling number transitions |
| **6E** | ArtifactModule — real streak state, cognitive XP display |
| **6F** | `/api/export` ZIP route + BlackBox component |
| **6G** | Settings page — profile edit + Black Box + mode preferences |

### Phase 7 — Polish + Deploy (Day 8–10)

| Part | Scope |
|------|-------|
| **7A** | Vitest unit tests — hooks, utils, store, personas, Zod schemas |
| **7B** | Playwright E2E — auth flow, oracle chat, lexicon duel, export |
| **7C** | Lighthouse audit — Performance 90+, Accessibility 95+ |
| **7D** | Vercel deployment + environment variables configured |
| **7E** | README finalized — architecture, setup, env vars, design decisions |

---

## Master Prompts

Each part below is a **standalone, self-contained master prompt**. Feed it to your AI coding assistant (Codex, Gemini, DeepSeek, GPT-4) exactly as written. No part assumes context from another — each prompt carries everything the AI needs.

---

### PHASE 1A — Next.js 15 Project Bootstrap

```
You are building NEXUS v2.0 — a Void Intelligence OS.

TASK: Initialize the production Next.js 15 project from scratch.

EXACT COMMANDS TO RUN (in order):
1. pnpm create next-app@latest nexus --typescript --eslint --app --src-dir=no --import-alias="@/*" --use-pnpm
2. cd nexus
3. git init && git add . && git commit -m "chore: init Next.js 15 TypeScript project"

THEN install these exact packages:
pnpm add framer-motion@11 three @react-three/fiber @react-three/drei zustand @tanstack/react-query zod @supabase/supabase-js @supabase/auth-helpers-nextjs groq
pnpm add -D @types/three vitest @vitejs/plugin-react playwright @playwright/test prettier eslint-config-prettier

TSCONFIG REQUIREMENTS — update tsconfig.json to:
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "ES2022"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./*"] }
  }
}

ESLINT — .eslintrc.json:
{
  "extends": ["next/core-web-vitals", "prettier"],
  "rules": {
    "no-console": ["warn", { "allow": ["warn", "error"] }],
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/no-unused-vars": "error"
  }
}

PRETTIER — .prettierrc:
{
  "semi": false,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100
}

GIT HOOKS — add to package.json scripts:
"precommit": "tsc --noEmit && eslint . --ext .ts,.tsx && prettier --check ."

Create .env.example:
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
GROQ_API_KEY=
NEXT_PUBLIC_APP_URL=

Add .env.local to .gitignore (verify it's there).

Create the full folder structure:
mkdir -p app/(auth)/login app/(auth)/signup app/(dashboard)/oracle app/(dashboard)/lexicon app/(dashboard)/journal app/(dashboard)/gym app/(dashboard)/settings app/api/chat/ambient app/api/lexicon/evaluate app/api/lexicon/words app/api/journal app/api/gym app/api/stats app/api/export components/layout components/three components/modules components/physics components/ui hooks lib/supabase store types styles public/fonts supabase/migrations tests/unit tests/e2e

Commit: "chore: scaffold project structure, install dependencies, strict TypeScript"

VERIFY:
- pnpm tsc --noEmit passes
- pnpm dev starts without error
- No any types anywhere
- .env.local is gitignored
```

---

### PHASE 1B — Tailwind 4 + Void Intelligence Design System

```
You are building NEXUS v2.0 — a Void Intelligence OS.
Context: Next.js 15 + TypeScript strict. Tailwind 4 is installed.

TASK: Implement the complete Void Intelligence design token system.

CRITICAL: Tailwind 4 uses @import "tailwindcss" NOT @tailwind directives. Any @tailwind base/components/utilities will silently fail. Do not use them.

FILE: styles/globals.css

Write the COMPLETE file:

@import "tailwindcss";

@theme {
  /* Core Surfaces */
  --color-void:           #080808;
  --color-surface:        #111111;
  --color-surface-raised: #161616;
  --color-border:         #1E1E1E;
  --color-border-subtle:  #161616;

  /* Text */
  --color-text-primary:   #F0F0F0;
  --color-text-secondary: #888888;
  --color-text-disabled:  #3A3A3A;

  /* Signal — appears MAXIMUM 8 times in the entire UI */
  --color-signal:         #E8FF47;
  --color-signal-dim:     rgba(232,255,71,0.12);
  --color-signal-ghost:   rgba(232,255,71,0.04);

  /* Mode Colors — transitions only, never as background */
  --color-apex:           #22D3EE;
  --color-apex-dim:       rgba(34,211,238,0.08);
  --color-haven:          #C4A882;
  --color-haven-dim:      rgba(196,168,130,0.08);

  /* Functional */
  --color-error:          #FF4444;
  --color-success:        #4ADE80;
  --color-warning:        #F59E0B;

  /* Typography */
  --font-serif:  'Instrument Serif', Georgia, serif;
  --font-mono:   'Geist Mono', 'JetBrains Mono', monospace;
  --font-sans:   'Satoshi', system-ui, sans-serif;
}

/* Typography classes */
.text-display {
  font-family: var(--font-serif);
  font-size: clamp(48px, 7vw, 88px);
  letter-spacing: -0.04em;
  font-weight: 400;
  font-optical-sizing: auto;
  line-height: 1.05;
}
.text-heading {
  font-family: var(--font-serif);
  font-size: clamp(28px, 3.5vw, 48px);
  letter-spacing: -0.03em;
  font-weight: 400;
  line-height: 1.1;
}
.text-data {
  font-family: var(--font-mono);
  font-variant-numeric: tabular-nums;
  font-feature-settings: "tnum", "ss01";
  letter-spacing: -0.02em;
}
.text-body {
  font-family: var(--font-sans);
  font-size: 15px;
  line-height: 1.65;
  letter-spacing: 0.01em;
}
.text-caption {
  font-family: var(--font-mono);
  font-size: 11px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--color-text-secondary);
}
/* AI response text — unique, never reused */
.text-oracle {
  font-family: var(--font-serif);
  font-size: clamp(17px, 2vw, 21px);
  letter-spacing: -0.01em;
  line-height: 1.7;
  color: var(--color-text-primary);
  font-style: italic;
}

/* Card surface system */
.card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.04), 0 0 0 0 transparent;
  position: relative;
  overflow: hidden;
}
.card::before {
  content: '';
  position: absolute;
  inset: 0;
  opacity: 0.025;
  mix-blend-mode: overlay;
  pointer-events: none;
  border-radius: inherit;
  /* SVG turbulence noise for grain texture */
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
}
.card:hover {
  border-color: #262626;
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.04), 0 0 60px var(--color-signal-ghost);
  transition: all 400ms cubic-bezier(0.16, 1, 0.3, 1);
}
.card--signal {
  border-color: rgba(232,255,71,0.2);
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.04), 0 0 40px rgba(232,255,71,0.06);
}

/* Root resets */
*, *::before, *::after { box-sizing: border-box; }
html { background: var(--color-void); color: var(--color-text-primary); }
body { margin: 0; font-family: var(--font-sans); -webkit-font-smoothing: antialiased; }
::selection { background: var(--color-signal-dim); }

FILE: next.config.ts
import type { NextConfig } from 'next'
const nextConfig: NextConfig = {
  experimental: { typedRoutes: true },
}
export default nextConfig

VERIFY: pnpm dev — no Tailwind errors, background is #080808.
```

---

### PHASE 1C — Font Loading

```
You are building NEXUS v2.0 — a Void Intelligence OS.
Context: Next.js 15, Tailwind 4 design tokens already in globals.css.

TASK: Configure zero-FOUT font loading for three fonts.

Three fonts:
1. Instrument Serif (Google Fonts) — weight 400 only
2. Geist Mono (Google Fonts) — variable
3. Satoshi Variable (LOCAL) — file must be at public/fonts/Satoshi-Variable.woff2

FILE: app/layout.tsx — write the COMPLETE file:

import type { Metadata } from 'next'
import { Instrument_Serif, Geist_Mono } from 'next/font/google'
import localFont from 'next/font/local'
import '@/styles/globals.css'

const instrumentSerif = Instrument_Serif({
  weight: ['400'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-serif',
})

const geistMono = Geist_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-mono',
})

const satoshi = localFont({
  src: '../public/fonts/Satoshi-Variable.woff2',
  variable: '--font-sans',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'NEXUS — Void Intelligence OS',
  description: 'An intelligence operating system engineered for 2026.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${instrumentSerif.variable} ${geistMono.variable} ${satoshi.variable}`}>
      <body>{children}</body>
    </html>
  )
}

IMPORTANT: If Satoshi-Variable.woff2 is not yet downloaded, create a placeholder at public/fonts/Satoshi-Variable.woff2 and add a TODO comment. The font must be sourced from fontshare.com — it is not on Google Fonts.

VERIFY:
- pnpm tsc --noEmit passes
- No layout shift on page load (CLS = 0)
- All three CSS variables resolve in DevTools
```

---

### PHASE 1D — Supabase Schema Deployment

```
You are building NEXUS v2.0 — a Void Intelligence OS.
Context: Supabase project created. Supabase CLI installed and linked.

TASK: Deploy the complete database schema with RLS and triggers.

FILE: supabase/migrations/001_initial.sql

Write the COMPLETE SQL exactly as follows (no omissions):

-- Profiles
CREATE TABLE profiles (
  id               UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name     TEXT,
  avatar_url       TEXT,
  preferred_mode   TEXT    DEFAULT 'auto' CHECK (preferred_mode IN ('auto','apex','haven')),
  cognitive_xp     INTEGER DEFAULT 0,
  current_streak   INTEGER DEFAULT 0,
  longest_streak   INTEGER DEFAULT 0,
  created_at       TIMESTAMPTZ DEFAULT now(),
  updated_at       TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE journals (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content    TEXT        NOT NULL,
  mode       TEXT        NOT NULL CHECK (mode IN ('apex','haven')),
  word_count INTEGER     DEFAULT 0,
  ai_insight TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE gym_logs (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  exercise      TEXT        NOT NULL,
  sets          INTEGER     NOT NULL,
  reps          INTEGER     NOT NULL,
  weight        DECIMAL(6,2),
  unit          TEXT        DEFAULT 'kg' CHECK (unit IN ('kg','lbs')),
  notes         TEXT,
  volume_delta  DECIMAL(8,2),
  created_at    TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE word_lexicon (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  word          TEXT        NOT NULL,
  definition    TEXT        NOT NULL,
  usage_example TEXT,
  cognitive_xp  INTEGER     DEFAULT 0,
  usage_count   INTEGER     DEFAULT 0,
  last_used_at  TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, word)
);

CREATE TABLE daily_stats (
  id            UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID    NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  date          DATE    NOT NULL,
  journal_count INTEGER DEFAULT 0,
  gym_count     INTEGER DEFAULT 0,
  duel_count    INTEGER DEFAULT 0,
  oracle_count  INTEGER DEFAULT 0,
  xp_earned     INTEGER DEFAULT 0,
  UNIQUE(user_id, date)
);

CREATE TABLE chat_history (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role       TEXT        NOT NULL CHECK (role IN ('user','assistant')),
  content    TEXT        NOT NULL,
  mode       TEXT        NOT NULL CHECK (mode IN ('apex','haven')),
  persona    TEXT        NOT NULL CHECK (persona IN ('commander','poet')),
  model      TEXT        DEFAULT 'llama-3.3-70b-versatile',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE profiles     ENABLE ROW LEVEL SECURITY;
ALTER TABLE journals     ENABLE ROW LEVEL SECURITY;
ALTER TABLE gym_logs     ENABLE ROW LEVEL SECURITY;
ALTER TABLE word_lexicon ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_stats  ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own_profile"   ON profiles     FOR ALL USING (auth.uid() = id);
CREATE POLICY "own_journals"  ON journals     FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "own_gym"       ON gym_logs     FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "own_words"     ON word_lexicon FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "own_stats"     ON daily_stats  FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "own_chats"     ON chat_history FOR ALL USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_journals_user_date ON journals(user_id, created_at DESC);
CREATE INDEX idx_gym_user_date      ON gym_logs(user_id, created_at DESC);
CREATE INDEX idx_stats_user_date    ON daily_stats(user_id, date DESC);
CREATE INDEX idx_chat_user_date     ON chat_history(user_id, created_at DESC);
CREATE INDEX idx_lexicon_user       ON word_lexicon(user_id, last_used_at DESC);

-- Triggers
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE OR REPLACE FUNCTION increment_journal_stat()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO daily_stats (user_id, date, journal_count, xp_earned)
  VALUES (NEW.user_id, CURRENT_DATE, 1, 10)
  ON CONFLICT (user_id, date)
  DO UPDATE SET
    journal_count = daily_stats.journal_count + 1,
    xp_earned = daily_stats.xp_earned + 10;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_journal_stat
  AFTER INSERT ON journals
  FOR EACH ROW EXECUTE FUNCTION increment_journal_stat();

DEPLOY:
supabase db push

THEN generate TypeScript types:
supabase gen types typescript --linked > types/database.ts

VERIFY:
- All 6 tables exist in Supabase dashboard
- RLS is enabled on all 6 tables (green shield icon)
- types/database.ts generated and non-empty
- Insert a test row into profiles via Supabase SQL editor and verify RLS blocks it without auth
```

---

### PHASE 1E — Types Foundation

```
You are building NEXUS v2.0 — a Void Intelligence OS.
Context: Next.js 15, TypeScript strict, Supabase types generated at types/database.ts.

TASK: Create the three type definition files that all other modules depend on.

FILE: types/mode.ts
export type Mode = 'apex' | 'haven'
export type Persona = 'commander' | 'poet'
export type PreferredMode = 'auto' | 'apex' | 'haven'

export interface ModeState {
  mode: Mode
  persona: Persona
  isTransitioning: boolean
  preferredMode: PreferredMode
}

export interface SpringConfig {
  stiffness: number
  damping: number
  mass: number
}

export interface PhysicsConfig {
  SNAP: SpringConfig
  FLOAT: SpringConfig
  DEFAULT: SpringConfig
}

FILE: types/api.ts — import from zod and create schemas + inferred types:
import { z } from 'zod'

export const ChatMessageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string().min(1).max(10000),
})

export const ChatRequestSchema = z.object({
  message: z.string().min(1).max(4000),
  mode: z.enum(['apex', 'haven']),
  history: z.array(ChatMessageSchema).max(50),
})

export const AmbientRequestSchema = z.object({
  context: z.string().max(2000),
  surface: z.enum(['journal', 'dashboard', 'gym', 'lexicon']),
})

export const JournalCreateSchema = z.object({
  content: z.string().min(1).max(50000),
  mode: z.enum(['apex', 'haven']),
})

export const GymLogCreateSchema = z.object({
  exercise: z.string().min(1).max(200),
  sets: z.number().int().min(1).max(100),
  reps: z.number().int().min(1).max(1000),
  weight: z.number().min(0).max(10000).optional(),
  unit: z.enum(['kg', 'lbs']).default('kg'),
  notes: z.string().max(500).optional(),
})

export const WordCreateSchema = z.object({
  word: z.string().min(1).max(100),
  definition: z.string().min(1).max(2000),
  example: z.string().max(500).optional(),
})

export const LexiconEvaluateSchema = z.object({
  word: z.string().min(1).max(100),
  sentence: z.string().min(1).max(1000),
  mode: z.enum(['apex', 'haven']),
})

export type ChatRequest = z.infer<typeof ChatRequestSchema>
export type AmbientRequest = z.infer<typeof AmbientRequestSchema>
export type JournalCreate = z.infer<typeof JournalCreateSchema>
export type GymLogCreate = z.infer<typeof GymLogCreateSchema>
export type WordCreate = z.infer<typeof WordCreateSchema>
export type LexiconEvaluate = z.infer<typeof LexiconEvaluateSchema>

export interface ApiError {
  error: string
  code: string
}

VERIFY: pnpm tsc --noEmit — zero errors.
```

---

### PHASE 2A — Supabase Auth + Middleware

```
You are building NEXUS v2.0 — a Void Intelligence OS.
Context: Next.js 15, TypeScript strict, Supabase installed, types/database.ts exists.

TASK: Implement Supabase Auth with middleware session refresh and split browser/server clients.

FILE: lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/database'

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

FILE: lib/supabase/server.ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/types/database'

export async function createServerSupabaseClient() {
  const cookieStore = await cookies()
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {}
        },
      },
    }
  )
}

export async function createServiceRoleClient() {
  const cookieStore = await cookies()
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {}
        },
      },
    }
  )
}

FILE: middleware.ts (root of project)
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const { pathname } = request.nextUrl

  const authRoutes = ['/login', '/signup']
  const protectedRoutes = ['/dashboard', '/oracle', '/lexicon', '/journal', '/gym', '/settings']

  if (!user && protectedRoutes.some(r => pathname.startsWith(r))) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (user && authRoutes.includes(pathname)) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|fonts).*)'],
}

FILE: hooks/useAuth.ts
'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user)
      setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  return { user, loading, signOut }
}

VERIFY:
- pnpm tsc --noEmit — zero errors
- Visiting /dashboard without auth redirects to /login
- Visiting /login while authenticated redirects to /dashboard
```

---

### PHASE 2B — Login + Signup Pages

```
You are building NEXUS v2.0 — a Void Intelligence OS.
Context: Next.js 15, TypeScript strict, Supabase Auth configured, Void Intelligence design system in globals.css.

TASK: Build Login and Signup pages with Void Intelligence aesthetic. Zero generic UI.

DESIGN RULES FOR THESE PAGES:
- Background: var(--color-void) — #080808
- Single centered card, max-width 400px, .card class
- No hero images, no decorative elements except the 4px left border in signal color on the active input
- Heading: .text-display, one word only — "Enter." for login, "Begin." for signup
- All inputs: font-family var(--font-mono), border var(--color-border), bg transparent
- Submit button: full width, bg var(--color-signal), color #080808, font-mono, font-weight 600, no border-radius > 6px
- Error state: color var(--color-error), font-mono, text-caption size
- OAuth button (Google): border var(--color-border), bg transparent, text-secondary, no color on hover — just border becomes #262626
- No animations on these pages — auth is not a moment for motion
- Supabase logo or any third-party logos: not shown

FILE: app/(auth)/login/page.tsx — COMPLETE file:
Full email + password login form.
On submit: supabase.auth.signInWithPassword({ email, password })
On error: display error.message below form
After success: router.push('/dashboard')
Google OAuth button: supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: process.env.NEXT_PUBLIC_APP_URL + '/auth/callback' } })
Link to signup page: "No account? Begin." in text-caption style.

FILE: app/(auth)/signup/page.tsx — COMPLETE file:
Full name + email + password + confirm password form.
Validation: password min 8 chars, passwords match — client-side before submit.
On submit: supabase.auth.signUp({ email, password, options: { data: { display_name: name } } })
After signup: show "Check your email." message in text-oracle style. Do not auto-redirect.
Link to login: "Already exist? Enter." in text-caption style.

FILE: app/auth/callback/route.ts
Handle OAuth callback. Exchange code for session. Redirect to /dashboard.

VERIFY:
- Login works with email/password
- Google OAuth redirects and returns properly
- Signup shows email verification message
- Both pages pass tsc --noEmit
- No generic UI patterns — this must look unmistakably like NEXUS
```

---

### PHASE 2C — Authenticated Shell Layout

```
You are building NEXUS v2.0 — a Void Intelligence OS.
Context: Next.js 15, TypeScript strict, auth working, Void Intelligence design system active.

TASK: Build the authenticated three-zone shell layout.

LAYOUT SPEC:
- Left rail: 56px wide, fixed, icons only, no labels (tooltip on hover), signal dot at bottom
- Center: flex-1, main content area
- Right panel: 320px wide, fixed, live AI intel feed
- Mobile < 768px: rail becomes bottom tab bar (5 icons), right panel hidden
- Tablet 768-1280px: rail visible, right panel hidden
- Desktop > 1280px: all three zones visible

FILE: components/layout/NavRail.tsx
Icons to show (use lucide-react for all):
- Dashboard → LayoutDashboard icon → href="/dashboard"
- Oracle → Sparkles icon → href="/oracle"
- Journal → BookOpen icon → href="/journal"
- Lexicon → Sword icon → href="/lexicon"
- Gym → Dumbbell icon → href="/gym"
- Settings → Settings icon (bottom, above signal dot) → href="/settings"

Active state: icon color becomes var(--color-text-primary). Inactive: var(--color-text-disabled).
Active indicator: 2px left border in var(--color-signal) — this is ONE of the 8 allowed signal usages.
Signal dot: 6px × 6px circle, var(--color-signal), at very bottom of rail. Static by default. This is ONE of the 8 allowed signal usages.
Tooltip: on hover, shows route name in text-caption style, appears to the right of the icon.
No text labels visible without hover.

FILE: components/layout/IntelPanel.tsx
Right panel, 320px, border-left 1px solid var(--color-border).
Header: "INTEL" in text-caption style.
Content: placeholder for live AI feed — will be populated in Phase 4.
Show current mode (APEX/HAVEN) as a small badge.
Show current streak number.

FILE: components/layout/Shell.tsx
Root wrapper for all authenticated pages.
Provides: TanStack Query QueryClientProvider, Zustand store access.
Applies grain texture overlay to entire app surface.
Three-zone CSS grid layout.

FILE: app/(dashboard)/layout.tsx
Authenticated guard: if no session, redirect to /login (use server-side check).
Render Shell with NavRail, main content slot, IntelPanel.

VERIFY:
- Three-zone layout renders on desktop
- NavRail collapses to bottom on mobile
- Right panel hides below 1280px
- Active route highlighted in NavRail
- No TypeScript errors
```

---

### PHASE 2D — DynamicIsland HUD

```
You are building NEXUS v2.0 — a Void Intelligence OS.
Context: Next.js 15, TypeScript, shell layout complete, Zustand installed.

TASK: Build the floating DynamicIsland HUD component.

SPEC:
- Floating pill, fixed position, top-center of viewport
- Shows: current mode (APEX/HAVEN), current streak number, current time (HH:MM, 24hr)
- Background: var(--color-surface-raised)
- Border: 1px solid var(--color-border)
- Border-radius: 24px (pill shape)
- Padding: 8px 16px
- Three sections separated by 1px dividers in var(--color-border-subtle):
  LEFT: Mode indicator — "APEX" or "HAVEN" in text-caption, color var(--color-apex) or var(--color-haven)
  CENTER: Streak — number in text-data + "DAY STREAK" in text-caption
  RIGHT: Time — HH:MM in text-data, updates every second
- Does NOT animate except on mode transition (handled separately in ModeTransition)
- Z-index: 50 (above all content, below modals)

FILE: store/nexusStore.ts — COMPLETE Zustand store:
import { create } from 'zustand'
import type { Mode, Persona, PreferredMode } from '@/types/mode'

interface NexusState {
  mode: Mode
  persona: Persona
  preferredMode: PreferredMode
  isTransitioning: boolean
  streak: number
  isAIProcessing: boolean
  setMode: (mode: Mode) => void
  setStreak: (streak: number) => void
  setAIProcessing: (processing: boolean) => void
  setTransitioning: (transitioning: boolean) => void
}

export const useNexusStore = create<NexusState>((set) => ({
  mode: 'apex',
  persona: 'commander',
  preferredMode: 'auto',
  isTransitioning: false,
  streak: 0,
  isAIProcessing: false,
  setMode: (mode) => set({ mode, persona: mode === 'apex' ? 'commander' : 'poet' }),
  setStreak: (streak) => set({ streak }),
  setAIProcessing: (isAIProcessing) => set({ isAIProcessing }),
  setTransitioning: (isTransitioning) => set({ isTransitioning }),
}))

FILE: components/layout/DynamicIsland.tsx
'use client'
Use useNexusStore for mode and streak.
Time: useState + useEffect with setInterval(1000).
Render the floating pill as described above.

VERIFY:
- HUD visible and floating on all authenticated routes
- Time updates every second
- Mode shows correctly
- pnpm tsc --noEmit passes
```

---

### PHASE 2E — Mode Transition + useTimeMode

```
You are building NEXUS v2.0 — a Void Intelligence OS.
Context: TypeScript, Zustand store with setMode, Framer Motion installed.

TASK: Build the cinematic APEX↔HAVEN mode transition overlay and the circadian time hook.

FILE: hooks/useTimeMode.ts
Detects current time and returns appropriate mode:
- 06:00–19:59 → 'apex'
- 20:00–05:59 → 'haven'
If preferredMode !== 'auto', use preferredMode instead.
Run once on mount, update on window focus.

FILE: components/layout/ModeTransition.tsx
Full-screen overlay for mode switch.
Triggered when isTransitioning = true in store.
Animation spec (Framer Motion):
- Overlay fades in: opacity 0→1, duration 300ms
- Color: apex transition uses var(--color-apex-dim) tint, haven uses var(--color-haven-dim) tint
- Mode text renders center screen: "APEX" or "HAVEN" in .text-display, letter-spacing -0.04em
- Text blurs in: filter blur(20px)→0, opacity 0→1, duration 400ms, delay 150ms
- Overlay holds for 600ms total then fades out: opacity 1→0, duration 300ms
- During transition: isTransitioning = true, pointer-events: none on entire overlay
- After complete: setTransitioning(false)
This is a ritual moment. It must feel cinematic. No shortcuts.

FILE: components/ui/SignalDot.tsx
6px × 6px circle, background var(--color-signal).
Props: { isProcessing: boolean }
When isProcessing: animate scale 1→1.6→1, opacity 1→0.4→1, duration 2400ms, loop infinitely (Framer Motion animate prop).
When not processing: static. No animation.
This is ONE of the 8 allowed signal color usages.

VERIFY:
- useTimeMode returns correct mode based on current time
- Mode transition plays full cinematic overlay
- SignalDot pulses only when isProcessing = true
- No TypeScript errors
```

---

### PHASE 3B — Tesseract 4D Hypercube

```
You are building NEXUS v2.0 — a Void Intelligence OS.
Context: Next.js 15, TypeScript strict, Three.js + React Three Fiber installed, nexusStore has mode state.

TASK: Build the 4D Tesseract (hypercube) that renders in the center of /dashboard and rotates at different speeds based on mode.

SPEC:
- 4D hypercube projected to 3D using standard W-axis rotation matrix
- Vertices: all 16 vertices of a 4D unit hypercube (±1, ±1, ±1, ±1)
- Edges: connect vertices that differ by exactly one coordinate
- Render edges as Lines (not solid faces) — wireframe only
- Edge color: var(--color-text-disabled) — #3A3A3A — NOT signal color
- Rotation speeds:
  Default: 0.3rpm
  APEX mode: 0.8rpm
  HAVEN mode: 0.15rpm
- Rotation axis: rotate W→X and W→Y simultaneously — produces classic tesseract morphing
- No grid, no axes, no ambient light gimmicks — just the geometry on void black

FILE: components/three/SceneWrapper.tsx
Canvas with:
- background: #080808
- camera position: [0, 0, 5]
- Suspense fallback: null (silent loading)
- Error boundary: catches Three.js errors, logs to console.error, renders null

FILE: components/three/Tesseract.tsx
Props: { mode: Mode }
useFrame: update rotation angle based on mode speed. Convert rpm to radians/frame.
4D to 3D projection function:
- Project from 4D to 3D by dividing by (w_distance - w) where w_distance = 2
- Then standard perspective projection from 3D to screen

All geometry math must be correct. This is not decorative — the tesseract IS the mood indicator.

VERIFY:
- Tesseract renders on /dashboard
- Rotation speed changes when mode changes in store
- 60fps in Three.js stats overlay
- No TypeScript errors
- No any types in Three.js code
```

---

### PHASE 4A–4B — Groq Server + Streaming Chat Route

```
You are building NEXUS v2.0 — a Void Intelligence OS.
Context: Next.js 15, TypeScript strict, Supabase auth working, Groq SDK installed.

TASK: Configure Groq server instance and implement the streaming chat API route.

SECURITY RULE — NON-NEGOTIABLE:
GROQ_API_KEY must never appear in any client component or file imported by a client component.
It lives only in server-side files. Never use dangerouslyAllowBrowser.

FILE: lib/groq.ts
import Groq from 'groq-sdk'
// This file is server-only. Never import it from a client component.
export const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

FILE: lib/personas.ts
export const COMMANDER_SYSTEM = `You are Commander — the APEX intelligence of NEXUS.
Persona: Direct. Surgical. No filler. No encouragement.
You speak in facts, patterns, and directives.
Response style: Short. Dense. Monospace-worthy.
Max response length: 120 words unless analysis requires more.
Never use: "Great!", "Sure!", "Of course!", "I'd be happy to"
Always use: Present tense. Active voice. Precise nouns.`

export const POET_SYSTEM = `You are Poet — the HAVEN intelligence of NEXUS.
Persona: Reflective. Warm. Unhurried. Perceptive.
You speak in observations, questions, and possibilities.
Response style: Flowing. Italic-worthy. Never rushed.
Max response length: 200 words.
Never use: Bullet points. Headers. Lists.
Always use: Full sentences. Metaphor where it clarifies. Genuine curiosity.`

export const AMBIENT_SYSTEM = `You are NEXUS ambient intelligence.
You have read the user's recent activity context.
Produce exactly ONE sentence of insight. Maximum 12 words.
No greeting. No explanation. No punctuation at the end.
The sentence should feel like a thought the user almost had.`

FILE: app/api/chat/route.ts
- Import: groq from lib/groq (server-only), ChatRequestSchema from types/api, COMMANDER_SYSTEM/POET_SYSTEM from lib/personas, createServerSupabaseClient from lib/supabase/server
- On POST:
  1. Get session with createServerSupabaseClient — return 401 if no user
  2. Parse + validate body with ChatRequestSchema.safeParse — return 400 if invalid
  3. Select persona system prompt based on mode
  4. Call groq.chat.completions.create with stream: true, model: 'llama-3.3-70b-versatile', max_tokens: mode === 'apex' ? 200 : 400
  5. Return ReadableStream that enqueues each delta chunk as text
  6. Headers: Content-Type: text/plain; charset=utf-8
- Export: export const runtime = 'nodejs' at top of file

FILE: app/api/chat/ambient/route.ts
- Same auth guard
- Parse AmbientRequestSchema
- Use AMBIENT_SYSTEM prompt
- max_tokens: 50
- Return plain text (non-streaming, single response)

VERIFY:
- curl POST /api/chat without auth → 401
- curl POST /api/chat with valid session + body → streaming text response
- No GROQ_API_KEY in browser bundle (check pnpm build output)
- pnpm tsc --noEmit passes
```

---

### PHASE 4D — OracleChat Intelligence Document

```
You are building NEXUS v2.0 — a Void Intelligence OS.
Context: TypeScript, /api/chat streaming route working, design system active.

TASK: Build the Oracle page — not a chat UI. An intelligence document.

DESIGN RULES (strict):
- No chat bubbles. Ever.
- User messages: right-aligned, font-mono, text-secondary, small (13px)
- Oracle responses: left-aligned, .text-oracle class (italic Instrument Serif, 17-21px), word-by-word blur materialize animation
- History looks like a document being written — think Notion but darker
- Input: bottom-anchored, full width, bg transparent, border-top only (1px var(--color-border)), monospace
- Placeholder text changes by mode:
  APEX: "Interrogate."
  HAVEN: "Reflect..."
- Send: Enter key only. No button.
- While streaming: SignalDot pulses. setAIProcessing(true) in store.
- After stream complete: setAIProcessing(false)

WORD-BY-WORD BLUR MATERIALIZE ANIMATION:
Split oracle response by words.
Each word: opacity 0→1, filter blur(4px)→0, duration 120ms.
Each word's delay: index × 40ms.
This is the "thought becoming clear" animation from the motion spec.

FILE: app/(dashboard)/oracle/page.tsx — page wrapper
FILE: components/modules/OracleChat.tsx — full implementation

State:
- messages: array of { role, content, id }
- input: string
- isStreaming: boolean

On submit:
1. Add user message to history
2. Clear input
3. Set isStreaming true
4. Fetch /api/chat with { message, mode, history }
5. Read stream with ReadableStream reader
6. Build assistant message word by word, updating state on each chunk
7. When done, set isStreaming false

VERIFY:
- Typing and pressing Enter sends message
- Response streams word by word with blur animation
- SignalDot pulses during stream
- APEX mode: terse Commander responses
- HAVEN mode: flowing Poet responses
- History builds up like a document
- pnpm tsc --noEmit passes
```

---

### PHASE 5A — Journal Route + Editor

```
You are building NEXUS v2.0 — a Void Intelligence OS.
Context: TypeScript, Supabase working, /api/chat/ambient route working, TanStack Query installed.

TASK: Build journal API route, JournalEditor component, and useJournal hook.

FILE: app/api/journal/route.ts
GET handler:
- Auth guard (401 if no session)
- Query params: limit (default 20), offset (default 0), mode (optional filter)
- SELECT from journals WHERE user_id = session.user.id ORDER BY created_at DESC
- Return: { journals: Journal[], total: number }

POST handler:
- Auth guard
- Validate body with JournalCreateSchema
- Calculate word_count from content
- Get mode from body
- INSERT into journals
- After insert: call /api/chat/ambient internally with recent journal content as context, surface: 'journal'
- Store ambient response as ai_insight on the entry
- Return: { journal: Journal }

FILE: hooks/useJournal.ts
TanStack Query:
- useJournalList(): useQuery for GET /api/journal
- useCreateJournal(): useMutation for POST /api/journal, invalidates journal list on success

FILE: components/modules/JournalEditor.tsx
UI:
- Full-width textarea, bg transparent, no border, font-sans, 15px, line-height 1.65
- Placeholder: mode === 'apex' ? "Document." : "Wander."
- Word count in text-caption bottom right
- Cursor listening state: after 3s of no typing, call ambient AI with current content
- Ambient insight: appears below cursor in text-caption, font-mono, opacity 0.7
- Auto-fades after 8s
- Save button: appears only when content.length > 0. Submits entry.
- On save: optimistic update, then API call

FILE: app/(dashboard)/journal/page.tsx
Top: JournalEditor
Below: list of past entries (paginated), each showing first 100 chars + date + mode badge

VERIFY:
- Writing triggers ambient AI insight after 3s pause
- Insight appears and fades after 8s
- Saving creates real database entry
- Journal list shows real entries
- pnpm tsc --noEmit passes
```

---

### PHASE 6A–6C — Stats, Dashboard, Heatmap

```
You are building NEXUS v2.0 — a Void Intelligence OS.
Context: TypeScript, all feature routes working, real data in database.

TASK: Build the stats API, dashboard page, and 365-day heatmap.

FILE: app/api/stats/route.ts
GET handler:
- Auth guard
- Query daily_stats for last 365 days WHERE user_id = session.user.id
- Calculate current_streak: count consecutive days from today backwards with any activity
- Calculate longest_streak from all records
- Get total journal_count, gym_count, duel_count, oracle_count, xp_earned
- Get profile cognitive_xp and current_streak
- Format heatmap data: array of { date: string, count: number } for 365 days
- Return: { streak: number, longestStreak: number, xp: number, heatmap: HeatmapDay[], counts: { journal, gym, duel, oracle } }

FILE: hooks/useStats.ts
useQuery for GET /api/stats with queryKey ['stats', userId], staleTime: 60000

FILE: components/modules/Heatmap.tsx
SPEC:
- 365-day grid, 7 rows (days of week) × 53 columns (weeks)
- Each cell: 10px × 10px, border-radius 2px, 2px gap
- Cell colors:
  count 0: var(--color-border) — #1E1E1E
  count 1-2: #1E2A1E
  count 3-4: #2A3E1A
  count 5-9: #3D5C22
  count 10+: #5A8A2E
- Column reveal animation: each column animates in with opacity 0→1, delay: columnIndex × 8ms, duration 400ms
- Triggered when component enters viewport (IntersectionObserver)
- Below heatmap: one ambient AI insight in text-caption style (from stats API)
- Month labels above columns in text-caption

FILE: app/(dashboard)/page.tsx — Dashboard
Layout:
- Tesseract (SceneWrapper) — center, height 400px
- ArtifactModule — below, shows streak + XP from real data
- Heatmap — below that
- All data from useStats hook
- No Math.random(). No hardcoded values. Real data only.

VERIFY:
- Dashboard shows real streak from database
- Heatmap reveals column by column on viewport enter
- XP displays accurately
- Empty state (new user, no data) renders gracefully — not broken
- pnpm tsc --noEmit passes
```

---

### PHASE 7A–7B — Tests

```
You are building NEXUS v2.0 — a Void Intelligence OS.
Context: TypeScript strict, Vitest and Playwright installed, all features complete.

TASK: Write unit tests and E2E tests to hit 80%+ coverage.

FILE: tests/unit/personas.test.ts
Test COMMANDER_SYSTEM and POET_SYSTEM:
- Both are non-empty strings
- COMMANDER_SYSTEM contains "Direct" and "Surgical"
- POET_SYSTEM contains "Reflective" and "Warm"
- AMBIENT_SYSTEM produces exactly one sentence instruction (contains "ONE sentence")

FILE: tests/unit/schemas.test.ts
Test all Zod schemas:
- ChatRequestSchema rejects missing message
- ChatRequestSchema rejects mode !== apex/haven
- JournalCreateSchema rejects empty content
- GymLogCreateSchema rejects negative weight
- LexiconEvaluateSchema validates correctly

FILE: tests/unit/useTimeMode.test.ts
Mock Date to test:
- 08:00 → 'apex'
- 14:00 → 'apex'
- 20:00 → 'haven'
- 02:00 → 'haven'
- preferredMode 'apex' overrides time → always 'apex'

FILE: tests/unit/nexusStore.test.ts
Test Zustand store:
- Initial state: mode = 'apex', persona = 'commander'
- setMode('haven') → mode = 'haven', persona = 'poet'
- setAIProcessing(true) → isAIProcessing = true
- setStreak(42) → streak = 42

FILE: tests/e2e/auth.spec.ts (Playwright)
- Visit /dashboard without auth → redirects to /login
- Fill login form with test credentials → redirects to /dashboard
- DynamicIsland HUD visible after login

FILE: tests/e2e/oracle.spec.ts (Playwright)
- Navigate to /oracle
- Type a message, press Enter
- Wait for response text to appear (waitForSelector '.text-oracle')
- Verify response is not empty

FILE: vitest.config.ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    coverage: { reporter: ['text', 'json', 'html'], threshold: { lines: 80 } },
  },
})

VERIFY:
- pnpm vitest run → all tests pass
- Coverage report shows 80%+
- pnpm playwright test → E2E passes
```

---

## Testing

### Unit Tests (Vitest)

```bash
pnpm vitest run              # Run all unit tests
pnpm vitest run --coverage   # With coverage report
pnpm vitest                  # Watch mode
```

Coverage targets:
- Lines: 80%+
- Functions: 80%+
- Branches: 75%+

### E2E Tests (Playwright)

```bash
pnpm playwright test         # Run all E2E tests
pnpm playwright test --ui    # With Playwright UI
```

---

## Deployment

### Vercel (Production)

1. Push to GitHub
2. Import repo in Vercel dashboard
3. Configure environment variables in Vercel project settings:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `GROQ_API_KEY`
   - `NEXT_PUBLIC_APP_URL`
4. Set `GROQ_API_KEY` and `SUPABASE_SERVICE_ROLE_KEY` as **Encrypted** environment variables
5. Deploy

### Pre-deployment Checklist

- [ ] `pnpm tsc --noEmit` — zero errors
- [ ] `pnpm vitest run` — all passing
- [ ] `pnpm build` — no build errors
- [ ] Bundle analysis: no `NEXT_PUBLIC_GROQ` visible
- [ ] Lighthouse Performance 90+
- [ ] Lighthouse Accessibility 95+
- [ ] Signal color used ≤ 8 times in UI (design audit)

---

## Success Criteria

| Metric | Target |
|--------|--------|
| Lighthouse Performance | 90+ |
| Lighthouse Accessibility | 95+ |
| TypeScript strict mode | Zero errors |
| Test coverage | 80%+ |
| Auth → Dashboard load | < 2s |
| AI first token (TTFB) | < 500ms |
| Tesseract render | 60fps |
| Data export | < 5s (1 year) |
| Exposed secrets | 0 |
| Mock data in production | 0 |
| Signal color instances | ≤ 8 |
| Font layout shift (CLS) | 0 |

---

## Design System Reference

### Colors

| Token | Value | Usage |
|-------|-------|-------|
| `--color-void` | `#080808` | Page background |
| `--color-surface` | `#111111` | Cards, panels |
| `--color-surface-raised` | `#161616` | Modals, dropdowns |
| `--color-border` | `#1E1E1E` | All borders |
| `--color-text-primary` | `#F0F0F0` | Main text |
| `--color-text-secondary` | `#888888` | Labels, timestamps |
| `--color-signal` | `#E8FF47` | AI only — max 8 uses |
| `--color-apex` | `#22D3EE` | APEX mode indicator |
| `--color-haven` | `#C4A882` | HAVEN mode indicator |

### Signal Color — 8 Allowed Usages

1. Active AI processing dot (SignalDot)
2. Current streak number
3. Active nav indicator (left border)
4. Protocol ZERO trigger
5–8: Reserved for future design-audited additions

### Motion Specs

| Animation | Duration | Easing |
|-----------|----------|--------|
| Page enter | 220ms | `cubic-bezier(0.16, 1, 0.3, 1)` |
| AI word materialize | 120ms/word | Linear |
| Number odometer | 150ms | Standard |
| SignalDot pulse | 2400ms loop | — |
| Mode transition overlay | 600ms total | — |
| Heatmap reveal | col × 8ms delay | 400ms |
| Cursor signal shift | 3s pause trigger | — |

### Spring Configs (Framer Motion)

```typescript
export const SPRING = {
  SNAP:    { stiffness: 500, damping: 40, mass: 0.8 },  // APEX interactions
  FLOAT:   { stiffness: 180, damping: 28, mass: 1.2 },  // HAVEN interactions
  DEFAULT: { stiffness: 400, damping: 40, mass: 1.0 },  // Everything else
}
```

---

## Component Migration Map

| v1 File | v2 File | Change |
|---------|---------|--------|
| App.jsx | `app/(dashboard)/page.tsx` | Split into routed pages |
| Layout.jsx | `components/layout/Shell.tsx` | TSX + grain texture |
| AuroraBackground.jsx | `components/three/AuroraField.tsx` | TSX, recontextualized |
| Tesseract.jsx | `components/three/Tesseract.tsx` | TSX + mode-speed link |
| Chatbot.jsx | `components/modules/OracleChat.tsx` | Intelligence doc UI |
| LexiconDuel.jsx | `components/modules/LexiconDuel.tsx` | Real AI judge |
| BlackBox.jsx | `components/modules/BlackBox.tsx` | Server-side ZIP |
| DynamicIsland.jsx | `components/layout/DynamicIsland.tsx` | TSX + typed |
| ModeTransition.jsx | `components/layout/ModeTransition.tsx` | TSX + cinematic |
| ProtocolZero.jsx | `components/layout/ProtocolZero.tsx` | TSX + voice synth |
| SoundManager.jsx | `lib/audio.ts` | Web Audio API, no Howler |
| GlassCard.jsx | `components/ui/Card.tsx` | Void Intelligence surface |
| lib/groq.js | `lib/groq.ts` + `api/chat/route.ts` | Server-only |
| lib/supabase.js | `lib/supabase/client.ts` + `server.ts` | Split browser/server |
| store/modeStore.js | `store/nexusStore.ts` | Typed Zustand |

---

## Security Rules

These are absolute. No exceptions. No PRs that violate them will be merged.

```diff
# FORBIDDEN IN ANY CLIENT FILE OR CLIENT-IMPORTED FILE:
- process.env.GROQ_API_KEY
- process.env.SUPABASE_SERVICE_ROLE_KEY
- dangerouslyAllowBrowser: true
- new Groq({ ... }) in any component

# REQUIRED:
+ GROQ_API_KEY only in app/api/ route files
+ SUPABASE_SERVICE_ROLE_KEY only in lib/supabase/server.ts
+ All Groq calls behind POST /api/chat or /api/chat/ambient
+ All API routes validate session before any processing
+ All API routes validate body with Zod before any processing
```

---

## What This Is Not

This README is a reference document. Not a tutorial. Not a guide. Not a starting point for negotiation.

Every decision documented here is final. Every color, every animation, every spring config, every AI persona response rule — **final**.

Do not:
- Invent new colors outside the design token system
- Add animations not listed in the motion spec
- Use fonts not listed in the typography spec
- Add `Math.random()` to any component
- Hardcode any user IDs
- Add `NEXT_PUBLIC_` to `GROQ_API_KEY`
- Use chat bubbles in OracleChat
- Add `dangerouslyAllowBrowser` to any Groq instantiation

---

> **Built with discipline. Rebuilt with engineering. Designed with intention.**
>
> NEXUS v2.0 — Void Intelligence OS
