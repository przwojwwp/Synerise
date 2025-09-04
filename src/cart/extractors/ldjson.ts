import { isLdType, looksLikeLD } from "../../helpers/mime";
import { scriptText, scriptType, allScripts } from "../../helpers/scripts";
import { safeParseJsonOrFirstObject } from "../../helpers/json";
import type { ExtractOptions } from "../../types/ExtractOptions";

export const extractNameFromLDJSON = (
  options: ExtractOptions = {}
): string | null => {
  const { fullScan = true, maxScripts = 8, maxChars } = options;

  const scripts = allScripts();
  const typedLD: HTMLScriptElement[] = [];
  const looksLD: HTMLScriptElement[] = [];

  for (const s of scripts) {
    const t = scriptType(s);
    if (isLdType(t)) {
      typedLD.push(s);
      continue;
    }
    const txt = scriptText(s, maxChars);
    if (txt && looksLikeLD(txt)) looksLD.push(s);
  }

  const buckets = [typedLD, looksLD];

  const isProduct = (n: any): boolean => {
    const t = Array.isArray(n?.["@type"]) ? n["@type"] : [n?.["@type"]];
    return t.some((x: any) => String(x).toLowerCase() === "product");
  };

  const pick = (v: any): string | null => {
    if (!v) return null;
    if (typeof v === "string") return v || null;
    if (Array.isArray(v)) {
      for (const el of v) {
        const s = pick(el);
        if (s) return s;
      }
      return null;
    }
    if (typeof v === "object") {
      if (typeof v["@value"] === "string" && v["@value"]) return v["@value"];
      if (typeof (v as any).value === "string" && (v as any).value)
        return (v as any).value;
    }
    return null;
  };

  const nameFrom = (n: any): string | null =>
    pick(n?.name) || pick(n?.headline) || pick(n?.offers?.name) || null;

  const fromNode = (n: any): string | null => {
    if (!n) return null;
    if (isProduct(n)) {
      const c = nameFrom(n);
      if (c) return c;
    }
    const c1 = nameFrom(n?.mainEntity || n?.mainEntityOfPage);
    if (c1) return c1;
    const c2 = nameFrom(n?.itemOffered);
    if (c2) return c2;
    return null;
  };

  let checked = 0;
  for (const bucket of buckets) {
    for (const s of bucket) {
      if (!fullScan && checked >= maxScripts) return null;
      checked++;

      const txt = scriptText(s, maxChars);
      if (!txt) continue;

      const data = safeParseJsonOrFirstObject(txt);
      if (!data) continue;

      const roots = Array.isArray(data) ? data : [data];

      for (const r of roots) {
        const nodes = Array.isArray(r?.["@graph"]) ? r["@graph"] : [r];
        for (const node of nodes) {
          const c = fromNode(node);
          if (c) return c;
        }
        const cr = fromNode(r);
        if (cr) return cr;
      }
    }
  }

  return null;
};
