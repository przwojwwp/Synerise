import { defineConfig } from "vite";
import monkey from "vite-plugin-monkey";
import path from "node:path";

export default defineConfig({
  resolve: {
    alias: {
      "@core": path.resolve(__dirname, "src/core"),
      "@ui": path.resolve(__dirname, "src/ui"),
      "@shared": path.resolve(__dirname, "src/shared"),
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
