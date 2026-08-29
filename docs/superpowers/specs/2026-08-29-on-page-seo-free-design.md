# Autonomous On-Page SEO Analyzer — Design

Status: Approved by user
Date: 2026-08-29
Target location: `tools/on-page-seo-free`

## Goal

Create a durable, local-first fork of `AgriciDaniel/on-page-seo` that audits a website without Firecrawl, DataForSEO, API keys, subscriptions, or deposits. Preserve the useful parts of the existing product: browser UI, SQLite history, live progress, per-page reports, and CSV/JSON export.

The application must run on Windows with Node.js 22 and support macOS/Linux where the chosen dependencies allow it. Network access is limited to the site being audited and the resources that site loads.

## Selected Approach

The application will use two explicit scan modes:

1. **Quick Scan** discovers and inspects up to 500 HTML pages with a local HTTP crawler. It covers technical and on-page SEO checks and is the default.
2. **Deep Scan** runs Lighthouse in local Chromium for user-selected URLs after the Quick Scan. It adds laboratory performance and accessibility data without making every crawl take hours.

This approach was selected over two alternatives:

- Running Lighthouse for every discovered page was rejected as the default because 100–500 sequential browser audits would take tens of minutes to hours and heavily load the machine and target site.
- A CLI-only analyzer was rejected because the existing UI, progress display, report history, and exports are worth preserving.

## User Flow

1. The user enters a public `http` or `https` URL and a page limit from 1 to 500.
2. The user selects Quick Scan or Quick + Deep Scan.
3. For Deep Scan, the user may choose up to 10 URLs after discovery. The root URL is preselected.
4. The server discovers URLs, scans them with bounded concurrency, aggregates duplicate findings, and streams progress through the existing SSE channel.
5. The audit page shows a summary, sortable page results, issues, and Lighthouse metrics where available.
6. The user exports the audit as CSV or JSON.

No settings screen asks for API credentials. Existing credential fields and connection tests are removed.

## Architecture

The fork keeps the existing three-part structure:

- `client/`: React UI and audit/report views.
- `server/`: Express API, crawler, analyzers, Lighthouse runner, SQLite persistence, SSE progress, and exports.
- `shared/types/`: request, audit, page-result, issue, and progress contracts shared by client and server.

The server is divided into small units:

- `url-normalizer`: validates schemes, removes fragments, normalizes trailing slashes/default ports, and produces stable deduplication keys.
- `page-discovery`: reads `robots.txt`, reads sitemap and sitemap indexes, then performs same-origin breadth-first discovery from HTML anchors until the configured limit.
- `http-fetcher`: retrieves documents with timeouts, redirect tracking, a clear user agent, a maximum response size, and bounded concurrency.
- `html-analyzer`: parses one HTML document and returns deterministic page-level metrics and issues.
- `audit-aggregator`: detects duplicate titles, descriptions, canonicals, and normalized content after all pages finish.
- `score-calculator`: produces a documented local score from explicit issue weights; it must not imply that the score comes from Google or DataForSEO.
- `lighthouse-runner`: launches local Chromium and runs Lighthouse for selected pages sequentially.
- `audit-orchestrator`: owns cancellation, progress, persistence, partial failures, and final status.

External paid service modules are deleted rather than left dormant.

## Discovery Rules

Discovery proceeds in this order:

1. Normalize the submitted URL and establish its origin.
2. Fetch `robots.txt` and collect sitemap directives.
3. Try declared sitemaps, then `/sitemap.xml`.
4. Add eligible sitemap URLs.
5. Crawl same-origin anchors breadth-first from the submitted URL and newly found pages.

Only `http` and `https` URLs are accepted. Fragments are discarded. Query strings are retained because they may identify pages, but tracking parameters (`utm_*`, `gclid`, `yclid`, `fbclid`) are removed. Static assets, API routes, mail, telephone, and JavaScript links are excluded. Redirect sources and destinations are recorded.

The crawler identifies itself as `OnPageSEOFreeBot`. By default it respects matching `robots.txt` disallow rules during breadth-first discovery. URLs listed in a sitemap but blocked by robots are retained as explicit `blocked_by_robots` findings and are not fetched. The UI may offer an owner-controlled “ignore robots for this audit” switch, off by default.

The default concurrency is 5. Each request has a 20-second timeout and a 5 MiB HTML limit. The crawler stops exactly at the configured page limit.

By default, private, link-local, and cloud metadata IP ranges are rejected to reduce SSRF risk. DNS resolution and address validation are repeated for every redirect destination. A clearly labelled local-target option may allow `localhost` and loopback addresses for development audits; it is off by default.

## Quick Scan Metrics

Quick Scan collects:

- status code, final URL, redirect chain, content type, HTML bytes, fetch duration, and approximate TTFB;
- title, meta description, canonical, meta robots, language, doctype, viewport, charset, Open Graph, and Twitter tags;
- H1/H2/H3 counts and visible text, approximate word count, content hash, and basic readability indicators;
- internal/external links, redirecting links, and broken page links;
- broken same-origin image, script, and stylesheet resources; checks are deduplicated and capped at 1,000 resources per audit, using `HEAD` with a small `GET` fallback when `HEAD` is unsupported;
- image count, missing/empty `alt`, missing dimensions, and lazy-loading signals;
- JSON-LD count, parse errors, and declared schema types;
- duplicate titles, descriptions, canonicals, and normalized content across the audit;
- a structured list of issues with severity, evidence, and a suggested fix.

Spelling is excluded from version 1 because reliable Russian-language checking would add a dictionary service or a large language dependency. The UI must show it as “not measured”, never as zero errors.

## Deep Scan Metrics

Deep Scan uses local Lighthouse mobile emulation and stores:

- Performance, SEO, Accessibility, and Best Practices scores;
- FCP, LCP, CLS, Speed Index, Total Blocking Time, and Time to Interactive where Lighthouse provides them;
- total transfer size, request count, main-thread work, JavaScript execution time, and major savings opportunities;
- failed Lighthouse audits with their titles, display values, and actionable evidence.

FID is removed from new UI contracts because it is obsolete and cannot be measured meaningfully in a lab run. TBT is used as the lab responsiveness metric. INP remains unmeasured unless real-user field data is available.

Chromium is installed locally through a documented setup command. The server discovers the packaged browser path automatically; no API-key `.env` file is required. Deep scans run one at a time to avoid corrupting measurements and exhausting local CPU or memory.

## Persistence and API Contracts

SQLite remains the persistence layer. A fresh database schema is acceptable because this is a separate fork; no migration from the temporary paid-service database is required.

Core endpoints remain compatible where practical:

- `POST /api/audits/discover`: local discovery preview.
- `POST /api/audits`: starts Quick or Quick + Deep audit.
- `GET /api/audits/:id`: returns audit, pages, issues, and summary.
- `GET /api/audits/:id/progress`: SSE progress.
- `POST /api/audits/:id/cancel`: cooperative cancellation.
- `GET /api/audits/:id/export?format=csv|json`: export.
- `DELETE /api/audits/:id`: delete audit and dependent results.

Audit status becomes `pending | discovering | scanning | deep_scanning | completed | completed_with_errors | failed | cancelled`.

A per-page failure is stored with its URL and error. An audit may be `completed` only when it contains at least one successfully analyzed page. If some pages fail, the result is `completed_with_errors`. Empty successful-looking reports are forbidden.

## Scoring

The local on-page score starts at 100 and subtracts documented weights. Critical indexability and availability problems carry the largest penalties; metadata, headings, links, structured data, content, and image findings carry smaller penalties. The score is clamped to 0–100.

The report labels it **Local audit score** and shows the contributing issues. Lighthouse scores remain separate and are never blended into the local score.

## Error Handling

- Discovery failure records the attempted sitemap/robots URLs and falls back to anchor crawling where possible.
- A timeout or invalid page records a page error and does not abort unrelated pages.
- Database and orchestrator failures mark the audit `failed` with a visible message.
- Cancellation stops scheduling new work, closes active browser work, and marks the audit `cancelled`.
- Missing Chromium disables Deep Scan with setup instructions; Quick Scan remains available.
- Retries are limited to one retry for transient network errors. Authentication-style retries no longer exist.

Logs must never include URL credentials, cookies, authorization headers, or full response bodies.

## License and Attribution

The fork retains the upstream MIT license, copyright notices, and a README attribution/link to `AgriciDaniel/on-page-seo`. New code remains compatible with that license. The product name must make clear that this is a local autonomous fork, not an official DataForSEO, Firecrawl, Google, or Lighthouse product.

## UI Changes

The existing visual structure is retained. Required changes are limited to behavior and labels:

- replace credential settings with scan-mode and browser-status information;
- add Quick/Deep mode controls and Deep URL selection;
- mark performance fields as “not measured” on Quick-only pages;
- show partial failures instead of silently dropping pages;
- rename the primary score to Local audit score;
- expose issue evidence and suggested fixes;
- keep dark mode, history, progress, filters, and exports.

## Testing Strategy

Development follows test-first implementation.

Unit tests use deterministic HTML fixtures for URL normalization, sitemap parsing, anchor discovery, metadata extraction, headings, images, JSON-LD, issue weights, duplicate aggregation, and export escaping.

Integration tests start a local fixture HTTP server with redirects, broken pages, sitemap indexes, robots directives, duplicate metadata, malformed JSON-LD, slow responses, and oversized responses. These tests exercise the real fetcher and crawler without paid APIs or internet access.

The Lighthouse adapter has contract tests around result transformation and one opt-in local Chromium smoke test. The audit API has integration tests proving SSE progress, cancellation, partial failures, non-empty completion, and export output.

Client tests cover scan-mode controls, unmeasured states, partial failures, and report rendering.

## Acceptance Criteria

The implementation is complete when all of the following are verified from a clean install:

1. `npm run install:all` and the browser setup command complete on Node.js 22.
2. `npm run dev` starts client and server without Firecrawl/DataForSEO variables.
3. A Quick Scan of `https://kucherandconga.ru` discovers and persists real pages, produces non-empty reports, and exports valid CSV and JSON.
4. A Deep Scan of the homepage and `/menu` records Lighthouse categories and laboratory metrics.
5. Unit/integration tests, type checks, lint, and production builds pass.
6. Repository search finds no runtime references to Firecrawl or DataForSEO.
7. No audit can be marked `completed` with zero successful pages.

## Out of Scope for Version 1

- keyword rankings, search volume, backlink data, SERP scraping, or competitor intelligence;
- real-user CrUX/Core Web Vitals field data;
- automatic spelling correction;
- cloud hosting or multi-user authentication;
- scheduled recurring audits;
- distributed crawling or more than 500 pages per audit.
