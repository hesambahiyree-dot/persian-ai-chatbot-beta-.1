//#region node_modules/.nitro/vite/services/ssr/assets/config-DHHrNjo8.js
/**
* Single source of truth for Gemma 3 inference.
* Native llama.cpp and the web preview both read these values.
*/
var MODEL = {
	id: "gemma-3-4b-persian",
	fileName: "gemma-3-4b-persian-v0.Q4_K_M.gguf",
	displayName: "Gemma 3 4B فارسی",
	quant: "Q4_K_M",
	family: "Gemma 3"
};
var INFERENCE_DEFAULTS = {
	temperature: .7,
	topP: .95,
	topK: 64,
	minP: .05,
	maxTokens: 512,
	contextSize: 4096,
	nThreads: 4,
	nBatch: 256,
	repeatPenalty: 1.08
};
var SYSTEM_PROMPT = "تو نوا (NOVA) هستی؛ دستیار هوشمند فارسی. پاسخ را به فارسی روان، دقیق و مفید بنویس. لحن گرم و حرفه‌ای است. از زیاده‌گویی و ادعاهای ساختگی پرهیز کن. اگر چیزی را نمی‌دانی صریح بگو.";
var PREMIUM_MAX_TOKENS = 1024;
var MODEL_SEARCH_HINTS = [
	"Android/obb/ai.nova.app/" + MODEL.fileName,
	"Android/obb/ai.nova.app/main.<version>.ai.nova.app.obb",
	"Android/data/ai.nova.app/files/models/" + MODEL.fileName
];
//#endregion
export { SYSTEM_PROMPT as a, PREMIUM_MAX_TOKENS as i, MODEL as n, MODEL_SEARCH_HINTS as r, INFERENCE_DEFAULTS as t };
