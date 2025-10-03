import { JSONPath } from "jsonpath-plus";

export function extractByJsonPath<T = unknown>(
  payload: unknown,
  path: string
): T | undefined {
  try {
    if (!path || path === "$") return payload as T;
    const result = JSONPath({ path, json: payload }) as T[];
    return result && result.length ? result[0] : undefined;
  } catch {
    return undefined;
  }
}
