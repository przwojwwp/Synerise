import { toAbsUrl } from "@/lib/web/url";

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
    .replace(/\u00A0/g, " ")
    .replace(/\s+/g, "")
    .replace(/[^\d.,-]/g, "")
    .replace(/,(\d{1,2})$/, ".$1");
  const normalized = cleaned.replace(/(?<=\d)[.,](?=\d{3}(\D|$))/g, "");
  const n = parseFloat(normalized.replace(",", "."));
  return Number.isFinite(n) ? n : null;
};

export const domFallbackImage = (): string | null => {
  const og = getMeta('meta[property="og:image"]');
  const tw =
    getMeta('meta[name="twitter:image"]') ||
    getMeta('meta[name="twitter:image:src"]');
  const img = document.querySelector<HTMLImageElement>("img[src]")?.src || null;
  return toAbsUrl(og || tw || img);
};

export const domFallbackPrice = (): number | null => {
  {
    const amount =
      getMeta('meta[property="product:price:amount"]') ||
      getMeta('meta[property="og:price:amount"]') ||
      document
        .querySelector<HTMLElement>('[itemprop="price"]')
        ?.getAttribute("content") ||
      document
        .querySelector<HTMLElement>('[itemprop="price"]')
        ?.textContent?.trim() ||
      null;

    const n = normalizePrice(amount);
    if (n !== null) return n;
  }

  {
    const candidates = document.querySelectorAll<HTMLElement>(
      [
        '[data-testid*="price" i]',
        '[data-test*="price" i]',
        '[data-qa*="price" i]',
        '[class*="price" i]',
        '[id*="price" i]',
        '[aria-label*="price" i]',
        '[itemprop*="price" i]',
        "[data-price]",
        "[data-amount]",
        "[data-price-amount]",
        "[data-current-price]",
      ].join(",")
    );

    for (const el of candidates) {
      for (const { name, value } of Array.from(el.attributes)) {
        if (!value) continue;
        if (/price|amount/i.test(name)) {
          const direct = normalizePrice(value);
          if (direct !== null) return direct;
          if (/^\d+$/.test(value) && +value > 1000) return +value / 100;
        }
      }
      const n1 = normalizePrice(el.textContent?.trim() || "");
      if (n1 !== null) return n1;

      for (const child of Array.from(el.children)) {
        const n2 = normalizePrice(child.textContent?.trim() || "");
        if (n2 !== null) return n2;
      }
    }
  }

  {
    const CURRENCY = /(zł|pln|€|eur|£|gbp|\$|usd|¥|jpy|₽|₴|₺|₩|₹)/i;
    const nodes = document.querySelectorAll<HTMLElement>(
      "span,div,dd,dt,p,b,strong,em"
    );
    let checked = 0;
    for (const el of nodes) {
      if (checked++ > 2000) break;
      const txt = el.textContent?.trim() || "";
      if (!txt || !CURRENCY.test(txt)) continue;
      if (/\/\s?(mies|msc|month|mo)\b/i.test(txt)) continue;
      const n = normalizePrice(txt);
      if (n !== null) return n;
    }
  }

  return null;
};
