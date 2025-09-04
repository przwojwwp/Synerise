import type { ProductInfo } from "./ProductInfo";

export type CartItem = ProductInfo & {
  id: string;
  quantity: number;
  addedAt: string;
  updatedAt: string;
};

export type CartState = {
  version: 1;
  updatedAt: string;
  items: CartItem[];
};

export const CART_LS_KEY = "__minicart:cart__";
export const CART_VERSION = 1 as const;
