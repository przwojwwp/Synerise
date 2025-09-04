export const MAX_CHARS = 300_000;

export const allScripts = () =>
  Array.from(document.querySelectorAll<HTMLScriptElement>("script"));

export const scriptType = (s: HTMLScriptElement) => (s.type || "").trim();

export const scriptText = (s: HTMLScriptElement, max?: number) => {
  const txt = (s.textContent || "").trim();
  if (max == null) return txt;
  return txt.slice(0, max).trim();
};
