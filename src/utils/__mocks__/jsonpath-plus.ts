export const JSONPath = ({ path, json }: { path: string; json: any }) => {
  function resolvePath(obj: any, p: string): any {
    if (!p || p === "$") return obj;
    if (p.startsWith("$.") ) p = p.slice(2);
    const parts = p.split(".");
    let cur = obj;
    for (const part of parts) {
      if (cur == null) return undefined;
      cur = cur[part as keyof typeof cur];
    }
    return cur;
  }
  const val = resolvePath(json, path);
  return val === undefined ? [] : [val];
};
