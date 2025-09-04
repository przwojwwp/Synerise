import { getProductName } from "./cart/product";
import { detectDataFormat } from "./utils/detectDataFormat/detectDataFormat";

declare global {
  interface Window {
    MiniCart: {
      getProductName: (opts?: {
        fullScan?: boolean;
        maxScripts?: number;
      }) => string | null;
      detectDataFormat: (
        fullScan?: boolean
      ) => "ld+json" | "json" | "both" | "none";
    };
  }
}

(() => {
  (window as any).MiniCart = { getProductName, detectDataFormat };

  const blue = "color: dodgerblue; font-weight: bold;";
  const yellow = "color: gold; font-weight: bold;";

  console.log(
    "Tip: You can run %cMiniCart.getProductName%c()%c in the console (optionally: { fullScan: false, maxScripts: 8 })",
    yellow,
    blue,
    ""
  );

  const t0 = performance.now?.() ?? Date.now();
  const format = detectDataFormat(true);
  const name = getProductName({ fullScan: true });
  const t1 = performance.now?.() ?? Date.now();

  console.log("Detected data format: %c%s", blue, format);

  if (name) {
    console.log("Detected product name: %c%s", blue, name);
  } else {
    console.log(
      "%cProduct name not found.%c Try %cMiniCart.getProductName({ fullScan: true, maxScripts: 20 })",
      yellow,
      "",
      blue
    );
  }

  console.log("%cScan time:%c %d ms", yellow, "", Math.round(t1 - t0));
})();
