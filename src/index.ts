import { getCart, upsertProduct } from "./features/cart/cart";
import { getProductInfo } from "./features/cart/getProductInfo";
import { initCartPanel } from "./features/cart/ui/cart-panel";
import type { ProductInfo } from "./types/ProductInfo";
import { detectDataFormat } from "./utils/detectDataFormat/detectDataFormat";

declare global {
  interface Window {
    __minicartBooted__?: boolean;
    MiniCart: {
      getProductInfo: (opts?: {
        fullScan?: boolean;
        maxScripts?: number;
        maxChars?: number;
      }) => ProductInfo;
      detectDataFormat: (
        fullScan?: boolean
      ) => "ld+json" | "json" | "both" | "none";
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
    detectDataFormat,
    getCart,
    addToCart: (qty = 1) => {
      const p = getProductInfo({ fullScan: true });
      return upsertProduct(p, qty);
    },
    initCartPanel,
  };

  const isComplete = (p: ProductInfo) =>
    !!(p.name && p.imageUrl && p.productUrl && p.price !== null);

  // pierwsze podejście — spróbuj od razu zapisać produkt
  let info = getProductInfo({ fullScan: true });
  upsertProduct(info, 1);

  // jeśli strona jeszcze „dochodzi”, spróbuj uzupełnić brakujące dane
  if (!isComplete(info)) {
    const MAX_ATTEMPTS = 3;
    const DELAY_MS = 700;
    let attempt = 0;

    const retry = () => {
      attempt += 1;
      const again = getProductInfo({ fullScan: true });
      if (isComplete(again)) {
        upsertProduct(again, 1);
        return;
      }
      if (attempt < MAX_ATTEMPTS) {
        setTimeout(retry, DELAY_MS);
      }
    };

    setTimeout(retry, DELAY_MS);
  }

  initCartPanel();
})();
