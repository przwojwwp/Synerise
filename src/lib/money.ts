export const asNumber = (v: unknown): number => {
  if (typeof v === "number") return v;
  if (typeof v === "string") {
    const n = parseFloat(v.replace(",", "."));
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
};

export const toCents = (n: number) =>
  Math.round((Number(n) + Number.EPSILON) * 100);

export const fromCents = (c: number) => c / 100;

export const fmt = (n: number) => fromCents(toCents(n)).toFixed(2);

export const lineTotalCents = (unit: number, qty: number) =>
  toCents(unit) * Math.max(1, Math.floor(qty));
