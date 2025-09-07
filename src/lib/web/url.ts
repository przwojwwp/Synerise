export const toAbsUrl = (u?: string | null): string | null => {
  if (!u || typeof u !== "string") return null;
  try {
    return new URL(u, document.baseURI).toString();
  } catch {
    return null;
  }
};

export const getCanonicalUrl = (): string | null => {
  const can = document.querySelector<HTMLLinkElement>(
    'link[rel="canonical"]'
  )?.href;
  const og = document.querySelector<HTMLMetaElement>(
    'meta[property="og:url"]'
  )?.content;
  return toAbsUrl(can || og || window.location.href);
};
