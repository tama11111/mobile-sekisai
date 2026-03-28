import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatInTimeZone } from 'date-fns-tz';
import { ja } from 'date-fns/locale';
import type { InsuranceCase, TowStatus, AccidentStatus, CaseType } from '@/types/database';
import StatusBadge from '@/components/common/StatusBadge';
import { COLORS } from '@/constants/colors';
import { LAYOUT } from '@/constants/layout';

interface Props {
  item: InsuranceCase;
  onPress: () => void;
  isSelected?: boolean;
}

function formatJST(iso: string) {
  return formatInTimeZone(iso, 'Asia/Tokyo', 'M/d HH:mm', { locale: ja });
}

export default function CaseListItem({ item, onPress, isSelected = false }: Props) {
  const detail = item.insurance_details?.[0];
  const caseType: CaseType | null = detail?.case_type ?? null;

  // ステータスバッジ（detail に tow_status / accident_status があれば優先）
  const detailTowStatus   = detail?.tow_status   as TowStatus | null | undefined;
  const detailAccStatus   = detail?.accident_status as AccidentStatus | null | undefined;
  // 終了ウォーターマーク（いずれかの最終ステータスが paid）
  const isPaid =
    detailTowStatus === 'paid' ||
    detailAccStatus === 'paid' ||
    item.tow_status === 'paid';

  const textColor = isSelected ? COLORS.white : COLORS.navy;

  return (
    <TouchableOpacity
      style={[styles.container, isSelected && styles.selected, isPaid && styles.paidContainer]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* 終了ウォーターマーク */}
      {isPaid && (
        <View style={styles.watermarkWrapper} pointerEvents="none">
          <Text style={styles.watermark}>終了</Text>
        </View>
      )}

      {/* Row 1: 種別バッジ ＋ タイトル ＋ ステータスバッジ */}
      <View style={styles.row}>
        {caseType && (
          <StatusBadge type="caseType" status={caseType} size="sm" />
        )}
        <Text style={[styles.title, { color: textColor }]} numberOfLines={1}>
          {item.title ?? item.tow_origin_address ?? '案件'}
        </Text>
        {/* ステータスバッジ */}
        {caseType === 'accident' && detailAccStatus ? (
          <StatusBadge type="accident" status={detailAccStatus} size="sm" />
        ) : (
          <StatusBadge
            status={detailTowStatus ?? item.tow_status}
            size="sm"
          />
        )}
      </View>

      {/* Row 2: 顧客名 */}
      <View style={styles.row}>
        <Ionicons name="person-outline" size={12} color={isSelected ? COLORS.goldLight : COLORS.gray} />
        <Text style={[styles.customerName, { color: isSelected ? COLORS.white : COLORS.darkGray }]} numberOfLines={1}>
          {item.customer?.name ?? '顧客名不明'}
        </Text>
      </View>

      {/* Row 3: 車両情報 */}
      {item.vehicle && (
        <View style={styles.row}>
          <Ionicons name="car-outline" size={12} color={isSelected ? COLORS.goldLight : COLORS.gray} />
          <Text style={[styles.vehicleText, { color: isSelected ? COLORS.lightGray : COLORS.darkGray }]} numberOfLines={1}>
            {[item.vehicle.make, item.vehicle.model].filter(Boolean).join(' ')}
            {item.vehicle.plate ? ` / ${item.vehicle.plate}` : ''}
          </Text>
        </View>
      )}

      {/* Row 4: 更新日時（右寄せ） */}
      <Text style={[styles.updatedAt, { color: isSelected ? COLORS.lightGray : COLORS.gray }]}>
        更新: {formatJST(item.updated_at)}
      </Text>
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
    gap: LAYOUT.spacing.xs,
    overflow: 'hidden',
  },
  selected: {
    backgroundColor: COLORS.navy,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.gold,
  },
  paidContainer: {
    opacity: 0.75,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: LAYOUT.spacing.xs,
    flexWrap: 'nowrap',
  },
  title: {
    flex: 1,
    fontSize: LAYOUT.fontSize.md,
    fontWeight: '700',
  },
  customerName: {
    flex: 1,
    fontSize: LAYOUT.fontSize.sm,
  },
  vehicleText: {
    flex: 1,
    fontSize: LAYOUT.fontSize.sm,
  },
  updatedAt: {
    fontSize: LAYOUT.fontSize.xs,
    textAlign: 'right',
    marginTop: 2,
  },
  watermarkWrapper: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingRight: LAYOUT.spacing.md,
  },
  watermark: {
    fontSize: 36,
    fontWeight: '900',
    color: COLORS.gray,
    opacity: 0.18,
    letterSpacing: 4,
  },
});
