import { isAnyJsonButLd, isLdType, looksLikeLD } from "../../helpers/mime";
import { MAX_CHARS, scriptText, scriptType } from "../../helpers/scripts";
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

  const { maxScripts = 8, maxChars = MAX_CHARS, fullScan = false } = options;

  let checked = 0;
  for (const s of scripts) {
    if (!fullScan && checked >= maxScripts) break;

    const type = scriptType(s).toLowerCase();
    const content = scriptText(s, maxChars);

    // 1) MIME (pewniaki)
    if (isLdType(type)) hasLD = true;
    else if (isAnyJsonButLd(type)) hasJSON = true;

    // 2) Heurystyki (fallback)
    if (content) {
      if (looksLikeLD(content) && /"Product"/i.test(content)) hasLD = true;
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
