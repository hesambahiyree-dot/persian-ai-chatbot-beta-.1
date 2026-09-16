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
    `<!doctype html><html lang="fa" dir="rtl"><head><meta charset="utf-8"><title>NOVA AI</title></head><body><h1>NOVA AI</h1><p>رابط وب ساخته نشده.</p></body></html>`,
  );
  console.log("[prepare-android-assets] placeholder index.html (no web build found)");
} else {
  const skip = new Set(["server", "nitro.json", "index.html"]);
  for (const entry of readdirSync(source)) {
    if (skip.has(entry)) continue;
    const from = join(source, entry);
    const to = join(dest, entry);
    rmSync(to, { recursive: true, force: true });
    cpSync(from, to, { recursive: true });
    console.log(`[prepare-android-assets] copied ${entry}`);
  }

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

  const html = `<!doctype html>
<html lang="fa" dir="rtl">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover" />
    <title>NOVA AI</title>
    ${cssFile ? `<link rel="stylesheet" href="./assets/${cssFile}" />` : ""}
    <style>
      #debug-log {
        position: fixed;
        bottom: 0; left: 0; right: 0;
        max-height: 45vh;
        overflow: auto;
        background: rgba(0,0,0,0.9);
        color: #0f0;
        font: 12px/1.4 monospace;
        padding: 10px;
        z-index: 99999;
        direction: ltr;
        text-align: left;
        white-space: pre-wrap;
        word-break: break-all;
        border-top: 2px solid #0f0;
      }
    </style>
  </head>
  <body>
    <div id="root"></div>
    <pre id="debug-log">Loading...</pre>
    <script>
      (function() {
        var log = document.getElementById('debug-log');
        function push(msg) {
          if (log.textContent === 'Loading...') log.textContent = '';
          log.textContent += msg + '\\n';
        }
        window.addEventListener('error', function(e) {
          push('❌ ERROR: ' + (e.message || e.error));
          if (e.filename) push('   at ' + e.filename + ':' + e.lineno + ':' + e.colno);
        });
        window.addEventListener('unhandledrejection', function(e) {
          push('❌ REJECT: ' + (e.reason && e.reason.message ? e.reason.message : e.reason));
        });
        push('✅ HTML loaded');
        push('UA: ' + navigator.userAgent);
        window.__nova_debug = push;
      })();
    </script>
    ${
      jsFile
        ? `<script type="module" src="./assets/${jsFile}"></script>`
        : `<script>document.getElementById('debug-log').textContent = '❌ JS file not found!';</script>`
    }
    <script>
      setTimeout(function() {
        var root = document.getElementById('root');
        if (window.__nova_debug) {
          if (root && root.children.length === 0) {
            window.__nova_debug('⚠️ WARNING: #root still empty after 4s. React did not render.');
          } else {
            window.__nova_debug('✅ OK: #root has ' + root.children.length + ' children.');
          }
        }
      }, 4000);
    </script>
  </body>
</html>`;

  writeFileSync(join(dest, "index.html"), html);
  console.log("[prepare-android-assets] generated index.html with debug overlay");
}

const inject = spawnSync(process.execPath, [join(root, "scripts/inject-android-bridge.mjs"), join(dest, "index.html")], {
  stdio: "inherit",
});
process.exit(inject.status ?? 0);
