import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatInTimeZone } from 'date-fns-tz';
import { ja } from 'date-fns/locale';
import type { InsuranceCase } from '@/types/database';
import StatusBadge from '@/components/common/StatusBadge';
import { COLORS } from '@/constants/colors';
import { LAYOUT } from '@/constants/layout';

interface Props {
  item: InsuranceCase;
  onPress: () => void;
  isSelected?: boolean;
}

export default function CaseListItem({ item, onPress, isSelected = false }: Props) {
  const formattedDate = formatInTimeZone(item.created_at, 'Asia/Tokyo', 'M/d HH:mm', { locale: ja });

  return (
    <TouchableOpacity
      style={[styles.container, isSelected && styles.selected]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.top}>
        <View style={styles.titleRow}>
          <Ionicons name="car-sport" size={16} color={isSelected ? COLORS.gold : COLORS.navy} />
          <Text style={[styles.customerName, isSelected && styles.selectedText]} numberOfLines={1}>
            {item.customer?.name ?? '顧客名不明'}
          </Text>
        </View>
        <StatusBadge status={item.tow_status} size="sm" />
      </View>

      {item.vehicle && (
        <Text style={styles.vehiclePlate}>
          {item.vehicle.plate}
          {item.vehicle.make ? ` / ${item.vehicle.make}` : ''}
          {item.vehicle.model ? ` ${item.vehicle.model}` : ''}
        </Text>
      )}

      {item.tow_origin_address && (
        <View style={styles.addressRow}>
          <Ionicons name="location-outline" size={12} color={COLORS.gray} />
          <Text style={styles.address} numberOfLines={1}>
            {item.tow_origin_address}
          </Text>
        </View>
      )}

      <Text style={styles.date}>{formattedDate}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.white,
    paddingHorizontal: LAYOUT.spacing.md,
    paddingVertical: LAYOUT.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderColor,
  },
  selected: {
    backgroundColor: COLORS.navy,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.gold,
  },
  top: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: LAYOUT.spacing.xs,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: LAYOUT.spacing.xs,
    flex: 1,
  },
  customerName: {
    fontSize: LAYOUT.fontSize.md,
    fontWeight: '700',
    color: COLORS.navy,
    flex: 1,
  },
  selectedText: {
    color: COLORS.white,
  },
  vehiclePlate: {
    fontSize: LAYOUT.fontSize.sm,
    color: COLORS.darkGray,
    marginBottom: 2,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginBottom: 2,
  },
  address: {
    fontSize: LAYOUT.fontSize.xs,
    color: COLORS.gray,
    flex: 1,
  },
  date: {
    fontSize: LAYOUT.fontSize.xs,
    color: COLORS.gray,
    textAlign: 'right',
    marginTop: LAYOUT.spacing.xs,
  },
});
