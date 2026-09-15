import { n as TSS_SERVER_FUNCTION, t as createServerFn } from "./ssr.mjs";
import { a as SYSTEM_PROMPT, t as INFERENCE_DEFAULTS } from "./config-DHHrNjo8.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/preview-backend-DHmohtX8.js
var createServerRpc = (serverFnMeta, splitImportFn) => {
	const url = "/_serverFn/" + serverFnMeta.id;
	return Object.assign(splitImportFn, {
		url,
		serverFnMeta,
		[TSS_SERVER_FUNCTION]: true
	});
};
var generatePreviewReply_createServerFn_handler = createServerRpc({
	id: "18f7598532db70a6644a3dc21288d9434907426ff11382ebf91d88209d73d8da",
	name: "generatePreviewReply",
	filename: "src/lib/inference/preview-backend.ts"
}, (opts) => generatePreviewReply.__executeServer(opts));
var generatePreviewReply = createServerFn({ method: "POST" }).validator((input) => input).handler(generatePreviewReply_createServerFn_handler, async ({ data }) => {
	const apiKey = process.env.XAI_API_KEY;
	if (!apiKey) return {
		ok: false,
		error: "پاسخ‌گویی پیش‌نمایش در این محیط در دسترس نیست.",
		code: "unavailable"
	};
	const temperature = clamp(data.temperature ?? INFERENCE_DEFAULTS.temperature, .1, 1.4);
	const maxTokens = Math.min(Math.max(data.maxTokens ?? INFERENCE_DEFAULTS.maxTokens, 32), 768);
	const messages = [{
		role: "system",
		content: `${SYSTEM_PROMPT}

این یک پیش‌نمایش وب از برنامهٔ نوا است. روی گوشی اندروید، پاسخ‌ها با مدل آفلاین Gemma 3 4B فارسی تولید می‌شوند. اینجا هم به فارسی پاسخ بده.`
	}, ...data.messages.filter((m) => m.role === "user" || m.role === "assistant").slice(-12).map((m) => ({
		role: m.role === "assistant" ? "assistant" : "user",
		content: m.content.slice(0, 4e3)
	}))];
	try {
		const res = await fetch("https://api.x.ai/v1/chat/completions", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${apiKey}`
			},
			body: JSON.stringify({
				model: "grok-4.5",
				temperature,
				max_tokens: maxTokens,
				messages
			})
		});
		if (!res.ok) return {
			ok: false,
			error: `سرویس پیش‌نمایش پاسخ نداد (${res.status}).`,
			code: "error"
		};
		const text = (await res.json()).choices?.[0]?.message?.content?.trim() ?? "";
		if (!text) return {
			ok: false,
			error: "پاسخ خالی دریافت شد.",
			code: "error"
		};
		return {
			ok: true,
			text
		};
	} catch {
		return {
			ok: false,
			error: "ارتباط با سرویس پیش‌نمایش برقرار نشد.",
			code: "error"
		};
	}
});
var probePreviewBackend_createServerFn_handler = createServerRpc({
	id: "24994bc2de141b34d3c3e1d36c6f6ad643f8778d06545c95a04fcd650d9e57a0",
	name: "probePreviewBackend",
	filename: "src/lib/inference/preview-backend.ts"
}, (opts) => probePreviewBackend.__executeServer(opts));
var probePreviewBackend = createServerFn({ method: "GET" }).handler(probePreviewBackend_createServerFn_handler, async () => {
	return { available: Boolean(process.env.XAI_API_KEY) };
});
function clamp(n, min, max) {
	return Math.min(max, Math.max(min, n));
}
//#endregion
export { generatePreviewReply_createServerFn_handler, probePreviewBackend_createServerFn_handler };
