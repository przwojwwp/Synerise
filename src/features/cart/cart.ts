import { fromCents, toCents } from "@/lib/money";
import { getProductId } from "@/lib/product/product-id";
import { isCompleteProduct } from "@/lib/product/product-validate";
import { readLS, writeLS } from "@/lib/storage/ls";
import {
  CART_LS_KEY,
  CART_VERSION,
  type CartItem,
  type CartState,
} from "@/types/Cart";
import type { ProductInfo } from "@/types/ProductInfo";

const OLD_CART_LS_KEY = "cart";
const nowIso = () => new Date().toISOString();

export const loadCart = (): CartState => {
  const existing = readLS<CartState>(CART_LS_KEY);
  if (!existing) {
    const legacy = readLS<CartState>(OLD_CART_LS_KEY);
    if (legacy && Array.isArray(legacy.items)) {
      writeLS(CART_LS_KEY, legacy);
    }
  }

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
  const ok = writeLS(CART_LS_KEY, payload);
  try {
    window.dispatchEvent(new CustomEvent("minicart:change"));
  } catch {}
  return ok;
};

export const upsertProduct = (info: ProductInfo, qty = 1): CartItem | null => {
  if (!isCompleteProduct(info)) return null;

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

export const removeItem = (id: string): boolean => {
  const state = loadCart();
  const before = state.items.length;
  state.items = state.items.filter((it) => it.id !== id);
  return before !== state.items.length ? saveCart(state) : false;
};

export const setQuantity = (id: string, qty: number): boolean => {
  const state = loadCart();
  const item = state.items.find((i) => i.id === id);
  if (!item) return false;

  const next = Math.max(1, Math.floor(qty));
  if (item.quantity === next) return false;

  item.quantity = next;
  item.updatedAt = nowIso();
  return saveCart(state);
};

export const removeSome = (id: string, count = 1): boolean => {
  const state = loadCart();
  const item = state.items.find((i) => i.id === id);
  if (!item) return false;

  const n = Math.max(1, Math.min(item.quantity, Math.floor(count)));
  const left = item.quantity - n;

  if (left <= 0) {
    state.items = state.items.filter((i) => i.id !== id);
  } else {
    item.quantity = left;
    item.updatedAt = nowIso();
  }
  return saveCart(state);
};

export const calcTotal = (state = loadCart()): number => {
  const cents = state.items.reduce((sum, it) => {
    const unit =
      typeof it.price === "number" && Number.isFinite(it.price) ? it.price : 0;
    return sum + toCents(unit) * it.quantity;
  }, 0);
  return fromCents(cents);
};

export const getCart = (): CartState => loadCart();
