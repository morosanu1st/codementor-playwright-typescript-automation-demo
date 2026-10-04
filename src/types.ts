export interface MappingRule {
  sourceAttr: string;
  mdrField: string;
  cobraSelector: string;
  description: string;
}

export interface MappingConfig {
  version: string;
  productInstanceKey: string;
  sources: {
    json: { path: string };
    aodl: { path: string };
    cobraUi: { page: string };
  };
  mappings: MappingRule[];
  output: {
    mdrTabFile: string;
    traceabilityLog: string;
  };
}

export interface TraceEntry {
  mdrField: string;
  sourceAttr: string;
  sourceValue: unknown;
  uiValue: string | null;
  uiSelector: string;
  match: boolean;
  description: string;
  timestamp: string;
}

export interface MdrTabOutput {
  productInstanceId: string;
  generatedAt: string;
  fields: Record<string, unknown>;
  traceability: TraceEntry[];
}
