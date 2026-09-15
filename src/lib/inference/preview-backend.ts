import { createServerFn } from "@tanstack/react-start";
import { INFERENCE_DEFAULTS, SYSTEM_PROMPT } from "./config";
import type { ChatMessage } from "./types";

type PreviewInput = {
  messages: ChatMessage[];
  temperature: number;
  maxTokens: number;
};

export const generatePreviewReply = createServerFn({ method: "POST" })
  .validator((input: PreviewInput) => input)
  .handler(async ({ data }) => {
    const apiKey = process.env.XAI_API_KEY;
    if (!apiKey) {
      return {
        ok: false as const,
        error: "پاسخ‌گویی پیش‌نمایش در این محیط در دسترس نیست.",
        code: "unavailable" as const,
      };
    }

    const temperature = clamp(data.temperature ?? INFERENCE_DEFAULTS.temperature, 0.1, 1.4);
    const maxTokens = Math.min(
      Math.max(data.maxTokens ?? INFERENCE_DEFAULTS.maxTokens, 32),
      768,
    );

    const messages = [
      {
        role: "system" as const,
        content: `${SYSTEM_PROMPT}

این یک پیش‌نمایش وب از برنامهٔ نوا است. روی گوشی اندروید، پاسخ‌ها با مدل آفلاین Gemma 3 4B فارسی تولید می‌شوند. اینجا هم به فارسی پاسخ بده.`,
      },
      ...data.messages
        .filter((m) => m.role === "user" || m.role === "assistant")
        .slice(-12)
        .map((m) => ({
          role: m.role === "assistant" ? ("assistant" as const) : ("user" as const),
          content: m.content.slice(0, 4000),
        })),
    ];

    try {
      const res = await fetch("https://api.x.ai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "grok-4.5",
          temperature,
          max_tokens: maxTokens,
          messages,
        }),
      });

      if (!res.ok) {
        const detail = await res.text().catch(() => "");
        const quota =
          res.status === 403 || /spending-limit|credits/i.test(detail);
        return {
          ok: false as const,
          error: quota
            ? "پیش‌نمایش آنلاین الان در دسترس نیست. روی اپ اندروید، پاسخ با Gemma 3 روی خودِ گوشی ساخته می‌شود."
            : `سرویس پیش‌نمایش پاسخ نداد (${res.status}).`,
          code: "error" as const,
        };
      }

      const body = (await res.json()) as {
        choices?: { message?: { content?: string } }[];
      };
      const text = body.choices?.[0]?.message?.content?.trim() ?? "";
      if (!text) {
        return {
          ok: false as const,
          error: "پاسخ خالی دریافت شد.",
          code: "error" as const,
        };
      }
      return { ok: true as const, text };
    } catch {
      return {
        ok: false as const,
        error: "ارتباط با سرویس پیش‌نمایش برقرار نشد.",
        code: "error" as const,
      };
    }
  });

export const probePreviewBackend = createServerFn({ method: "GET" }).handler(async () => {
  return { available: Boolean(process.env.XAI_API_KEY) };
});

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}
