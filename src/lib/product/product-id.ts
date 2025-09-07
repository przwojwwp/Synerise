import type { ProductInfo } from "@/types/ProductInfo";

const djb2 = (str: string): string => {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) + hash + str.charCodeAt(i);
  }
  return (hash >>> 0).toString(16);
};

export const getProductId = (p: ProductInfo): string => {
  if (p.productUrl) return p.productUrl;
  const sig = `${p.name ?? ""}|${p.imageUrl ?? ""}|${p.price ?? ""}`;
  return `hash:${djb2(sig)}`;
};
