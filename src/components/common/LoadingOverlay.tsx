import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { COLORS } from '@/constants/colors';
import { LAYOUT } from '@/constants/layout';

interface Props {
  message?: string;
}

export default function LoadingOverlay({ message }: Props) {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={COLORS.gold} />
      {message && <Text style={styles.message}>{message}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.navy,
    alignItems: 'center',
    justifyContent: 'center',
    gap: LAYOUT.spacing.md,
  },
  message: {
    color: COLORS.white,
    fontSize: LAYOUT.fontSize.md,
  },
});
