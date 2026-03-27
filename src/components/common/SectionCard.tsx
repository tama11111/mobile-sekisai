import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { COLORS } from '@/constants/colors';
import { LAYOUT } from '@/constants/layout';

interface Props {
  title?: string;
  children: React.ReactNode;
  style?: ViewStyle;
}

export default function SectionCard({ title, children, style }: Props) {
  return (
    <View style={[styles.card, style]}>
      {title && <Text style={styles.title}>{title}</Text>}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white,
    borderRadius: LAYOUT.borderRadius.lg,
    padding: LAYOUT.spacing.md,
    marginBottom: LAYOUT.spacing.md,
    borderWidth: 1,
    borderColor: COLORS.borderColor,
    shadowColor: COLORS.navy,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  title: {
    fontSize: LAYOUT.fontSize.sm,
    fontWeight: '700',
    color: COLORS.navy,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: LAYOUT.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gold,
    paddingBottom: LAYOUT.spacing.xs,
  },
});
