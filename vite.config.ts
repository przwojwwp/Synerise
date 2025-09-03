import { defineConfig } from "vite";
export default defineConfig({
  build: {
    lib: {
      entry: "src/index.ts",
      name: "MiniCart",
      formats: ["iife"],
      fileName: () => "mini-cart.js",
    },
    rollupOptions: { output: { inlineDynamicImports: true } },
    target: "es2018",
  },
});
