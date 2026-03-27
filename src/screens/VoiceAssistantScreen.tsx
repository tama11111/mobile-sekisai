import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Animated,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useVoiceAI } from '@/hooks/useVoiceAI';
import ConversationBubble from '@/components/voice/ConversationBubble';
import { COLORS } from '@/constants/colors';
import { LAYOUT } from '@/constants/layout';

const EXAMPLE_QUERIES = [
  '山田さんの前回の案件は何でしたか？',
  '今日の出動中の案件を教えてください',
  '先月の請求済み案件の件数は？',
  '西湘ダイヤの今の状況は？',
];

export default function VoiceAssistantScreen() {
  const {
    conversation,
    isListening,
    isProcessing,
    isSpeaking,
    partialTranscript,
    startListening,
    stopListening,
    clearConversation,
    sendTextMessage,
  } = useVoiceAI();

  const flatListRef = useRef<FlatList>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const [textInput, setTextInput] = useState('');

  // Mic pulse animation
  useEffect(() => {
    if (isListening) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.3, duration: 600, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isListening, pulseAnim]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (conversation.length > 0) {
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [conversation]);

  const handleMicPress = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const handleTextSend = () => {
    if (!textInput.trim() || isProcessing) return;
    sendTextMessage(textInput.trim());
    setTextInput('');
  };

  const handleExamplePress = (query: string) => {
    sendTextMessage(query);
  };

  const statusText = isListening
    ? '聞いています...'
    : isProcessing
    ? 'AIが考えています...'
    : isSpeaking
    ? '読み上げ中...'
    : 'マイクをタップして質問';

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Header */}
      <LinearGradient colors={[COLORS.navy, COLORS.navyLight]} style={styles.headerGrad}>
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>AIアシスタント</Text>
            <Text style={styles.headerSub}>案件データに質問できます</Text>
          </View>
          {conversation.length > 0 && (
            <TouchableOpacity
              onPress={() => Alert.alert('会話をクリア', '会話履歴を削除しますか？', [
                { text: 'キャンセル', style: 'cancel' },
                { text: '削除', style: 'destructive', onPress: clearConversation },
              ])}
              style={styles.clearBtn}
            >
              <Ionicons name="trash-outline" size={20} color={COLORS.gold} />
            </TouchableOpacity>
          )}
        </View>
      </LinearGradient>

      {/* Conversation */}
      {conversation.length === 0 ? (
        <View style={styles.examples}>
          <Text style={styles.examplesTitle}>質問の例</Text>
          {EXAMPLE_QUERIES.map((q, i) => (
            <TouchableOpacity
              key={i}
              style={styles.exampleChip}
              onPress={() => handleExamplePress(q)}
            >
              <Ionicons name="chatbubble-outline" size={16} color={COLORS.gold} />
              <Text style={styles.exampleText}>{q}</Text>
            </TouchableOpacity>
          ))}
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={conversation}
          keyExtractor={(_, i) => i.toString()}
          renderItem={({ item }) => <ConversationBubble message={item} />}
          contentContainerStyle={styles.conversationPad}
          style={styles.conversation}
        />
      )}

      {/* Partial transcript */}
      {(isListening && partialTranscript) && (
        <View style={styles.partialRow}>
          <Text style={styles.partialText}>{partialTranscript}</Text>
        </View>
      )}

      {/* Status */}
      <Text style={styles.statusText}>{statusText}</Text>

      {/* Controls */}
      <View style={styles.controls}>
        {/* Text input */}
        <View style={styles.inputRow}>
          <TextInput
            style={styles.textInput}
            placeholder="テキストで入力..."
            placeholderTextColor={COLORS.gray}
            value={textInput}
            onChangeText={setTextInput}
            onSubmitEditing={handleTextSend}
            returnKeyType="send"
            editable={!isProcessing}
          />
          <TouchableOpacity
            style={[styles.sendBtn, (!textInput.trim() || isProcessing) && styles.sendBtnDisabled]}
            onPress={handleTextSend}
            disabled={!textInput.trim() || isProcessing}
          >
            <Ionicons name="send" size={18} color={COLORS.white} />
          </TouchableOpacity>
        </View>

        {/* Mic button */}
        <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
          <TouchableOpacity
            style={[
              styles.micBtn,
              isListening && styles.micBtnActive,
              isProcessing && styles.micBtnDisabled,
            ]}
            onPress={handleMicPress}
            disabled={isProcessing}
            activeOpacity={0.8}
          >
            <Ionicons
              name={isListening ? 'stop' : 'mic'}
              size={32}
              color={isListening ? COLORS.white : COLORS.navy}
            />
          </TouchableOpacity>
        </Animated.View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  headerGrad: {
    paddingBottom: LAYOUT.spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: LAYOUT.spacing.md,
    paddingTop: LAYOUT.spacing.md,
  },
  headerTitle: {
    color: COLORS.white,
    fontSize: LAYOUT.fontSize.xl,
    fontWeight: '800',
  },
  headerSub: {
    color: COLORS.gold,
    fontSize: LAYOUT.fontSize.sm,
    marginTop: 2,
  },
  clearBtn: {
    padding: LAYOUT.spacing.sm,
  },
  examples: {
    flex: 1,
    padding: LAYOUT.spacing.lg,
    gap: LAYOUT.spacing.sm,
  },
  examplesTitle: {
    color: COLORS.darkGray,
    fontSize: LAYOUT.fontSize.sm,
    fontWeight: '700',
    marginBottom: LAYOUT.spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  exampleChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: LAYOUT.spacing.sm,
    padding: LAYOUT.spacing.md,
    backgroundColor: COLORS.white,
    borderRadius: LAYOUT.borderRadius.lg,
    borderWidth: 1,
    borderColor: COLORS.borderColor,
    shadowColor: COLORS.navy,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  exampleText: {
    flex: 1,
    fontSize: LAYOUT.fontSize.sm,
    color: COLORS.darkGray,
  },
  conversation: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  conversationPad: {
    paddingVertical: LAYOUT.spacing.md,
  },
  partialRow: {
    marginHorizontal: LAYOUT.spacing.md,
    padding: LAYOUT.spacing.sm,
    backgroundColor: COLORS.offWhite,
    borderRadius: LAYOUT.borderRadius.md,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.gold,
  },
  partialText: {
    fontSize: LAYOUT.fontSize.sm,
    color: COLORS.gray,
    fontStyle: 'italic',
  },
  statusText: {
    textAlign: 'center',
    fontSize: LAYOUT.fontSize.sm,
    color: COLORS.gray,
    paddingVertical: LAYOUT.spacing.xs,
  },
  controls: {
    alignItems: 'center',
    padding: LAYOUT.spacing.md,
    gap: LAYOUT.spacing.md,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderColor,
  },
  inputRow: {
    flexDirection: 'row',
    width: '100%',
    gap: LAYOUT.spacing.sm,
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.borderColor,
    borderRadius: LAYOUT.borderRadius.md,
    paddingHorizontal: LAYOUT.spacing.md,
    paddingVertical: LAYOUT.spacing.sm,
    fontSize: LAYOUT.fontSize.sm,
    color: COLORS.darkGray,
    backgroundColor: COLORS.offWhite,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: LAYOUT.borderRadius.md,
    backgroundColor: COLORS.navy,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: {
    opacity: 0.4,
  },
  micBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: COLORS.gold,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.gold,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  micBtnActive: {
    backgroundColor: COLORS.error,
    shadowColor: COLORS.error,
  },
  micBtnDisabled: {
    opacity: 0.5,
  },
});
