import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { calculateFare, formatFare } from '@/constants/fare';
import { COLORS } from '@/constants/colors';
import { LAYOUT } from '@/constants/layout';

interface Props {
  distanceKm: number;
  durationSeconds: number;
}

export default function FareCard({ distanceKm, durationSeconds }: Props) {
  const fare = calculateFare(distanceKm);
  const minutes = Math.ceil(durationSeconds / 60);

  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <Ionicons name="speedometer-outline" size={20} color={COLORS.gold} />
        <Text style={styles.label}>距離</Text>
        <Text style={styles.value}>{distanceKm.toFixed(1)} km</Text>
      </View>
      <View style={styles.divider} />
      <View style={styles.row}>
        <Ionicons name="time-outline" size={20} color={COLORS.gold} />
        <Text style={styles.label}>所要時間</Text>
        <Text style={styles.value}>{minutes} 分</Text>
      </View>
      <View style={styles.divider} />
      <View style={styles.row}>
        <Ionicons name="cash-outline" size={20} color={COLORS.gold} />
        <Text style={styles.label}>概算料金</Text>
        <Text style={styles.fareValue}>{formatFare(fare)}</Text>
      </View>
      <Text style={styles.note}>※ 基本料金 ¥10,000 + ¥700/km</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.navy,
    borderRadius: LAYOUT.borderRadius.lg,
    padding: LAYOUT.spacing.md,
    margin: LAYOUT.spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: LAYOUT.spacing.sm,
    paddingVertical: LAYOUT.spacing.sm,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.navyLight,
  },
  label: {
    flex: 1,
    color: COLORS.lightGray,
    fontSize: LAYOUT.fontSize.md,
  },
  value: {
    color: COLORS.white,
    fontSize: LAYOUT.fontSize.md,
    fontWeight: '700',
  },
  fareValue: {
    color: COLORS.gold,
    fontSize: LAYOUT.fontSize.xl,
    fontWeight: '800',
  },
  note: {
    color: COLORS.gray,
    fontSize: LAYOUT.fontSize.xs,
    textAlign: 'right',
    marginTop: LAYOUT.spacing.sm,
  },
});
