# GSA/site-scanning-engine context
> refreshed 2026-09-09 | upstream default: main @ 3845a8228b2ecc6c233f643f3c7807cd48b8db62

## Identity & policies
- upstream: GSA/site-scanning-engine, default branch main, primary language TypeScript (NestJS monorepo), English-first (yes).
- Issue tracker: the program's tracker lives in `GSA/site-scanning` (GitHub issues, e.g. #1980-#1990 filed there and reference engine files). The engine repo itself has no open issues.
- CLA/DCO: none. No CONTRIBUTING.md. No branch protection on main (no required signatures/reviews). Signed commits required: no.
- AI-assisted PR policy: unstated (repo AGENTS.md is Claude guidance only; no PR-template AI disclosure; GSA org has no default community files).
- PR template: none in `.github` (only workflows), none at root, none in `GSA/.github` (org repo absent). -> fall back to pipeline 3-section body.
- AI review / ban: `bans_ai=false`, `ai_disclosure_required=false`. Fork PR bodies/commits carry no AI mention.

## Conventions (verified from merged PRs)
- Branch naming from merged PRs is mixed: `task/*`, `feature/*`, `fix/*`, `refactor/*`, `bugfix/*`, plus issue-number branches. No single dominant pattern -> fall back to `type/desc` (previous fork PR used `fix/dap-empty-version-check`).
- Commit style: Conventional Commits (`feat:`, `fix:`, `refactor:`).
- CI: GitHub Actions (`test.yml`, `codeql.yml`, `semgrep.yml`, `snyk.yml`, `megalinter.yml`). Substantive check = `test.yml` (install/build/test). Unit tests run via `npm run test:unit` (jest, `--testPathIgnorePatterns e2e-spec`). Lint = `eslint`. Format = prettier.
- Main maintainer: ethangardner (recent merges: task/*, fix/*, refactor/*). External contributor arpitjain099 has open fixes (null navigation response #586, timeout classification #585, duplicate request handlers #580). Dependabot auto-bumps deps.

## Maintainer picture
- ethangardner merges PRs frequently (multiple per week), including external PRs. Responsive. Avoid areas he is actively reworking (snapshot columns `task/expose-secondary-scan-date`, `refactor/snapshot-column-order-guard` recently merged).
- 35 external merges in last 60 days per queue score. High merge likelihood.

## Issue-area health
- Engine bugs are tracked in GSA/site-scanning. Open engine-relevant bugs (all `[bug]`, unassigned, no PR):
  - #1988 null navigation response for www/robots/sitemap -> has open PR #586 (claimed).
  - #1984 timeout classified as unknown_error -> open PR #585 (claimed).
  - #1985 duplicate page event listeners -> open PR #580 (claimed).
  - #1986 buildUrlScanResult not wrapped in error-swallowing runScan (null-guard unreachable) -> UNCLAIMED, pick.
  - #1987 url-scan mixes page.url() and response-derived fields after client redirect -> UNCLAIMED (suggests observability first; discuss with team).
  - #1989 re-enable disabled primary.spec.ts hermetically -> UNCLAIMED (large, hard to make hermetic because primaryScan calls page.goto(url) itself).

## Gap ledger (dedupe — READ FIRST, never re-pick)
- 2026-08-26 dap empty-version crash (candidate.version null/'' + Any-DAP-Match lowest priority) — outcome pr-opened (fork PR #1, branch fix/dap-empty-version-check) — verified tsc/lint/prettier + dap.spec green.

- 2026-09-09 self-found bug: `scan_status` filter queries phantom `coreResult.status` column (real column is `core_result.primary_scan_status`) in libs/database/src/websites/websites.service.ts + libs/database/src/analysis/analysis.service.ts — outcome pr-opened (fork PR #3, branch fix/scan-status-filter-column, commit f71cbb0) — verified tsc/eslint/prettier clean + targeted jest green + build:api compiles. Both DTOs advertise the filter; any use threw 'column coreResult.status does not exist'. No upstream issue/PR ever reported it (only closed PR #45 introduced the line).

## Mined gaps (discovered, not yet attempted)
- 2026-09-09 bug-fix: primary.ts calls `buildUrlScanResult(input, page, response, pageLogger)` directly in promiseAll, the ONLY scan not wrapped in the local `runScan` error-swallowing helper. If it throws, `Promise.all` rejects and the whole primary page fails instead of producing `urlScan:null` (which CoreResultService already null-guards). Repro: make buildUrlScanResult throw (e.g. page.url() throws / hash computation fails). Fix: wrap with runScan via an adapter that keeps buildUrlScanResult's own (input,page,response,parentLogger) signature; assert urlScan:null and scan completes. Dedupe: no upstream issue/PR for wrapping; issues #1980/#1986 reference the unreachable guard. — status: proposed (pick)
