import { extractFirstJSONObject } from "./json-from-js";

export function safeParseJsonOrFirstObject(txt: string): any | null {
  try {
    return JSON.parse(txt);
  } catch {}
  return extractFirstJSONObject(txt);
}
