import { toAbsUrl } from "./url";
import { normalizePrice } from "./dom-fallback";

export const pickString = (v: any): string | null => {
  if (!v) return null;
  if (typeof v === "string") return v || null;
  if (Array.isArray(v)) {
    for (const el of v) {
      const s = pickString(el);
      if (s) return s;
    }
    return null;
  }
  if (typeof v === "object") {
    if (typeof v["@value"] === "string" && v["@value"]) return v["@value"];
    if (typeof (v as any).value === "string" && (v as any).value)
      return (v as any).value;
    if (typeof (v as any).url === "string" && (v as any).url)
      return (v as any).url;
    if (typeof (v as any).contentUrl === "string" && (v as any).contentUrl)
      return (v as any).contentUrl;
  }
  return null;
};

export const pickUrl = (v: any): string | null => toAbsUrl(pickString(v));

// LD-JSON
export const ldIsProduct = (n: any): boolean => {
  const t = Array.isArray(n?.["@type"]) ? n["@type"] : [n?.["@type"]];
  return t.some((x: any) => String(x).toLowerCase() === "product");
};

export const ldPickName = (n: any): string | null =>
  pickString(n?.name) || pickString(n?.headline) || pickString(n?.offers?.name);

export const ldPickImage = (n: any): string | null =>
  pickUrl(n?.image) || pickUrl(n?.primaryImageOfPage);

export const ldPickUrl = (n: any): string | null =>
  pickUrl(n?.url) || pickUrl(n?.mainEntityOfPage) || null;

export const ldPickPrice = (n: any): number | null => {
  const offers = n?.offers;
  if (!offers) return null;
  const arr = Array.isArray(offers) ? offers : [offers];

  for (const ofr of arr) {
    const raw =
      pickString(ofr?.price) || pickString(ofr?.priceSpecification?.price);
    const price = normalizePrice(raw);
    if (price !== null) return price;

    const lp = normalizePrice(pickString(ofr?.lowPrice));
    if (lp !== null) return lp;

    const hp = normalizePrice(pickString(ofr?.highPrice));
    if (hp !== null) return hp;
  }
  return null;
};

// App JSON
export const appPickName = (n: any): string | null =>
  pickString(n?.props?.pageProps?.product?.title) ||
  pickString(n?.props?.pageProps?.product?.name) ||
  pickString(n?.product?.title) ||
  pickString(n?.product?.name) ||
  pickString(n?.data?.product?.title) ||
  pickString(n?.data?.product?.name) ||
  pickString(n?.state?.product?.name) ||
  pickString(n?.page?.product?.name) ||
  pickString(n?.item?.name) ||
  pickString(n?.item?.title) ||
  pickString(n?.name) ||
  pickString(n?.title) ||
  pickString(n?.headline);

export const appPickImage = (n: any): string | null => {
  const direct =
    pickUrl(n?.product?.image) ||
    pickUrl(n?.product?.images) ||
    pickUrl(n?.data?.product?.image) ||
    pickUrl(n?.data?.product?.images) ||
    pickUrl(n?.item?.image) ||
    pickUrl(n?.image) ||
    pickUrl(n?.images) ||
    null;
  if (direct) return direct;

  const queue: any[] = [n];
  let vis = 0;
  const MAX_VIS = 10_000;
  const looksImageKey = (k: string) =>
    /img|image|thumbnail|thumb|gallery|mainImage/i.test(k);

  while (queue.length && ++vis < MAX_VIS) {
    const node = queue.shift();
    if (!node || typeof node !== "object") continue;
    if (Array.isArray(node)) {
      for (let i = 0; i < Math.min(300, node.length); i++) queue.push(node[i]);
      continue;
    }
    for (const k in node) {
      const v = (node as any)[k];
      if (looksImageKey(k)) {
        const url = pickUrl(v);
        if (url) return url;
      }
      if (v && typeof v === "object") queue.push(v);
    }
  }
  return null;
};

export const appPickUrl = (n: any): string | null =>
  pickUrl(n?.product?.url) ||
  pickUrl(n?.data?.product?.url) ||
  pickUrl(n?.item?.url) ||
  pickUrl(n?.url);

export const appPickPrice = (n: any): number | null => {
  const candidates = [
    n?.props?.pageProps?.product,
    n?.product,
    n?.data?.product,
    n?.item,
    n,
  ];

  for (const p of candidates) {
    if (!p || typeof p !== "object") continue;

    const raw =
      pickString(p?.price) ||
      pickString(p?.salePrice) ||
      pickString(p?.currentPrice) ||
      pickString(p?.price?.value) ||
      pickString(p?.pricing?.price) ||
      pickString(p?.pricing?.current?.value);

    const price = normalizePrice(raw);
    if (price !== null) return price;

    const offers = (p as any).offers;
    if (offers) {
      const arr = Array.isArray(offers) ? offers : [offers];
      for (const ofr of arr) {
        const r =
          pickString(ofr?.price) ||
          pickString(ofr?.priceSpecification?.price) ||
          pickString(ofr?.amount);
        const pr = normalizePrice(r);
        if (pr !== null) return pr;
      }
    }
  }
  return null;
};
