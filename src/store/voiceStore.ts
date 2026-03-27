import { create } from 'zustand';
import type { ConversationMessage } from '@/lib/anthropic';

interface VoiceStore {
  conversation: ConversationMessage[];
  isListening: boolean;
  isProcessing: boolean;
  isSpeaking: boolean;
  partialTranscript: string;
  addMessage: (message: ConversationMessage) => void;
  clearConversation: () => void;
  setIsListening: (v: boolean) => void;
  setIsProcessing: (v: boolean) => void;
  setIsSpeaking: (v: boolean) => void;
  setPartialTranscript: (v: string) => void;
}

export const useVoiceStore = create<VoiceStore>((set) => ({
  conversation: [],
  isListening: false,
  isProcessing: false,
  isSpeaking: false,
  partialTranscript: '',
  addMessage: (message) =>
    set((state) => ({ conversation: [...state.conversation, message] })),
  clearConversation: () => set({ conversation: [] }),
  setIsListening: (v) => set({ isListening: v }),
  setIsProcessing: (v) => set({ isProcessing: v }),
  setIsSpeaking: (v) => set({ isSpeaking: v }),
  setPartialTranscript: (v) => set({ partialTranscript: v }),
}));
