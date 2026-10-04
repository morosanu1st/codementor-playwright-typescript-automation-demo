import fs from 'fs';
import path from 'path';
import type { MappingConfig } from './types';
import { getByPath } from './path-utils';

export interface IngestedSource {
  productInstanceId: string;
  payload: Record<string, unknown>;
  aodlBlocks: Array<{ label: string; value: string }>;
}

export function ingestSource(repoRoot: string, config: MappingConfig): IngestedSource {
  const jsonPath = path.join(repoRoot, config.sources.json.path);
  const aodlPath = path.join(repoRoot, config.sources.aodl.path);

  const payload = JSON.parse(fs.readFileSync(jsonPath, 'utf8')) as Record<string, unknown>;
  const aodl = JSON.parse(fs.readFileSync(aodlPath, 'utf8')) as {
    extractedTextBlocks?: Array<{ label: string; value: string }>;
  };

  const productInstanceId = String(
    getByPath(payload, config.productInstanceKey) ?? 'UNKNOWN'
  );

  return {
    productInstanceId,
    payload,
    aodlBlocks: aodl.extractedTextBlocks ?? [],
  };
}

export function readSourceAttr(
  source: IngestedSource,
  sourceAttr: string
): unknown {
  return getByPath(source.payload, sourceAttr);
}
