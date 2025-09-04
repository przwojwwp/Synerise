export function extractNameFromAppJSON(): string | null {
  const jsonScripts = Array.from(
    document.querySelectorAll<HTMLScriptElement>("script[type]")
  ).filter((s) => {
    const typeLower = (s.type || "").toLowerCase();
    return (
      typeLower.startsWith("application/json") ||
      (typeLower.includes("+json") && !typeLower.includes("ld+json"))
    );
  });

  const preferredIds = [
    /__NEXT_DATA__/,
    /__NUXT__/,
    /__APOLLO_STATE__/i,
    /__INITIAL_STATE__/i,
  ];
  jsonScripts.sort((a, b) => {
    const ap = preferredIds.some((rx) => rx.test(a.id || ""));
    const bp = preferredIds.some((rx) => rx.test(b.id || ""));
    return ap === bp ? 0 : ap ? -1 : 1;
  });

  const tryExtractName = (data: any): string | null => {
    const direct =
      data?.props?.pageProps?.product?.title ??
      data?.props?.pageProps?.product?.name ??
      data?.product?.title ??
      data?.product?.name ??
      data?.data?.product?.title ??
      data?.data?.product?.name ??
      data?.state?.product?.name ??
      data?.page?.product?.name ??
      data?.item?.name ??
      data?.item?.title;

    if (typeof direct === "string" && direct) return direct;

    const START =
      typeof performance !== "undefined" && performance.now
        ? performance.now()
        : Date.now();
    const TIME_BUDGET_MS = 120;
    const HARD_NODE_MAX = 20000;
    const ARRAY_SLICE = 400;

    const q: any[] = [data];
    let visited = 0;

    const hasProductSignals = (obj: any) =>
      Object.keys(obj).some((k) =>
        /price|sku|brand|image|product|variant|availability|gtin|mpn|category/i.test(
          k
        )
      );

    while (q.length) {
      const now =
        typeof performance !== "undefined" && performance.now
          ? performance.now()
          : Date.now();
      if (now - START > TIME_BUDGET_MS) break;
      if (++visited > HARD_NODE_MAX) break;

      const node = q.shift();
      if (!node || typeof node !== "object") continue;

      if (Array.isArray(node)) {
        const n = Math.min(node.length, ARRAY_SLICE);
        for (let i = 0; i < n; i++) q.push(node[i]);
        continue;
      }

      const n = (node as any).name;
      const t = (node as any).title;
      const h = (node as any).headline;
      const candidate =
        (typeof n === "string" && n) ||
        (typeof t === "string" && t) ||
        (typeof h === "string" && h);

      if (candidate && hasProductSignals(node)) return candidate;

      for (const k in node as any) {
        const v = (node as any)[k];
        if (v && typeof v === "object") q.push(v);
      }
    }
    return null;
  };

  for (const s of jsonScripts) {
    const txt = s.textContent?.trim();
    if (!txt) continue;
    try {
      const data = JSON.parse(txt);
      const name = tryExtractName(data);
      if (name) return name;
    } catch {
    }
  }
  return null;
}
