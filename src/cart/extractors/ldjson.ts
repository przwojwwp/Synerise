import { allScripts, scriptText, scriptType } from "../../helpers/scripts";
import { safeParseJsonOrFirstObject } from "../../helpers/json";
import { isLdType, looksLikeLD } from "../../helpers/mime";
import {
  ldIsProduct,
  ldPickImage,
  ldPickName,
  ldPickPrice,
  ldPickUrl,
} from "../../helpers/json-pick";
import { getCanonicalUrl } from "../../helpers/url";
import type { ProductInfo } from "../../types/ProductInfo";
import type { ExtractOptions } from "../../types/ExtractOptions";


export const extractInfoFromLDJSON = (
  opts: ExtractOptions = {}
): ProductInfo | null => {
  const { fullScan = true, maxScripts = 8, maxChars } = opts;

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
  let checked = 0;

  const findProductNode = (n: any): any | null => {
    if (!n || typeof n !== "object") return null;
    if (ldIsProduct(n)) return n;
    const candidate =
      n.mainEntity ?? n.mainEntityOfPage ?? n.itemOffered ?? null;
    return ldIsProduct(candidate) ? candidate : null;
  };

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
          const prod = findProductNode(node);
          if (!prod) continue;

          const name = ldPickName(prod);
          const imageUrl = ldPickImage(prod);
          const { price, currency } = ldPickPrice(prod);
          const productUrl = ldPickUrl(prod) || getCanonicalUrl();

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

        const rootProd = findProductNode(r);
        if (rootProd) {
          const name = ldPickName(rootProd);
          const imageUrl = ldPickImage(rootProd);
          const { price, currency } = ldPickPrice(rootProd);
          const productUrl = ldPickUrl(rootProd) || getCanonicalUrl();

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
    }
  }

  return null;
};
