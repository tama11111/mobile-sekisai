import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { TowStatus, AccidentStatus, CaseType } from '@/types/database';
import { COLORS } from '@/constants/colors';
import { LAYOUT } from '@/constants/layout';

const TOW_STATUS_CONFIG: Record<TowStatus, { label: string; color: string }> = {
  tow:     { label: '出動中',  color: COLORS.statusTow },
  arrival: { label: '現着',   color: COLORS.statusArrival },
  repair:  { label: '入庫',   color: COLORS.statusRepair },
  claim:   { label: '請求済', color: COLORS.statusClaim },
  paid:    { label: '入金済', color: COLORS.statusPaid },
};

const ACCIDENT_STATUS_CONFIG: Record<AccidentStatus, { label: string; color: string }> = {
  reception:  { label: '受付',         color: COLORS.statusReception },
  arrival:    { label: '入庫',         color: COLORS.statusArrival },
  adjuster:   { label: 'アジャスター', color: COLORS.statusAdjuster },
  repairing:  { label: '修理中',       color: COLORS.statusRepairing },
  agreement:  { label: '協定済',       color: COLORS.statusAgreement },
  paid:       { label: '入金済',       color: COLORS.statusPaid },
};

const CASE_TYPE_CONFIG: Record<CaseType, { label: string; color: string }> = {
  tow:      { label: '故障レッカー', color: COLORS.typeTow },
  accident: { label: '事故修理',    color: COLORS.typeAccident },
};

interface TowProps {
  type: 'tow';
  status: TowStatus;
  size?: 'sm' | 'md';
}

interface AccidentProps {
  type: 'accident';
  status: AccidentStatus;
  size?: 'sm' | 'md';
}

interface CaseTypeProps {
  type: 'caseType';
  status: CaseType;
  size?: 'sm' | 'md';
}

// Legacy prop shape (backward compat)
interface LegacyProps {
  status: TowStatus;
  size?: 'sm' | 'md';
}

type Props = TowProps | AccidentProps | CaseTypeProps | LegacyProps;

export default function StatusBadge(props: Props) {
  let label: string;
  let color: string;

  if ('type' in props && props.type === 'caseType') {
    const cfg = CASE_TYPE_CONFIG[props.status as CaseType];
    label = cfg.label;
    color = cfg.color;
  } else if ('type' in props && props.type === 'accident') {
    const cfg = ACCIDENT_STATUS_CONFIG[props.status as AccidentStatus];
    label = cfg.label;
    color = cfg.color;
  } else {
    const cfg = TOW_STATUS_CONFIG[props.status as TowStatus];
    label = cfg?.label ?? String(props.status);
    color = cfg?.color ?? COLORS.gray;
  }

  const isSmall = (props.size ?? 'md') === 'sm';

  return (
    <View style={[styles.badge, { backgroundColor: color }, isSmall && styles.badgeSm]}>
      <Text style={[styles.text, isSmall && styles.textSm]}>{label}</Text>
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
