import { detectDataFormat } from "./utils/detectDataFormat/detectDataFormat";
import type { ProductInfo } from "./types/ProductInfo";
import { getProductInfo } from "./cart/getProductInfo";

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
    };
  }
}

(() => {
  (window as any).MiniCart = { getProductInfo, detectDataFormat };

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
})();
