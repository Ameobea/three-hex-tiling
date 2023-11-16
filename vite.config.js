import { resolve } from "path";
import { defineConfig } from "vite";
import glsl from "vite-plugin-glsl";
import dts from "vite-plugin-dts";

export default defineConfig({
  plugins: [glsl({ compress: false }), dts({ include: "src/index.ts" })],
  build: {
    copyPublicDir: false,
    lib: {
      entry: resolve(__dirname, "src/index.ts"),
      name: "three-hex-tiling",
      fileName: "index",
    },
    rollupOptions: {
      // make sure to externalize deps that shouldn't be bundled into the library
      external: ["three"],
      output: {
        // Provide global variables to use in the UMD build for externalized deps
        globals: {
          three: "THREE",
        },
      },
    },
  },
});
