import { fullDetectDataFormat } from "../utils/detectDataFormat";
import { extractNameFromAppJSON } from "./extractors/appjson";
import { extractNameFromLDJSON } from "./extractors/ldjson";

export const getProductName = (): string | null => {
  const format = fullDetectDataFormat();

  if (format === "ld+json" || format === "both") {
    const n = extractNameFromLDJSON();
    if (n) return n;
  }

  if (format === "json" || format === "both") {
    const n = extractNameFromAppJSON();
    if (n) return n;
  }

  return null;
};
