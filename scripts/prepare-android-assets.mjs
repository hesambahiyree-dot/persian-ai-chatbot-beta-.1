#!/usr/bin/env node
import { cpSync, existsSync, mkdirSync, rmSync, readdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const dest = join(root, "native/android/app/src/main/assets");
const source = join(root, "dist");

if (!existsSync(join(source, "index.html"))) {
  console.error("ERROR: dist/index.html not found. Run `npm run build` first.");
  process.exit(1);
}

if (existsSync(dest)) rmSync(dest, { recursive: true, force: true });
mkdirSync(dest, { recursive: true });
cpSync(source, dest, { recursive: true });

console.log(`[prepare-android-assets] copied ${source} -> ${dest}`);
console.log(`[prepare-android-assets] contents:`);
for (const f of readdirSync(dest)) {
  console.log(`  - ${f}`);
}
