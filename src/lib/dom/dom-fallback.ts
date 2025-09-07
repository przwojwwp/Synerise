import { toAbsUrl } from "../web/url";

const getMeta = (sel: string) =>
  document.querySelector<HTMLMetaElement>(sel)?.content?.trim() || null;

export const domFallbackName = (): string | null =>
  getMeta('meta[property="og:title"]') ||
  getMeta('meta[name="twitter:title"]') ||
  document.title?.trim() ||
  null;

export const normalizePrice = (raw?: string | null): number | null => {
  if (!raw) return null;
  const cleaned = raw
    .replace(/\s+/g, "")
    .replace(/[^\d.,-]/g, "")
    .replace(/,(\d{1,2})$/, ".$1");
  const normalized = cleaned.replace(/(?<=\d)[.,](?=\d{3}(\D|$))/g, "");
  const n = parseFloat(normalized.replace(",", "."));
  return Number.isFinite(n) ? n : null;
};

export const domFallbackPrice = (): number | null => {
  const amount =
    getMeta('meta[property="product:price:amount"]') ||
    getMeta('meta[property="og:price:amount"]') ||
    getMeta('meta[itemprop="price"]') ||
    document
      .querySelector<HTMLElement>('[itemprop="price"]')
      ?.getAttribute("content") ||
    document
      .querySelector<HTMLElement>('[itemprop="price"]')
      ?.textContent?.trim() ||
    null;

  return normalizePrice(amount);
};

export const domFallbackImage = (): string | null => {
  const og = getMeta('meta[property="og:image"]');
  const tw =
    getMeta('meta[name="twitter:image"]') ||
    getMeta('meta[name="twitter:image:src"]');
  const img = document.querySelector<HTMLImageElement>("img[src]")?.src || null;
  return toAbsUrl(og || tw || img);
};
