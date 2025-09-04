import type { DataFormat } from "../../types/DataFormat";

export type DetectOptions = {
  maxScripts?: number;
  maxChars?: number;
  fullScan?: boolean;
};

export const detectFromScripts = (
  scripts: HTMLScriptElement[],
  options: DetectOptions = {}
): DataFormat => {
  let hasLD = false;
  let hasJSON = false;

  const { maxScripts = 8, maxChars = 150_000, fullScan = false } = options;

  let checked = 0;
  for (const s of scripts) {
    if (!fullScan && checked >= maxScripts) break;
    const type = (s.type || "").toLowerCase();
    const content = (s.textContent || "").trim();

    if (type.startsWith("application/ld+json")) hasLD = true;
    else if (
      type.startsWith("application/json") ||
      (type.includes("+json") && !type.includes("ld+json"))
    ) {
      hasJSON = true;
    }

    if (content && content.length <= maxChars) {
      if (
        /"@context"\s*:/.test(content) &&
        /"@type"\s*:/.test(content) &&
        /"Product"/.test(content)
      ) {
        hasLD = true;
      }
      if (
        /"product"\s*:/.test(content) &&
        (/"name"\s*:/.test(content) || /"title"\s*:/.test(content))
      ) {
        hasJSON = true;
      }
    }

    checked++;
    if (hasLD && hasJSON) return "both";
  }

  if (hasLD && hasJSON) return "both";
  if (hasLD) return "ld+json";
  if (hasJSON) return "json";
  return "none";
};
