import { asNumber, fmt, fromCents, toCents } from "@/lib/money";
import {
  calcTotal,
  getCart,
  removeSome,
  removeItem,
} from "@/features/cart/cart";
import { CART_LS_KEY } from "@/types/Cart";
import { styleTag } from "./cart-panel-styles";

const PANEL_ID = "mini-cart-panel";
const PANEL_SHADOW_HOST_ID = "mini-cart-panel-host";

const ensureHost = (): HTMLElement => {
  let host = document.getElementById(PANEL_SHADOW_HOST_ID);
  if (!host) {
    host = document.createElement("div");
    host.id = PANEL_SHADOW_HOST_ID;
    host.style.position = "fixed";
    host.style.bottom = "16px";
    host.style.right = "16px";
    host.style.zIndex = "2147483647";
    document.documentElement.appendChild(host);
  }
  return host;
};

const getShadowRoot = (host: HTMLElement): ShadowRoot =>
  host.shadowRoot ?? host.attachShadow({ mode: "open" });


const render = (shadowRoot: ShadowRoot) => {
  const state = getCart();
  const total = calcTotal(state);

  const prevDock = shadowRoot.querySelector<HTMLDivElement>(".dock");
  const wasOpen = prevDock?.classList.contains("open") ?? true;

  const dock = document.createElement("div");
  dock.className = "dock" + (wasOpen ? " open" : "");

  const toggle = document.createElement("button");
  toggle.className = "toggle";
  toggle.type = "button";
  toggle.setAttribute("aria-controls", PANEL_ID);
  toggle.setAttribute("aria-expanded", String(wasOpen));
  toggle.textContent = wasOpen ? "Hide cart" : "Cart";
  toggle.addEventListener("click", () => {
    const isOpen = dock.classList.toggle("open");
    toggle.setAttribute("aria-expanded", String(isOpen));
    toggle.textContent = isOpen ? "Hide cart" : "Cart";
  });

  const wrapper = document.createElement("div");
  wrapper.className = "panel";
  wrapper.id = PANEL_ID;

  const header = document.createElement("div");
  header.className = "header";
  header.innerHTML = `<div class="title">Mini Cart</div>`;

  const list = document.createElement("div");
  list.className = "list";

  const cols = document.createElement("div");
  cols.className = "cols";
  cols.innerHTML = `
    <div>Name</div>
    <div class="price">Price</div>
    <div class="quantity">Quantity</div>
    <div class="total">Total</div>
    <div class="actions">Actions</div>
  `;
  list.appendChild(cols);

  if (state.items.length === 0) {
    const empty = document.createElement("div");
    empty.className = "empty";
    empty.textContent = "Your cart is empty.";
    list.appendChild(empty);
  } else {
    for (const it of state.items) {
      const row = document.createElement("div");
      row.className = "row";
      row.dataset.id = it.id;

      const name = document.createElement("div");
      name.className = "name";
      name.title = it.name || "";
      name.innerHTML = it.productUrl
        ? `<a href="${it.productUrl}" target="_blank" rel="noopener">${it.name}</a>`
        : it.name || "";

      const price = document.createElement("div");
      price.className = "price";
      const unit = asNumber(it.price);
      price.textContent = fmt(unit);

      const qty = document.createElement("div");
      qty.className = "quantity";
      qty.textContent = String(it.quantity);

      const totalCell = document.createElement("div");
      totalCell.className = "total";
      const lineCents = toCents(unit) * it.quantity;
      totalCell.textContent = fmt(fromCents(lineCents));

      const actions = document.createElement("div");
      actions.className = "actions";
      const controls = document.createElement("div");
      controls.className = "controls";

      const stepper = document.createElement("div");
      stepper.className = "stepper";

      const minusBtn = document.createElement("button");
      minusBtn.type = "button";
      minusBtn.setAttribute("aria-label", "Decrease");
      minusBtn.textContent = "−";

      const input = document.createElement("input");
      input.type = "number";
      input.min = "1";
      input.max = String(it.quantity);
      input.value = "1";

      const plusBtn = document.createElement("button");
      plusBtn.type = "button";
      plusBtn.setAttribute("aria-label", "Increase");
      plusBtn.textContent = "+";

      const clamp = (v: number) => Math.max(1, Math.min(it.quantity, v));
      minusBtn.addEventListener("click", () => {
        input.value = String(clamp((parseInt(input.value) || 1) - 1));
      });
      plusBtn.addEventListener("click", () => {
        input.value = String(clamp((parseInt(input.value) || 1) + 1));
      });
      input.addEventListener("input", () => {
        input.value = String(clamp(parseInt(input.value) || 1));
      });

      stepper.append(minusBtn, input, plusBtn);

      const rmBtn = document.createElement("button");
      rmBtn.className = "removeBtn";
      rmBtn.textContent = "Remove";
      rmBtn.addEventListener("click", (e) => {
        e.preventDefault();
        const n = clamp(parseInt(input.value) || 1);
        if (n >= it.quantity) removeItem(it.id);
        else removeSome(it.id, n);
      });

      controls.append(stepper, rmBtn);
      actions.appendChild(controls);

      row.append(name, price, qty, totalCell, actions);
      list.appendChild(row);
    }
  }

  const footer = document.createElement("div");
  footer.className = "footer";
  footer.innerHTML = `<div>Total:</div><div>${total.toFixed(2)}</div>`;

  shadowRoot.innerHTML = "";
  shadowRoot.appendChild(styleTag());

  wrapper.append(header, list, footer);
  dock.append(toggle, wrapper);
  shadowRoot.appendChild(dock);
};

export const initCartPanel = (): void => {
  const host = ensureHost();
  const shadow = getShadowRoot(host);
  render(shadow);

  window.addEventListener("minicart:change", () => render(shadow));
  window.addEventListener("storage", (ev) => {
    if (ev.key === CART_LS_KEY) render(shadow);
  });
};
