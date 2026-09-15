import { create } from "zustand";
import { persist } from "zustand/middleware";
import { INFERENCE_DEFAULTS } from "@/lib/inference/config";

type SettingsState = {
  temperature: number;
  maxTokens: number;
  contextSize: number;
  topP: number;
  topK: number;
  setTemperature: (value: number) => void;
  setMaxTokens: (value: number) => void;
  setContextSize: (value: number) => void;
  reset: () => void;
};

const defaults = {
  temperature: INFERENCE_DEFAULTS.temperature,
  maxTokens: INFERENCE_DEFAULTS.maxTokens,
  contextSize: INFERENCE_DEFAULTS.contextSize,
  topP: INFERENCE_DEFAULTS.topP,
  topK: INFERENCE_DEFAULTS.topK,
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      ...defaults,
      setTemperature: (temperature) => set({ temperature }),
      setMaxTokens: (maxTokens) => set({ maxTokens }),
      setContextSize: (contextSize) => set({ contextSize }),
      reset: () => set(defaults),
    }),
    { name: "nova.settings.v1" },
  ),
);
