import { readLS, writeLS } from "../helpers/ls";
import { getProductId } from "../helpers/product-id";
import { isCompleteProduct } from "../helpers/product-validate";
import {
  CART_LS_KEY,
  CART_VERSION,
  type CartItem,
  type CartState,
} from "../types/Cart";
import type { ProductInfo } from "../types/ProductInfo";

const nowIso = () => new Date().toISOString();

export const loadCart = (): CartState => {
  const data = readLS<CartState>(CART_LS_KEY);
  if (data && Array.isArray(data.items)) {
    return {
      version: CART_VERSION,
      updatedAt: data.updatedAt ?? nowIso(),
      items: data.items.map((it) => ({
        ...it,
        addedAt: it.addedAt ?? nowIso(),
        updatedAt: it.updatedAt ?? nowIso(),
      })),
    };
  }
  return { version: CART_VERSION, updatedAt: nowIso(), items: [] };
};

export const saveCart = (state: CartState): boolean => {
  const payload: CartState = {
    ...state,
    version: CART_VERSION,
    updatedAt: nowIso(),
  };
  return writeLS(CART_LS_KEY, payload);
};

export const upsertProduct = (info: ProductInfo, qty = 1): CartItem | null => {
  if (!isCompleteProduct(info)) {
    return null;
  }

  const id = getProductId(info);
  const state = loadCart();

  const existing = state.items.find((x) => x.id === id);
  if (existing) {
    existing.quantity += Math.max(1, qty);
    existing.updatedAt = nowIso();
    saveCart(state);
    return existing;
  }

  const item: CartItem = {
    id,
    name: info.name,
    price: info.price,
    imageUrl: info.imageUrl,
    productUrl: info.productUrl,
    quantity: Math.max(1, qty),
    addedAt: nowIso(),
    updatedAt: nowIso(),
  };

  state.items.unshift(item);
  saveCart(state);
  return item;
};

export const getCart = (): CartState => {
  return loadCart();
};
