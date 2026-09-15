/**
 * Single source of truth for Gemma 3 inference.
 * Native llama.cpp and the web preview both read these values.
 */
export const MODEL = {
  id: "gemma-3-4b-persian",
  fileName: "gemma-3-4b-persian-v0.Q4_K_M.gguf",
  displayName: "Gemma 3 4B فارسی",
  quant: "Q4_K_M",
  family: "Gemma 3",
} as const;

export const INFERENCE_DEFAULTS = {
  temperature: 0.7,
  topP: 0.95,
  topK: 64,
  minP: 0.05,
  maxTokens: 512,
  contextSize: 4096,
  nThreads: 4,
  nBatch: 256,
  repeatPenalty: 1.08,
} as const;

export const SYSTEM_PROMPT =
  "تو نوا (NOVA) هستی؛ دستیار هوشمند فارسی. پاسخ را به فارسی روان، دقیق و مفید بنویس. لحن گرم و حرفه‌ای است. از زیاده‌گویی و ادعاهای ساختگی پرهیز کن. اگر چیزی را نمی‌دانی صریح بگو.";

export const GEMMA_STOP_SEQUENCES = [
  "<end_of_turn>",
  "<start_of_turn>",
  "<eos>",
] as const;

export const FREE_DAILY_MESSAGES = 8;
export const PREMIUM_MAX_TOKENS = 1024;

export const MODEL_SEARCH_HINTS = [
  "Android/obb/ai.nova.app/" + MODEL.fileName,
  "Android/obb/ai.nova.app/main.<version>.ai.nova.app.obb",
  "Android/data/ai.nova.app/files/models/" + MODEL.fileName,
] as const;
