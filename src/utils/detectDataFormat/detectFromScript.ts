import { isAnyJsonButLd, isLdType, looksLikeLD } from "@/lib/web/mime";
import { scriptText, scriptType } from "@/lib/web/scripts";
import type { DataFormat } from "@/types/DataFormat";
import type { DetectOptions } from "@/types/DetectOptions";

export const detectFromScripts = (
  scripts: HTMLScriptElement[],
  options: DetectOptions = {}
): DataFormat => {
  let hasLD = false;
  let hasJSON = false;

  const { maxScripts = 8, maxChars, fullScan = true } = options;

  let checked = 0;
  for (const s of scripts) {
    if (!fullScan && checked >= maxScripts) break;

    const type = scriptType(s).toLowerCase();
    const content = scriptText(s, maxChars);

    if (isLdType(type)) hasLD = true;
    else if (isAnyJsonButLd(type)) hasJSON = true;

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
