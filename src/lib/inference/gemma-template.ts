import { SYSTEM_PROMPT } from "./config";
import type { ChatMessage } from "./types";

/**
 * Gemma 3 chat template.
 * Roles are `user` / `model`. A system prompt is folded into the first user turn.
 * Native C++ applies the GGUF-embedded template when present; this is the
 * canonical fallback used by JS and by nova_llama.cpp.
 */
export function applyGemmaChatTemplate(
  messages: ChatMessage[],
  opts: { addGenerationPrompt?: boolean; systemPrompt?: string } = {},
): string {
  const addGenerationPrompt = opts.addGenerationPrompt ?? true;
  const systemPrompt = (opts.systemPrompt ?? SYSTEM_PROMPT).trim();

  const turns: { role: "user" | "model"; content: string }[] = [];
  let pendingSystem = systemPrompt;

  for (const msg of messages) {
    if (msg.role === "system") {
      pendingSystem = [pendingSystem, msg.content.trim()].filter(Boolean).join("\n\n");
      continue;
    }
    const role = msg.role === "assistant" ? "model" : "user";
    let content = msg.content.trim();
    if (role === "user" && pendingSystem) {
      content = `${pendingSystem}\n\n${content}`;
      pendingSystem = "";
    }
    const last = turns[turns.length - 1];
    if (last && last.role === role) {
      last.content = `${last.content}\n${content}`;
    } else {
      turns.push({ role, content });
    }
  }

  if (pendingSystem && turns.length === 0) {
    turns.push({ role: "user", content: pendingSystem });
  } else if (pendingSystem && turns[0]?.role === "user") {
    turns[0].content = `${pendingSystem}\n\n${turns[0].content}`;
  }

  let out = "";
  for (const turn of turns) {
    out += `<start_of_turn>${turn.role}\n${turn.content}<end_of_turn>\n`;
  }
  if (addGenerationPrompt) {
    out += `<start_of_turn>model\n`;
  }
  return out;
}

export function stripGemmaSpecialTokens(text: string): string {
  return text
    .replace(/<start_of_turn>(?:user|model|system)?\n?/g, "")
    .replace(/<end_of_turn>/g, "")
    .replace(/<eos>/g, "")
    .replace(/<bos>/g, "")
    .trim();
}
