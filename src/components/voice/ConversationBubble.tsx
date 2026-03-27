import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { ConversationMessage } from '@/lib/anthropic';
import { COLORS } from '@/constants/colors';
import { LAYOUT } from '@/constants/layout';

interface Props {
  message: ConversationMessage;
}

export default function ConversationBubble({ message }: Props) {
  const isUser = message.role === 'user';

  return (
    <View style={[styles.row, isUser ? styles.rowUser : styles.rowAssistant]}>
      <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleAssistant]}>
        <Text style={[styles.text, isUser ? styles.textUser : styles.textAssistant]}>
          {message.content}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    marginVertical: LAYOUT.spacing.xs,
    paddingHorizontal: LAYOUT.spacing.md,
  },
  rowUser: {
    justifyContent: 'flex-end',
  },
  rowAssistant: {
    justifyContent: 'flex-start',
  },
  bubble: {
    maxWidth: '80%',
    padding: LAYOUT.spacing.md,
    borderRadius: LAYOUT.borderRadius.lg,
  },
  bubbleUser: {
    backgroundColor: COLORS.gold,
    borderBottomRightRadius: 4,
  },
  bubbleAssistant: {
    backgroundColor: COLORS.navyLight,
    borderBottomLeftRadius: 4,
  },
  text: {
    fontSize: LAYOUT.fontSize.md,
    lineHeight: 22,
  },
  textUser: {
    color: COLORS.navy,
    fontWeight: '600',
  },
  textAssistant: {
    color: COLORS.white,
  },
});
