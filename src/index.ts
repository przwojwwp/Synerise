import { detectDataFormat } from "./utils/detectDataFormat/detectDataFormat";
import type { ProductInfo } from "./types/ProductInfo";
import { getProductInfo } from "./cart/getProductInfo";
import { upsertProduct, getCart } from "./cart/cart";
import { initCartPanel } from "./cart/cart-panel";
import { CART_LS_KEY } from "./types/Cart";

declare global {
  interface Window {
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

  const blue = "color: dodgerblue; font-weight: bold;";
  const yellow = "color: gold; font-weight: bold;";

  console.log(
    "Tip: You can run %cMiniCart.getProductInfo%c()%c — optionally with { fullScan: false, maxScripts: 8 }",
    yellow,
    blue,
    ""
  );

  const t0 = performance.now?.() ?? Date.now();
  const format = detectDataFormat(true);
  const info = getProductInfo({ fullScan: true });
  const t1 = performance.now?.() ?? Date.now();

  console.log("Detected data format: %c%s", blue, format);
  console.log("Product info:", info);
  console.log("%cScan time:%c %d ms", yellow, "", Math.round(t1 - t0));

  const saved = upsertProduct(info, 1);
  if (saved) {
    console.log(
      "%c[MiniCart]%c saved to localStorage '%s':",
      yellow,
      "",
      CART_LS_KEY,
      saved
    );
    console.log(
      "%c[MiniCart]%c current cart (from '%s'):",
      yellow,
      "",
      CART_LS_KEY,
      getCart()
    );
  } else {
    console.log(
      "%c[MiniCart]%c skipped — product incomplete (requires name, price, imageUrl, productUrl).",
      yellow,
      ""
    );
  }

  initCartPanel();
})();
