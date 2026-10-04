import fs from 'fs';
import path from 'path';
import type { MappingConfig, MdrTabOutput, TraceEntry } from './types';
import type { IngestedSource } from './ingest-source';
import { readSourceAttr } from './ingest-source';

function valuesMatch(sourceValue: unknown, uiValue: string | null): boolean {
  if (uiValue == null) return false;
  if (sourceValue == null) return false;
  const left = String(sourceValue).trim();
  const right = uiValue.trim();
  // Numeric compare for premiums etc.
  const nLeft = Number(left);
  const nRight = Number(right);
  if (!Number.isNaN(nLeft) && !Number.isNaN(nRight)) {
    return nLeft === nRight;
  }
  return left === right;
}

export function buildMdrOutput(
  config: MappingConfig,
  source: IngestedSource,
  uiValues: Record<string, string | null>
): MdrTabOutput {
  const now = new Date().toISOString();
  const fields: Record<string, unknown> = {};
  const traceability: TraceEntry[] = [];

  for (const rule of config.mappings) {
    const sourceValue = readSourceAttr(source, rule.sourceAttr);
    const uiValue = uiValues[rule.mdrField] ?? null;
    // Prefer UI value when present (simulates "extract from COBRA UI into MDR");
    // fall back to source for fields the UI might omit.
    const mdrValue = uiValue != null && uiValue !== '' ? uiValue : sourceValue;
    fields[rule.mdrField] = mdrValue;

    traceability.push({
      mdrField: rule.mdrField,
      sourceAttr: rule.sourceAttr,
      sourceValue,
      uiValue,
      uiSelector: rule.cobraSelector,
      match: valuesMatch(sourceValue, uiValue),
      description: rule.description,
      timestamp: now,
    });
  }

  return {
    productInstanceId: source.productInstanceId,
    generatedAt: now,
    fields,
    traceability,
  };
}

export function writeOutputs(
  repoRoot: string,
  config: MappingConfig,
  mdr: MdrTabOutput
): { mdrPath: string; logPath: string } {
  const mdrPath = path.join(repoRoot, config.output.mdrTabFile);
  const logPath = path.join(repoRoot, config.output.traceabilityLog);

  fs.mkdirSync(path.dirname(mdrPath), { recursive: true });
  fs.mkdirSync(path.dirname(logPath), { recursive: true });

  const { traceability, ...mdrFieldsOnly } = mdr;
  fs.writeFileSync(mdrPath, JSON.stringify(mdrFieldsOnly, null, 2) + '\n', 'utf8');
  fs.writeFileSync(
    logPath,
    JSON.stringify(
      {
        productInstanceId: mdr.productInstanceId,
        generatedAt: mdr.generatedAt,
        summary: {
          total: traceability.length,
          matched: traceability.filter((t) => t.match).length,
          mismatched: traceability.filter((t) => !t.match).length,
        },
        entries: traceability,
      },
      null,
      2
    ) + '\n',
    'utf8'
  );

  return { mdrPath, logPath };
}
