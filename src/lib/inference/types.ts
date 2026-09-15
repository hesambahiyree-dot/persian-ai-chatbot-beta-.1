export type ChatRole = "system" | "user" | "assistant";

export type ChatMessage = {
  role: ChatRole;
  content: string;
};

export type InferenceBackend = "native-gemma" | "web-preview" | "missing" | "unavailable";

export type ModelStatusCode =
  | "ready"
  | "loading"
  | "missing"
  | "error"
  | "web-preview"
  | "idle";

export type ModelStatus = {
  backend: InferenceBackend;
  code: ModelStatusCode;
  ready: boolean;
  message: string;
  modelPath?: string;
  nativeAvailable: boolean;
};

export type GenerateRequest = {
  messages: ChatMessage[];
  temperature: number;
  maxTokens: number;
  contextSize: number;
  topP: number;
  topK: number;
};

export type GenerateResult =
  | { ok: true; text: string; backend: InferenceBackend }
  | { ok: false; error: string; code: "missing" | "quota" | "premium" | "busy" | "error" | "unavailable" };

export type TokenHandler = (piece: string) => void;
