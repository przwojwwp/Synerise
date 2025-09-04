export const isLdType = (t: string) => /^\s*application\/ld\+json\b/i.test(t);

export const isPlainJsonType = (t: string) =>
  /^\s*application\/json\b/i.test(t);

export const isVendorJsonType = (t: string) =>
  /^\s*[\w.-]+\/[\w.+-]*\+json\b/i.test(t);

export const isAnyJsonButLd = (t: string) =>
  isPlainJsonType(t) || (isVendorJsonType(t) && !/ld\+json/i.test(t));

export const looksLikeLD = (txt: string) =>
  /"@context"\s*:/.test(txt) && /"@type"\s*:/.test(txt);

export const looksLikeJsonPayload = (txt: string) => /^[\[{]/.test(txt);
