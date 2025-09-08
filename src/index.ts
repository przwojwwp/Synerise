import { upsertProduct, getCart } from "./features/cart/cart";
import { getProductInfo } from "./features/cart/getProductInfo";
import { initCartPanel } from "./features/cart/ui/cart-panel";
import type { ProductInfo } from "./types/ProductInfo";

declare global {
  interface Window {
    __minicartBooted__?: boolean;
    MiniCart: {
      getProductInfo: (opts?: {
        fullScan?: boolean;
        maxScripts?: number;
        maxChars?: number;
      }) => ProductInfo;
      addToCart: (qty?: number) => import("./types/Cart").CartItem | null;
      getCart: () => import("./types/Cart").CartState;
      initCartPanel: () => void;
    };
  }
}

(() => {
  if (window.top !== window.self) return;
  if (window.__minicartBooted__) return;
  window.__minicartBooted__ = true;

  (window as any).MiniCart = {
    getProductInfo,
    getCart,
    addToCart: (qty = 1) => {
      const p = getProductInfo({ fullScan: true });
      return upsertProduct(p, qty);
    },
    initCartPanel,
  };

  const isComplete = (p: ProductInfo) =>
    !!(p.name && p.imageUrl && p.productUrl && p.price !== null);

  const debounce = <T extends (...args: any[]) => void>(fn: T, ms = 200) => {
    let t: number | undefined;
    return (...args: Parameters<T>) => {
      if (t) window.clearTimeout(t);
      t = window.setTimeout(() => fn(...args), ms);
    };
  };

  let lastProcessedUrl: string | null = null;

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

  const emitRouteEvent = () =>
    window.dispatchEvent(new Event("minicart:route"));

  ["pushState", "replaceState"].forEach((m) => {
    const orig = (history as any)[m];
    (history as any)[m] = function (...args: any[]) {
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
