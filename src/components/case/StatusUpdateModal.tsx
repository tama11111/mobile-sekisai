import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { TowStatus } from '@/types/database';
import { updateTowStatus } from '@/lib/supabase';
import { COLORS } from '@/constants/colors';
import { LAYOUT } from '@/constants/layout';

const STATUS_OPTIONS: Array<{ value: TowStatus; label: string; icon: string; color: string }> = [
  { value: 'tow', label: '出動中', icon: 'car', color: COLORS.statusTow },
  { value: 'arrival', label: '現着', icon: 'location', color: COLORS.statusArrival },
  { value: 'repair', label: '入庫', icon: 'build', color: COLORS.statusRepair },
  { value: 'claim', label: '請求済', icon: 'checkmark-circle', color: COLORS.statusClaim },
];

interface Props {
  visible: boolean;
  caseId: string;
  currentStatus: TowStatus;
  onClose: () => void;
  onUpdated: (newStatus: TowStatus) => void;
}

export default function StatusUpdateModal({
  visible,
  caseId,
  currentStatus,
  onClose,
  onUpdated,
}: Props) {
  const [loading, setLoading] = useState(false);

  const handleSelect = async (status: TowStatus) => {
    if (status === currentStatus) {
      onClose();
      return;
    }
    setLoading(true);
    try {
      await updateTowStatus(caseId, status);
      onUpdated(status);
      onClose();
    } catch (err) {
      console.error('Status update error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={styles.overlay} onPress={onClose} activeOpacity={1}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>ステータス更新</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={COLORS.navy} />
            </TouchableOpacity>
          </View>

          {loading ? (
            <ActivityIndicator size="large" color={COLORS.navy} style={{ padding: 32 }} />
          ) : (
            STATUS_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt.value}
                style={[
                  styles.option,
                  opt.value === currentStatus && styles.optionActive,
                ]}
                onPress={() => handleSelect(opt.value)}
              >
                <View style={[styles.iconWrap, { backgroundColor: opt.color }]}>
                  <Ionicons name={opt.icon as 'car'} size={20} color={COLORS.white} />
                </View>
                <Text
                  style={[
                    styles.optionLabel,
                    opt.value === currentStatus && styles.optionLabelActive,
                  ]}
                >
                  {opt.label}
                </Text>
                {opt.value === currentStatus && (
                  <Ionicons name="checkmark" size={20} color={COLORS.gold} />
                )}
              </TouchableOpacity>
            ))
          )}
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sheet: {
    backgroundColor: COLORS.white,
    borderRadius: LAYOUT.borderRadius.xl,
    width: 320,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: LAYOUT.spacing.md,
    backgroundColor: COLORS.offWhite,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderColor,
  },
  title: {
    fontSize: LAYOUT.fontSize.lg,
    fontWeight: '700',
    color: COLORS.navy,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: LAYOUT.spacing.md,
    gap: LAYOUT.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderColor,
  },
  optionActive: {
    backgroundColor: '#FFF8E6',
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionLabel: {
    flex: 1,
    fontSize: LAYOUT.fontSize.md,
    color: COLORS.darkGray,
  },
  optionLabelActive: {
    fontWeight: '700',
    color: COLORS.navy,
  },
});
