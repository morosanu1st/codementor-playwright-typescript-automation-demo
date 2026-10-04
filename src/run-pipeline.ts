/**
 * Standalone pipeline runner (same steps as the Playwright test).
 * Usage: npm run pipeline
 */
import path from 'path';
import { chromium } from '@playwright/test';
import { loadMappingConfig } from './load-mapping';
import { ingestSource } from './ingest-source';
import { buildMdrOutput, writeOutputs } from './build-mdr-output';

async function main() {
  const repoRoot = path.resolve(__dirname, '..');
  const config = loadMappingConfig(repoRoot);
  const source = ingestSource(repoRoot, config);

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const uiPage = path.join(repoRoot, config.sources.cobraUi.page);
  await page.goto('file://' + uiPage);

  const uiValues: Record<string, string | null> = {};
  for (const rule of config.mappings) {
    uiValues[rule.mdrField] =
      (await page.locator(rule.cobraSelector).textContent())?.trim() ?? null;
  }
  await browser.close();

  const mdr = buildMdrOutput(config, source, uiValues);
  const { mdrPath, logPath } = writeOutputs(repoRoot, config, mdr);

  const matched = mdr.traceability.filter((t) => t.match).length;
  console.log(`Product instance: ${mdr.productInstanceId}`);
  console.log(`MDR fields written: ${Object.keys(mdr.fields).length}`);
  console.log(`Traceability: ${matched}/${mdr.traceability.length} matched`);
  console.log(`→ ${mdrPath}`);
  console.log(`→ ${logPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
