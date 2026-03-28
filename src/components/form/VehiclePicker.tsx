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
import type { Vehicle } from '@/types/database';
import { fetchVehiclesByCustomer, insertVehicle } from '@/lib/supabase';
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
  const [showForm, setShowForm] = useState(false);

  // 新規フォーム
  const [plate, setPlate] = useState('');
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState('');
  const [vin, setVin] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!customerId) return;
    setLoading(true);
    try { setVehicles(await fetchVehiclesByCustomer(customerId)); }
    finally { setLoading(false); }
  }, [customerId]);

  useEffect(() => {
    if (visible) { load(); setShowForm(false); }
  }, [visible, load]);

  const resetForm = () => {
    setPlate(''); setMake(''); setModel(''); setYear(''); setVin('');
  };

  const handleCreate = async () => {
    if (!plate.trim()) { Alert.alert('エラー', 'ナンバープレートは必須です'); return; }
    setSaving(true);
    try {
      const created = await insertVehicle({
        customer_id: customerId,
        plate: plate.trim(),
        make: make.trim() || null,
        model: model.trim() || null,
        year: year ? Number(year) : null,
        vin: vin.trim() || null,
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
            <Text style={styles.title}>{showForm ? '新規車両登録' : '車両選択'}</Text>
            <TouchableOpacity
              onPress={() => { setShowForm((v) => !v); resetForm(); }}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name={showForm ? 'list' : 'add-circle'} size={22} color={COLORS.gold} />
            </TouchableOpacity>
          </View>

          {showForm ? (
            /* ── 新規車両フォーム ── */
            <ScrollView contentContainerStyle={styles.formBody} keyboardShouldPersistTaps="handled">
              <Field label="ナンバープレート" required value={plate} onChangeText={setPlate} placeholder="例: 横浜 300 あ 1234" />
              <Field label="メーカー" value={make} onChangeText={setMake} placeholder="例: トヨタ" />
              <Field label="車種・モデル" value={model} onChangeText={setModel} placeholder="例: プリウス" />
              <Field label="年式" value={year} onChangeText={setYear} placeholder="例: 2020" keyboardType="numeric" />
              <Field label="車台番号（VIN）" value={vin} onChangeText={setVin} placeholder="例: ZVW5012345" />

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
            /* ── 車両一覧 ── */
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
              ListHeaderComponent={loading ? <ActivityIndicator style={{ margin: LAYOUT.spacing.lg }} color={COLORS.navy} /> : null}
              ListEmptyComponent={
                !loading ? (
                  <View style={styles.emptyWrap}>
                    <Text style={styles.empty}>この顧客の車両データがありません</Text>
                    <TouchableOpacity style={styles.newBtn} onPress={() => setShowForm(true)}>
                      <Ionicons name="add-circle" size={16} color={COLORS.navy} />
                      <Text style={styles.newBtnText}>新規車両を登録する</Text>
                    </TouchableOpacity>
                  </View>
                ) : null
              }
            />
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
  keyboardType?: 'default' | 'phone-pad' | 'email-address' | 'numeric';
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

  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: LAYOUT.spacing.md,
    padding: LAYOUT.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderColor,
  },
  itemInfo: { flex: 1 },
  itemPlate: { fontSize: LAYOUT.fontSize.md, fontWeight: '700', color: COLORS.navy },
  itemSub: { fontSize: LAYOUT.fontSize.sm, color: COLORS.gray },
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
