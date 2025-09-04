import type { ExtractOptions } from "../types/ExtractOptions";
import { detectDataFormat } from "../utils/detectDataFormat/detectDataFormat";
import { extractInfoFromLDJSON } from "./extractors/ldjson";
import { extractInfoFromAppJSON } from "./extractors/appjson";
import {
  domFallbackImage,
  domFallbackName,
  domFallbackPrice,
} from "../helpers/dom-fallback";
import { getCanonicalUrl } from "../helpers/url";
import type { ProductInfo } from "../types/ProductInfo";

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
  const { price, currency } = domFallbackPrice();
  const imageUrl = domFallbackImage();
  const productUrl = getCanonicalUrl();

  return {
    name,
    price,
    currency,
    imageUrl,
    productUrl,
  };
};

export const getProductName = (options: ExtractOptions = {}): string | null => {
  const info = getProductInfo(options);
  return info.name;
};
