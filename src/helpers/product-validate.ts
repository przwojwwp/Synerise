import type { ProductInfo } from "../types/ProductInfo";
import { toAbsUrl } from "./url";

export function isCompleteProduct(p: ProductInfo): p is Required<ProductInfo> {
  const nameOk = typeof p.name === "string" && p.name.trim().length > 1;

  const priceOk = typeof p.price === "number" && Number.isFinite(p.price);

  const imgOk = typeof p.imageUrl === "string" && !!toAbsUrl(p.imageUrl);

  const urlOk = typeof p.productUrl === "string" && !!toAbsUrl(p.productUrl);

  return nameOk && priceOk && imgOk && urlOk;
}
