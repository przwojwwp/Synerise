import { defineConfig } from "vite";
import monkey from "vite-plugin-monkey";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(new URL(import.meta.url)));

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  plugins: [
    monkey({
      entry: "src/index.ts",
      userscript: {
        name: "MiniCart Auto-Injector",
        namespace: "https://local/minicart",
        description: "Mini cart overlay that persists across product pages.",
        match: ["*://*/*"],
        "run-at": "document-idle",
        "inject-into": "page",
        noframes: true,
        grant: [],
      },
      build: {
        fileName: "minicart.user.js",
      },
    }),
  ],
  build: {
    target: "es2022",
  },
});
