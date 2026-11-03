// Removes the previous build's page and scripts from /demos/ecommerce/, keeping the generated images.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const OUT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../demos/ecommerce");
fs.rmSync(path.join(OUT, "assets"), { recursive: true, force: true });
fs.rmSync(path.join(OUT, "index.html"), { force: true });
