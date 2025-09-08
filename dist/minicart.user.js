// ==UserScript==
// @name         MiniCart Auto-Injector
// @namespace    https://local/minicart
// @version      0.0.0
// @description  Mini cart overlay that persists across product pages.
// @match        *://*/*
// @inject-into  page
// @run-at       document-idle
// @noframes
// ==/UserScript==

(function () {
  'use strict';

  const asNumber = (v) => {
    if (typeof v === "number") return v;
    if (typeof v === "string") {
      const n = parseFloat(v.replace(",", "."));
      return Number.isFinite(n) ? n : 0;
    }
    return 0;
  };
  const toCents = (n) => Math.round((Number(n) + Number.EPSILON) * 100);
  const fromCents = (c) => c / 100;
  const fmt = (n) => fromCents(toCents(n)).toFixed(2);
  const djb2 = (str) => {
    let hash = 5381;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) + hash + str.charCodeAt(i);
    }
    return (hash >>> 0).toString(16);
  };
  const getProductId = (p) => {
    if (p.productUrl) return p.productUrl;
    const sig = `${p.name ?? ""}|${p.imageUrl ?? ""}|${p.price ?? ""}`;
    return `hash:${djb2(sig)}`;
  };
  const toAbsUrl = (u) => {
    if (!u || typeof u !== "string") return null;
    try {
      return new URL(u, document.baseURI).toString();
    } catch {
      return null;
    }
  };
  const getCanonicalUrl = () => {
    const can = document.querySelector(
      'link[rel="canonical"]'
    )?.href;
    const og = document.querySelector(
      'meta[property="og:url"]'
    )?.content;
    return toAbsUrl(can || og || window.location.href);
  };
  const isCompleteProduct = (p) => {
    const nameOk = typeof p.name === "string" && p.name.trim().length > 1;
    const priceOk = typeof p.price === "number" && Number.isFinite(p.price) && p.price >= 0;
    const imgOk = typeof p.imageUrl === "string" && !!toAbsUrl(p.imageUrl);
    const urlOk = typeof p.productUrl === "string" && !!toAbsUrl(p.productUrl);
    return nameOk && priceOk && imgOk && urlOk;
  };
  const readLS = (key) => {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch {
      return null;
    }
  };
  const writeLS = (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch {
      return false;
    }
  };
  const CART_LS_KEY = "__minicart:cart__";
  const CART_VERSION = 1;
  const OLD_CART_LS_KEY = "cart";
  const nowIso = () => ( new Date()).toISOString();
  const loadCart = () => {
    const existing = readLS(CART_LS_KEY);
    if (!existing) {
      const legacy = readLS(OLD_CART_LS_KEY);
      if (legacy && Array.isArray(legacy.items)) {
        writeLS(CART_LS_KEY, legacy);
      }
    }
    const data = readLS(CART_LS_KEY);
    if (data && Array.isArray(data.items)) {
      return {
        version: CART_VERSION,
        updatedAt: data.updatedAt ?? nowIso(),
        items: data.items.map((it) => ({
          ...it,
          addedAt: it.addedAt ?? nowIso(),
          updatedAt: it.updatedAt ?? nowIso()
        }))
      };
    }
    return { version: CART_VERSION, updatedAt: nowIso(), items: [] };
  };
  const saveCart = (state) => {
    const payload = {
      ...state,
      version: CART_VERSION,
      updatedAt: nowIso()
    };
    const ok = writeLS(CART_LS_KEY, payload);
    try {
      window.dispatchEvent(new CustomEvent("minicart:change"));
    } catch {
    }
    return ok;
  };
  const upsertProduct = (info, qty = 1) => {
    if (!isCompleteProduct(info)) return null;
    const id = getProductId(info);
    const state = loadCart();
    const existing = state.items.find((x) => x.id === id);
    if (existing) {
      existing.quantity += Math.max(1, qty);
      existing.updatedAt = nowIso();
      saveCart(state);
      return existing;
    }
    const item = {
      id,
      name: info.name,
      price: info.price,
      imageUrl: info.imageUrl,
      productUrl: info.productUrl,
      quantity: Math.max(1, qty),
      addedAt: nowIso(),
      updatedAt: nowIso()
    };
    state.items.unshift(item);
    saveCart(state);
    return item;
  };
  const removeItem = (id) => {
    const state = loadCart();
    const before = state.items.length;
    state.items = state.items.filter((it) => it.id !== id);
    return before !== state.items.length ? saveCart(state) : false;
  };
  const removeSome = (id, count = 1) => {
    const state = loadCart();
    const item = state.items.find((i) => i.id === id);
    if (!item) return false;
    const n = Math.max(1, Math.min(item.quantity, Math.floor(count)));
    const left = item.quantity - n;
    if (left <= 0) {
      state.items = state.items.filter((i) => i.id !== id);
    } else {
      item.quantity = left;
      item.updatedAt = nowIso();
    }
    return saveCart(state);
  };
  const calcTotal = (state = loadCart()) => {
    const cents = state.items.reduce((sum, it) => {
      const unit = typeof it.price === "number" && Number.isFinite(it.price) ? it.price : 0;
      return sum + toCents(unit) * it.quantity;
    }, 0);
    return fromCents(cents);
  };
  const getCart = () => loadCart();
  const isLdType = (t) => /^\s*application\/ld\+json\b/i.test(t);
  const isPlainJsonType = (t) => /^\s*application\/json\b/i.test(t);
  const isVendorJsonType = (t) => /^\s*[\w.-]+\/[\w.+-]*\+json\b/i.test(t);
  const isAnyJsonButLd = (t) => isPlainJsonType(t) || isVendorJsonType(t) && !/ld\+json/i.test(t);
  const looksLikeLD = (txt) => /"@context"\s*:/.test(txt) && /"@type"\s*:/.test(txt);
  const looksLikeJsonPayload = (txt) => /^[\[{]/.test(txt);
  const allScripts = () => Array.from(document.querySelectorAll("script"));
  const scriptType = (s) => (s.type || "").trim();
  const scriptText = (s, max) => {
    const txt = (s.textContent || "").trim();
    if (max == null) return txt;
    return txt.slice(0, max).trim();
  };
  const detectFromScripts = (scripts, options = {}) => {
    let hasLD = false;
    let hasJSON = false;
    const { maxScripts = 8, maxChars, fullScan = true } = options;
    let checked = 0;
    for (const s of scripts) {
      if (!fullScan && checked >= maxScripts) break;
      const type = scriptType(s).toLowerCase();
      const content = scriptText(s, maxChars);
      if (isLdType(type)) hasLD = true;
      else if (isAnyJsonButLd(type)) hasJSON = true;
      if (content) {
        if (looksLikeLD(content) && /"Product"/i.test(content)) hasLD = true;
        if (/"product"\s*:/.test(content) && (/"name"\s*:/.test(content) || /"title"\s*:/.test(content))) {
          hasJSON = true;
        }
      }
      checked++;
      if (hasLD && hasJSON) return "both";
    }
    if (hasLD && hasJSON) return "both";
    if (hasLD) return "ld+json";
    if (hasJSON) return "json";
    return "none";
  };
  const detectDataFormat = (fullScan = false) => {
    return detectFromScripts(allScripts(), { fullScan });
  };
  function extractFirstJSONObject(txt) {
    const firstBrace = txt.indexOf("{");
    if (firstBrace < 0) return null;
    let i = firstBrace, depth = 0, inStr = false, esc = false;
    for (; i < txt.length; i++) {
      const ch = txt[i];
      if (inStr) {
        esc = ch === "\\" ? !esc : false;
        if (ch === '"' && !esc) inStr = false;
        continue;
      }
      if (ch === '"') {
        inStr = true;
        continue;
      }
      if (ch === "{") depth++;
      else if (ch === "}") {
        depth--;
        if (depth === 0) {
          const slice = txt.slice(firstBrace, i + 1);
          try {
            return JSON.parse(slice);
          } catch {
            return null;
          }
        }
      }
    }
    return null;
  }
  function safeParseJsonOrFirstObject(txt) {
    try {
      return JSON.parse(txt);
    } catch {
    }
    return extractFirstJSONObject(txt);
  }
  const getMeta = (sel) => document.querySelector(sel)?.content?.trim() || null;
  const domFallbackName = () => getMeta('meta[property="og:title"]') || getMeta('meta[name="twitter:title"]') || document.title?.trim() || null;
  const normalizePrice = (raw) => {
    if (!raw) return null;
    const cleaned = raw.replace(/\u00A0/g, " ").replace(/\s+/g, "").replace(/[^\d.,-]/g, "").replace(/,(\d{1,2})$/, ".$1");
    const normalized = cleaned.replace(/(?<=\d)[.,](?=\d{3}(\D|$))/g, "");
    const n = parseFloat(normalized.replace(",", "."));
    return Number.isFinite(n) ? n : null;
  };
  const isPositive = (n) => typeof n === "number" && Number.isFinite(n) && n > 0;
  const domFallbackImage = () => {
    const og = getMeta('meta[property="og:image"]');
    const tw = getMeta('meta[name="twitter:image"]') || getMeta('meta[name="twitter:image:src"]');
    const img = document.querySelector("img[src]")?.src || null;
    return toAbsUrl(og || tw || img);
  };
  const domFallbackPrice = () => {
    {
      const amount = getMeta('meta[property="product:price:amount"]') || getMeta('meta[property="og:price:amount"]') || document.querySelector('[itemprop="price"]')?.getAttribute("content") || document.querySelector('[itemprop="price"]')?.textContent?.trim() || null;
      const n = normalizePrice(amount);
      if (isPositive(n)) return n;
    }
    {
      const candidates = document.querySelectorAll(
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
          "[data-current-price]"
        ].join(",")
      );
      for (const el of candidates) {
        for (const { name, value } of Array.from(el.attributes)) {
          if (!value) continue;
          if (/price|amount/i.test(name)) {
            const direct = normalizePrice(value);
            if (isPositive(direct)) return direct;
            if (/^\d+$/.test(value) && +value > 1e3) {
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
      const nodes = document.querySelectorAll(
        "span,div,dd,dt,p,b,strong,em"
      );
      let checked = 0;
      for (const el of nodes) {
        if (checked++ > 2e3) break;
        const txt = el.textContent?.trim() || "";
        if (!txt || !CURRENCY.test(txt)) continue;
        if (/\/\s?(mies|msc|month|mo)\b/i.test(txt)) continue;
        const n = normalizePrice(txt);
        if (isPositive(n)) return n;
      }
    }
    return null;
  };
  const pickString = (v) => {
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
      if (typeof v.value === "string" && v.value)
        return v.value;
      if (typeof v.url === "string" && v.url)
        return v.url;
      if (typeof v.contentUrl === "string" && v.contentUrl)
        return v.contentUrl;
    }
    return null;
  };
  const pickUrl = (v) => toAbsUrl(pickString(v));
  const ldIsProduct = (n) => {
    const t = Array.isArray(n?.["@type"]) ? n["@type"] : [n?.["@type"]];
    return t.some((x) => String(x).toLowerCase() === "product");
  };
  const ldPickName = (n) => pickString(n?.name) || pickString(n?.headline) || pickString(n?.offers?.name);
  const ldPickImage = (n) => pickUrl(n?.image) || pickUrl(n?.primaryImageOfPage);
  const ldPickUrl = (n) => pickUrl(n?.url) || pickUrl(n?.mainEntityOfPage) || null;
  const ldPickPrice = (n) => {
    const offers = n?.offers;
    if (!offers) return null;
    const arr = Array.isArray(offers) ? offers : [offers];
    for (const ofr of arr) {
      const raw = pickString(ofr?.price) || pickString(ofr?.priceSpecification?.price);
      const price = normalizePrice(raw);
      if (price !== null) return price;
      const lp = normalizePrice(pickString(ofr?.lowPrice));
      if (lp !== null) return lp;
      const hp = normalizePrice(pickString(ofr?.highPrice));
      if (hp !== null) return hp;
    }
    return null;
  };
  const appPickName = (n) => pickString(n?.props?.pageProps?.product?.title) || pickString(n?.props?.pageProps?.product?.name) || pickString(n?.product?.title) || pickString(n?.product?.name) || pickString(n?.data?.product?.title) || pickString(n?.data?.product?.name) || pickString(n?.state?.product?.name) || pickString(n?.page?.product?.name) || pickString(n?.item?.name) || pickString(n?.item?.title) || pickString(n?.name) || pickString(n?.title) || pickString(n?.headline);
  const appPickImage = (n) => {
    const direct = pickUrl(n?.product?.image) || pickUrl(n?.product?.images) || pickUrl(n?.data?.product?.image) || pickUrl(n?.data?.product?.images) || pickUrl(n?.item?.image) || pickUrl(n?.image) || pickUrl(n?.images) || null;
    if (direct) return direct;
    const queue = [n];
    let vis = 0;
    const MAX_VIS = 1e4;
    const looksImageKey = (k) => /img|image|thumbnail|thumb|gallery|mainImage/i.test(k);
    while (queue.length && ++vis < MAX_VIS) {
      const node = queue.shift();
      if (!node || typeof node !== "object") continue;
      if (Array.isArray(node)) {
        for (let i = 0; i < Math.min(300, node.length); i++) queue.push(node[i]);
        continue;
      }
      for (const k in node) {
        const v = node[k];
        if (looksImageKey(k)) {
          const url = pickUrl(v);
          if (url) return url;
        }
        if (v && typeof v === "object") queue.push(v);
      }
    }
    return null;
  };
  const appPickUrl = (n) => pickUrl(n?.product?.url) || pickUrl(n?.data?.product?.url) || pickUrl(n?.item?.url) || pickUrl(n?.url);
  const appPickPrice = (n) => {
    const candidates = [
      n?.props?.pageProps?.product,
      n?.product,
      n?.data?.product,
      n?.item,
      n
    ];
    for (const p of candidates) {
      if (!p || typeof p !== "object") continue;
      const raw = pickString(p?.price) || pickString(p?.salePrice) || pickString(p?.currentPrice) || pickString(p?.price?.value) || pickString(p?.pricing?.price) || pickString(p?.pricing?.current?.value);
      const price = normalizePrice(raw);
      if (price !== null) return price;
      const offers = p.offers;
      if (offers) {
        const arr = Array.isArray(offers) ? offers : [offers];
        for (const ofr of arr) {
          const r = pickString(ofr?.price) || pickString(ofr?.priceSpecification?.price) || pickString(ofr?.amount);
          const pr = normalizePrice(r);
          if (pr !== null) return pr;
        }
      }
    }
    return null;
  };
  const extractInfoFromLDJSON = (opts = {}) => {
    const { fullScan = true, maxScripts = 8, maxChars } = opts;
    const scripts = allScripts();
    const typedLD = [];
    const looksLD = [];
    for (const s of scripts) {
      const t = scriptType(s);
      if (isLdType(t)) {
        typedLD.push(s);
        continue;
      }
      const txt = scriptText(s, maxChars);
      if (txt && looksLikeLD(txt)) looksLD.push(s);
    }
    const buckets = [typedLD, looksLD];
    let checked = 0;
    const findProductNode = (n) => {
      if (!n || typeof n !== "object") return null;
      if (ldIsProduct(n)) return n;
      const candidate = n.mainEntity ?? n.mainEntityOfPage ?? n.itemOffered ?? null;
      return ldIsProduct(candidate) ? candidate : null;
    };
    for (const bucket of buckets) {
      for (const s of bucket) {
        if (!fullScan && checked >= maxScripts) return null;
        checked++;
        const txt = scriptText(s, maxChars);
        if (!txt) continue;
        const data = safeParseJsonOrFirstObject(txt);
        if (!data) continue;
        const roots = Array.isArray(data) ? data : [data];
        for (const r of roots) {
          const nodes = Array.isArray(r?.["@graph"]) ? r["@graph"] : [r];
          for (const node of nodes) {
            const prod = findProductNode(node);
            if (!prod) continue;
            const name = ldPickName(prod);
            const imageUrl = ldPickImage(prod);
            const price = ldPickPrice(prod);
            const productUrl = ldPickUrl(prod) || getCanonicalUrl();
            if (name || imageUrl || price !== null) {
              return {
                name: name ?? null,
                price,
                imageUrl: imageUrl ?? null,
                productUrl: productUrl ?? null
              };
            }
          }
          const rootProd = findProductNode(r);
          if (rootProd) {
            const name = ldPickName(rootProd);
            const imageUrl = ldPickImage(rootProd);
            const price = ldPickPrice(rootProd);
            const productUrl = ldPickUrl(rootProd) || getCanonicalUrl();
            if (name || imageUrl || price !== null) {
              return {
                name: name ?? null,
                price,
                imageUrl: imageUrl ?? null,
                productUrl: productUrl ?? null
              };
            }
          }
        }
      }
    }
    return null;
  };
  const extractInfoFromAppJSON = (opts = {}) => {
    const { fullScan = true, maxScripts = 8, maxChars } = opts;
    const scripts = allScripts();
    const typedJSON = [];
    const looksJSON = [];
    for (const s of scripts) {
      const t = scriptType(s);
      if (isAnyJsonButLd(t)) {
        typedJSON.push(s);
        continue;
      }
      const txt = scriptText(s, maxChars);
      if (txt && looksLikeJsonPayload(txt) && !looksLikeLD(txt)) {
        looksJSON.push(s);
      }
    }
    const preferredIds = [
      /__NEXT_DATA__/,
      /__NUXT__/,
      /__APOLLO_STATE__/i,
      /__INITIAL_STATE__/i
    ];
    const sortPreferred = (arr) => arr.sort((a, b) => {
      const ap = preferredIds.some((rx) => rx.test(a.id || ""));
      const bp = preferredIds.some((rx) => rx.test(b.id || ""));
      return ap === bp ? 0 : ap ? -1 : 1;
    });
    sortPreferred(typedJSON);
    sortPreferred(looksJSON);
    const buckets = [typedJSON, looksJSON];
    let checked = 0;
    for (const bucket of buckets) {
      for (const s of bucket) {
        if (!fullScan && checked >= maxScripts) return null;
        checked++;
        const txt = scriptText(s, maxChars);
        if (!txt) continue;
        const data = safeParseJsonOrFirstObject(txt);
        if (!data) continue;
        const name = appPickName(data);
        const price = appPickPrice(data);
        const imageUrl = appPickImage(data);
        const productUrl = appPickUrl(data) || getCanonicalUrl();
        if (name || imageUrl || price !== null) {
          return {
            name: name ?? null,
            price,
            imageUrl: imageUrl ?? null,
            productUrl: productUrl ?? null
          };
        }
      }
    }
    return null;
  };
  const pick = (...vals) => {
    for (const v of vals) if (v !== null && v !== void 0) return v;
    return null;
  };
  const getProductInfo = (options = {}) => {
    const { fullScan = true, maxScripts, maxChars } = options;
    const format = detectDataFormat(fullScan);
    let fromLD = null;
    let fromAPP = null;
    if (format === "ld+json" || format === "both") {
      fromLD = extractInfoFromLDJSON({ fullScan, maxScripts, maxChars });
    }
    if (format === "json" || format === "both") {
      fromAPP = extractInfoFromAppJSON({ fullScan, maxScripts, maxChars });
    }
    if (!fromLD)
      fromLD = extractInfoFromLDJSON({ fullScan, maxScripts, maxChars }) || null;
    if (!fromAPP)
      fromAPP = extractInfoFromAppJSON({ fullScan, maxScripts, maxChars }) || null;
    const domName = domFallbackName();
    const domPrice = domFallbackPrice();
    const domImg = domFallbackImage();
    const canon = getCanonicalUrl();
    const name = pick(fromLD?.name, fromAPP?.name, domName);
    const price = pick(fromLD?.price, fromAPP?.price, domPrice);
    const imageUrl = pick(fromLD?.imageUrl, fromAPP?.imageUrl, domImg);
    const productUrl = pick(fromLD?.productUrl, fromAPP?.productUrl, canon);
    return { name, price, imageUrl, productUrl };
  };
  const styleTag = () => {
    const style = document.createElement("style");
    style.textContent = `
    /* ======================= PANEL ======================= */
    .panel {
      width: 600px;
      min-width: 600px;
      max-width: 600px;
      height: 400px;

      /* CSS variables */
      --w-price: 8ch;
      --w-qty: 4.5ch;
      --w-total: 8ch;
      --ui-scale: 1;
      --w-actions: calc(96px * var(--ui-scale) * 0.8);
      --row-h: 36px;
      --gap: 8px;
      --step-btn: calc(24px * var(--ui-scale));
      --step-h: calc(24px * var(--ui-scale));
      --step-gap: 3px;

      position: relative;
      display: flex;
      flex-direction: column;

      box-shadow: 0 10px 34px rgba(0, 0, 0, .24);
      border: 1px solid rgba(0, 0, 0, .12);
      border-radius: 10px;
      background: #fff;

      font: 16px/1.4 system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif;
      color: #111;

      overflow: hidden;
    }

    /* --- DOCK (pojemnik na toggle + panel) --- */
    .dock { position: relative; }
    /* ukrywa panel, ale NIE toggle */
    .dock:not(.open) .panel { display: none; }
    .dock.open .panel { display: flex; }

    /* --- TOGGLE --- */
    .toggle {
      position: absolute;
      right: 0;

      border: 0;
      cursor: pointer;

      color: #fff;
      background: #111;

      font-size: 12px;
      padding: 6px 10px;

      box-shadow: 0 4px 12px rgba(0, 0, 0, .24);
    }

    /* gdy otwarte – „języczek” nad panelem */
    .dock.open .toggle {
      top: -34px;
      bottom: auto;
      border-radius: 10px 10px 0 0;
    }

    /* gdy zamknięte – piguła przy krawędzi */
    .dock:not(.open) .toggle {
      top: auto;
      bottom: 0;
      border-radius: 999px;
    }

    /* ======================= HEADER ======================= */
    .header {
      display: flex;
      align-items: center;
      justify-content: flex-start; /* bez X po prawej */

      padding: 8px 10px;

      border-bottom: 1px solid rgba(0, 0, 0, .08);
      background: #fafafa;

      flex: 0 0 auto;
    }
    .title { font-weight: 700; }

    /* ======================== LISTA ======================= */
    .list {
      flex: 1 1 auto;
      overflow-y: auto;
      overflow-x: hidden;
      min-height: 0;
    }

    .cols,
    .row {
      display: grid;
      grid-template-columns:
        minmax(0, 1fr)
        var(--w-price)
        var(--w-qty)
        var(--w-total)
        var(--w-actions);
      gap: var(--gap);
      align-items: center;
    }

    .cols {
      padding: 6px 10px;
      font-weight: 600;
      color: #0d47a1;
      border-bottom: 1px solid rgba(0, 0, 0, .06);
      background: #fbfbfb;
    }

    .cols > .name     { text-align: left;  }
    .cols > .price    { text-align: right; }
    .cols > .quantity { text-align: center;}
    .cols > .total    { text-align: right; }
    .cols > .actions  { text-align: right; }

    .row {
      padding: 0 0 0 10px;
      border-bottom: 1px dashed rgba(0, 0, 0, .06);
      min-height: var(--row-h);
    }
    .row:last-child { border-bottom: 0; }

    .name,
    .name a {
      display: block;
      max-width: 100%;
      min-width: 0;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;

      font-weight: 600;
      color: #111;
      text-decoration: none;
    }
    .name a:hover {
      text-decoration: underline;
      text-underline-offset: 2px;
    }

    .quantity { text-align: center; font-variant-numeric: tabular-nums; }
    .price,
    .total,
    .actions { text-align: right; white-space: nowrap; }

    /* ======================= STOPKA ======================= */
    .footer {
      padding: 8px 10px;
      display: flex;
      justify-content: space-between;
      align-items: center;

      background: #fafafa;
      border-top: 1px solid rgba(0, 0, 0, .08);
      font-weight: 700;

      flex: 0 0 auto;
    }

    /* ===================== AKCJE / UI ===================== */
    .actions { display: flex; justify-content: flex-end; }
    .controls {
      display: grid;
      grid-template-rows: 1fr 1fr;
      gap: 0;
      width: var(--w-actions);
    }
    .controls > * { width: 100%; }

    /* ------ Stepper ------ */
    .stepper {
      width: 100%;
      height: var(--step-h);

      display: grid;
      grid-template-columns: var(--step-btn) 1fr var(--step-btn);
      align-items: stretch;
      gap: var(--step-gap);

      box-sizing: border-box;
      border: 1px solid rgba(0, 0, 0, .12);
      border-radius: 6px;
      background: #f6f6f6;
      overflow: hidden;
    }

    .stepper button {
      width: var(--step-btn);
      height: 100%;
      padding: 0;
      border: 0;
      border-radius: 6px;
      background: #eee;
      cursor: pointer;

      font-size: 12px;
      line-height: 1;

      display: inline-flex;
      align-items: center;
      justify-content: center;
    }

    .stepper input[type="number"] {
      width: 100%;
      height: 100%;
      box-sizing: border-box;
      padding: 0;
      margin: 0;
      border: 0;
      background: transparent;

      text-align: center;
      line-height: calc(var(--step-h) - 4px);
      font-variant-numeric: tabular-nums;
      font-size: calc(13px * var(--ui-scale));

      appearance: textfield;
      -moz-appearance: textfield;
    }

    .stepper input[type="number"]::-webkit-outer-spin-button,
    .stepper input[type="number"]::-webkit-inner-spin-button {
      -webkit-appearance: none;
      margin: 0;
    }

    /* ------ Remove button ------ */
    .removeBtn {
      display: inline-flex;
      align-items: center;
      justify-content: center;

      width: 100%;
      height: var(--step-h);

      margin: 0;
      padding: 0;
      box-sizing: border-box;

      border: 1px solid rgba(0, 0, 0, .12);
      border-radius: 6px;

      background: #ffecec;
      color: #c62828;

      font-weight: 600;
      font-size: calc(13px * var(--ui-scale));
      white-space: nowrap;
    }
  `;
    return style;
  };
  const PANEL_ID = "mini-cart-panel";
  const PANEL_SHADOW_HOST_ID = "mini-cart-panel-host";
  const ensureHost = () => {
    let host = document.getElementById(PANEL_SHADOW_HOST_ID);
    if (!host) {
      host = document.createElement("div");
      host.id = PANEL_SHADOW_HOST_ID;
      host.style.position = "fixed";
      host.style.bottom = "16px";
      host.style.right = "16px";
      host.style.zIndex = "2147483647";
      document.documentElement.appendChild(host);
    }
    return host;
  };
  const getShadowRoot = (host) => host.shadowRoot ?? host.attachShadow({ mode: "open" });
  const render = (shadowRoot) => {
    const state = getCart();
    const total = calcTotal(state);
    const prevDock = shadowRoot.querySelector(".dock");
    const wasOpen = prevDock?.classList.contains("open") ?? true;
    const dock = document.createElement("div");
    dock.className = "dock" + (wasOpen ? " open" : "");
    const toggle = document.createElement("button");
    toggle.className = "toggle";
    toggle.type = "button";
    toggle.setAttribute("aria-controls", PANEL_ID);
    toggle.setAttribute("aria-expanded", String(wasOpen));
    toggle.textContent = wasOpen ? "Hide cart" : "Cart";
    toggle.addEventListener("click", () => {
      const isOpen = dock.classList.toggle("open");
      toggle.setAttribute("aria-expanded", String(isOpen));
      toggle.textContent = isOpen ? "Hide cart" : "Cart";
    });
    const wrapper = document.createElement("div");
    wrapper.className = "panel";
    wrapper.id = PANEL_ID;
    const header = document.createElement("div");
    header.className = "header";
    header.innerHTML = `<div class="title">Mini Cart</div>`;
    const list = document.createElement("div");
    list.className = "list";
    const cols = document.createElement("div");
    cols.className = "cols";
    cols.innerHTML = `
    <div>Name</div>
    <div class="price">Price</div>
    <div class="quantity">Quantity</div>
    <div class="total">Total</div>
    <div class="actions">Actions</div>
  `;
    list.appendChild(cols);
    if (state.items.length === 0) {
      const empty = document.createElement("div");
      empty.className = "empty";
      empty.textContent = "Your cart is empty.";
      list.appendChild(empty);
    } else {
      for (const it of state.items) {
        const row = document.createElement("div");
        row.className = "row";
        row.dataset.id = it.id;
        const name = document.createElement("div");
        name.className = "name";
        name.title = it.name || "";
        name.innerHTML = it.productUrl ? `<a href="${it.productUrl}" target="_blank" rel="noopener">${it.name}</a>` : it.name || "";
        const price = document.createElement("div");
        price.className = "price";
        const unit = asNumber(it.price);
        price.textContent = fmt(unit);
        const qty = document.createElement("div");
        qty.className = "quantity";
        qty.textContent = String(it.quantity);
        const totalCell = document.createElement("div");
        totalCell.className = "total";
        const lineCents = toCents(unit) * it.quantity;
        totalCell.textContent = fmt(fromCents(lineCents));
        const actions = document.createElement("div");
        actions.className = "actions";
        const controls = document.createElement("div");
        controls.className = "controls";
        const stepper = document.createElement("div");
        stepper.className = "stepper";
        const minusBtn = document.createElement("button");
        minusBtn.type = "button";
        minusBtn.setAttribute("aria-label", "Decrease");
        minusBtn.textContent = "−";
        const input = document.createElement("input");
        input.type = "number";
        input.min = "1";
        input.max = String(it.quantity);
        input.value = "1";
        const plusBtn = document.createElement("button");
        plusBtn.type = "button";
        plusBtn.setAttribute("aria-label", "Increase");
        plusBtn.textContent = "+";
        const clamp = (v) => Math.max(1, Math.min(it.quantity, v));
        minusBtn.addEventListener("click", () => {
          input.value = String(clamp((parseInt(input.value) || 1) - 1));
        });
        plusBtn.addEventListener("click", () => {
          input.value = String(clamp((parseInt(input.value) || 1) + 1));
        });
        input.addEventListener("input", () => {
          input.value = String(clamp(parseInt(input.value) || 1));
        });
        stepper.append(minusBtn, input, plusBtn);
        const rmBtn = document.createElement("button");
        rmBtn.className = "removeBtn";
        rmBtn.textContent = "Remove";
        rmBtn.addEventListener("click", (e) => {
          e.preventDefault();
          const n = clamp(parseInt(input.value) || 1);
          if (n >= it.quantity) removeItem(it.id);
          else removeSome(it.id, n);
        });
        controls.append(stepper, rmBtn);
        actions.appendChild(controls);
        row.append(name, price, qty, totalCell, actions);
        list.appendChild(row);
      }
    }
    const footer = document.createElement("div");
    footer.className = "footer";
    footer.innerHTML = `<div>Total:</div><div>${total.toFixed(2)}</div>`;
    shadowRoot.innerHTML = "";
    shadowRoot.appendChild(styleTag());
    wrapper.append(header, list, footer);
    dock.append(toggle, wrapper);
    shadowRoot.appendChild(dock);
  };
  const initCartPanel = () => {
    const host = ensureHost();
    const shadow = getShadowRoot(host);
    render(shadow);
    window.addEventListener("minicart:change", () => render(shadow));
    window.addEventListener("storage", (ev) => {
      if (ev.key === CART_LS_KEY) render(shadow);
    });
  };
  (() => {
    if (window.top !== window.self) return;
    if (window.__minicartBooted__) return;
    window.__minicartBooted__ = true;
    window.MiniCart = {
      getProductInfo,
      getCart,
      addToCart: (qty = 1) => {
        const p = getProductInfo({ fullScan: true });
        return upsertProduct(p, qty);
      },
      initCartPanel
    };
    const isComplete = (p) => !!(p.name && p.imageUrl && p.productUrl && p.price !== null);
    const debounce = (fn, ms = 200) => {
      let t;
      return (...args) => {
        if (t) window.clearTimeout(t);
        t = window.setTimeout(() => fn(...args), ms);
      };
    };
    let lastProcessedUrl = null;
    const scanAndAddOncePerUrl = () => {
      const info = getProductInfo({ fullScan: true });
      const url = info.productUrl || window.location.href;
      if (lastProcessedUrl === url) return;
      const saved = upsertProduct(info, 1);
      if (saved) {
        lastProcessedUrl = url;
        return;
      }
      if (!isComplete(info)) {
        const MAX_ATTEMPTS = 3;
        const DELAY_MS = 700;
        let attempt = 0;
        const retry = () => {
          attempt += 1;
          const again = getProductInfo({ fullScan: true });
          const saved2 = isComplete(again) ? upsertProduct(again, 1) : null;
          if (saved2) {
            lastProcessedUrl = again.productUrl || window.location.href;
            return;
          }
          if (attempt < MAX_ATTEMPTS) {
            setTimeout(retry, DELAY_MS);
          }
        };
        setTimeout(retry, DELAY_MS);
      }
    };
    const debouncedScan = debounce(scanAndAddOncePerUrl, 200);
    const emitRouteEvent = () => window.dispatchEvent(new Event("minicart:route"));
    ["pushState", "replaceState"].forEach((m) => {
      const orig = history[m];
      history[m] = function(...args) {
        const ret = orig.apply(this, args);
        emitRouteEvent();
        return ret;
      };
    });
    window.addEventListener("popstate", emitRouteEvent);
    window.addEventListener("hashchange", emitRouteEvent);
    window.addEventListener("minicart:route", () => {
      lastProcessedUrl = null;
      debouncedScan();
    });
    const mo = new MutationObserver(() => {
      debouncedScan();
    });
    mo.observe(document.documentElement, { subtree: true, childList: true });
    scanAndAddOncePerUrl();
    initCartPanel();
  })();

})();