import { safeParseJsonOrFirstObject } from "@/lib/json/json-parse";
import { appPickImage, appPickName, appPickPrice, appPickUrl } from "@/lib/json/json-pick";
import { isAnyJsonButLd, looksLikeJsonPayload, looksLikeLD } from "@/lib/web/mime";
import { allScripts, scriptText, scriptType } from "@/lib/web/scripts";
import { getCanonicalUrl } from "@/lib/web/url";
import type { ExtractOptions } from "@/types/ExtractOptions";
import type { ProductInfo } from "@/types/ProductInfo";


export const extractInfoFromAppJSON = (
  opts: ExtractOptions = {}
): ProductInfo | null => {
  const { fullScan = true, maxScripts = 8, maxChars } = opts;

  const scripts = allScripts();
  const typedJSON: HTMLScriptElement[] = [];
  const looksJSON: HTMLScriptElement[] = [];

  for (const s of scripts) {
    const t = scriptType(s);
    if (isAnyJsonButLd(t)) {
      typedJSON.push(s);
      continue;
    }
    const txt = scriptText(s, maxChars);
    if (txt && looksLikeJsonPayload(txt) && !looksLikeLD(txt)) {
      looksJSON.push(s);
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
  sortPreferred(looksJSON);

  const buckets = [typedJSON, looksJSON];
  let checked = 0;

  for (const bucket of buckets) {
    for (const s of bucket) {
      if (!fullScan && checked >= maxScripts) return null;
      checked++;

      const txt = scriptText(s, maxChars);
      if (!txt) continue;

      const data = safeParseJsonOrFirstObject(txt);
      if (!data) continue;

      const name = appPickName(data);
      const price = appPickPrice(data);
      const imageUrl = appPickImage(data);
      const productUrl = appPickUrl(data) || getCanonicalUrl();

      if (name || imageUrl || price !== null) {
        return {
          name: name ?? null,
          price,
          imageUrl: imageUrl ?? null,
          productUrl: productUrl ?? null,
        };
      }
    }
  }
  return null;
};
