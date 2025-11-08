import { create } from "zustand";

interface AREffectsState {
  activeEffect: "glowing-eyes" | "sunglasses" | null;
  isRecording: boolean;
  emotionTriggerEnabled: boolean;
  glowIntensity: number;
  isCameraActive: boolean;
  snapshots: string[];
  recordings: { url: string; timestamp: number }[];
  
  setActiveEffect: (effect: "glowing-eyes" | "sunglasses" | null) => void;
  toggleRecording: () => void;
  toggleEmotionTrigger: () => void;
  setGlowIntensity: (intensity: number) => void;
  setCameraActive: (active: boolean) => void;
  addSnapshot: (dataUrl: string) => void;
  addRecording: (url: string) => void;
  clearSnapshots: () => void;
  clearRecordings: () => void;
  reset: () => void;
}

const initialState = {
  activeEffect: null as "glowing-eyes" | "sunglasses" | null,
  isRecording: false,
  emotionTriggerEnabled: false,
  glowIntensity: 1.0,
  isCameraActive: false,
  snapshots: [] as string[],
  recordings: [] as { url: string; timestamp: number }[],
};

export const useAREffectsStore = create<AREffectsState>((set) => ({
  ...initialState,

  setActiveEffect: (effect) => set({ activeEffect: effect }),

  toggleRecording: () =>
    set((state) => ({ isRecording: !state.isRecording })),

  toggleEmotionTrigger: () =>
    set((state) => ({ emotionTriggerEnabled: !state.emotionTriggerEnabled })),

  setGlowIntensity: (intensity) =>
    set({ glowIntensity: Math.max(0, Math.min(2, intensity)) }),

  setCameraActive: (active) => set({ isCameraActive: active }),

  addSnapshot: (dataUrl) =>
    set((state) => ({
      snapshots: [...state.snapshots, dataUrl],
    })),

  addRecording: (url) =>
    set((state) => ({
      recordings: [...state.recordings, { url, timestamp: Date.now() }],
    })),

  clearSnapshots: () => set({ snapshots: [] }),

  clearRecordings: () =>
    set((state) => {
      state.recordings.forEach((rec) => URL.revokeObjectURL(rec.url));
      return { recordings: [] };
    }),

  reset: () => set(initialState),
}));
