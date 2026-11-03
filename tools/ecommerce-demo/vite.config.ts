import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import fs from "node:fs";
import path from "node:path";

// The built demo lives in the published site at /demos/ecommerce/. Product images are generated
// straight into that folder by scripts/build-images.mjs, so they are not duplicated in this
// project; during development they are served from there.
const OUT = path.resolve(__dirname, "../../demos/ecommerce");
const IMG = path.join(OUT, "img");

function serveImages(): Plugin {
  return {
    name: "serve-demo-images",
    configureServer(server) {
      server.middlewares.use("/img", (req, res, next) => {
        const file = path.join(IMG, decodeURIComponent((req.url || "").split("?")[0]));
        if (!file.startsWith(IMG) || !fs.existsSync(file)) return next();
        res.setHeader("Content-Type", file.endsWith(".webp") ? "image/webp" : "application/octet-stream");
        fs.createReadStream(file).pipe(res);
      });
    }
  };
}

export default defineConfig({
  base: "./",
  plugins: [react(), tailwindcss(), serveImages()],
  resolve: { alias: { "@": path.resolve(__dirname, "src") } },
  publicDir: false,
  build: {
    outDir: OUT,
    emptyOutDir: false,
    assetsDir: "assets",
    target: "es2022",
    chunkSizeWarningLimit: 400
  }
});
