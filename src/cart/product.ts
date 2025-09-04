import { detectDataFormat } from "../utils/detectDataFormat/detectDataFormat";
import { extractNameFromAppJSON } from "./extractors/appjson";
import { extractNameFromLDJSON } from "./extractors/ldjson";

type GetNameOptions = {
  fullScan?: boolean;
  maxScripts?: number;
};

export const getProductName = (options: GetNameOptions = {}): string | null => {
  const { fullScan = true, maxScripts } = options;

  const format = detectDataFormat(fullScan);

  if (format === "ld+json" || format === "both") {
    const n = extractNameFromLDJSON({ fullScan, maxScripts });
    if (n) return n;
  }

  if (format === "json" || format === "both") {
    const n = extractNameFromAppJSON({ fullScan, maxScripts });
    if (n) return n;
  }

  return null;
};
