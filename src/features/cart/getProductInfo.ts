import type { ExtractOptions } from "@/types/ExtractOptions";
import type { ProductInfo } from "@/types/ProductInfo";
import { detectDataFormat } from "@/utils/detectDataFormat/detectDataFormat";
import { extractInfoFromLDJSON } from "./extractors/ldjson";
import { extractInfoFromAppJSON } from "./extractors/appjson";
import { domFallbackImage, domFallbackName, domFallbackPrice } from "@/lib/dom/dom-fallback";
import { getCanonicalUrl } from "@/lib/web/url";

export const getProductInfo = (options: ExtractOptions = {}): ProductInfo => {
  const { fullScan = true, maxScripts, maxChars } = options;

  const format = detectDataFormat(fullScan);

  if (format === "ld+json" || format === "both") {
    const info = extractInfoFromLDJSON({ fullScan, maxScripts, maxChars });
    if (info) return info;
  }
  if (format === "json" || format === "both") {
    const info = extractInfoFromAppJSON({ fullScan, maxScripts, maxChars });
    if (info) return info;
  }

  const name = domFallbackName();
  const price = domFallbackPrice();
  const imageUrl = domFallbackImage();
  const productUrl = getCanonicalUrl();

  return {
    name,
    price,
    imageUrl,
    productUrl,
  };
};
