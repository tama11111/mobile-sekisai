import React, { useState } from 'react';
import {
  View,
  FlatList,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import type { InsuranceCase, TowStatus } from '@/types/database';
import type { CaseStackParamList } from '@/types/navigation';
import { useCases } from '@/hooks/useCases';
import { useIPadLayout } from '@/hooks/useIPadLayout';
import { useCaseStore } from '@/store/caseStore';
import CaseListItem from '@/components/case/CaseListItem';
import { COLORS } from '@/constants/colors';
import { LAYOUT } from '@/constants/layout';

type Nav = NativeStackNavigationProp<CaseStackParamList>;

const STATUS_FILTERS: Array<{ value: TowStatus | 'all'; label: string }> = [
  { value: 'all', label: '全て' },
  { value: 'tow', label: '出動中' },
  { value: 'arrival', label: '現着' },
  { value: 'repair', label: '入庫' },
  { value: 'claim', label: '請求済' },
];

export default function CaseListScreen() {
  const navigation = useNavigation<Nav>();
  const { cases, loading, refresh } = useCases();
  const { isIPad } = useIPadLayout();
  const selectedCaseId = useCaseStore((s) => s.selectedCaseId);
  const setSelectedCaseId = useCaseStore((s) => s.setSelectedCaseId);

  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<TowStatus | 'all'>('all');

  const filtered = cases.filter((c) => {
    const matchStatus = statusFilter === 'all' || c.tow_status === statusFilter;
    const matchQuery =
      !query ||
      c.customer?.name?.toLowerCase().includes(query.toLowerCase()) ||
      c.vehicle?.plate?.toLowerCase().includes(query.toLowerCase()) ||
      c.tow_origin_address?.toLowerCase().includes(query.toLowerCase());
    return matchStatus && matchQuery;
  });

  const handlePress = (item: InsuranceCase) => {
    if (isIPad) {
      setSelectedCaseId(item.id);
    } else {
      navigation.navigate('CaseDetail', { caseId: item.id });
    }
  };

  return (
    <View style={styles.container}>
      {/* Search bar */}
      <View style={styles.searchBar}>
        <Ionicons name="search" size={18} color={COLORS.gray} />
        <TextInput
          style={styles.searchInput}
          placeholder="顧客名・ナンバーで検索"
          placeholderTextColor={COLORS.gray}
          value={query}
          onChangeText={setQuery}
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => setQuery('')}>
            <Ionicons name="close-circle" size={18} color={COLORS.gray} />
          </TouchableOpacity>
        )}
      </View>

      {/* Status filter chips */}
      <View style={styles.filterRow}>
        {STATUS_FILTERS.map((f) => (
          <TouchableOpacity
            key={f.value}
            style={[styles.chip, statusFilter === f.value && styles.chipActive]}
            onPress={() => setStatusFilter(f.value)}
          >
            <Text style={[styles.chipText, statusFilter === f.value && styles.chipTextActive]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <CaseListItem
            item={item}
            onPress={() => handlePress(item)}
            isSelected={isIPad && item.id === selectedCaseId}
          />
        )}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={refresh} tintColor={COLORS.navy} />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="document-outline" size={48} color={COLORS.lightGray} />
            <Text style={styles.emptyText}>案件がありません</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: LAYOUT.spacing.sm,
    margin: LAYOUT.spacing.sm,
    paddingHorizontal: LAYOUT.spacing.sm,
    backgroundColor: COLORS.offWhite,
    borderRadius: LAYOUT.borderRadius.md,
    borderWidth: 1,
    borderColor: COLORS.borderColor,
  },
  searchInput: {
    flex: 1,
    padding: LAYOUT.spacing.sm,
    fontSize: LAYOUT.fontSize.sm,
    color: COLORS.darkGray,
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: LAYOUT.spacing.sm,
    paddingBottom: LAYOUT.spacing.sm,
    gap: LAYOUT.spacing.xs,
    flexWrap: 'wrap',
  },
  chip: {
    paddingHorizontal: LAYOUT.spacing.sm,
    paddingVertical: LAYOUT.spacing.xs,
    borderRadius: LAYOUT.borderRadius.full,
    borderWidth: 1,
    borderColor: COLORS.borderColor,
    backgroundColor: COLORS.white,
  },
  chipActive: {
    backgroundColor: COLORS.navy,
    borderColor: COLORS.navy,
  },
  chipText: {
    fontSize: LAYOUT.fontSize.xs,
    color: COLORS.darkGray,
    fontWeight: '600',
  },
  chipTextActive: {
    color: COLORS.white,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: LAYOUT.spacing.xxl,
    gap: LAYOUT.spacing.md,
  },
  emptyText: {
    color: COLORS.gray,
    fontSize: LAYOUT.fontSize.md,
  },
});
