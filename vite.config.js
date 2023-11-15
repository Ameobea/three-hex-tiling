import { resolve } from "path";
import { defineConfig } from "vite";
import glsl from "vite-plugin-glsl";

export default defineConfig({
  plugins: [
    glsl({
      compress: false,
    }),
  ],
  build: {
    lib: {
      // Could also be a dictionary or array of multiple entry points
      entry: resolve(__dirname, "src/index.ts"),
      name: "three-hex-tiling",
      // the proper extensions will be added
      fileName: "index",
    },
    rollupOptions: {
      // make sure to externalize deps that shouldn't be bundled
      // into your library
      external: ["three"],
      output: {
        // Provide global variables to use in the UMD build
        // for externalized deps
        globals: {
          three: "THREE",
        },
      },
    },
  },
});
