import { i as __toESM } from "../_runtime.mjs";
import { n as require_react } from "../_libs/@radix-ui/react-compose-refs+[...].mjs";
import { v as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { n as TSS_SERVER_FUNCTION, r as getServerFnById, t as createServerFn } from "./ssr.mjs";
import { i as PREMIUM_MAX_TOKENS, n as MODEL, r as MODEL_SEARCH_HINTS, t as INFERENCE_DEFAULTS } from "./config-DHHrNjo8.mjs";
import { a as Settings, c as Menu, d as ArrowUp, i as Sparkles, l as FolderOpen, o as RefreshCw, r as Trash2, s as MessageSquarePlus, t as X, u as Check } from "../_libs/lucide-react.mjs";
import { n as create, t as persist } from "../_libs/zustand.mjs";
import { n as clsx, t as cva } from "../_libs/class-variance-authority+clsx.mjs";
import { t as twMerge } from "../_libs/tailwind-merge.mjs";
import { t as Slot } from "../_libs/radix-ui__react-slot.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-GqJzFvRM.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var createSsrRpc = (functionId) => {
	const url = "/_serverFn/" + functionId;
	const serverFnMeta = { id: functionId };
	const fn = async (...args) => {
		return (await getServerFnById(functionId, { origin: "server" }))(...args);
	};
	return Object.assign(fn, {
		url,
		serverFnMeta,
		[TSS_SERVER_FUNCTION]: true
	});
};
var generatePreviewReply = createServerFn({ method: "POST" }).validator((input) => input).handler(createSsrRpc("18f7598532db70a6644a3dc21288d9434907426ff11382ebf91d88209d73d8da"));
var probePreviewBackend = createServerFn({ method: "GET" }).handler(createSsrRpc("24994bc2de141b34d3c3e1d36c6f6ad643f8778d06545c95a04fcd650d9e57a0"));
function getNativeLlama() {
	if (typeof window === "undefined") return null;
	return window.NativeLlama ?? window.NovaLlama ?? null;
}
function isNativeRuntime() {
	return getNativeLlama() !== null;
}
function parseJson(value) {
	if (typeof value === "boolean") return { ready: value };
	if (typeof value !== "string") return null;
	try {
		return JSON.parse(value);
	} catch {
		return null;
	}
}
function readNativeStatus() {
	const api = getNativeLlama();
	if (!api) return {
		backend: "unavailable",
		code: "idle",
		ready: false,
		message: "پل نیتیو در این محیط وجود ندارد.",
		nativeAvailable: false
	};
	try {
		if (api.getModelStatus) {
			const parsed = parseJson(api.getModelStatus());
			if (parsed) {
				const ready = Boolean(parsed.ready);
				const code = String(parsed.code ?? (ready ? "ready" : "missing"));
				return {
					backend: ready ? "native-gemma" : code === "loading" ? "native-gemma" : "missing",
					code: code || (ready ? "ready" : "missing"),
					ready,
					message: String(parsed.message ?? (ready ? "مدل آماده است." : "مدل نصب نشده.")),
					modelPath: typeof parsed.modelPath === "string" ? parsed.modelPath : void 0,
					nativeAvailable: true
				};
			}
		}
		const readyRaw = api.isModelReady();
		const ready = typeof readyRaw === "boolean" ? readyRaw : Boolean(parseJson(readyRaw)?.ready);
		return {
			backend: ready ? "native-gemma" : "missing",
			code: ready ? "ready" : "missing",
			ready,
			message: ready ? "مدل Gemma آماده است." : "مدل نصب نشده.",
			nativeAvailable: true
		};
	} catch (err) {
		return {
			backend: "unavailable",
			code: "error",
			ready: false,
			message: err instanceof Error ? err.message : "خطای پل نیتیو",
			nativeAvailable: true
		};
	}
}
function initializeNativeModel(config) {
	const api = getNativeLlama();
	if (!api) return readNativeStatus();
	try {
		const raw = api.initializeModel(JSON.stringify(config));
		if (typeof raw === "string") {
			const parsed = parseJson(raw);
			if (parsed) {
				const ready = Boolean(parsed.ready);
				return {
					backend: ready ? "native-gemma" : "missing",
					code: String(parsed.code ?? (ready ? "ready" : "missing")),
					ready,
					message: String(parsed.message ?? ""),
					modelPath: typeof parsed.modelPath === "string" ? parsed.modelPath : void 0,
					nativeAvailable: true
				};
			}
		}
	} catch (err) {
		return {
			backend: "unavailable",
			code: "error",
			ready: false,
			message: err instanceof Error ? err.message : "بارگذاری مدل ناموفق بود.",
			nativeAvailable: true
		};
	}
	return readNativeStatus();
}
function generateNative(request, onToken) {
	const api = getNativeLlama();
	if (!api) return Promise.resolve({
		ok: false,
		error: "پل نیتیو در دسترس نیست.",
		code: "unavailable"
	});
	const requestId = `req_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
	return new Promise((resolve) => {
		let settled = false;
		const pieces = [];
		const cleanup = () => {
			if (typeof window === "undefined") return;
			if (window.__novaOnToken && currentToken === window.__novaOnToken) window.__novaOnToken = void 0;
			if (window.__novaOnDone && currentDone === window.__novaOnDone) window.__novaOnDone = void 0;
			if (window.__novaOnError && currentErr === window.__novaOnError) window.__novaOnError = void 0;
		};
		const finish = (result) => {
			if (settled) return;
			settled = true;
			cleanup();
			resolve(result);
		};
		const currentToken = (id, piece) => {
			if (id !== requestId) return;
			pieces.push(piece);
			onToken?.(piece);
		};
		const currentDone = (id, full) => {
			if (id !== requestId) return;
			const text = (full || pieces.join("")).trim();
			finish({
				ok: true,
				text,
				backend: "native-gemma"
			});
		};
		const currentErr = (id, message) => {
			if (id !== requestId) return;
			const code = /install|missing|not found|نصب/i.test(message) ? "missing" : "error";
			finish({
				ok: false,
				error: message || "خطای تولید پاسخ",
				code
			});
		};
		window.__novaOnToken = currentToken;
		window.__novaOnDone = currentDone;
		window.__novaOnError = currentErr;
		try {
			api.generateResponse(JSON.stringify({
				...request,
				requestId
			}), requestId);
		} catch (err) {
			finish({
				ok: false,
				error: err instanceof Error ? err.message : "خطای تولید پاسخ",
				code: "error"
			});
		}
		window.setTimeout(() => {
			finish({
				ok: false,
				error: "زمان انتظار برای پاسخ مدل به پایان رسید.",
				code: "error"
			});
		}, 18e4);
	});
}
async function probeModel() {
	if (isNativeRuntime()) {
		const current = readNativeStatus();
		if (current.ready || current.code === "loading") return current;
		return initializeNativeModel({
			modelFileName: MODEL.fileName,
			nCtx: INFERENCE_DEFAULTS.contextSize,
			nThreads: INFERENCE_DEFAULTS.nThreads,
			nBatch: INFERENCE_DEFAULTS.nBatch,
			temperature: INFERENCE_DEFAULTS.temperature,
			maxTokens: INFERENCE_DEFAULTS.maxTokens
		});
	}
	try {
		if ((await probePreviewBackend()).available) return {
			backend: "web-preview",
			code: "web-preview",
			ready: true,
			message: "پیش‌نمایش وب فعال است. روی اندروید، Gemma به‌صورت آفلاین اجرا می‌شود.",
			nativeAvailable: false
		};
	} catch {}
	return {
		backend: "unavailable",
		code: "missing",
		ready: false,
		message: "مدل نصب نشده و پیش‌نمایش هم در دسترس نیست.",
		nativeAvailable: false
	};
}
async function generateResponse(request, onToken) {
	if (isNativeRuntime()) {
		if (!readNativeStatus().ready) {
			const loaded = initializeNativeModel({
				modelFileName: MODEL.fileName,
				nCtx: request.contextSize,
				nThreads: INFERENCE_DEFAULTS.nThreads,
				nBatch: INFERENCE_DEFAULTS.nBatch,
				temperature: request.temperature,
				maxTokens: request.maxTokens
			});
			if (!loaded.ready) return {
				ok: false,
				error: loaded.message || "مدل نصب نشده.",
				code: "missing"
			};
		}
		return generateNative(request, onToken);
	}
	try {
		const result = await generatePreviewReply({ data: {
			messages: request.messages,
			temperature: request.temperature,
			maxTokens: request.maxTokens
		} });
		if (!result.ok) return {
			ok: false,
			error: result.error,
			code: result.code
		};
		if (onToken) {
			const parts = result.text.split(/(\s+)/);
			for (const part of parts) if (part) onToken(part);
		}
		return {
			ok: true,
			text: result.text,
			backend: "web-preview"
		};
	} catch (err) {
		return {
			ok: false,
			error: err instanceof Error ? err.message : "خطای تولید پاسخ",
			code: "error"
		};
	}
}
function cn(...inputs) {
	return twMerge(clsx(inputs));
}
function uid(prefix = "id") {
	return `${prefix}_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36).slice(-4)}`;
}
function todayKey(now = /* @__PURE__ */ new Date()) {
	return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}
function truncate(text, max = 42) {
	const t = text.replace(/\s+/g, " ").trim();
	if (t.length <= max) return t;
	return `${t.slice(0, max).trim()}…`;
}
/**
* Public product identifiers. Prices are resolved by the store SDK at runtime.
* No merchant keys, RSA secrets, or billing tokens live here.
*/
var PRODUCTS = [{
	id: "nova_premium_monthly",
	title: "نوا ویژه — ماهانه",
	description: "پیام نامحدود و سقف توکن بالاتر، تمدید ماهانه از فروشگاه.",
	period: "monthly",
	storePriceLabel: "قیمت در فروشگاه"
}, {
	id: "nova_premium_lifetime",
	title: "نوا ویژه — یک‌بار پرداخت",
	description: "خرید دائمی روی همین حساب فروشگاه.",
	period: "lifetime",
	storePriceLabel: "قیمت در فروشگاه"
}];
PRODUCTS.map((p) => p.id);
var STORAGE_KEY = "nova.entitlement.v1";
function empty() {
	return {
		premium: false,
		source: "none",
		updatedAt: Date.now()
	};
}
function read() {
	if (typeof localStorage === "undefined") return empty();
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		if (!raw) return empty();
		const parsed = JSON.parse(raw);
		return {
			premium: Boolean(parsed.premium),
			productId: parsed.productId,
			source: parsed.premium ? parsed.source || "local" : "none",
			updatedAt: parsed.updatedAt || Date.now()
		};
	} catch {
		return empty();
	}
}
function write(next) {
	if (typeof localStorage !== "undefined") localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
	return next;
}
/**
* Development / web adapter. Does not charge money and stores no secrets.
* Swap this for CafeBazaarPaymentService or PlayBillingPaymentService
* without touching the UI.
*/
var localPaymentService = {
	providerId: "local-debug",
	async getProducts() {
		return PRODUCTS;
	},
	async getEntitlement() {
		return read();
	},
	async isPremium() {
		return read().premium;
	},
	async purchase(productId) {
		if (!PRODUCTS.find((p) => p.id === productId)) return {
			ok: false,
			error: "محصول ناشناخته است."
		};
		return {
			ok: true,
			entitlement: write({
				premium: true,
				productId,
				source: "local",
				updatedAt: Date.now()
			})
		};
	},
	async restore() {
		return read();
	}
};
function getNativePayment() {
	if (typeof window === "undefined") return null;
	return window.NativePayment ?? window.NovaPayment ?? null;
}
function parse(raw, fallback) {
	try {
		return JSON.parse(raw);
	} catch {
		return fallback;
	}
}
var none = {
	premium: false,
	source: "none",
	updatedAt: 0
};
var nativePaymentService = {
	providerId: "android-store",
	async getProducts() {
		const api = getNativePayment();
		if (api?.getProducts) {
			const parsed = parse(api.getProducts(), PRODUCTS);
			return parsed.length ? parsed : PRODUCTS;
		}
		return PRODUCTS;
	},
	async getEntitlement() {
		const api = getNativePayment();
		if (!api) return localPaymentService.getEntitlement();
		return parse(api.getEntitlement(), none);
	},
	async isPremium() {
		const api = getNativePayment();
		if (!api) return localPaymentService.isPremium();
		const raw = api.isPremium();
		if (typeof raw === "boolean") return raw;
		return parse(raw, {}).premium === true;
	},
	async purchase(productId) {
		const api = getNativePayment();
		if (!api) return localPaymentService.purchase(productId);
		return parse(api.purchase(productId), {
			ok: false,
			error: "فروشگاه پاسخی نداد."
		});
	},
	async restore() {
		const api = getNativePayment();
		if (!api) return localPaymentService.restore();
		return parse(api.restore(), none);
	}
};
function resolvePaymentService() {
	return getNativePayment() ? nativePaymentService : localPaymentService;
}
/** UI talks only to this module. Store SDK swaps happen behind PaymentService. */
function payment() {
	return resolvePaymentService();
}
async function loadEntitlement() {
	return payment().getEntitlement();
}
async function buyPremium(productId) {
	return payment().purchase(productId);
}
async function restorePurchases() {
	return payment().restore();
}
var usePremiumStore = create()(persist((set, get) => ({
	entitlement: {
		premium: false,
		source: "none",
		updatedAt: 0
	},
	usedToday: 0,
	usedOn: todayKey(),
	ready: false,
	remainingToday: () => {
		const s = get();
		if (s.entitlement.premium) return Number.POSITIVE_INFINITY;
		const used = s.usedOn === todayKey() ? s.usedToday : 0;
		return Math.max(0, 8 - used);
	},
	registerSend: () => {
		const s = get();
		if (s.entitlement.premium) return {
			allowed: true,
			remaining: Number.POSITIVE_INFINITY
		};
		const day = todayKey();
		const used = s.usedOn === day ? s.usedToday : 0;
		if (used >= 8) return {
			allowed: false,
			remaining: 0
		};
		set({
			usedToday: used + 1,
			usedOn: day
		});
		return {
			allowed: true,
			remaining: 8 - used - 1
		};
	},
	markPurchased: (productId) => {
		set({ entitlement: {
			premium: true,
			productId,
			source: "local",
			updatedAt: Date.now()
		} });
	},
	refresh: async () => {
		try {
			const entitlement = await loadEntitlement();
			const premium = await payment().isPremium();
			set({
				entitlement: {
					...entitlement,
					premium
				},
				ready: true
			});
		} catch {
			set({ ready: true });
		}
	}
}), {
	name: "nova.premium.v1",
	partialize: (s) => ({
		entitlement: s.entitlement,
		usedToday: s.usedToday,
		usedOn: s.usedOn
	})
}));
var defaults = {
	temperature: INFERENCE_DEFAULTS.temperature,
	maxTokens: INFERENCE_DEFAULTS.maxTokens,
	contextSize: INFERENCE_DEFAULTS.contextSize,
	topP: INFERENCE_DEFAULTS.topP,
	topK: INFERENCE_DEFAULTS.topK
};
var useSettingsStore = create()(persist((set) => ({
	...defaults,
	setTemperature: (temperature) => set({ temperature }),
	setMaxTokens: (maxTokens) => set({ maxTokens }),
	setContextSize: (contextSize) => set({ contextSize }),
	reset: () => set(defaults)
}), { name: "nova.settings.v1" }));
function blankConversation() {
	const now = Date.now();
	return {
		id: uid("chat"),
		title: "گفتگوی تازه",
		messages: [],
		createdAt: now,
		updatedAt: now
	};
}
var initialStatus = {
	backend: "unavailable",
	code: "loading",
	ready: false,
	message: "در حال بررسی مدل…",
	nativeAvailable: false
};
var useChatStore = create()(persist((set, get) => ({
	conversations: [],
	activeId: null,
	status: initialStatus,
	sending: false,
	panel: "none",
	active: () => {
		const { conversations, activeId } = get();
		return conversations.find((c) => c.id === activeId);
	},
	setPanel: (panel) => set({ panel }),
	hydrateStatus: async () => {
		set({ status: {
			...get().status,
			code: "loading",
			message: "در حال آماده‌سازی مدل…"
		} });
		set({ status: await probeModel() });
	},
	newChat: () => {
		const next = blankConversation();
		set((s) => ({
			conversations: [next, ...s.conversations],
			activeId: next.id,
			panel: "none"
		}));
	},
	selectChat: (id) => set({
		activeId: id,
		panel: "none"
	}),
	deleteChat: (id) => {
		set((s) => {
			const conversations = s.conversations.filter((c) => c.id !== id);
			return {
				conversations,
				activeId: s.activeId === id ? conversations[0]?.id ?? null : s.activeId
			};
		});
	},
	send: async (raw) => {
		const text = raw.trim();
		if (!text || get().sending) return;
		if (!usePremiumStore.getState().registerSend().allowed) {
			set({ panel: "premium" });
			return;
		}
		let conv = get().active();
		if (!conv) {
			get().newChat();
			conv = get().active();
		}
		if (!conv) return;
		const userMsg = {
			id: uid("msg"),
			role: "user",
			content: text,
			createdAt: Date.now()
		};
		const assistantId = uid("msg");
		const assistantMsg = {
			id: assistantId,
			role: "assistant",
			content: "",
			createdAt: Date.now(),
			pending: true
		};
		const title = conv.messages.length === 0 ? truncate(text, 36) : conv.title;
		set((s) => ({
			sending: true,
			conversations: s.conversations.map((c) => c.id === conv.id ? {
				...c,
				title,
				updatedAt: Date.now(),
				messages: [
					...c.messages,
					userMsg,
					assistantMsg
				]
			} : c)
		}));
		const settings = useSettingsStore.getState();
		const isPremium = usePremiumStore.getState().entitlement.premium;
		const history = [...get().active()?.messages ?? []].filter((m) => m.id !== assistantId).map((m) => ({
			role: m.role,
			content: m.content
		}));
		const patchAssistant = (partial) => {
			set((s) => ({ conversations: s.conversations.map((c) => c.id === conv.id ? {
				...c,
				updatedAt: Date.now(),
				messages: c.messages.map((m) => m.id === assistantId ? {
					...m,
					...partial
				} : m)
			} : c) }));
		};
		try {
			const result = await generateResponse({
				messages: history,
				temperature: settings.temperature,
				maxTokens: isPremium ? Math.max(settings.maxTokens, PREMIUM_MAX_TOKENS) : settings.maxTokens,
				contextSize: settings.contextSize,
				topP: settings.topP,
				topK: settings.topK
			}, (piece) => {
				const current = get().conversations.find((c) => c.id === conv.id)?.messages.find((m) => m.id === assistantId);
				patchAssistant({
					content: `${current?.content ?? ""}${piece}`,
					pending: true
				});
			});
			if (!result.ok) {
				patchAssistant({
					pending: false,
					error: result.error,
					content: result.code === "missing" ? "" : get().conversations.find((c) => c.id === conv.id)?.messages.find((m) => m.id === assistantId)?.content ?? ""
				});
				if (result.code === "missing") set({ status: {
					...get().status,
					backend: "missing",
					code: "missing",
					ready: false,
					message: result.error
				} });
				return;
			}
			patchAssistant({
				content: result.text,
				pending: false,
				error: void 0
			});
		} catch (err) {
			patchAssistant({
				pending: false,
				error: err instanceof Error ? err.message : "خطای ناشناخته"
			});
		} finally {
			set({ sending: false });
		}
	}
}), {
	name: "nova.chats.v1",
	partialize: (s) => ({
		conversations: s.conversations.map((c) => ({
			...c,
			messages: c.messages.map((m) => ({
				...m,
				pending: false
			}))
		})),
		activeId: s.activeId
	})
}));
function NovaLogo({ className }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
		src: "/nova-logo.png",
		alt: "NOVA AI",
		className: cn("object-contain", className)
	});
}
var buttonVariants = cva("inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium transition-colors duration-150 ease-out disabled:pointer-events-none disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 active:scale-[0.98]", {
	variants: {
		variant: {
			default: "bg-primary text-primary-fg hover:bg-primary-dark",
			secondary: "bg-surface-2 text-fg hover:bg-border",
			ghost: "bg-transparent text-fg hover:bg-surface-2",
			outline: "border border-border bg-surface text-fg hover:bg-surface-2",
			danger: "bg-danger text-primary-fg hover:opacity-90"
		},
		size: {
			default: "h-11 px-4",
			sm: "h-9 px-3 text-xs",
			lg: "h-12 px-5",
			icon: "size-11"
		}
	},
	defaultVariants: {
		variant: "default",
		size: "default"
	}
});
function Button({ className, variant, size, asChild, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(asChild ? Slot : "button", {
		className: cn(buttonVariants({
			variant,
			size
		}), className),
		...props
	});
}
function ModelStatusChip() {
	const status = useChatStore((s) => s.status);
	const label = status.code === "ready" ? "آفلاین" : status.code === "web-preview" ? "پیش‌نمایش" : status.code === "loading" ? "بارگذاری" : status.code === "missing" ? "بدون مدل" : "نامشخص";
	const tone = status.code === "ready" ? "bg-primary/15 text-primary-dark" : status.code === "web-preview" ? "bg-surface-2 text-muted" : status.code === "loading" ? "bg-surface-2 text-muted" : "bg-danger/10 text-danger";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		className: cn("hidden max-w-28 truncate rounded-full px-2.5 py-1 text-[11px] font-medium sm:inline", tone),
		title: status.message,
		children: label
	});
}
function ChatHeader() {
	const setPanel = useChatStore((s) => s.setPanel);
	const premium = usePremiumStore((s) => s.entitlement.premium);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
		className: "flex items-center gap-3 border-b border-border/80 bg-surface/80 px-3 py-3 pt-[max(0.75rem,env(safe-area-inset-top))] backdrop-blur-sm",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				variant: "ghost",
				size: "icon",
				className: "shrink-0 rounded-lg",
				onClick: () => setPanel("sidebar"),
				"aria-label": "فهرست گفتگوها",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Menu, { className: "size-5" })
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex min-w-0 flex-1 items-center gap-2.5",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "grid size-10 place-items-center overflow-hidden rounded-lg bg-bg",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(NovaLogo, { className: "size-9" })
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "min-w-0",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
							className: "truncate text-base font-semibold tracking-tight",
							children: "NOVA AI"
						}), premium ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "rounded-full bg-primary/12 px-2 py-0.5 text-[10px] font-medium text-primary-dark",
							children: "ویژه"
						}) : null]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "truncate text-xs text-muted",
						children: "دستیار هوشمند فارسی"
					})]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ModelStatusChip, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				variant: "ghost",
				size: "icon",
				className: "shrink-0 rounded-lg",
				onClick: () => setPanel("premium"),
				"aria-label": "نوا ویژه",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sparkles, { className: "size-5 text-primary-dark" })
			})
		]
	});
}
var Textarea = (0, import_react.forwardRef)(function Textarea({ className, ...props }, ref) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
		ref,
		className: cn("w-full resize-none rounded-lg border border-border bg-surface px-3 py-3 text-base text-fg placeholder:text-subtle outline-none transition-shadow duration-150 focus:ring-2 focus:ring-ring/40", className),
		...props
	});
});
function Composer() {
	const [value, setValue] = (0, import_react.useState)("");
	const sending = useChatStore((s) => s.sending);
	const ready = useChatStore((s) => s.status.ready);
	const send = useChatStore((s) => s.send);
	const setPanel = useChatStore((s) => s.setPanel);
	const premium = usePremiumStore((s) => s.entitlement.premium);
	const remaining = usePremiumStore((s) => s.remainingToday());
	const ref = (0, import_react.useRef)(null);
	(0, import_react.useEffect)(() => {
		const el = ref.current;
		if (!el) return;
		el.style.height = "0px";
		el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
	}, [value]);
	const disabled = sending || !ready || !value.trim();
	const submit = () => {
		if (disabled) return;
		const text = value;
		setValue("");
		send(text);
	};
	const onKey = (e) => {
		if (e.key === "Enter" && !e.shiftKey) {
			e.preventDefault();
			submit();
		}
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "border-t border-border/80 bg-surface/90 px-3 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-sm",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mx-auto flex max-w-2xl items-end gap-2 rounded-xl border border-border bg-bg p-2 shadow-[var(--shadow-soft)]",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Textarea, {
				ref,
				rows: 1,
				value,
				onChange: (e) => setValue(e.target.value),
				onKeyDown: onKey,
				placeholder: "پیام خود را بنویسید…",
				disabled: sending || !ready,
				className: "min-h-11 border-0 bg-transparent px-2 py-2.5 shadow-none focus:ring-0"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				size: "icon",
				className: "shrink-0 rounded-lg",
				disabled,
				onClick: submit,
				"aria-label": "ارسال",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowUp, { className: "size-5" })
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mx-auto mt-2 flex max-w-2xl items-center justify-between px-1 text-[11px] text-subtle",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: premium ? "نسخه ویژه — پیام نامحدود" : `${Math.max(0, remaining === Number.POSITIVE_INFINITY ? 8 : remaining)} از 8 پیام رایگان امروز` }), !premium ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				className: "text-primary-dark",
				onClick: () => setPanel("premium"),
				children: "ارتقا به ویژه"
			}) : null]
		})]
	});
}
var SUGGESTIONS = [
	"یک برنامهٔ روزانه منظم برای مطالعه پیشنهاد بده",
	"این جمله را ساده‌تر و محترمانه‌تر بازنویسی کن",
	"تفاوت یادگیری نظارت‌شده و بدون نظارت چیست؟"
];
function EmptyState() {
	const send = useChatStore((s) => s.send);
	const sending = useChatStore((s) => s.sending);
	const ready = useChatStore((s) => s.status.ready);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mx-auto flex h-full max-w-lg flex-col items-center justify-center px-6 text-center",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "grid size-24 place-items-center rounded-2xl bg-surface shadow-[var(--shadow-soft)]",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(NovaLogo, { className: "size-16" })
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "mt-5 text-xl font-semibold",
				children: "سلام، من نوا هستم"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-2 max-w-sm text-sm leading-6 text-muted",
				children: "دستیار فارسی شما. روی گوشی اندروید پاسخ‌ها با Gemma 3 به‌صورت آفلاین ساخته می‌شود."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
				className: "mt-6 grid w-full gap-2",
				children: SUGGESTIONS.map((s) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					disabled: sending || !ready,
					onClick: () => send(s),
					className: "w-full rounded-xl border border-border bg-surface px-4 py-3 text-right text-sm leading-6 text-fg transition-colors duration-150 hover:border-primary/40 hover:bg-surface-2 disabled:opacity-50",
					children: s
				}) }, s))
			})
		]
	});
}
function MessageBubble({ message }) {
	const mine = message.role === "user";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: cn("nova-rise flex w-full", mine ? "justify-end" : "justify-start"),
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: cn("max-w-[86%] rounded-2xl px-3.5 py-2.5 text-[15px] leading-7 shadow-[var(--shadow-soft)]", mine ? "rounded-bl-md bg-user text-user-fg" : "rounded-br-md border border-border/70 bg-surface text-fg"),
			children: [message.pending && !message.content ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
				className: "nova-dots inline-flex items-center gap-1 px-1",
				"aria-label": "در حال نوشتن",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "size-1.5 rounded-full bg-current" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "size-1.5 rounded-full bg-current" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "size-1.5 rounded-full bg-current" })
				]
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "whitespace-pre-wrap",
				children: message.content
			}), message.error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-1 text-xs text-danger",
				children: message.error
			}) : null]
		})
	});
}
function MessageList({ messages }) {
	const endRef = (0, import_react.useRef)(null);
	(0, import_react.useEffect)(() => {
		endRef.current?.scrollIntoView({
			behavior: "smooth",
			block: "end"
		});
	}, [messages.length, messages[messages.length - 1]?.content]);
	if (messages.length === 0) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EmptyState, {});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mx-auto flex w-full max-w-2xl flex-col gap-3 px-4 py-4",
		children: [messages.map((m) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MessageBubble, { message: m }, m.id)), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { ref: endRef })]
	});
}
function ModelMissing() {
	const status = useChatStore((s) => s.status);
	const hydrateStatus = useChatStore((s) => s.hydrateStatus);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mx-auto flex h-full max-w-lg flex-col items-center justify-center px-6 text-center",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "grid size-24 place-items-center rounded-2xl bg-surface shadow-[var(--shadow-soft)]",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(NovaLogo, { className: "size-16 opacity-70" })
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "mt-5 text-xl font-semibold",
				children: "مدل نصب نشده"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "mt-2 max-w-sm text-sm leading-6 text-muted",
				children: [
					"فایل ",
					MODEL.fileName,
					" پیدا نشد. برنامه بدون مدل هم اجرا می‌شود؛ برای گفتگوی آفلاین، مدل Gemma را در یکی از مسیرهای زیر قرار دهید."
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
				className: "mt-5 w-full space-y-2 text-right",
				children: MODEL_SEARCH_HINTS.map((path) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
					className: "flex items-start gap-2 rounded-lg bg-surface px-3 py-2.5 text-xs leading-5 text-muted",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FolderOpen, { className: "mt-0.5 size-4 shrink-0 text-primary" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("code", {
						className: "break-all font-sans",
						children: path
					})]
				}, path))
			}),
			status.message ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-3 text-xs text-subtle",
				children: status.message
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
				className: "mt-6 rounded-lg",
				onClick: () => hydrateStatus(),
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RefreshCw, { className: "size-4" }), "بررسی دوباره"]
			})
		]
	});
}
var PERKS = [
	"پیام روزانه نامحدود",
	"سقف توکن خروجی بالاتر",
	"اولویت پشتیبانی مدل آفلاین"
];
function PremiumSheet() {
	const open = useChatStore((s) => s.panel === "premium");
	const setPanel = useChatStore((s) => s.setPanel);
	const entitlement = usePremiumStore((s) => s.entitlement);
	const refresh = usePremiumStore((s) => s.refresh);
	const markPurchased = usePremiumStore((s) => s.markPurchased);
	const [busy, setBusy] = (0, import_react.useState)(null);
	const [error, setError] = (0, import_react.useState)(null);
	const buy = async (id) => {
		setBusy(id);
		setError(null);
		try {
			const result = await buyPremium(id);
			if (!result.ok) {
				setError(result.cancelled ? "خرید لغو شد." : result.error);
				return;
			}
			markPurchased(id);
			await refresh();
		} catch (err) {
			setError(err instanceof Error ? err.message : "خرید انجام نشد.");
		} finally {
			setBusy(null);
		}
	};
	const restore = async () => {
		setBusy("restore");
		setError(null);
		try {
			await restorePurchases();
			await refresh();
		} finally {
			setBusy(null);
		}
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: cn("fixed inset-0 z-40 bg-fg/25 transition-opacity duration-200", open ? "opacity-100" : "pointer-events-none opacity-0"),
		onClick: () => setPanel("none")
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: cn("fixed inset-x-0 bottom-0 z-50 mx-auto max-w-lg rounded-t-2xl bg-surface p-5 shadow-[var(--shadow-float)] transition-transform duration-300 ease-out", open ? "translate-y-0" : "translate-y-full"),
		"aria-hidden": !open,
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mb-4 flex items-center justify-between",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(NovaLogo, { className: "size-7" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "text-base font-semibold",
						children: "نوا ویژه"
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					variant: "ghost",
					size: "icon",
					onClick: () => setPanel("none"),
					"aria-label": "بستن",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "size-4" })
				})]
			}),
			entitlement.premium ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "rounded-lg bg-primary/12 px-3 py-2 text-sm text-primary-dark",
				children: [
					"اشتراک ویژه فعال است",
					entitlement.productId ? ` (${entitlement.productId})` : "",
					"."
				]
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm leading-6 text-muted",
				children: "پرداخت از طریق فروشگاه اندروید انجام می‌شود. هیچ کلید خصوصی یا اطلاعات درگاه داخل برنامه ذخیره نشده است."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
				className: "mt-4 space-y-2",
				children: PERKS.map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
					className: "flex items-center gap-2 text-sm",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { className: "size-4 text-primary" }), p]
				}, p))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-5 grid gap-2",
				children: PRODUCTS.map((product) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
					variant: product.period === "lifetime" ? "default" : "outline",
					className: "h-auto flex-col items-start rounded-xl px-4 py-3",
					disabled: Boolean(busy) || entitlement.premium,
					onClick: () => buy(product.id),
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-sm font-semibold",
						children: product.title
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-xs opacity-80",
						children: product.storePriceLabel
					})]
				}, product.id))
			}),
			error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-3 text-sm text-danger",
				children: error
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				className: "mt-4 w-full text-center text-sm text-muted",
				disabled: Boolean(busy),
				onClick: restore,
				children: "بازیابی خریدهای قبلی"
			})
		]
	})] });
}
function SettingsPanel() {
	const open = useChatStore((s) => s.panel === "settings");
	const setPanel = useChatStore((s) => s.setPanel);
	const status = useChatStore((s) => s.status);
	const temperature = useSettingsStore((s) => s.temperature);
	const maxTokens = useSettingsStore((s) => s.maxTokens);
	const contextSize = useSettingsStore((s) => s.contextSize);
	const setTemperature = useSettingsStore((s) => s.setTemperature);
	const setMaxTokens = useSettingsStore((s) => s.setMaxTokens);
	const setContextSize = useSettingsStore((s) => s.setContextSize);
	const reset = useSettingsStore((s) => s.reset);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: cn("fixed inset-0 z-40 bg-fg/25 transition-opacity duration-200", open ? "opacity-100" : "pointer-events-none opacity-0"),
		onClick: () => setPanel("none")
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: cn("fixed inset-x-0 bottom-0 z-50 mx-auto max-w-lg rounded-t-2xl bg-surface p-5 shadow-[var(--shadow-float)] transition-transform duration-300 ease-out", open ? "translate-y-0" : "translate-y-full"),
		"aria-hidden": !open,
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mb-4 flex items-center justify-between",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "text-base font-semibold",
					children: "تنظیمات مدل"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					variant: "ghost",
					size: "icon",
					onClick: () => setPanel("none"),
					"aria-label": "بستن",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "size-4" })
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "mb-4 text-sm leading-6 text-muted",
				children: [MODEL.displayName, " — دما، سقف توکن خروجی و طول context در همین‌جا تنظیم می‌شود و به llama.cpp پاس داده می‌شود."]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dl", {
				className: "mb-4 grid grid-cols-2 gap-2 text-xs",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "rounded-lg bg-bg px-3 py-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
						className: "text-subtle",
						children: "وضعیت"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
						className: "mt-1 font-medium",
						children: status.message
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "rounded-lg bg-bg px-3 py-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
						className: "text-subtle",
						children: "موتور"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
						className: "mt-1 font-medium",
						children: status.backend === "native-gemma" ? "llama.cpp / CPU" : status.backend
					})]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
				className: "block",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
					className: "flex items-center justify-between text-sm",
					children: ["دما", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "tabular-nums text-muted",
						children: temperature.toFixed(2)
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					type: "range",
					min: .1,
					max: 1.4,
					step: .05,
					value: temperature,
					onChange: (e) => setTemperature(Number(e.target.value)),
					className: "mt-2 w-full accent-primary"
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
				className: "mt-4 block",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
					className: "flex items-center justify-between text-sm",
					children: ["سقف توکن خروجی", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "tabular-nums text-muted",
						children: maxTokens
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					type: "range",
					min: 64,
					max: 1024,
					step: 64,
					value: maxTokens,
					onChange: (e) => setMaxTokens(Number(e.target.value)),
					className: "mt-2 w-full accent-primary"
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
				className: "mt-4 block",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
					className: "flex items-center justify-between text-sm",
					children: ["طول context", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "tabular-nums text-muted",
						children: contextSize
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					type: "range",
					min: 2048,
					max: 8192,
					step: 1024,
					value: contextSize,
					onChange: (e) => setContextSize(Number(e.target.value)),
					className: "mt-2 w-full accent-primary"
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "mt-3 text-[11px] leading-5 text-subtle",
				children: [
					"پیش‌فرض: دما ",
					INFERENCE_DEFAULTS.temperature,
					"، توکن ",
					INFERENCE_DEFAULTS.maxTokens,
					"، context ",
					INFERENCE_DEFAULTS.contextSize,
					". تغییر context فقط هنگام بارگذاری دوباره مدل اعمال می‌شود."
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				variant: "outline",
				className: "mt-4 w-full rounded-lg",
				onClick: reset,
				children: "بازگشت به پیش‌فرض"
			})
		]
	})] });
}
function Sidebar() {
	const open = useChatStore((s) => s.panel === "sidebar");
	const setPanel = useChatStore((s) => s.setPanel);
	const conversations = useChatStore((s) => s.conversations);
	const activeId = useChatStore((s) => s.activeId);
	const newChat = useChatStore((s) => s.newChat);
	const selectChat = useChatStore((s) => s.selectChat);
	const deleteChat = useChatStore((s) => s.deleteChat);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: cn("fixed inset-0 z-40 bg-fg/25 transition-opacity duration-200", open ? "opacity-100" : "pointer-events-none opacity-0"),
		onClick: () => setPanel("none")
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("aside", {
		className: cn("fixed inset-y-0 right-0 z-50 flex w-[min(20rem,88vw)] flex-col bg-surface shadow-[var(--shadow-float)] transition-transform duration-200 ease-out", open ? "translate-x-0" : "translate-x-full"),
		"aria-hidden": !open,
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center gap-2 border-b border-border px-4 py-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(NovaLogo, { className: "size-7" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "min-w-0 flex-1",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-sm font-semibold",
							children: "نوا"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-xs text-muted",
							children: "گفتگوها"
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "ghost",
						size: "icon",
						onClick: () => setPanel("none"),
						"aria-label": "بستن",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "size-4" })
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "p-3",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
					className: "w-full rounded-lg",
					onClick: newChat,
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MessageSquarePlus, { className: "size-4" }), "گفتگوی جدید"]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("nav", {
				className: "min-h-0 flex-1 overflow-y-auto px-2 pb-3",
				children: conversations.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "px-3 py-6 text-center text-sm text-muted",
					children: "هنوز گفتگویی نیست."
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
					className: "space-y-1",
					children: conversations.map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
						className: "group relative",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							onClick: () => selectChat(c.id),
							className: cn("w-full rounded-lg px-3 py-2.5 text-right text-sm transition-colors duration-150", c.id === activeId ? "bg-primary/12 text-primary-dark" : "text-fg hover:bg-surface-2"),
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "block truncate font-medium",
								children: c.title
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "mt-0.5 block text-[11px] text-subtle",
								children: new Date(c.updatedAt).toLocaleDateString("fa-IR")
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							className: "absolute left-2 top-2 grid size-8 place-items-center rounded-md text-subtle opacity-0 hover:bg-surface hover:text-danger group-hover:opacity-100",
							onClick: () => deleteChat(c.id),
							"aria-label": "حذف گفتگو",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "size-3.5" })
						})]
					}, c.id))
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid grid-cols-2 gap-2 border-t border-border p-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
					variant: "outline",
					className: "rounded-lg",
					onClick: () => setPanel("settings"),
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Settings, { className: "size-4" }), "تنظیمات"]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
					variant: "secondary",
					className: "rounded-lg",
					onClick: () => setPanel("premium"),
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sparkles, { className: "size-4" }), "ویژه"]
				})]
			})
		]
	})] });
}
function AppShell() {
	const hydrateStatus = useChatStore((s) => s.hydrateStatus);
	const refreshPremium = usePremiumStore((s) => s.refresh);
	const status = useChatStore((s) => s.status);
	const active = useChatStore((s) => s.conversations.find((c) => c.id === s.activeId));
	(0, import_react.useEffect)(() => {
		hydrateStatus();
		refreshPremium();
	}, [hydrateStatus, refreshPremium]);
	const showMissing = status.code === "missing" && status.backend !== "web-preview";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "nova-shell flex h-dvh min-h-0 flex-col",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChatHeader, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
				className: "min-h-0 flex-1 overflow-y-auto",
				children: showMissing ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ModelMissing, {}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MessageList, { messages: active?.messages ?? [] })
			}),
			showMissing ? null : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Composer, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sidebar, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SettingsPanel, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PremiumSheet, {})
		]
	});
}
function Home() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AppShell, {});
}
//#endregion
export { Home as component };
