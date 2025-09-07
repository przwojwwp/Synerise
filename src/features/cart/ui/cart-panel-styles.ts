export const styleTag = (): HTMLStyleElement => {
  const style = document.createElement("style");
  style.textContent = `
    /* ======================= PANEL ======================= */
    .panel {
      width: 600px;
      min-width: 600px;
      max-width: 600px;
      height: 400px;

      /* CSS variables */
      --w-price: 8ch;
      --w-qty: 4.5ch;
      --w-total: 8ch;
      --ui-scale: 1;
      --w-actions: calc(96px * var(--ui-scale) * 0.8);
      --row-h: 36px;
      --gap: 8px;
      --step-btn: calc(24px * var(--ui-scale));
      --step-h: calc(24px * var(--ui-scale));
      --step-gap: 3px;

      position: relative;
      display: flex;
      flex-direction: column;

      box-shadow: 0 10px 34px rgba(0, 0, 0, .24);
      border: 1px solid rgba(0, 0, 0, .12);
      border-radius: 10px;
      background: #fff;

      font: 16px/1.4 system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif;
      color: #111;

      overflow: hidden;
    }

    /* --- DOCK (pojemnik na toggle + panel) --- */
    .dock { position: relative; }
    /* ukrywa panel, ale NIE toggle */
    .dock:not(.open) .panel { display: none; }
    .dock.open .panel { display: flex; }

    /* --- TOGGLE --- */
    .toggle {
      position: absolute;
      right: 0;

      border: 0;
      cursor: pointer;

      color: #fff;
      background: #111;

      font-size: 12px;
      padding: 6px 10px;

      box-shadow: 0 4px 12px rgba(0, 0, 0, .24);
    }

    /* gdy otwarte – „języczek” nad panelem */
    .dock.open .toggle {
      top: -34px;
      bottom: auto;
      border-radius: 10px 10px 0 0;
    }

    /* gdy zamknięte – piguła przy krawędzi */
    .dock:not(.open) .toggle {
      top: auto;
      bottom: 0;
      border-radius: 999px;
    }

    /* ======================= HEADER ======================= */
    .header {
      display: flex;
      align-items: center;
      justify-content: flex-start; /* bez X po prawej */

      padding: 8px 10px;

      border-bottom: 1px solid rgba(0, 0, 0, .08);
      background: #fafafa;

      flex: 0 0 auto;
    }
    .title { font-weight: 700; }

    /* ======================== LISTA ======================= */
    .list {
      flex: 1 1 auto;
      overflow-y: auto;
      overflow-x: hidden;
      min-height: 0;
    }

    .cols,
    .row {
      display: grid;
      grid-template-columns:
        minmax(0, 1fr)
        var(--w-price)
        var(--w-qty)
        var(--w-total)
        var(--w-actions);
      gap: var(--gap);
      align-items: center;
    }

    .cols {
      padding: 6px 10px;
      font-weight: 600;
      color: #0d47a1;
      border-bottom: 1px solid rgba(0, 0, 0, .06);
      background: #fbfbfb;
    }

    .cols > .name     { text-align: left;  }
    .cols > .price    { text-align: right; }
    .cols > .quantity { text-align: center;}
    .cols > .total    { text-align: right; }
    .cols > .actions  { text-align: right; }

    .row {
      padding: 0 0 0 10px;
      border-bottom: 1px dashed rgba(0, 0, 0, .06);
      min-height: var(--row-h);
    }
    .row:last-child { border-bottom: 0; }

    .name,
    .name a {
      display: block;
      max-width: 100%;
      min-width: 0;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;

      font-weight: 600;
      color: #111;
      text-decoration: none;
    }
    .name a:hover {
      text-decoration: underline;
      text-underline-offset: 2px;
    }

    .quantity { text-align: center; font-variant-numeric: tabular-nums; }
    .price,
    .total,
    .actions { text-align: right; white-space: nowrap; }

    /* ======================= STOPKA ======================= */
    .footer {
      padding: 8px 10px;
      display: flex;
      justify-content: space-between;
      align-items: center;

      background: #fafafa;
      border-top: 1px solid rgba(0, 0, 0, .08);
      font-weight: 700;

      flex: 0 0 auto;
    }

    /* ===================== AKCJE / UI ===================== */
    .actions { display: flex; justify-content: flex-end; }
    .controls {
      display: grid;
      grid-template-rows: 1fr 1fr;
      gap: 0;
      width: var(--w-actions);
    }
    .controls > * { width: 100%; }

    /* ------ Stepper ------ */
    .stepper {
      width: 100%;
      height: var(--step-h);

      display: grid;
      grid-template-columns: var(--step-btn) 1fr var(--step-btn);
      align-items: stretch;
      gap: var(--step-gap);

      box-sizing: border-box;
      border: 1px solid rgba(0, 0, 0, .12);
      border-radius: 6px;
      background: #f6f6f6;
      overflow: hidden;
    }

    .stepper button {
      width: var(--step-btn);
      height: 100%;
      padding: 0;
      border: 0;
      border-radius: 6px;
      background: #eee;
      cursor: pointer;

      font-size: 12px;
      line-height: 1;

      display: inline-flex;
      align-items: center;
      justify-content: center;
    }

    .stepper input[type="number"] {
      width: 100%;
      height: 100%;
      box-sizing: border-box;
      padding: 0;
      margin: 0;
      border: 0;
      background: transparent;

      text-align: center;
      line-height: calc(var(--step-h) - 4px);
      font-variant-numeric: tabular-nums;
      font-size: calc(13px * var(--ui-scale));

      appearance: textfield;
      -moz-appearance: textfield;
    }

    .stepper input[type="number"]::-webkit-outer-spin-button,
    .stepper input[type="number"]::-webkit-inner-spin-button {
      -webkit-appearance: none;
      margin: 0;
    }

    /* ------ Remove button ------ */
    .removeBtn {
      display: inline-flex;
      align-items: center;
      justify-content: center;

      width: 100%;
      height: var(--step-h);

      margin: 0;
      padding: 0;
      box-sizing: border-box;

      border: 1px solid rgba(0, 0, 0, .12);
      border-radius: 6px;

      background: #ffecec;
      color: #c62828;

      font-weight: 600;
      font-size: calc(13px * var(--ui-scale));
      white-space: nowrap;
    }
  `;
  return style;
};
