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
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { Customer } from '@/types/database';
import { searchCustomers, fetchAllCustomers, insertCustomer } from '@/lib/supabase';
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
  const [showForm, setShowForm] = useState(false);

  // 新規フォーム
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [saving, setSaving] = useState(false);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      setCustomers(await fetchAllCustomers());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (visible) { loadAll(); setShowForm(false); }
  }, [visible, loadAll]);

  useEffect(() => {
    if (!query.trim()) { loadAll(); return; }
    const timer = setTimeout(async () => {
      setLoading(true);
      try { setCustomers(await searchCustomers(query)); }
      finally { setLoading(false); }
    }, 400);
    return () => clearTimeout(timer);
  }, [query, loadAll]);

  const resetForm = () => {
    setName(''); setPhone(''); setEmail(''); setAddress('');
  };

  const handleCreate = async () => {
    if (!name.trim()) { Alert.alert('エラー', '顧客名は必須です'); return; }
    setSaving(true);
    try {
      const created = await insertCustomer({
        name: name.trim(),
        phone: phone.trim() || null,
        email: email.trim() || null,
        address: address.trim() || null,
      });
      resetForm();
      setShowForm(false);
      onSelect(created);
    } catch (err: unknown) {
      Alert.alert('エラー', err instanceof Error ? err.message : '登録に失敗しました');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.container}>

          {/* ヘッダー */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close" size={24} color={COLORS.white} />
            </TouchableOpacity>
            <Text style={styles.title}>{showForm ? '新規顧客登録' : '顧客選択'}</Text>
            <TouchableOpacity
              onPress={() => { setShowForm((v) => !v); resetForm(); }}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name={showForm ? 'list' : 'person-add'} size={22} color={COLORS.gold} />
            </TouchableOpacity>
          </View>

          {showForm ? (
            /* ── 新規顧客フォーム ── */
            <ScrollView contentContainerStyle={styles.formBody} keyboardShouldPersistTaps="handled">
              <Field label="顧客名" required value={name} onChangeText={setName} placeholder="例: 山田 太郎" />
              <Field label="電話番号" value={phone} onChangeText={setPhone} placeholder="例: 090-1234-5678" keyboardType="phone-pad" />
              <Field label="メールアドレス" value={email} onChangeText={setEmail} placeholder="例: yamada@example.com" keyboardType="email-address" />
              <Field label="住所" value={address} onChangeText={setAddress} placeholder="例: 神奈川県小田原市..." />

              <TouchableOpacity
                style={[styles.createBtn, saving && styles.createBtnDisabled]}
                onPress={handleCreate}
                disabled={saving}
              >
                {saving
                  ? <ActivityIndicator color={COLORS.navy} />
                  : <Text style={styles.createBtnText}>登録して選択</Text>
                }
              </TouchableOpacity>
            </ScrollView>
          ) : (
            /* ── 顧客一覧 ── */
            <>
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
                      <View style={{ flex: 1 }}>
                        <Text style={styles.itemName}>{item.name}</Text>
                        {item.phone && <Text style={styles.itemSub}>{item.phone}</Text>}
                      </View>
                      <Ionicons name="chevron-forward" size={18} color={COLORS.gray} />
                    </TouchableOpacity>
                  )}
                  ListEmptyComponent={
                    <View style={styles.emptyWrap}>
                      <Text style={styles.empty}>顧客が見つかりません</Text>
                      <TouchableOpacity style={styles.newBtn} onPress={() => setShowForm(true)}>
                        <Ionicons name="person-add" size={16} color={COLORS.navy} />
                        <Text style={styles.newBtnText}>新規顧客を登録する</Text>
                      </TouchableOpacity>
                    </View>
                  }
                />
              )}
            </>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function Field({
  label, required, value, onChangeText, placeholder, keyboardType,
}: {
  label: string; required?: boolean; value: string;
  onChangeText: (v: string) => void; placeholder?: string;
  keyboardType?: 'default' | 'phone-pad' | 'email-address';
}) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.fieldLabel}>
        {label}{required && <Text style={styles.required}> *</Text>}
      </Text>
      <TextInput
        style={styles.fieldInput}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={COLORS.gray}
        keyboardType={keyboardType ?? 'default'}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: LAYOUT.spacing.md,
    backgroundColor: COLORS.navy,
  },
  title: { fontSize: LAYOUT.fontSize.lg, fontWeight: '700', color: COLORS.white },

  // 検索
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
  searchIcon: { marginRight: LAYOUT.spacing.xs },
  searchInput: { flex: 1, padding: LAYOUT.spacing.sm, fontSize: LAYOUT.fontSize.md, color: COLORS.darkGray },

  // リスト
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: LAYOUT.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderColor,
  },
  itemName: { fontSize: LAYOUT.fontSize.md, fontWeight: '600', color: COLORS.navy },
  itemSub: { fontSize: LAYOUT.fontSize.sm, color: COLORS.gray, marginTop: 2 },
  emptyWrap: { alignItems: 'center', padding: LAYOUT.spacing.xl, gap: LAYOUT.spacing.md },
  empty: { color: COLORS.gray, fontSize: LAYOUT.fontSize.md },
  newBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: LAYOUT.spacing.xs,
    backgroundColor: COLORS.gold,
    paddingHorizontal: LAYOUT.spacing.lg,
    paddingVertical: LAYOUT.spacing.sm,
    borderRadius: LAYOUT.borderRadius.full,
  },
  newBtnText: { color: COLORS.navy, fontWeight: '700', fontSize: LAYOUT.fontSize.sm },

  // フォーム
  formBody: { padding: LAYOUT.spacing.lg, gap: LAYOUT.spacing.md },
  fieldWrap: { gap: 4 },
  fieldLabel: { color: COLORS.darkGray, fontSize: LAYOUT.fontSize.sm, fontWeight: '600' },
  required: { color: COLORS.error },
  fieldInput: {
    borderWidth: 1,
    borderColor: COLORS.borderColor,
    borderRadius: LAYOUT.borderRadius.md,
    padding: LAYOUT.spacing.md,
    fontSize: LAYOUT.fontSize.md,
    color: COLORS.darkGray,
    backgroundColor: COLORS.offWhite,
  },
  createBtn: {
    backgroundColor: COLORS.gold,
    borderRadius: LAYOUT.borderRadius.md,
    padding: LAYOUT.spacing.md,
    alignItems: 'center',
    marginTop: LAYOUT.spacing.md,
  },
  createBtnDisabled: { opacity: 0.6 },
  createBtnText: { color: COLORS.navy, fontWeight: '700', fontSize: LAYOUT.fontSize.md },
});
