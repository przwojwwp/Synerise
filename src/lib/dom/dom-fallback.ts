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

const isPositive = (n: number | null): n is number =>
  typeof n === "number" && Number.isFinite(n) && n > 0;

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
    if (isPositive(n)) return n;
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
          if (isPositive(direct)) return direct;
          if (/^\d+$/.test(value) && +value > 1000) {
            const cents = +value / 100;
            if (isPositive(cents)) return cents;
          }
        }
      }
      const n1 = normalizePrice(el.textContent?.trim() || "");
      if (isPositive(n1)) return n1;

      for (const child of Array.from(el.children)) {
        const n2 = normalizePrice(child.textContent?.trim() || "");
        if (isPositive(n2)) return n2;
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
      if (isPositive(n)) return n;
    }
  }

  return null;
};
