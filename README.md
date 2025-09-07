# MiniCart (Tampermonkey)

A lightweight userscript that adds a cross-site mini cart to product pages. It auto-detects product data (name, price, image, URL), stores it in `localStorage`, and shows a compact cart UI.

## Features

- Detects product data from:
  - JSON-LD (`application/ld+json`)
  - App states (e.g. `__NEXT_DATA__`, `__NUXT__`)
  - DOM fallback (meta tags, common `data-*`, currency text)
- Hydration retry: up to 3 attempts (700 ms apart) if price isn’t ready.
- Shadow DOM panel with columns: **Name**, **Price**, **Quantity**, **Total**, **Actions**.
- Quantity shows the count in cart (read-only).
- Actions: stepper (− / +) to choose how many to remove (1…quantity), then **Remove**.
- Data persists via `localStorage` per domain.

## Install (Tampermonkey)

1. Install Tampermonkey in your browser.
2. Paste code from minicart.user.js
3. Enable Tampermonkey.
