import { useCallback, useEffect, useRef } from 'react';
import * as Speech from 'expo-speech';
import { useVoiceStore } from '@/store/voiceStore';
import { sendMessageToAI } from '@/lib/anthropic';

// Dynamic import for Voice to avoid crashes in environments without native module
let Voice: typeof import('@react-native-voice/voice').default | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  Voice = require('@react-native-voice/voice').default;
} catch {
  console.warn('@react-native-voice/voice not available');
}

export function useVoiceAI() {
  const {
    conversation,
    isListening,
    isProcessing,
    isSpeaking,
    partialTranscript,
    addMessage,
    clearConversation,
    setIsListening,
    setIsProcessing,
    setIsSpeaking,
    setPartialTranscript,
  } = useVoiceStore();

  const storeConversationRef = useRef(conversation);
  useEffect(() => {
    storeConversationRef.current = conversation;
  }, [conversation]);

  const handleTranscript = useCallback(
    async (text: string) => {
      if (!text.trim()) return;

      setIsProcessing(true);
      addMessage({ role: 'user', content: text });

      try {
        const reply = await sendMessageToAI(text, storeConversationRef.current);
        addMessage({ role: 'assistant', content: reply });

        setIsSpeaking(true);
        Speech.speak(reply, {
          language: 'ja-JP',
          rate: 1.0,
          onDone: () => setIsSpeaking(false),
          onError: () => setIsSpeaking(false),
        });
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'エラーが発生しました';
        addMessage({ role: 'assistant', content: `エラー: ${message}` });
      } finally {
        setIsProcessing(false);
      }
    },
    [addMessage, setIsProcessing, setIsSpeaking]
  );

  useEffect(() => {
    if (!Voice) return;

    Voice.onSpeechStart = () => setIsListening(true);
    Voice.onSpeechEnd = () => setIsListening(false);
    Voice.onSpeechResults = (e) => {
      const text = e.value?.[0] ?? '';
      setPartialTranscript('');
      if (text) handleTranscript(text);
    };
    Voice.onSpeechPartialResults = (e) => {
      setPartialTranscript(e.value?.[0] ?? '');
    };
    Voice.onSpeechError = (e) => {
      console.warn('Speech error:', e);
      setIsListening(false);
    };

    return () => {
      Voice?.destroy().then(() => Voice?.removeAllListeners());
    };
  }, [handleTranscript, setIsListening, setPartialTranscript]);

  const startListening = useCallback(async () => {
    if (!Voice) {
      // Fallback: prompt for text input
      return;
    }
    try {
      Speech.stop();
      await Voice.start('ja-JP');
    } catch (err) {
      console.warn('Failed to start voice:', err);
    }
  }, []);

  const stopListening = useCallback(async () => {
    if (!Voice) return;
    try {
      await Voice.stop();
    } catch (err) {
      console.warn('Failed to stop voice:', err);
    }
  }, []);

  return {
    conversation,
    isListening,
    isProcessing,
    isSpeaking,
    partialTranscript,
    startListening,
    stopListening,
    clearConversation,
    sendTextMessage: handleTranscript,
  };
}
