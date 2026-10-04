export function getByPath(obj: unknown, path: string): unknown {
  if (obj == null || path === '') return undefined;
  const parts = path.split('.');
  let cur: unknown = obj;
  for (const part of parts) {
    if (cur == null || typeof cur !== 'object') return undefined;
    cur = (cur as Record<string, unknown>)[part];
  }
  return cur;
}
