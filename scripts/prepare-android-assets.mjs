#!/usr/bin/env node
import { cpSync, existsSync, mkdirSync, rmSync, writeFileSync, readdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const dest = join(root, "native/android/app/src/main/assets");

const candidates = [
  join(root, ".vercel/output/static"),
  join(root, ".output/public"),
  join(root, "dist/client"),
  join(root, "dist"),
];

const source = candidates.find((p) => existsSync(join(p, "index.html")) || existsSync(p));

console.log(`[prepare-android-assets] candidates checked:`);
for (const c of candidates) {
  console.log(`  - ${c} ${existsSync(c) ? "✅" : "❌"}`);
}
console.log(`[prepare-android-assets] chosen source: ${source || "NONE"}`);

mkdirSync(dest, { recursive: true });

if (!source || !existsSync(source)) {
  writeFileSync(
    join(dest, "index.html"),
    `<!doctype html><html lang="fa" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>NOVA AI</title></head><body style="font-family:sans-serif;background:#f3f0e8;color:#1a2a1c;padding:2rem;text-align:center"><h1>NOVA AI</h1><p>رابط وب هنوز ساخته نشده.</p></body></html>`,
  );
  console.log("[prepare-android-assets] placeholder index.html (no web build found)");
} else {
  // ۱. کپی همه فایل‌های استاتیک به جز index.html
  const skip = new Set(["server", "nitro.json", "index.html"]);
  for (const entry of readdirSync(source)) {
    if (skip.has(entry)) continue;
    const from = join(source, entry);
    const to = join(dest, entry);
    rmSync(to, { recursive: true, force: true });
    cpSync(from, to, { recursive: true });
    console.log(`[prepare-android-assets] copied ${entry}`);
  }

  // ۲. پیدا کردن اسم فایل JS و CSS ساخته‌شده
  const assetsDir = join(source, "assets");
  let jsFile = null;
  let cssFile = null;
  if (existsSync(assetsDir)) {
    for (const f of readdirSync(assetsDir)) {
      if (f.startsWith("index-") && f.endsWith(".js")) jsFile = f;
      if (f.startsWith("styles-") && f.endsWith(".css")) cssFile = f;
    }
  }

  console.log(`[prepare-android-assets] found JS: ${jsFile}, CSS: ${cssFile}`);

  // ۳. ساخت index.html که SPA رو لود کنه
  const html = `<!doctype html>
<html lang="fa" dir="rtl">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover" />
    <meta name="theme-color" content="#1a2a1c" />
    <title>NOVA AI</title>
    ${cssFile ? `<link rel="stylesheet" href="/assets/${cssFile}" />` : ""}
    <link rel="icon" href="/favicon.svg" />
  </head>
  <body>
    <div id="root"></div>
    ${jsFile ? `<script type="module" src="/assets/${jsFile}"></script>` : ""}
  </body>
</html>`;

  writeFileSync(join(dest, "index.html"), html);
  console.log("[prepare-android-assets] generated index.html for SPA");

  console.log(`[prepare-android-assets] copied ${source} -> ${dest}`);
}

const inject = spawnSync(process.execPath, [join(root, "scripts/inject-android-bridge.mjs"), join(dest, "index.html")], {
  stdio: "inherit",
});
process.exit(inject.status ?? 0);
