import type { ExtractOptions } from "@/types/ExtractOptions";
import type { ProductInfo } from "@/types/ProductInfo";
import { detectDataFormat } from "@/utils/detectDataFormat/detectDataFormat";
import { extractInfoFromLDJSON } from "./extractors/ldjson";
import { extractInfoFromAppJSON } from "./extractors/appjson";
import {
  domFallbackImage,
  domFallbackName,
  domFallbackPrice,
} from "@/lib/dom/dom-fallback";
import { getCanonicalUrl } from "@/lib/web/url";

const pick = <T>(...vals: (T | null | undefined)[]): T | null => {
  for (const v of vals) if (v !== null && v !== undefined) return v as T;
  return null;
};

export const getProductInfo = (options: ExtractOptions = {}): ProductInfo => {
  const { fullScan = true, maxScripts, maxChars } = options;

  const format = detectDataFormat(fullScan);
  let fromLD: ProductInfo | null = null;
  let fromAPP: ProductInfo | null = null;

  if (format === "ld+json" || format === "both") {
    fromLD = extractInfoFromLDJSON({ fullScan, maxScripts, maxChars });
  }
  if (format === "json" || format === "both") {
    fromAPP = extractInfoFromAppJSON({ fullScan, maxScripts, maxChars });
  }

  if (!fromLD)
    fromLD = extractInfoFromLDJSON({ fullScan, maxScripts, maxChars }) || null;
  if (!fromAPP)
    fromAPP =
      extractInfoFromAppJSON({ fullScan, maxScripts, maxChars }) || null;

  const domName = domFallbackName();
  const domPrice = domFallbackPrice();
  const domImg = domFallbackImage();
  const canon = getCanonicalUrl();

  const name = pick(fromLD?.name, fromAPP?.name, domName);
  const price = pick(fromLD?.price, fromAPP?.price, domPrice);
  const imageUrl = pick(fromLD?.imageUrl, fromAPP?.imageUrl, domImg);
  const productUrl = pick(fromLD?.productUrl, fromAPP?.productUrl, canon);

  return { name, price, imageUrl, productUrl };
};
