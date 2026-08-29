# Autonomous On-Page SEO Analyzer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a durable local fork of `AgriciDaniel/on-page-seo` that performs Quick and Deep SEO audits without Firecrawl, DataForSEO, API keys, subscriptions, or deposits.

**Architecture:** Keep the upstream React/Vite client, Express server, SQLite history, SSE progress, and exports under `tools/on-page-seo-free`. Replace paid-service modules with a safe same-origin crawler, deterministic HTML analyzer, duplicate/resource aggregation, and an optional sequential Lighthouse adapter using locally installed Chromium.

**Tech Stack:** Node.js 22, TypeScript, React 19, Vite 7, Express 4, SQLite (`better-sqlite3`), Cheerio, `robots-parser`, `fast-xml-parser`, Lighthouse, Playwright Chromium, Vitest, Supertest, Testing Library.

**Spec:** `docs/superpowers/specs/2026-08-29-on-page-seo-free-design.md`

## Global Constraints

- Work only in `tools/on-page-seo-free` except for documentation under `docs/superpowers`.
- Copy upstream source without `.git`, `node_modules`, `dist`, `data`, `.env`, or lockfiles from temporary experiments.
- Preserve the upstream MIT `LICENSE` and add explicit attribution in the new README.
- Never read or log credentials from `.codex-tmp/on-page-seo/server/.env`; the finished app has no key settings.
- Write the failing test first, run it, add the smallest implementation, rerun the focused test, then commit.
- Do not make live-site smoke tests part of the deterministic test suite; keep fixture-server tests offline and repeatable.

## File and Responsibility Map

- `tools/on-page-seo-free/shared/types/index.ts`: the only client/server audit contract.
- `tools/on-page-seo-free/server/src/app.ts`: Express composition without opening a port.
- `tools/on-page-seo-free/server/src/index.ts`: database initialization and process startup only.
- `tools/on-page-seo-free/server/src/db/{schema,repositories}.ts`: fresh schema and typed persistence.
- `tools/on-page-seo-free/server/src/crawler/*`: normalization, network policy, safe fetches, robots/sitemap parsing, and discovery.
- `tools/on-page-seo-free/server/src/analyzer/*`: HTML metrics, issues, scoring, resources, duplicates, and exports.
- `tools/on-page-seo-free/server/src/lighthouse/*`: browser lookup, Lighthouse execution, and result transformation.
- `tools/on-page-seo-free/server/src/audit/*`: state machine, cancellation, concurrency, SSE events, and orchestration.
- `tools/on-page-seo-free/server/src/routes/*`: request validation and HTTP response mapping only.
- `tools/on-page-seo-free/client/src/features/{landing,seo-audit,seo-report}`: scan controls, progress, summaries, table, and page report.

---

### Task 1: Create the durable fork and a testable server shell

**Files:**
- Create: `tools/on-page-seo-free/**` by copying the upstream source tree subject to Global Constraints.
- Modify: `tools/on-page-seo-free/package.json`
- Modify: `tools/on-page-seo-free/server/package.json`
- Modify: `tools/on-page-seo-free/server/tsconfig.json`
- Modify: `tools/on-page-seo-free/client/package.json`
- Create: `tools/on-page-seo-free/server/src/app.ts`
- Modify: `tools/on-page-seo-free/server/src/index.ts`
- Create: `tools/on-page-seo-free/server/src/app.test.ts`
- Create: `tools/on-page-seo-free/.nvmrc`
- Create: `tools/on-page-seo-free/.gitignore`

- [ ] **Step 1: Copy the upstream tree and remove generated/runtime-only material**

Copy from `.codex-tmp/on-page-seo` into `tools/on-page-seo-free`, excluding `.git`, `node_modules`, `dist`, `data`, `.env`, and all copied lockfiles. Confirm `LICENSE` exists and `git status --short tools/on-page-seo-free` lists only the intended new tree.

- [ ] **Step 2: Pin the runtime contract and install scripts**

Set `.nvmrc` to `22`. Change the root package name to `on-page-seo-free`, set `engines.node` to `>=22 <23`, and add:

```json
{
  "scripts": {
    "install:all": "npm install && npm --prefix server install && npm --prefix client install",
    "install:browser": "npm --prefix server run install:browser",
    "test": "npm run test:server && npm run test:client",
    "test:server": "npm --prefix server test",
    "test:client": "npm --prefix client test",
    "typecheck": "npm --prefix server run typecheck && npm --prefix client run typecheck"
  }
}
```

In `server/package.json`, add `vitest`, `supertest`, and `@types/supertest`; add `test: vitest run` and `typecheck: tsc --noEmit`. In `client/package.json`, add `vitest`, `jsdom`, `@testing-library/react`, `@testing-library/jest-dom`, and `@testing-library/user-event`; add `test: vitest run` and `typecheck: tsc -b --pretty false`. Set `declaration: false` in `server/tsconfig.json` to remove the upstream TS4023 declaration-build failure.

- [ ] **Step 3: Write the failing health test**

```ts
// server/src/app.test.ts
import request from 'supertest'
import { describe, expect, it } from 'vitest'
import { createApp } from './app.js'

describe('GET /api/health', () => {
  it('starts without API-key environment variables', async () => {
    const response = await request(createApp()).get('/api/health')
    expect(response.status).toBe(200)
    expect(response.body).toMatchObject({ status: 'ok', mode: 'local' })
  })
})
```

- [ ] **Step 4: Run RED**

Run `npm run test:server -- app.test.ts` from `tools/on-page-seo-free`.

Expected: FAIL because `server/src/app.ts` does not exist.

- [ ] **Step 5: Extract the Express app from the process entry point**

Implement `createApp()` in `server/src/app.ts`. It must add CORS, JSON parsing, and `GET /api/health`, but must not call `listen()` or initialize a file database. Keep `server/src/index.ts` responsible for initializing the database and calling `createApp(dependencies).listen(...)`.

- [ ] **Step 6: Run GREEN and the baseline build**

Run:

```powershell
npm run test:server -- app.test.ts
npm run build
```

Expected: the health test and both production builds pass on Node 22.

- [ ] **Step 7: Commit**

```powershell
git add tools/on-page-seo-free
git commit -m "feat: scaffold local SEO analyzer"
```

---

### Task 2: Replace paid-service contracts with local audit contracts and schema

**Files:**
- Replace: `tools/on-page-seo-free/shared/types/index.ts`
- Create: `tools/on-page-seo-free/server/src/db/schema.ts`
- Create: `tools/on-page-seo-free/server/src/db/repositories.ts`
- Replace: `tools/on-page-seo-free/server/src/db/database.ts`
- Create: `tools/on-page-seo-free/server/src/db/repositories.test.ts`
- Modify: `tools/on-page-seo-free/server/src/types/index.ts`

- [ ] **Step 1: Write the failing persistence tests**

```ts
// server/src/db/repositories.test.ts
import { afterEach, describe, expect, it } from 'vitest'
import { createDatabase } from './database.js'
import { createRepositories } from './repositories.js'

describe('audit persistence invariants', () => {
  const databases: ReturnType<typeof createDatabase>[] = []
  afterEach(() => databases.splice(0).forEach((db) => db.close()))

  it('rejects a successful-looking audit with zero successful pages', () => {
    const db = createDatabase(':memory:')
    databases.push(db)
    const repos = createRepositories(db)
    repos.audits.create({ id: 'a1', url: 'https://example.com', mode: 'quick', pageLimit: 10 })
    expect(() => repos.audits.finish('a1', 'completed', { successful: 0, failed: 0 }))
      .toThrow(/successful page/i)
  })

  it('round-trips structured metrics and issues', () => {
    const db = createDatabase(':memory:')
    databases.push(db)
    const repos = createRepositories(db)
    repos.audits.create({ id: 'a1', url: 'https://example.com', mode: 'quick', pageLimit: 10 })
    repos.pages.insert({
      id: 'p1', auditId: 'a1', url: 'https://example.com', finalUrl: 'https://example.com/',
      ok: true, statusCode: 200, metrics: { title: 'Example', wordCount: 20 },
      issues: [{ code: 'missing_description', severity: 'warning', message: 'Missing description', evidence: null, fix: 'Add a description' }],
      deep: null, error: null,
    })
    expect(repos.pages.byAudit('a1')[0].metrics.title).toBe('Example')
  })
})
```

- [ ] **Step 2: Run RED**

Run `npm run test:server -- repositories.test.ts`.

Expected: FAIL because the fresh database and repositories do not exist.

- [ ] **Step 3: Define the shared contracts**

Replace DataForSEO/Firecrawl types with these named contracts and their fields:

```ts
export type ScanMode = 'quick' | 'quick_deep'
export type AuditStatus = 'pending' | 'discovering' | 'scanning' | 'deep_scanning' |
  'completed' | 'completed_with_errors' | 'failed' | 'cancelled'
export type IssueSeverity = 'critical' | 'error' | 'warning' | 'info'
export type MetricStatus = 'good' | 'needs_improvement' | 'poor' | 'not_measured'

export interface Issue {
  code: string
  severity: IssueSeverity
  message: string
  evidence: string | null
  fix: string
}

export interface CreateAuditRequest {
  url: string
  limit: number
  mode: ScanMode
  pages?: string[]
  deepUrls?: string[]
  ignoreRobots?: boolean
  allowLocal?: boolean
}
```

Also define `Audit`, `QuickMetrics`, `DeepMetrics`, `PageResult`, `AuditSummary`, `AuditWithResults`, `DiscoveryResult`, and `ProgressEvent`. Use nullable values for every Deep metric so Quick-only reports can render `not_measured`; do not include FID.

- [ ] **Step 4: Implement the fresh schema and repositories**

Create `audits` and `page_results` tables. Store structured page metrics as JSON text and decode them in the repository boundary. Add this database invariant:

```sql
CHECK (
  status NOT IN ('completed', 'completed_with_errors')
  OR successful_pages > 0
)
```

`audits.finish()` must make the same check in TypeScript and set `completed_at`. `createDatabase(':memory:')` must be isolated and side-effect free for tests; the production default remains `data/seo-dashboard.db`.

- [ ] **Step 5: Run GREEN**

Run `npm run test:server -- repositories.test.ts` and `npm run typecheck`.

Expected: both repository tests pass and no paid-service types remain under `shared/types`.

- [ ] **Step 6: Commit**

```powershell
git add tools/on-page-seo-free/shared tools/on-page-seo-free/server/src/db tools/on-page-seo-free/server/src/types
git commit -m "feat: define local audit persistence"
```

---

### Task 3: Implement URL normalization and SSRF-safe network policy

**Files:**
- Create: `tools/on-page-seo-free/server/src/crawler/url-normalizer.ts`
- Create: `tools/on-page-seo-free/server/src/crawler/network-policy.ts`
- Create: `tools/on-page-seo-free/server/src/crawler/url-normalizer.test.ts`
- Create: `tools/on-page-seo-free/server/src/crawler/network-policy.test.ts`

- [ ] **Step 1: Write normalization and policy tests**

Cover these exact cases:

```ts
expect(normalizeUrl('HTTPS://Example.com:443/a/?utm_source=x&b=2#part').href)
  .toBe('https://example.com/a?b=2')
expect(normalizeUrl('/menu', new URL('https://example.com/base')).href)
  .toBe('https://example.com/menu')
expect(() => normalizeUrl('javascript:alert(1)')).toThrow(/http/i)

await expect(assertSafeTarget(new URL('http://127.0.0.1'), { allowLocal: false }))
  .rejects.toThrow(/private|loopback/i)
await expect(assertSafeTarget(new URL('http://169.254.169.254/latest/meta-data'), { allowLocal: false }))
  .rejects.toThrow(/link-local|metadata/i)
await expect(assertSafeTarget(new URL('http://127.0.0.1'), { allowLocal: true }))
  .resolves.toBeDefined()
```

Inject a DNS resolver in policy tests and cover IPv4 private ranges, IPv6 loopback/link-local/ULA, mixed public/private answers, URL credentials, and a public address.

- [ ] **Step 2: Run RED**

Run `npm run test:server -- url-normalizer.test.ts network-policy.test.ts`.

Expected: FAIL because both modules are missing.

- [ ] **Step 3: Implement normalization**

`normalizeUrl(input, base?)` must accept only HTTP(S), remove credentials and fragments, lowercase the host, remove default ports and trailing slashes except `/`, sort query parameters, and drop `utm_*`, `gclid`, `yclid`, and `fbclid`. Export `dedupeKey(url)` and `redactUrlForLog(url)`.

- [ ] **Step 4: Implement network policy**

`assertSafeTarget(url, options)` must resolve every hostname through an injectable resolver and reject if any returned address is loopback, RFC1918, link-local, multicast, unspecified, IPv6 ULA, or cloud metadata. `allowLocal` may permit loopback/private development targets but must never permit URL credentials.

- [ ] **Step 5: Run GREEN**

Run the two focused tests and `npm run typecheck`.

- [ ] **Step 6: Commit**

```powershell
git add tools/on-page-seo-free/server/src/crawler
git commit -m "feat: secure crawler URL handling"
```

---

### Task 4: Build the bounded HTTP client

**Files:**
- Create: `tools/on-page-seo-free/server/src/crawler/http-fetcher.ts`
- Create: `tools/on-page-seo-free/server/src/test/fixture-site.ts`
- Create: `tools/on-page-seo-free/server/src/crawler/http-fetcher.test.ts`

- [ ] **Step 1: Write fixture-server fetch tests**

Use an ephemeral local HTTP server and `allowLocal: true`. Tests must prove:

```ts
it('revalidates every redirect destination', async () => {
  const seen: string[] = []
  const client = new SafeHttpClient({ allowLocal: true, validate: async (url) => { seen.push(url.href) } })
  await client.getText(site.url('/redirect-to-home'))
  expect(seen).toEqual([site.url('/redirect-to-home'), site.url('/')])
})

it('rejects responses over the byte limit', async () => {
  await expect(client.getText(site.url('/oversized'), { maxBytes: 1024 }))
    .rejects.toThrow(/size limit/i)
})
```

Also test a 20 ms timeout, non-HTML content reporting, at most five redirects, the `OnPageSEOFreeBot/1.0` user agent, and one retry only for transient connection/5xx errors.

- [ ] **Step 2: Run RED**

Run `npm run test:server -- http-fetcher.test.ts`.

Expected: FAIL because `SafeHttpClient` and the fixture server do not exist.

- [ ] **Step 3: Implement the client**

Use Node 22 `fetch` with `redirect: 'manual'`, `AbortSignal.timeout`, streaming byte accounting, and the policy validator before the initial request and before each redirect. Return:

```ts
export interface FetchResult {
  requestedUrl: string
  finalUrl: string
  redirectChain: string[]
  statusCode: number
  contentType: string
  body: string
  bytes: number
  fetchDurationMs: number
  ttfbMs: number
}
```

Never log headers, response bodies, cookies, or unredacted URL credentials.

- [ ] **Step 4: Run GREEN**

Run the focused test and `npm run typecheck`.

- [ ] **Step 5: Commit**

```powershell
git add tools/on-page-seo-free/server/src/crawler tools/on-page-seo-free/server/src/test
git commit -m "feat: add bounded local HTTP client"
```

---

### Task 5: Discover pages from robots, sitemaps, and same-origin links

**Files:**
- Create: `tools/on-page-seo-free/server/src/crawler/robots.ts`
- Create: `tools/on-page-seo-free/server/src/crawler/sitemap.ts`
- Create: `tools/on-page-seo-free/server/src/crawler/page-discovery.ts`
- Create: `tools/on-page-seo-free/server/src/crawler/page-discovery.test.ts`
- Modify: `tools/on-page-seo-free/server/src/test/fixture-site.ts`
- Modify: `tools/on-page-seo-free/server/package.json`

- [ ] **Step 1: Add parser dependencies**

Add `cheerio@1.2.0`, `fast-xml-parser@5.11.1`, `robots-parser@3.0.1`, and `p-limit@7.3.1` to server dependencies, then install so the server lockfile records exact resolved versions.

- [ ] **Step 2: Write the failing discovery integration test**

The fixture must expose `/robots.txt`, `/sitemap.xml`, `/sitemap-pages.xml`, `/`, `/about`, `/menu`, `/private`, and a static asset link. Assert:

```ts
const result = await discoverSite(site.url('/'), {
  limit: 3,
  ignoreRobots: false,
  client: new SafeHttpClient({ allowLocal: true }),
})

expect(result.pages.map((page) => page.url)).toEqual([
  site.url('/'), site.url('/about'), site.url('/menu'),
])
expect(result.blocked).toContainEqual(expect.objectContaining({ url: site.url('/private') }))
expect(result.pages).toHaveLength(3)
```

Add separate cases for a sitemap index, malformed XML fallback, missing robots, cross-origin links, fragments/tracking duplicates, and excluded extensions such as `.jpg`, `.css`, `.js`, `.pdf`, and `.zip`.

- [ ] **Step 3: Run RED**

Run `npm run test:server -- page-discovery.test.ts`.

Expected: FAIL because the parsers and discovery service do not exist.

- [ ] **Step 4: Implement robots and sitemap parsers**

`loadRobots()` returns the parsed policy plus declared sitemap URLs. `loadSitemaps()` follows sitemap indexes with a visited set and a hard cap of 20 sitemap documents. Fetch failures become warnings, not fatal errors.

- [ ] **Step 5: Implement breadth-first discovery**

Seed in stable order with the submitted URL, then eligible sitemap URLs, then same-origin anchors discovered breadth-first. Stop exactly at `limit`. Return pages, blocked URLs, redirect records, and discovery warnings. Keep `ignoreRobots` false by default.

- [ ] **Step 6: Run GREEN**

Run the focused test and `npm run typecheck`.

- [ ] **Step 7: Commit**

```powershell
git add tools/on-page-seo-free/server
git commit -m "feat: discover local audit pages"
```

---

### Task 6: Analyze HTML and calculate the local audit score

**Files:**
- Create: `tools/on-page-seo-free/server/src/analyzer/html-analyzer.ts`
- Create: `tools/on-page-seo-free/server/src/analyzer/issue-rules.ts`
- Create: `tools/on-page-seo-free/server/src/analyzer/score-calculator.ts`
- Create: `tools/on-page-seo-free/server/src/analyzer/html-analyzer.test.ts`
- Create: `tools/on-page-seo-free/server/src/analyzer/score-calculator.test.ts`
- Create: `tools/on-page-seo-free/server/src/test/fixtures/complete.html`
- Create: `tools/on-page-seo-free/server/src/test/fixtures/problematic.html`

- [ ] **Step 1: Write the failing analyzer tests**

The complete fixture must contain title, description, canonical, robots, language, charset, viewport, one H1, H2/H3, internal/external links, images, Open Graph, Twitter tags, valid JSON-LD, and visible Russian text. The problematic fixture must contain duplicate H1s, missing metadata, an empty image alt, missing dimensions, and malformed JSON-LD.

```ts
const result = analyzeHtml(completeHtml, {
  requestedUrl: 'https://example.com/', finalUrl: 'https://example.com/',
  statusCode: 200, bytes: 2048, fetchDurationMs: 40, ttfbMs: 10, redirectChain: [],
})
expect(result.metrics).toMatchObject({ title: 'Example', h1Count: 1, jsonLdCount: 1 })
expect(result.issues).not.toContainEqual(expect.objectContaining({ severity: 'critical' }))

const bad = analyzeHtml(problematicHtml, pageContext)
expect(bad.issues.map((issue) => issue.code)).toEqual(expect.arrayContaining([
  'missing_title', 'missing_description', 'multiple_h1', 'image_alt_missing', 'jsonld_invalid',
]))
```

- [ ] **Step 2: Write the failing score tests**

Assert an empty issue set scores 100, a critical non-indexable issue subtracts more than a missing description, duplicate issue codes do not double-charge a page unless the rule is count-based, and the score clamps to 0–100.

- [ ] **Step 3: Run RED**

Run `npm run test:server -- html-analyzer.test.ts score-calculator.test.ts`.

Expected: FAIL because analyzer modules do not exist.

- [ ] **Step 4: Implement deterministic extraction**

Parse with Cheerio. Extract every Quick Scan metric from the spec, normalize visible whitespace, compute a SHA-256 hash of normalized visible content, and calculate approximate word count/readability without a spelling dictionary. Set spelling to `not_measured`, not zero.

- [ ] **Step 5: Implement documented issue weights**

Export a constant `ISSUE_WEIGHTS` used by both tests and scoring. Use 40 for unreachable/non-indexable, 15 for missing title/H1, 10 for missing description/canonical, 8 for broken internal links or invalid JSON-LD, 5 for metadata length/multiple H1/image-alt problems, and 2 for informational image/loading hints. Clamp and label the output `Local audit score`.

- [ ] **Step 6: Run GREEN**

Run the focused tests and `npm run typecheck`.

- [ ] **Step 7: Commit**

```powershell
git add tools/on-page-seo-free/server/src/analyzer tools/on-page-seo-free/server/src/test/fixtures
git commit -m "feat: analyze on-page SEO locally"
```

---

### Task 7: Check resources, aggregate duplicates, and export safely

**Files:**
- Create: `tools/on-page-seo-free/server/src/analyzer/resource-checker.ts`
- Create: `tools/on-page-seo-free/server/src/analyzer/audit-aggregator.ts`
- Create: `tools/on-page-seo-free/server/src/analyzer/exporter.ts`
- Create: `tools/on-page-seo-free/server/src/analyzer/resource-checker.test.ts`
- Create: `tools/on-page-seo-free/server/src/analyzer/audit-aggregator.test.ts`
- Create: `tools/on-page-seo-free/server/src/analyzer/exporter.test.ts`
- Modify: `tools/on-page-seo-free/server/src/test/fixture-site.ts`

- [ ] **Step 1: Write failing resource tests**

Assert that duplicate resource URLs cause one network check, same-origin image/script/stylesheet URLs are capped at 1,000, `HEAD` 405 triggers a small `GET`, external page links are counted but not recursively crawled, and 404/410 results produce evidence-bearing issues.

- [ ] **Step 2: Write failing duplicate tests**

Pass three analyzed pages and assert duplicate non-empty titles, descriptions, canonicals, and content hashes are marked on every affected page while empty strings never count as duplicates.

- [ ] **Step 3: Write failing export tests**

```ts
const csv = exportAuditCsv(auditWithCommaQuoteAndFormula)
expect(csv).toContain('"Title, with ""quotes"""')
expect(csv).toContain("'=-dangerous")
expect(JSON.parse(exportAuditJson(audit)).pages).toHaveLength(1)
```

- [ ] **Step 4: Run RED**

Run `npm run test:server -- resource-checker.test.ts audit-aggregator.test.ts exporter.test.ts`.

Expected: FAIL because all three modules are missing.

- [ ] **Step 5: Implement resource/link checking and duplicate aggregation**

Use one audit-wide URL cache and `p-limit(5)`. Try `HEAD`, then `GET` with a 64 KiB cap only for 405/501. Merge aggregate issues back into pages and recalculate each local score after duplicate and broken-link findings are known.

- [ ] **Step 6: Implement CSV and JSON exports**

Use a fixed, documented column order. Escape quotes/newlines/commas and prefix spreadsheet-formula-leading cells (`=`, `+`, `-`, `@`) with an apostrophe. JSON export returns the full typed audit result.

- [ ] **Step 7: Run GREEN**

Run the three focused tests and `npm run typecheck`.

- [ ] **Step 8: Commit**

```powershell
git add tools/on-page-seo-free/server/src/analyzer tools/on-page-seo-free/server/src/test
git commit -m "feat: aggregate and export SEO findings"
```

---

### Task 8: Orchestrate audits and expose REST, SSE, cancellation, and exports

**Files:**
- Create: `tools/on-page-seo-free/server/src/audit/audit-events.ts`
- Create: `tools/on-page-seo-free/server/src/audit/audit-orchestrator.ts`
- Create: `tools/on-page-seo-free/server/src/audit/audit-orchestrator.test.ts`
- Replace: `tools/on-page-seo-free/server/src/routes/audit.routes.ts`
- Create: `tools/on-page-seo-free/server/src/routes/report.routes.ts`
- Create: `tools/on-page-seo-free/server/src/routes/audit.routes.test.ts`
- Modify: `tools/on-page-seo-free/server/src/app.ts`
- Delete: `tools/on-page-seo-free/server/src/routes/settings.routes.ts`
- Delete: `tools/on-page-seo-free/server/src/services/firecrawl.service.ts`
- Delete: `tools/on-page-seo-free/server/src/services/dataforseo.service.ts`
- Delete: `tools/on-page-seo-free/server/src/services/seo-analyzer.service.ts`

- [ ] **Step 1: Write failing orchestrator state tests**

Use injected fake discovery/fetch/analyze/deep dependencies. Prove these transitions:

```text
pending -> discovering -> scanning -> completed
pending -> discovering -> scanning -> completed_with_errors
pending -> discovering -> failed                 (zero successful pages)
pending -> discovering -> scanning -> cancelled
```

Assert concurrency never exceeds 5, cancellation stops scheduling new pages, `completed_pages` counts attempted pages, and `successful_pages`/`failed_pages` remain separate.

- [ ] **Step 2: Write failing API integration tests**

With an in-memory database and fake orchestrator, cover:

- `POST /api/audits/discover` validation and discovery output;
- `POST /api/audits` with Quick and Quick + Deep requests;
- `GET /api/audits/:id`, list, delete, cancel, CSV, and JSON;
- an SSE client receiving an initial snapshot and later progress event;
- 400 for Deep requests with more than 10 URLs and for limits outside 1–500.

- [ ] **Step 3: Run RED**

Run `npm run test:server -- audit-orchestrator.test.ts audit.routes.test.ts`.

Expected: FAIL because the orchestrator and local routes do not exist.

- [ ] **Step 4: Implement the event stream and orchestrator**

Use an `EventEmitter`-backed per-audit progress channel with connection cleanup. Keep one `AbortController` per active audit. Persist each page result immediately, run duplicate/resource aggregation after page scans, and select final status from actual success/failure counts. Catch background promise failures and persist `failed`; never leave an unhandled rejection.

- [ ] **Step 5: Implement routes with injected dependencies**

Validate bodies without coercing unknown schemes. Return `202` when an audit starts, `404` for unknown IDs, `409` for cancellation of a terminal audit, and content-disposition filenames for both exports. SSE must send `Content-Type: text/event-stream`, an initial persisted snapshot, heartbeat comments, and cleanup on request close.

- [ ] **Step 6: Delete paid-service runtime paths**

Remove settings routes, paid service modules, settings database code, and their imports. Keep no compatibility shim that silently calls external APIs.

- [ ] **Step 7: Run GREEN**

Run the focused tests, full server tests, and server typecheck.

- [ ] **Step 8: Commit**

```powershell
git add -A tools/on-page-seo-free/server
git commit -m "feat: run autonomous SEO audits"
```

---

### Task 9: Add optional local Lighthouse Deep Scan

**Files:**
- Create: `tools/on-page-seo-free/server/src/lighthouse/browser-resolver.ts`
- Create: `tools/on-page-seo-free/server/src/lighthouse/lighthouse-runner.ts`
- Create: `tools/on-page-seo-free/server/src/lighthouse/lighthouse-transform.ts`
- Create: `tools/on-page-seo-free/server/src/lighthouse/lighthouse-transform.test.ts`
- Create: `tools/on-page-seo-free/server/src/lighthouse/lighthouse-runner.smoke.test.ts`
- Modify: `tools/on-page-seo-free/server/src/audit/audit-orchestrator.ts`
- Modify: `tools/on-page-seo-free/server/src/audit/audit-orchestrator.test.ts`
- Modify: `tools/on-page-seo-free/server/package.json`

- [ ] **Step 1: Add browser dependencies and setup command**

Add `lighthouse@13.4.1`, `chrome-launcher@1.2.1`, and `playwright@1.62.1`. Add `install:browser: playwright install chromium`. Do not install all Playwright browsers.

- [ ] **Step 2: Write the failing transformation contract test**

Build a minimal typed Lighthouse fixture containing category scores, FCP, LCP, CLS, Speed Index, TBT, TTI, total byte weight, request count, main-thread work, bootup time, and one failed opportunity. Assert:

```ts
expect(transformLighthouseResult(lhr)).toMatchObject({
  performanceScore: 91,
  seoScore: 100,
  accessibilityScore: 94,
  bestPracticesScore: 96,
  lcpMs: 2400,
  tbtMs: 120,
  inpMs: null,
})
```

Assert FID is absent from the returned object.

- [ ] **Step 3: Run RED**

Run `npm run test:server -- lighthouse-transform.test.ts`.

Expected: FAIL because the Lighthouse modules do not exist.

- [ ] **Step 4: Implement browser resolution and Lighthouse execution**

Resolve Chromium with `chromium.executablePath()`, verify it exists, then launch it with `chrome-launcher` and run Lighthouse mobile categories sequentially. Always kill Chrome in `finally`. If Chromium is missing, throw a typed `BrowserUnavailableError` whose message includes `npm run install:browser`.

- [ ] **Step 5: Integrate Deep Scan into the orchestrator**

After Quick Scan aggregation, transition to `deep_scanning` and run at most 10 selected same-origin URLs one at a time. Persist Deep metrics onto existing page results. A per-page Lighthouse failure becomes a page error and final `completed_with_errors`; missing Chromium must not break Quick-only audits.

- [ ] **Step 6: Add the opt-in smoke test**

Guard the real-browser test with `RUN_LIGHTHOUSE_SMOKE=1`. It serves one local fixture page, runs Lighthouse, and asserts all four category scores are numbers. Default `npm test` skips it.

- [ ] **Step 7: Run GREEN**

Run:

```powershell
npm run test:server -- lighthouse-transform.test.ts audit-orchestrator.test.ts
npm run typecheck
```

Expected: transformation and orchestration tests pass without launching a browser.

- [ ] **Step 8: Commit**

```powershell
git add tools/on-page-seo-free/server
git commit -m "feat: add local Lighthouse deep scans"
```

---

### Task 10: Adapt the React UI to Quick/Deep scans and partial results

**Files:**
- Modify: `tools/on-page-seo-free/client/vite.config.ts`
- Create: `tools/on-page-seo-free/client/src/test/setup.ts`
- Modify: `tools/on-page-seo-free/client/src/types/seo.ts`
- Replace: `tools/on-page-seo-free/client/src/lib/api.ts`
- Modify: `tools/on-page-seo-free/client/src/features/landing/index.tsx`
- Modify: `tools/on-page-seo-free/client/src/features/seo-audit/components/audit-progress.tsx`
- Modify: `tools/on-page-seo-free/client/src/features/seo-audit/components/audit-summary-cards.tsx`
- Modify: `tools/on-page-seo-free/client/src/features/seo-audit/components/audit-columns.tsx`
- Modify: `tools/on-page-seo-free/client/src/features/seo-report/index.tsx`
- Modify: `tools/on-page-seo-free/client/src/routes/_authenticated/audits/index.tsx`
- Modify: `tools/on-page-seo-free/client/src/routes/_authenticated/audits/$auditId.tsx`
- Modify: `tools/on-page-seo-free/client/src/components/layout/data/sidebar-data.ts`
- Delete: `tools/on-page-seo-free/client/src/routes/_authenticated/settings/api-keys.tsx`
- Delete: `tools/on-page-seo-free/client/src/features/settings/api-keys/index.tsx`
- Delete: `tools/on-page-seo-free/client/src/features/settings/api-keys/api-keys-form.tsx`
- Create: `tools/on-page-seo-free/client/src/features/landing/landing.test.tsx`
- Create: `tools/on-page-seo-free/client/src/features/seo-report/seo-report.test.tsx`

- [ ] **Step 1: Configure client tests and write failing UI tests**

Use jsdom and Testing Library. Mock `auditApi`. The landing test must select `Quick + Deep`, discover 12 pages, verify the root URL is preselected for Deep Scan, select up to 10 deep URLs, and assert the create request contains `mode: 'quick_deep'` and `deepUrls`.

The report test must render a Quick-only page and assert `Performance: not measured`, `INP: not measured`, and `Spelling: not measured`, with no FID label. A partial audit test must expose failed page URLs and `completed_with_errors` rather than treating them as completed.

- [ ] **Step 2: Run RED**

Run `npm run test:client -- landing.test.tsx seo-report.test.tsx`.

Expected: FAIL because the UI still uses the paid-service data model and has no scan mode.

- [ ] **Step 3: Replace client contracts and API adapter**

Re-export the new shared contracts, extend `auditFormSchema` with `mode`, `ignoreRobots`, and `allowLocal`, and update API calls to send `CreateAuditRequest`. Delete `settingsApi` and every Firecrawl/DataForSEO settings type.

- [ ] **Step 4: Adapt the landing and progress flow**

Keep the current visual structure. Add Quick/Deep controls, keep Quick as default, show browser status/setup instructions, preselect the root only for Deep, enforce the 10-URL Deep limit, and render all terminal statuses. Keep the owner-only local-target and ignore-robots switches off by default with warning copy.

- [ ] **Step 5: Adapt reports and history**

Rename `Overall Score` to `Local audit score`. Render structured issues with severity, evidence, and fix. Show nullable Deep metrics as `not measured`; replace FID with TBT and explicitly show INP as unmeasured. Show unsuccessful page rows, partial error counts, CSV/JSON buttons, and results links for both `completed` and `completed_with_errors`.

- [ ] **Step 6: Remove API-key UI**

Delete the route and feature files and remove the sidebar entry. Keep Appearance settings. Regenerate TanStack Router output through the normal client build rather than editing `routeTree.gen.ts` manually.

- [ ] **Step 7: Run GREEN**

Run:

```powershell
npm run test:client -- landing.test.tsx seo-report.test.tsx
npm run typecheck
npm run lint
npm run build
```

Expected: UI tests, typechecks, lint, and both builds pass.

- [ ] **Step 8: Commit**

```powershell
git add -A tools/on-page-seo-free/client tools/on-page-seo-free/shared
git commit -m "feat: expose free Quick and Deep scans"
```

---

### Task 11: Document setup and verify every acceptance criterion

**Files:**
- Replace: `tools/on-page-seo-free/README.md`
- Modify: `tools/on-page-seo-free/LICENSE` only if copying omitted the upstream notice; otherwise leave unchanged.
- Create: `tools/on-page-seo-free/server/src/acceptance/current-site.smoke.test.ts`
- Modify: `tools/on-page-seo-free/package.json`

- [ ] **Step 1: Write the README before the final smoke run**

Document Node 22, `npm run install:all`, `npm run install:browser`, `npm run dev`, Quick versus Deep behavior, limits, local-target/robots safety, data location, CSV/JSON export, and troubleshooting for missing Chromium. State that the local score is not a Google/DataForSEO metric. Credit and link `AgriciDaniel/on-page-seo` under the MIT license.

- [ ] **Step 2: Add an explicit live-site smoke script**

Add `test:smoke:current-site` that runs only `server/src/acceptance/current-site.smoke.test.ts`. The test reads `SMOKE_SITE_URL`, defaults to no execution, uses a Quick limit of 20, and when enabled asserts at least one successful page plus non-empty CSV and JSON. Keep it outside default `npm test`.

- [ ] **Step 3: Verify clean install and static quality**

From `tools/on-page-seo-free` on Node 22 run:

```powershell
npm run install:all
npm run install:browser
npm test
npm run typecheck
npm run lint
npm run build
```

Expected: all commands exit 0.

- [ ] **Step 4: Verify the current site**

Run:

```powershell
$env:SMOKE_SITE_URL='https://kucherandconga.ru'
npm run test:smoke:current-site
$env:RUN_LIGHTHOUSE_SMOKE='1'
npm run test:server -- lighthouse-runner.smoke.test.ts
Remove-Item Env:SMOKE_SITE_URL
Remove-Item Env:RUN_LIGHTHOUSE_SMOKE
```

Then use the UI to Deep Scan exactly `https://kucherandconga.ru/` and `https://kucherandconga.ru/menu`; verify four Lighthouse category scores and lab metrics are persisted for both.

- [ ] **Step 5: Prove paid runtime dependencies are gone**

Run:

```powershell
rg -n -i "firecrawl|dataforseo|FIRECRAWL_API_KEY|DATAFORSEO_" tools/on-page-seo-free -g '!README.md' -g '!LICENSE'
```

Expected: no matches. Then inspect a deliberately all-failing fixture audit and confirm its status is `failed`, never `completed` or `completed_with_errors`.

- [ ] **Step 6: Inspect the working tree and commit**

Run `git diff --check` and `git status --short`. Preserve unrelated user files. Then commit only analyzer documentation and acceptance changes:

```powershell
git add tools/on-page-seo-free/README.md tools/on-page-seo-free/package.json tools/on-page-seo-free/server/src/acceptance
git commit -m "docs: verify autonomous SEO analyzer"
```

- [ ] **Step 7: Final acceptance record**

Record the exact command results and audit IDs in the implementation handoff. If the live target blocks automated requests, report the HTTP status and keep the deterministic fixture suite as the correctness gate; do not weaken the crawler safety policy.
