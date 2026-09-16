#!/usr/bin/env node
import { cpSync, existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const dest = join(root, "native/android/app/src/main/assets");

const candidates = [
  join(root, ".vercel/output/static"),   // ✅ Vercel/Nitro output (projet NOVA)
  join(root, ".output/public"),          // Nitro قدیمی
  join(root, "dist/client"),             // Vite SSR
  join(root, "dist"),                    // Vite معمولی
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
    `<!doctype html><html lang="fa" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>NOVA AI</title></head><body style="font-family:sans-serif;background:#f3f0e8;color:#1a2a1c;padding:2rem;text-align:center"><h1>NOVA AI</h1><p>رابط وب هنوز ساخته نشده. ابتدا npm run build سپس android:assets را اجرا کنید.</p></body></html>`,
  );
  console.log("[prepare-android-assets] placeholder index.html (no web build found)");
} else {
  for (const name of ["assets", "index.html"]) {
    const from = join(source, name);
    if (existsSync(from)) {
      const to = join(dest, name);
      rmSync(to, { recursive: true, force: true });
      cpSync(from, to, { recursive: true });
      console.log(`[prepare-android-assets] copied ${name}`);
    }
  }
  // Copy remaining top-level files (favicon, logo, etc.)
  const skip = new Set(["server", "nitro.json"]);
  try {
    const { readdirSync } = await import("node:fs");
    for (const entry of readdirSync(source)) {
      if (skip.has(entry) || entry === "assets" || entry === "index.html") continue;
      const from = join(source, entry);
      const to = join(dest, entry);
      rmSync(to, { recursive: true, force: true });
      cpSync(from, to, { recursive: true });
      console.log(`[prepare-android-assets] copied ${entry}`);
    }
  } catch {
    /* ignore */
  }
  console.log(`[prepare-android-assets] copied ${source} -> ${dest}`);
}

const inject = spawnSync(process.execPath, [join(root, "scripts/inject-android-bridge.mjs"), join(dest, "index.html")], {
  stdio: "inherit",
});
process.exit(inject.status ?? 0);
