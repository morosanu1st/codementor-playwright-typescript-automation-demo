import { test, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';
import { loadMappingConfig } from '../src/load-mapping';
import { ingestSource } from '../src/ingest-source';
import { buildMdrOutput, writeOutputs } from '../src/build-mdr-output';

const REPO_ROOT = path.resolve(__dirname, '..');

test.describe('COBRA → MDR attribute mapping pipeline', () => {
  test('ingests source JSON, extracts COBRA UI fields, writes MDR output with traceability', async ({
    page,
  }) => {
    const config = loadMappingConfig(REPO_ROOT);
    const source = ingestSource(REPO_ROOT, config);

    expect(source.productInstanceId).toBeTruthy();
    expect(source.aodlBlocks.length).toBeGreaterThan(0);

    const uiPage = path.join(REPO_ROOT, config.sources.cobraUi.page);
    await page.goto('file://' + uiPage);

    await expect(page.getByTestId('cobra-product-panel')).toBeVisible();

    const uiValues: Record<string, string | null> = {};
    for (const rule of config.mappings) {
      const el = page.locator(rule.cobraSelector);
      await expect(el, `selector ${rule.cobraSelector} for ${rule.mdrField}`).toBeVisible();
      uiValues[rule.mdrField] = (await el.textContent())?.trim() ?? null;
    }

    const mdr = buildMdrOutput(config, source, uiValues);
    const { mdrPath, logPath } = writeOutputs(REPO_ROOT, config, mdr);

    expect(fs.existsSync(mdrPath)).toBe(true);
    expect(fs.existsSync(logPath)).toBe(true);

    const mdrWritten = JSON.parse(fs.readFileSync(mdrPath, 'utf8'));
    const logWritten = JSON.parse(fs.readFileSync(logPath, 'utf8'));

    expect(mdrWritten.productInstanceId).toBe(source.productInstanceId);
    expect(Object.keys(mdrWritten.fields).length).toBe(config.mappings.length);
    expect(logWritten.summary.total).toBe(config.mappings.length);
    expect(logWritten.summary.matched).toBe(config.mappings.length);

    // Spot-check a few mapped fields
    expect(mdrWritten.fields.mdr_plan_code).toBe('COB-ENT-01');
    expect(mdrWritten.fields.mdr_subscriber_id).toBe('SUB-77821');
    expect(mdrWritten.fields.mdr_coverage_tier).toBe('employee_plus_family');

    // Every trace entry links source attr → UI selector → MDR field
    for (const entry of logWritten.entries) {
      expect(entry.sourceAttr).toBeTruthy();
      expect(entry.mdrField).toBeTruthy();
      expect(entry.uiSelector).toMatch(/^#cobra-/);
      expect(entry.match).toBe(true);
    }
  });

  test('mapping config drives selectors — no hard-coded field list in UI scrape', async ({
    page,
  }) => {
    const config = loadMappingConfig(REPO_ROOT);
    const uiPage = path.join(REPO_ROOT, config.sources.cobraUi.page);
    await page.goto('file://' + uiPage);

    // Adding a mapping in YAML is enough to pick up a new field;
    // this test asserts the config ↔ DOM contract for all rules.
    for (const rule of config.mappings) {
      const text = await page.locator(rule.cobraSelector).innerText();
      expect(text.trim().length, rule.mdrField).toBeGreaterThan(0);
    }
  });
});
