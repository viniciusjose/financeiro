import path from "node:path";
import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/server.ts"],
  format: ["esm"],
  target: "node24",
  outDir: "dist",
  clean: true,
  sourcemap: true,
  splitting: false,
  dts: false,
  esbuildOptions(options) {
    options.alias = {
      "@": path.resolve("src"),
    };
  },
});
