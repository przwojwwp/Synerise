import type { ExtractOptions } from "../types/ExtractOptions";
import { detectDataFormat } from "../utils/detectDataFormat/detectDataFormat";
import { extractNameFromAppJSON } from "./extractors/appjson";
import { extractNameFromLDJSON } from "./extractors/ldjson";

export const getProductName = (options: ExtractOptions = {}): string | null => {
  const { fullScan = true, maxScripts, maxChars } = options;

  const format = detectDataFormat(fullScan);

  if (format === "ld+json" || format === "both") {
    const n = extractNameFromLDJSON({ fullScan, maxScripts, maxChars });
    if (n) return n;
  }

  if (format === "json" || format === "both") {
    const n = extractNameFromAppJSON({ fullScan, maxScripts, maxChars });
    if (n) return n;
  }

  return null;
};
