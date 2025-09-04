import { toAbsUrl } from "./url";

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

export const domFallbackPrice = (): {
  price: number | null;
  currency: string | null;
} => {
  const amount =
    getMeta('meta[property="product:price:amount"]') ||
    getMeta('meta[property="og:price:amount"]') ||
    getMeta('meta[itemprop="price"]');
  const currency =
    getMeta('meta[property="product:price:currency"]') ||
    getMeta('meta[property="og:price:currency"]') ||
    getMeta('meta[itemprop="priceCurrency"]') ||
    null;
  return { price: normalizePrice(amount), currency };
};

export const domFallbackImage = (): string | null => {
  const og = getMeta('meta[property="og:image"]');
  const tw =
    getMeta('meta[name="twitter:image"]') ||
    getMeta('meta[name="twitter:image:src"]');
  const img = document.querySelector<HTMLImageElement>("img[src]")?.src || null;
  return toAbsUrl(og || tw || img);
};
