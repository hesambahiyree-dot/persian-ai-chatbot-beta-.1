#!/usr/bin/env node
/**
 * Injects a tiny JS shim into the Android WebView index.html so
 * window.NovaLlama / window.NovaPayment alias the Kotlin JavascriptInterface.
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const MARKER = "nova-android-bridge";
const SHIM = `<script data-${MARKER}="1">
(function(){
  function alias(){
    if (window.NativeLlama && !window.NovaLlama) window.NovaLlama = window.NativeLlama;
    if (window.NativePayment && !window.NovaPayment) window.NovaPayment = window.NativePayment;
  }
  alias();
  document.addEventListener("DOMContentLoaded", alias);
})();
</script>`;

const target = resolve(
  process.argv[2] || "native/android/app/src/main/assets/index.html",
);

if (!existsSync(target)) {
  console.log(`[inject-android-bridge] skip, missing ${target}`);
  process.exit(0);
}

let html = readFileSync(target, "utf8");
if (html.includes(`data-${MARKER}`)) {
  console.log("[inject-android-bridge] already injected");
  process.exit(0);
}

if (/<\/head>/i.test(html)) {
  html = html.replace(/<\/head>/i, `${SHIM}</head>`);
} else if (/<body[^>]*>/i.test(html)) {
  html = html.replace(/<body[^>]*>/i, (m) => `${m}${SHIM}`);
} else {
  html = SHIM + html;
}

writeFileSync(target, html);
console.log(`[inject-android-bridge] wrote ${target}`);
