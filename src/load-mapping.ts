import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import type { MappingConfig } from './types';

export function loadMappingConfig(repoRoot: string): MappingConfig {
  const yamlPath = path.join(repoRoot, 'config', 'attribute-mapping.yaml');
  const jsonPath = path.join(repoRoot, 'config', 'attribute-mapping.json');

  if (fs.existsSync(yamlPath)) {
    const raw = fs.readFileSync(yamlPath, 'utf8');
    return yaml.load(raw) as MappingConfig;
  }
  if (fs.existsSync(jsonPath)) {
    return JSON.parse(fs.readFileSync(jsonPath, 'utf8')) as MappingConfig;
  }
  throw new Error('No mapping config found in config/');
}
