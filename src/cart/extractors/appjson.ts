import {
  isAnyJsonButLd,
  looksLikeJsonPayload,
  looksLikeLD,
} from "../../helpers/mime";
import { scriptText, scriptType, allScripts } from "../../helpers/scripts";
import { safeParseJsonOrFirstObject } from "../../helpers/json";
import type { ExtractOptions } from "../../types/ExtractOptions";

export const extractNameFromAppJSON = (
  options: ExtractOptions = {}
): string | null => {
  const { fullScan = true, maxScripts = 8, maxChars } = options;

  const scripts = allScripts();

  const typedJSON: HTMLScriptElement[] = [];
  const noTypeButLooksJson: HTMLScriptElement[] = [];

  for (const s of scripts) {
    const t = scriptType(s);
    if (isAnyJsonButLd(t)) {
      typedJSON.push(s);
      continue;
    }
    const txt = scriptText(s, maxChars);
    if (!txt) continue;
    if (looksLikeJsonPayload(txt) && !looksLikeLD(txt)) {
      noTypeButLooksJson.push(s);
    }
  }

  const preferredIds = [
    /__NEXT_DATA__/,
    /__NUXT__/,
    /__APOLLO_STATE__/i,
    /__INITIAL_STATE__/i,
  ];
  const sortPreferred = (arr: HTMLScriptElement[]) =>
    arr.sort((a, b) => {
      const ap = preferredIds.some((rx) => rx.test(a.id || ""));
      const bp = preferredIds.some((rx) => rx.test(b.id || ""));
      return ap === bp ? 0 : ap ? -1 : 1;
    });

  sortPreferred(typedJSON);
  sortPreferred(noTypeButLooksJson);

  const buckets = [typedJSON, noTypeButLooksJson];

  const tryExtractName = (data: any): string | null => {
    const direct =
      data?.props?.pageProps?.product?.title ??
      data?.props?.pageProps?.product?.name ??
      data?.product?.title ??
      data?.product?.name ??
      data?.data?.product?.title ??
      data?.data?.product?.name ??
      data?.state?.product?.name ??
      data?.page?.product?.name ??
      data?.item?.name ??
      data?.item?.title;
    if (typeof direct === "string" && direct) return direct;

    const START =
      typeof performance !== "undefined" && performance.now
        ? performance.now()
        : Date.now();
    const TIME_BUDGET_MS = 120;
    const HARD_NODE_MAX = 20_000;
    const ARRAY_SLICE = 400;

    const q: any[] = [data];
    let visited = 0;

    const hasProductSignals = (obj: any) =>
      Object.keys(obj).some((k) =>
        /price|sku|brand|image|product|variant|availability|gtin|mpn|category/i.test(
          k
        )
      );

    while (q.length) {
      const now =
        typeof performance !== "undefined" && performance.now
          ? performance.now()
          : Date.now();
      if (now - START > TIME_BUDGET_MS) break;
      if (++visited > HARD_NODE_MAX) break;

      const node = q.shift();
      if (!node || typeof node !== "object") continue;

      if (Array.isArray(node)) {
        const n = Math.min(node.length, ARRAY_SLICE);
        for (let i = 0; i < n; i++) q.push(node[i]);
        continue;
      }

      const n = (node as any).name;
      const t = (node as any).title;
      const h = (node as any).headline;
      const candidate =
        (typeof n === "string" && n) ||
        (typeof t === "string" && t) ||
        (typeof h === "string" && h);

      if (candidate && hasProductSignals(node)) return candidate;

      for (const k in node as any) {
        const v = (node as any)[k];
        if (v && typeof v === "object") q.push(v);
      }
    }
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

      const name = tryExtractName(data);
      if (name) return name;
    }
  }

  return null;
};
