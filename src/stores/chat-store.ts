import { create } from "zustand";
import { persist } from "zustand/middleware";
import { generateResponse, probeModel } from "@/lib/inference/client";
import { PREMIUM_MAX_TOKENS } from "@/lib/inference/config";
import type { ChatMessage } from "@/lib/inference/types";
import type { ModelStatus } from "@/lib/inference/types";
import { uid, truncate } from "@/lib/utils";
import { usePremiumStore } from "./premium-store";
import { useSettingsStore } from "./settings-store";

export type UiMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: number;
  pending?: boolean;
  error?: string;
};

export type Conversation = {
  id: string;
  title: string;
  messages: UiMessage[];
  createdAt: number;
  updatedAt: number;
};

type ChatState = {
  conversations: Conversation[];
  activeId: string | null;
  status: ModelStatus;
  sending: boolean;
  panel: "none" | "sidebar" | "settings" | "premium";
  hydrateStatus: () => Promise<void>;
  newChat: () => void;
  selectChat: (id: string) => void;
  deleteChat: (id: string) => void;
  setPanel: (panel: ChatState["panel"]) => void;
  send: (text: string) => Promise<void>;
  active: () => Conversation | undefined;
};

function blankConversation(): Conversation {
  const now = Date.now();
  return {
    id: uid("chat"),
    title: "گفتگوی تازه",
    messages: [],
    createdAt: now,
    updatedAt: now,
  };
}

const initialStatus: ModelStatus = {
  backend: "unavailable",
  code: "loading",
  ready: false,
  message: "در حال بررسی مدل…",
  nativeAvailable: false,
};

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
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
        set({
          status: {
            ...get().status,
            code: "loading",
            message: "در حال آماده‌سازی مدل…",
          },
        });
        const status = await probeModel();
        set({ status });
      },

      newChat: () => {
        const next = blankConversation();
        set((s) => ({
          conversations: [next, ...s.conversations],
          activeId: next.id,
          panel: "none",
        }));
      },

      selectChat: (id) => set({ activeId: id, panel: "none" }),

      deleteChat: (id) => {
        set((s) => {
          const conversations = s.conversations.filter((c) => c.id !== id);
          const activeId =
            s.activeId === id ? (conversations[0]?.id ?? null) : s.activeId;
          return { conversations, activeId };
        });
      },

      send: async (raw) => {
        const text = raw.trim();
        if (!text || get().sending) return;

        const premium = usePremiumStore.getState();
        const gate = premium.registerSend();
        if (!gate.allowed) {
          set({ panel: "premium" });
          return;
        }

        let conv = get().active();
        if (!conv) {
          get().newChat();
          conv = get().active();
        }
        if (!conv) return;

        const userMsg: UiMessage = {
          id: uid("msg"),
          role: "user",
          content: text,
          createdAt: Date.now(),
        };
        const assistantId = uid("msg");
        const assistantMsg: UiMessage = {
          id: assistantId,
          role: "assistant",
          content: "",
          createdAt: Date.now(),
          pending: true,
        };

        const title =
          conv.messages.length === 0 ? truncate(text, 36) : conv.title;

        set((s) => ({
          sending: true,
          conversations: s.conversations.map((c) =>
            c.id === conv.id
              ? {
                  ...c,
                  title,
                  updatedAt: Date.now(),
                  messages: [...c.messages, userMsg, assistantMsg],
                }
              : c,
          ),
        }));

        const settings = useSettingsStore.getState();
        const isPremium = usePremiumStore.getState().entitlement.premium;
        const history: ChatMessage[] = [...(get().active()?.messages ?? [])]
          .filter((m) => m.id !== assistantId)
          .map((m) => ({ role: m.role, content: m.content }));

        const patchAssistant = (partial: Partial<UiMessage>) => {
          set((s) => ({
            conversations: s.conversations.map((c) =>
              c.id === conv.id
                ? {
                    ...c,
                    updatedAt: Date.now(),
                    messages: c.messages.map((m) =>
                      m.id === assistantId ? { ...m, ...partial } : m,
                    ),
                  }
                : c,
            ),
          }));
        };

        try {
          const result = await generateResponse(
            {
              messages: history,
              temperature: settings.temperature,
              maxTokens: isPremium
                ? Math.max(settings.maxTokens, PREMIUM_MAX_TOKENS)
                : settings.maxTokens,
              contextSize: settings.contextSize,
              topP: settings.topP,
              topK: settings.topK,
            },
            (piece) => {
              const current = get()
                .conversations.find((c) => c.id === conv.id)
                ?.messages.find((m) => m.id === assistantId);
              patchAssistant({
                content: `${current?.content ?? ""}${piece}`,
                pending: true,
              });
            },
          );

          if (!result.ok) {
            patchAssistant({
              pending: false,
              error: result.error,
              content:
                result.code === "missing"
                  ? ""
                  : get()
                      .conversations.find((c) => c.id === conv.id)
                      ?.messages.find((m) => m.id === assistantId)?.content ?? "",
            });
            if (result.code === "missing") {
              set({
                status: {
                  ...get().status,
                  backend: "missing",
                  code: "missing",
                  ready: false,
                  message: result.error,
                },
              });
            }
            return;
          }

          patchAssistant({
            content: result.text,
            pending: false,
            error: undefined,
          });
        } catch (err) {
          patchAssistant({
            pending: false,
            error: err instanceof Error ? err.message : "خطای ناشناخته",
          });
        } finally {
          set({ sending: false });
        }
      },
    }),
    {
      name: "nova.chats.v1",
      partialize: (s) => ({
        conversations: s.conversations.map((c) => ({
          ...c,
          messages: c.messages.map((m) => ({ ...m, pending: false })),
        })),
        activeId: s.activeId,
      }),
    },
  ),
);
