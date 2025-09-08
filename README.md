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

## Tampermonkey — Install & Connect (necessary to keep the minicart when changing product cards!)

1. Install Tampermonkey
   Chrome/Brave: Open the Chrome Web Store → search Tampermonkey → Add to Chrome → Add extension.
   Edge: Open Microsoft Edge Add-ons → search Tampermonkey → Get.
   Firefox: Open Firefox Add-ons → search Tampermonkey → Add to Firefox.
   After installation, click the extensions (puzzle) icon and Pin Tampermonkey so the icon is visible.

2. Add your userscript
   Click the Tampermonkey icon → Create a new script…
   Paste code from dist/minicart.user.js and save.
   Install and enable script.

3. Reload the target page.
   The Tampermonkey icon should show a small badge number indicating active scripts.

4. Verify & debug
   Click the Tampermonkey icon → confirm your script is Enabled.
   Open Dashboard → Logs to see script logs.
   Use the browser DevTools Console for console.log output and errors.

You can also double-check the installation steps on the official Tampermonkey website (Installation & FAQ): https://www.tampermonkey.net/
