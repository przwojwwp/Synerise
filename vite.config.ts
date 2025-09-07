// vite.config.ts
import { defineConfig } from "vite";
import monkey from "vite-plugin-monkey";

export default defineConfig({
  plugins: [
    monkey({
      entry: "src/index.ts",
      userscript: {
        name: "MiniCart Auto-Injector",
        namespace: "https://local/minicart",
        description: "Mini cart overlay that persists across product pages.",
        match: ["*://*/*"],
        "run-at": "document-idle",
        grant: [],
      },
      build: { fileName: "minicart.user.js" },
    }),
  ],
  build: { target: "es2022" },
});
