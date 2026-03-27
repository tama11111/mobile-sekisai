import React, { useState, useEffect, useCallback } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { Customer } from '@/types/database';
import { searchCustomers, fetchAllCustomers } from '@/lib/supabase';
import { COLORS } from '@/constants/colors';
import { LAYOUT } from '@/constants/layout';

interface Props {
  visible: boolean;
  onSelect: (customer: Customer) => void;
  onClose: () => void;
}

export default function CustomerPicker({ visible, onSelect, onClose }: Props) {
  const [query, setQuery] = useState('');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchAllCustomers();
      setCustomers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (visible) loadAll();
  }, [visible, loadAll]);

  useEffect(() => {
    if (!query.trim()) {
      loadAll();
      return;
    }
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await searchCustomers(query);
        setCustomers(data);
      } finally {
        setLoading(false);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [query, loadAll]);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>顧客選択</Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color={COLORS.navy} />
          </TouchableOpacity>
        </View>
        <View style={styles.searchRow}>
          <Ionicons name="search" size={18} color={COLORS.gray} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="名前・電話番号で検索"
            value={query}
            onChangeText={setQuery}
            autoFocus
          />
        </View>
        {loading ? (
          <ActivityIndicator style={{ flex: 1 }} color={COLORS.navy} />
        ) : (
          <FlatList
            data={customers}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.item} onPress={() => onSelect(item)}>
                <View>
                  <Text style={styles.itemName}>{item.name}</Text>
                  {item.phone && <Text style={styles.itemSub}>{item.phone}</Text>}
                </View>
                <Ionicons name="chevron-forward" size={18} color={COLORS.gray} />
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <Text style={styles.empty}>顧客が見つかりません</Text>
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
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: LAYOUT.spacing.md,
    borderWidth: 1,
    borderColor: COLORS.borderColor,
    borderRadius: LAYOUT.borderRadius.md,
    paddingHorizontal: LAYOUT.spacing.sm,
    backgroundColor: COLORS.offWhite,
  },
  searchIcon: {
    marginRight: LAYOUT.spacing.xs,
  },
  searchInput: {
    flex: 1,
    padding: LAYOUT.spacing.sm,
    fontSize: LAYOUT.fontSize.md,
    color: COLORS.darkGray,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: LAYOUT.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderColor,
  },
  itemName: {
    fontSize: LAYOUT.fontSize.md,
    fontWeight: '600',
    color: COLORS.navy,
  },
  itemSub: {
    fontSize: LAYOUT.fontSize.sm,
    color: COLORS.gray,
    marginTop: 2,
  },
  empty: {
    textAlign: 'center',
    padding: LAYOUT.spacing.xl,
    color: COLORS.gray,
  },
});
