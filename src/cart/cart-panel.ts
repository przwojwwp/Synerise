import { calcTotal, getCart, removeItem } from "./cart";
import { CART_LS_KEY } from "../types/Cart";
import { asNumber, fmt, fromCents, toCents } from "../helpers/money";

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

const styleTag = (): HTMLStyleElement => {
  const style = document.createElement("style");
  style.textContent = `
    .panel {
      position: relative;
      box-shadow: 0 6px 24px rgba(0,0,0,.2);
      border: 1px solid rgba(0,0,0,.12);
      border-radius: 10px;
      background: #fff;
      font: 14px/1.4 system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif;
      min-width: 280px;
      max-width: 360px;
      color: #111;
      overflow: hidden;
    }
    .header {
      display:flex; align-items:center; justify-content:space-between;
      padding: 10px 12px; border-bottom: 1px solid rgba(0,0,0,.08);
      background: #fafafa;
    }
    .title { font-weight: 700; }
    .close { border: 0; background: transparent; cursor: pointer; font-size: 18px; }
    .list { max-height: 280px; overflow: auto; }
    .row {
      display:grid; grid-template-columns: 1fr auto auto auto; gap: 8px;
      align-items:center; padding: 8px 12px; border-bottom: 1px dashed rgba(0,0,0,.06);
    }
    .row:last-child { border-bottom: 0; }
    .row .name { font-weight: 600; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
    .row .qty { text-align:right; min-width: 2ch; }
    .row .price, .row .total { text-align:right; white-space:nowrap; }
    .row .remove { margin-left: 8px; cursor:pointer; border:0; background:transparent; color:#c00; }
    .footer {
      padding: 10px 12px; display:flex; justify-content:space-between; align-items:center;
      background: #fafafa; border-top: 1px solid rgba(0,0,0,.08);
      font-weight: 700;
    }
    .empty { padding: 16px; text-align:center; color:#666; }
    .toggle {
      position: absolute; top: -36px; right: 0;
      border-radius: 10px 10px 0 0;
      background: #111; color: #fff; padding: 6px 10px; font-size: 12px;
      border: 0; cursor: pointer;
    }
    a { color: inherit; text-decoration: none; }
  `;
  return style;
};

/** --- render ------------------------------------------------------------ */
const render = (shadowRoot: ShadowRoot) => {
  const state = getCart(); // stan koszyka
  const total = calcTotal(state); // liczony w groszach po stronie cart.ts

  const wrapper = document.createElement("div");
  wrapper.className = "panel";
  wrapper.id = PANEL_ID;

  const toggle = document.createElement("button");
  toggle.className = "toggle";
  toggle.textContent = "Cart";
  toggle.addEventListener("click", () => {
    const el = shadowRoot.getElementById(PANEL_ID);
    if (!el) return;
    el.style.display = el.style.display === "none" ? "" : "none";
  });

  const header = document.createElement("div");
  header.className = "header";
  header.innerHTML = `
    <div class="title">Mini Cart</div>
    <button class="close" aria-label="Close panel">×</button>
  `;

  const list = document.createElement("div");
  list.className = "list";

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

      const qty = document.createElement("div");
      qty.className = "qty";
      qty.textContent = String(it.quantity);

      const price = document.createElement("div");
      price.className = "price";
      const unit = asNumber(it.price);
      price.textContent = fmt(unit);

      const line = document.createElement("div");
      line.className = "total";
      const lineCents = toCents(unit) * it.quantity;
      line.textContent = fromCents(lineCents).toFixed(2);

      const remove = document.createElement("button");
      remove.className = "remove";
      remove.textContent = "Remove";
      remove.addEventListener("click", (e) => {
        e.preventDefault();
        removeItem(it.id);
      });

      row.appendChild(name);
      row.appendChild(qty);
      row.appendChild(price);

      const totalWrap = document.createElement("div");
      totalWrap.style.display = "flex";
      totalWrap.style.alignItems = "center";
      totalWrap.style.gap = "6px";
      totalWrap.appendChild(line);
      totalWrap.appendChild(remove);
      row.appendChild(totalWrap);

      list.appendChild(row);
    }
  }

  const footer = document.createElement("div");
  footer.className = "footer";
  footer.innerHTML = `
    <div>Total:</div>
    <div>${total.toFixed(2)}</div>
  `;

  header
    .querySelector<HTMLButtonElement>(".close")!
    .addEventListener("click", () => {
      const el = shadowRoot.getElementById(PANEL_ID);
      if (el) el.style.display = "none";
    });

  shadowRoot.innerHTML = "";
  shadowRoot.appendChild(styleTag());
  wrapper.appendChild(toggle);
  wrapper.appendChild(header);
  wrapper.appendChild(list);
  wrapper.appendChild(footer);
  shadowRoot.appendChild(wrapper);
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
