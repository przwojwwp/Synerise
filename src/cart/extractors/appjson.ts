import { allScripts, scriptText, scriptType } from "../../helpers/scripts";
import { safeParseJsonOrFirstObject } from "../../helpers/json";
import {
  isAnyJsonButLd,
  looksLikeJsonPayload,
  looksLikeLD,
} from "../../helpers/mime";
import {
  appPickImage,
  appPickName,
  appPickPrice,
  appPickUrl,
} from "../../helpers/json-pick";
import { getCanonicalUrl } from "../../helpers/url";
import type { ProductInfo } from "../../types/ProductInfo";
import type { ExtractOptions } from "../../types/ExtractOptions";

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
      const { price, currency } = appPickPrice(data);
      const imageUrl = appPickImage(data);
      const productUrl = appPickUrl(data) || getCanonicalUrl();

      if (name || imageUrl || price !== null) {
        return {
          name: name ?? null,
          price,
          currency,
          imageUrl: imageUrl ?? null,
          productUrl: productUrl ?? null,
        };
      }
    }
  }
  return null;
};
