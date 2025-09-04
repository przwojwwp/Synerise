export const MAX_CHARS = 300_000;

export type ScanOptions = {
  fullScan?: boolean;
  maxScripts?: number;
  maxChars?: number;
};

export const allScripts = () =>
  Array.from(document.querySelectorAll<HTMLScriptElement>("script"));

export const scriptType = (s: HTMLScriptElement) => (s.type || "").trim();

export const scriptText = (s: HTMLScriptElement, max = MAX_CHARS) =>
  (s.textContent || "").slice(0, max).trim();
