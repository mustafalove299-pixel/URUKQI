#!/usr/bin/env node
/* Copies the web game (games/alghaz) into www/ for the native app:
   fonts are bundled locally, and web-only bits (service worker, web manifest)
   are removed because the app already works offline. */
"use strict";
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "../../..");
const GAME = path.join(ROOT, "games/alghaz");
const WWW = path.resolve(__dirname, "../www");

fs.rmSync(WWW, { recursive: true, force: true });
fs.mkdirSync(path.join(WWW, "fonts"), { recursive: true });

for (const f of ["icon.svg", "icon-192.png", "icon-512.png"]) fs.copyFileSync(path.join(GAME, f), path.join(WWW, f));
for (const f of ["cairo-arabic-wght-normal.woff2", "cairo-latin-wght-normal.woff2"])
  fs.copyFileSync(path.join(ROOT, "assets/fonts", f), path.join(WWW, "fonts", f));

let html = fs.readFileSync(path.join(GAME, "index.html"), "utf8");
const swap = (from, to) => {
  if (!html.includes(from)) throw new Error("prepare-www: expected text not found: " + from.slice(0, 60));
  html = html.split(from).join(to);
};
swap("../../assets/fonts/", "fonts/");
swap('<link rel="manifest" href="manifest.webmanifest">\n', "");
swap('<a href="../../">URUKQI</a>', '<a href="https://urukqi.pages.dev/">URUKQI</a>');
html = html.replace(/if \("serviceWorker" in navigator[^\n]*\n[^\n]*\n\}\n/, "");
if (html.includes("serviceWorker")) throw new Error("prepare-www: service worker block not removed");

fs.writeFileSync(path.join(WWW, "index.html"), html);
console.log("www/ ready:", fs.readdirSync(WWW).join(", "));
