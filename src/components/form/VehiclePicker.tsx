import React, { useState, useEffect, useCallback } from 'react';
import {
  Modal,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { Vehicle } from '@/types/database';
import { fetchVehiclesByCustomer } from '@/lib/supabase';
import { COLORS } from '@/constants/colors';
import { LAYOUT } from '@/constants/layout';

interface Props {
  visible: boolean;
  customerId: string;
  onSelect: (vehicle: Vehicle) => void;
  onClose: () => void;
}

export default function VehiclePicker({ visible, customerId, onSelect, onClose }: Props) {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!customerId) return;
    setLoading(true);
    try {
      const data = await fetchVehiclesByCustomer(customerId);
      setVehicles(data);
    } finally {
      setLoading(false);
    }
  }, [customerId]);

  useEffect(() => {
    if (visible) load();
  }, [visible, load]);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>車両選択</Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color={COLORS.white} />
          </TouchableOpacity>
        </View>
        {loading ? (
          <ActivityIndicator style={{ flex: 1 }} color={COLORS.navy} />
        ) : (
          <FlatList
            data={vehicles}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.item} onPress={() => onSelect(item)}>
                <Ionicons name="car" size={24} color={COLORS.navy} />
                <View style={styles.itemInfo}>
                  <Text style={styles.itemPlate}>{item.plate}</Text>
                  <Text style={styles.itemSub}>
                    {[item.make, item.model, item.year?.toString()].filter(Boolean).join(' ')}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={COLORS.gray} />
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <Text style={styles.empty}>この顧客の車両データがありません</Text>
            }
          />
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: LAYOUT.spacing.md,
    backgroundColor: COLORS.navy,
  },
  title: {
    fontSize: LAYOUT.fontSize.lg,
    fontWeight: '700',
    color: COLORS.white,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: LAYOUT.spacing.md,
    padding: LAYOUT.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderColor,
  },
  itemInfo: {
    flex: 1,
  },
  itemPlate: {
    fontSize: LAYOUT.fontSize.md,
    fontWeight: '700',
    color: COLORS.navy,
  },
  itemSub: {
    fontSize: LAYOUT.fontSize.sm,
    color: COLORS.gray,
  },
  empty: {
    textAlign: 'center',
    padding: LAYOUT.spacing.xl,
    color: COLORS.gray,
  },
});
