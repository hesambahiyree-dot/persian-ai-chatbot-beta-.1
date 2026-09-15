import type { GenerateRequest, GenerateResult, ModelStatus, TokenHandler } from "./types";

export type NativeLlamaApi = {
  initializeModel: (configJson?: string) => string | boolean;
  isModelReady: () => boolean | string;
  generateResponse: (payloadJson: string, requestId: string) => void | string;
  releaseModel: () => void | string;
  getModelStatus?: () => string;
  abortGeneration?: (requestId?: string) => void;
};

declare global {
  interface Window {
    NativeLlama?: NativeLlamaApi;
    NovaLlama?: NativeLlamaApi;
    __novaOnToken?: (requestId: string, piece: string) => void;
    __novaOnDone?: (requestId: string, full: string) => void;
    __novaOnError?: (requestId: string, message: string) => void;
  }
}

export function getNativeLlama(): NativeLlamaApi | null {
  if (typeof window === "undefined") return null;
  return window.NativeLlama ?? window.NovaLlama ?? null;
}

export function isNativeRuntime(): boolean {
  return getNativeLlama() !== null;
}

function parseJson(value: unknown): Record<string, unknown> | null {
  if (typeof value === "boolean") return { ready: value };
  if (typeof value !== "string") return null;
  try {
    return JSON.parse(value) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export function readNativeStatus(): ModelStatus {
  const api = getNativeLlama();
  if (!api) {
    return {
      backend: "unavailable",
      code: "idle",
      ready: false,
      message: "پل نیتیو در این محیط وجود ندارد.",
      nativeAvailable: false,
    };
  }

  try {
    if (api.getModelStatus) {
      const parsed = parseJson(api.getModelStatus());
      if (parsed) {
        const ready = Boolean(parsed.ready);
        const code = String(parsed.code ?? (ready ? "ready" : "missing"));
        return {
          backend: ready ? "native-gemma" : code === "loading" ? "native-gemma" : "missing",
          code: (code as ModelStatus["code"]) || (ready ? "ready" : "missing"),
          ready,
          message: String(parsed.message ?? (ready ? "مدل آماده است." : "مدل نصب نشده.")),
          modelPath: typeof parsed.modelPath === "string" ? parsed.modelPath : undefined,
          nativeAvailable: true,
        };
      }
    }
    const readyRaw = api.isModelReady();
    const ready =
      typeof readyRaw === "boolean" ? readyRaw : Boolean(parseJson(readyRaw)?.ready);
    return {
      backend: ready ? "native-gemma" : "missing",
      code: ready ? "ready" : "missing",
      ready,
      message: ready ? "مدل Gemma آماده است." : "مدل نصب نشده.",
      nativeAvailable: true,
    };
  } catch (err) {
    return {
      backend: "unavailable",
      code: "error",
      ready: false,
      message: err instanceof Error ? err.message : "خطای پل نیتیو",
      nativeAvailable: true,
    };
  }
}

export function initializeNativeModel(config: Record<string, unknown>): ModelStatus {
  const api = getNativeLlama();
  if (!api) {
    return readNativeStatus();
  }
  try {
    const raw = api.initializeModel(JSON.stringify(config));
    if (typeof raw === "string") {
      const parsed = parseJson(raw);
      if (parsed) {
        const ready = Boolean(parsed.ready);
        return {
          backend: ready ? "native-gemma" : "missing",
          code: (String(parsed.code ?? (ready ? "ready" : "missing")) as ModelStatus["code"]),
          ready,
          message: String(parsed.message ?? ""),
          modelPath: typeof parsed.modelPath === "string" ? parsed.modelPath : undefined,
          nativeAvailable: true,
        };
      }
    }
  } catch (err) {
    return {
      backend: "unavailable",
      code: "error",
      ready: false,
      message: err instanceof Error ? err.message : "بارگذاری مدل ناموفق بود.",
      nativeAvailable: true,
    };
  }
  return readNativeStatus();
}

export function generateNative(
  request: GenerateRequest,
  onToken?: TokenHandler,
): Promise<GenerateResult> {
  const api = getNativeLlama();
  if (!api) {
    return Promise.resolve({
      ok: false,
      error: "پل نیتیو در دسترس نیست.",
      code: "unavailable",
    });
  }

  const requestId = `req_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

  return new Promise((resolve) => {
    let settled = false;
    const pieces: string[] = [];

    const cleanup = () => {
      if (typeof window === "undefined") return;
      if (window.__novaOnToken && currentToken === window.__novaOnToken) {
        window.__novaOnToken = undefined;
      }
      if (window.__novaOnDone && currentDone === window.__novaOnDone) {
        window.__novaOnDone = undefined;
      }
      if (window.__novaOnError && currentErr === window.__novaOnError) {
        window.__novaOnError = undefined;
      }
    };

    const finish = (result: GenerateResult) => {
      if (settled) return;
      settled = true;
      cleanup();
      resolve(result);
    };

    const currentToken = (id: string, piece: string) => {
      if (id !== requestId) return;
      pieces.push(piece);
      onToken?.(piece);
    };
    const currentDone = (id: string, full: string) => {
      if (id !== requestId) return;
      const text = (full || pieces.join("")).trim();
      finish({ ok: true, text, backend: "native-gemma" });
    };
    const currentErr = (id: string, message: string) => {
      if (id !== requestId) return;
      const code = /install|missing|not found|نصب/i.test(message) ? "missing" : "error";
      finish({ ok: false, error: message || "خطای تولید پاسخ", code });
    };

    window.__novaOnToken = currentToken;
    window.__novaOnDone = currentDone;
    window.__novaOnError = currentErr;

    try {
      api.generateResponse(JSON.stringify({ ...request, requestId }), requestId);
    } catch (err) {
      finish({
        ok: false,
        error: err instanceof Error ? err.message : "خطای تولید پاسخ",
        code: "error",
      });
    }

    window.setTimeout(() => {
      finish({
        ok: false,
        error: "زمان انتظار برای پاسخ مدل به پایان رسید.",
        code: "error",
      });
    }, 180_000);
  });
}

export function releaseNativeModel(): void {
  try {
    getNativeLlama()?.releaseModel();
  } catch {
    /* never crash JS if native teardown fails */
  }
}
