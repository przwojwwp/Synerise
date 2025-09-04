export function extractFirstJSONObject(txt: string): any | null {
  const firstBrace = txt.indexOf("{");
  if (firstBrace < 0) return null;

  let i = firstBrace,
    depth = 0,
    inStr = false,
    esc = false;
  for (; i < txt.length; i++) {
    const ch = txt[i];
    if (inStr) {
      esc = ch === "\\" ? !esc : false;
      if (ch === '"' && !esc) inStr = false;
      continue;
    }
    if (ch === '"') {
      inStr = true;
      continue;
    }
    if (ch === "{") depth++;
    else if (ch === "}") {
      depth--;
      if (depth === 0) {
        const slice = txt.slice(firstBrace, i + 1);
        try {
          return JSON.parse(slice);
        } catch {
          return null;
        }
      }
    }
  }
  return null;
}
