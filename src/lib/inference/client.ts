import { INFERENCE_DEFAULTS, MODEL } from "./config";
import { generatePreviewReply, probePreviewBackend } from "./preview-backend";
import {
  generateNative,
  initializeNativeModel,
  isNativeRuntime,
  readNativeStatus,
} from "./native-bridge";
import type { GenerateRequest, GenerateResult, ModelStatus, TokenHandler } from "./types";

export async function probeModel(): Promise<ModelStatus> {
  if (isNativeRuntime()) {
    const current = readNativeStatus();
    if (current.ready || current.code === "loading") return current;
    return initializeNativeModel({
      modelFileName: MODEL.fileName,
      nCtx: INFERENCE_DEFAULTS.contextSize,
      nThreads: INFERENCE_DEFAULTS.nThreads,
      nBatch: INFERENCE_DEFAULTS.nBatch,
      temperature: INFERENCE_DEFAULTS.temperature,
      maxTokens: INFERENCE_DEFAULTS.maxTokens,
    });
  }

  try {
    const probe = await probePreviewBackend();
    if (probe.available) {
      return {
        backend: "web-preview",
        code: "web-preview",
        ready: true,
        message: "پیش‌نمایش وب فعال است. روی اندروید، Gemma به‌صورت آفلاین اجرا می‌شود.",
        nativeAvailable: false,
      };
    }
  } catch {
    /* fall through */
  }

  return {
    backend: "unavailable",
    code: "missing",
    ready: false,
    message: "مدل نصب نشده و پیش‌نمایش هم در دسترس نیست.",
    nativeAvailable: false,
  };
}

export async function generateResponse(
  request: GenerateRequest,
  onToken?: TokenHandler,
): Promise<GenerateResult> {
  if (isNativeRuntime()) {
    const status = readNativeStatus();
    if (!status.ready) {
      const loaded = initializeNativeModel({
        modelFileName: MODEL.fileName,
        nCtx: request.contextSize,
        nThreads: INFERENCE_DEFAULTS.nThreads,
        nBatch: INFERENCE_DEFAULTS.nBatch,
        temperature: request.temperature,
        maxTokens: request.maxTokens,
      });
      if (!loaded.ready) {
        return {
          ok: false,
          error: loaded.message || "مدل نصب نشده.",
          code: "missing",
        };
      }
    }
    return generateNative(request, onToken);
  }

  try {
    const result = await generatePreviewReply({
      data: {
        messages: request.messages,
        temperature: request.temperature,
        maxTokens: request.maxTokens,
      },
    });
    if (!result.ok) {
      return { ok: false, error: result.error, code: result.code };
    }
    if (onToken) {
      // Reveal the finished reply in small chunks so the chat feels alive
      // without inventing tokens the model did not produce.
      const parts = result.text.split(/(\s+)/);
      for (const part of parts) {
        if (part) onToken(part);
      }
    }
    return { ok: true, text: result.text, backend: "web-preview" };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "خطای تولید پاسخ",
      code: "error",
    };
  }
}
