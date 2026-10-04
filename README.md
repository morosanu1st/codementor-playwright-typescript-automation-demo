# Playwright + TypeScript Automation Demo

Minimal but real **Playwright + TypeScript** pipeline that shows how to:

1. **Ingest** source attributes from inbound JSON / form payloads (and an AODL-style PDF text stub)
2. **Extract** target values from a stub **COBRA UI** page into MDR Tab–style fields for the same product instance
3. **Maintain** a configurable attribute → field mapping (YAML/JSON) with a **traceability log** from source → UI selector → MDR field

This repo is a teaching / architecture demo for structuring the same kind of automation work on a real product UI.

---

## What this demo shows

| Piece | Location | Role |
|--------|----------|------|
| Inbound JSON + form fields | `fixtures/inbound-product.json` | Source attributes for one product instance |
| AODL stub | `fixtures/aodl-stub.json` | Stand-in for PDF / AODL text extraction |
| Mapping config | `config/attribute-mapping.yaml` (JSON twin too) | Source attr → MDR field name → COBRA CSS selector |
| COBRA UI stub | `pages/cobra-ui-stub.html` | Tiny HTML “app” Playwright scrapes |
| Pipeline logic | `src/` | Load mapping → ingest → extract → write MDR + log |
| Playwright tests | `tests/mdr-pipeline.spec.ts` | End-to-end proof the mapping drives extraction |

**Traceability:** every MDR field records which source path it came from, which UI selector was scraped, whether source and UI values matched, and a short description — useful for audits and for changing mappings without rewriting tests.

---

## How I’d help structure this for a real engagement

Tutor-style approach (same patterns you’d apply on a live COBRA / MDR stack):

1. **Pipeline stages, not one giant script**  
   Separate *ingest* → *UI extract* → *map & write* so each stage can be unit-tested and swapped (e.g. real PDF parser later).

2. **Config-driven mapping**  
   Keep selectors and field names in YAML/JSON. Product teams can add rows without touching Playwright code. Version the mapping file in git for change history.

3. **Stable Playwright selectors**  
   Prefer `data-testid` / stable ids (`#cobra-plan-code`) over brittle text or layout XPath. Pair each mapping row with one selector.

4. **Traceability as a first-class output**  
   Emit a log that proves *source attr X → UI selector Y → MDR field Z* for every product instance. That’s how you debug mismatches and satisfy “where did this value come from?” questions.

5. **CI-ready**  
   `npx playwright test` is headless Chromium by default — drop into GitHub Actions / any CI with `npx playwright install --with-deps`.

6. **Extend next**  
   Real AODL/PDF parsing, auth against the real COBRA app, soft assertions + screenshots on mismatch, and a small CLI to re-run mapping for a batch of product IDs.

---

## Project layout

```
├── config/
│   ├── attribute-mapping.yaml   # preferred mapping source
│   └── attribute-mapping.json   # same mapping as JSON
├── fixtures/
│   ├── inbound-product.json     # sample JSON/form payload
│   └── aodl-stub.json           # AODL/PDF text-extract stub
├── pages/
│   └── cobra-ui-stub.html       # stub COBRA UI to scrape
├── src/
│   ├── types.ts
│   ├── path-utils.ts
│   ├── load-mapping.ts
│   ├── ingest-source.ts
│   ├── build-mdr-output.ts
│   └── run-pipeline.ts          # optional CLI runner
├── tests/
│   └── mdr-pipeline.spec.ts
├── playwright.config.ts
├── package.json
└── tsconfig.json
```

---

## How to run

Requirements: Node.js 18+ (20+ recommended).

```bash
npm install
npx playwright install chromium
npx playwright test
```

Optional: run the same pipeline outside the test runner:

```bash
npm run pipeline
```

Artifacts (gitignored):

- `output/mdr-tab-fields.json` — mapped MDR Tab fields for the product instance  
- `output/traceability-log.json` — source ↔ UI ↔ MDR audit trail  

---

## Mapping example

```yaml
- sourceAttr: attributes.planCode
  mdrField: mdr_plan_code
  cobraSelector: "#cobra-plan-code"
  description: Plan / COBRA code
```

Change the selector or add a new row in `config/attribute-mapping.yaml`, re-run the tests — no code change required for new fields that already exist on the UI stub.

---

## License

MIT — feel free to reuse the structure for your own Playwright + TypeScript automation work.
