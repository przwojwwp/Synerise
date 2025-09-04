import { getProductName } from "./cart/product";

(() => {
  (window as any).MiniCart = { getProductName };

  const blue = "color: dodgerblue; font-weight: bold;";
  const yellow = "color: gold; font-weight: bold;";

  console.log(
    "Tip: You can also run %cMiniCart.getProductName%c()%c in console",
    yellow,
    blue,
    ""
  );

  const name = getProductName();
  console.log("Detected product name: %c%s", blue, name);
})();
