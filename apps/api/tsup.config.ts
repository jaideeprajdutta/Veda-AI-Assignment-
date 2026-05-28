import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    server: "src/server.ts",
    worker: "src/worker/index.ts",
  },
  format: ["cjs"],
  target: "node20",
  sourcemap: true,
  clean: true,
  // bundle the workspace shared package into the output
  noExternal: ["@vedaai/shared"],
});
