import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { TowStatus } from '@/types/database';
import { COLORS } from '@/constants/colors';
import { LAYOUT } from '@/constants/layout';

const STATUS_CONFIG: Record<TowStatus, { label: string; color: string }> = {
  tow: { label: '出動中', color: COLORS.statusTow },
  arrival: { label: '現着', color: COLORS.statusArrival },
  repair: { label: '入庫', color: COLORS.statusRepair },
  claim: { label: '請求済', color: COLORS.statusClaim },
};

interface Props {
  status: TowStatus;
  size?: 'sm' | 'md';
}

export default function StatusBadge({ status, size = 'md' }: Props) {
  const config = STATUS_CONFIG[status];
  const isSmall = size === 'sm';

  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: config.color },
        isSmall && styles.badgeSm,
      ]}
    >
      <Text style={[styles.text, isSmall && styles.textSm]}>{config.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: LAYOUT.spacing.sm,
    paddingVertical: LAYOUT.spacing.xs,
    borderRadius: LAYOUT.borderRadius.full,
    alignSelf: 'flex-start',
  },
  badgeSm: {
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  text: {
    color: COLORS.white,
    fontSize: LAYOUT.fontSize.sm,
    fontWeight: '700',
  },
  textSm: {
    fontSize: LAYOUT.fontSize.xs,
  },
});
