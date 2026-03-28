import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import type { Customer, Vehicle } from '@/types/database';
import {
  insertCase,
  insertInsuranceDetail,
  uploadFile,
  updateCasePhotos,
  updateCaseSignature,
} from '@/lib/supabase';
import { useTripStore } from '@/store/tripStore';
import CustomerPicker from '@/components/form/CustomerPicker';
import VehiclePicker from '@/components/form/VehiclePicker';
import FormField from '@/components/form/FormField';
import GoldButton from '@/components/common/GoldButton';
import { COLORS } from '@/constants/colors';
import { LAYOUT } from '@/constants/layout';

interface Props {
  visible: boolean;
  prefilled: {
    originAddress: string;
    destAddress: string;
    distanceKm: number;
    headingMinutes: number;
    towingMinutes: number;
  };
  onCompleted: () => void;
  onClose: () => void;
}

function generateId() {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

async function uploadPhoto(uri: string, caseId: string): Promise<string> {
  const response = await fetch(uri);
  const blob = await response.blob();
  const ext = uri.split('.').pop()?.toLowerCase() ?? 'jpg';
  return uploadFile('photos', `cases/${caseId}/${Date.now()}.${ext}`, blob, `image/${ext}`);
}

async function uploadSignature(dataUri: string, caseId: string): Promise<string> {
  const base64 = dataUri.replace('data:image/png;base64,', '');
  const localUri = FileSystem.cacheDirectory + 'sig_tmp.png';
  await FileSystem.writeAsStringAsync(localUri, base64, { encoding: FileSystem.EncodingType.Base64 });
  const raw = await FileSystem.readAsStringAsync(localUri, { encoding: FileSystem.EncodingType.Base64 });
  const bytes = atob(raw);
  const arr = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
  const blob = new Blob([arr], { type: 'image/png' });
  return uploadFile('signatures', `signatures/${caseId}/${generateId()}.png`, blob, 'image/png');
}

export default function QuickCaseModal({ visible, prefilled, onCompleted, onClose }: Props) {
  const trip = useTripStore();

  // 顧客・車両
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [customerPickerVisible, setCustomerPickerVisible] = useState(false);
  const [vehiclePickerVisible, setVehiclePickerVisible] = useState(false);

  // 場所
  const [originAddress, setOriginAddress] = useState(prefilled.originAddress);
  const [destAddress, setDestAddress] = useState(prefilled.destAddress);

  // 料金
  const [fareAmount, setFareAmount] = useState('');

  // 保険情報
  const [insuranceOpen, setInsuranceOpen] = useState(false);
  const [insurerName, setInsurerName] = useState('');
  const [policyNumber, setPolicyNumber] = useState('');
  const [claimNumber, setClaimNumber] = useState('');
  const [adjusterName, setAdjusterName] = useState('');
  const [adjusterPhone, setAdjusterPhone] = useState('');
  const [coverageType, setCoverageType] = useState('');

  // 備考
  const [notes, setNotes] = useState('');

  // 送信
  const [submitting, setSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState('');

  React.useEffect(() => {
    setOriginAddress(prefilled.originAddress);
    setDestAddress(prefilled.destAddress);
  }, [prefilled.originAddress, prefilled.destAddress]);

  const resetForm = () => {
    setCustomer(null);
    setVehicle(null);
    setFareAmount('');
    setInsurerName('');
    setPolicyNumber('');
    setClaimNumber('');
    setAdjusterName('');
    setAdjusterPhone('');
    setCoverageType('');
    setNotes('');
    setInsuranceOpen(false);
  };

  const handleSubmit = async () => {
    if (!customer) { Alert.alert('エラー', '顧客を選択してください'); return; }
    setSubmitting(true);
    try {
      // ── 案件登録 ──
      setSubmitStatus('案件を登録中...');
      const newCase = await insertCase({
        customer_id: customer.id,
        vehicle_id: vehicle?.id ?? null,
        tow_status: 'repair',
        tow_origin_address: originAddress.trim() || null,
        tow_destination_address: destAddress.trim() || null,
        distance_km: prefilled.distanceKm || null,
        fare_amount: fareAmount ? Number(fareAmount) : null,
        photos: null,
        signature_url: null,
        notes: notes.trim() || null,
      });

      // ── 保険情報 ──
      if (insurerName.trim()) {
        setSubmitStatus('保険情報を保存中...');
        await insertInsuranceDetail({
          case_id: newCase.id,
          insurer_name: insurerName.trim() || null,
          policy_number: policyNumber.trim() || null,
          claim_number: claimNumber.trim() || null,
          adjuster_name: adjusterName.trim() || null,
          adjuster_phone: adjusterPhone.trim() || null,
          coverage_type: coverageType.trim() || null,
        });
      }

      // ── 写真アップロード ──
      if (trip.localPhotoUris.length > 0) {
        setSubmitStatus(`写真をアップロード中... (0/${trip.localPhotoUris.length})`);
        const urls: string[] = [];
        for (let i = 0; i < trip.localPhotoUris.length; i++) {
          setSubmitStatus(`写真をアップロード中... (${i + 1}/${trip.localPhotoUris.length})`);
          urls.push(await uploadPhoto(trip.localPhotoUris[i], newCase.id));
        }
        await updateCasePhotos(newCase.id, urls);
      }

      // ── サインアップロード ──
      if (trip.localSignature) {
        setSubmitStatus('サインを保存中...');
        const sigUrl = await uploadSignature(trip.localSignature, newCase.id);
        await updateCaseSignature(newCase.id, sigUrl);
      }

      resetForm();
      trip.reset();
      onCompleted();
    } catch (err: unknown) {
      Alert.alert('エラー', err instanceof Error ? err.message : '登録に失敗しました');
    } finally {
      setSubmitting(false);
      setSubmitStatus('');
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>

          {/* ヘッダー */}
          <View style={styles.header}>
            <Text style={styles.title}>業務完了 · 案件登録</Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
              <Ionicons name="close" size={24} color={COLORS.white} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">

            {/* GPS サマリ */}
            <View style={styles.summaryRow}>
              <SummaryChip icon="navigate"  label="移動"   value={`${prefilled.headingMinutes}分`} />
              <SummaryChip icon="car"       label="搬送距離" value={`${prefilled.distanceKm} km`} />
              <SummaryChip icon="time"      label="搬送"   value={`${prefilled.towingMinutes}分`} />
              {trip.localPhotoUris.length > 0 && <SummaryChip icon="camera" label="写真" value={`${trip.localPhotoUris.length}枚`} />}
              {trip.localSignature ? <SummaryChip icon="pencil" label="サイン" value="取得済" /> : null}
            </View>

            {/* ── 顧客・車両 ── */}
            <SectionHeader label="顧客・車両" icon="person" />

            <FieldLabel label="顧客" required />
            <TouchableOpacity style={styles.picker} onPress={() => setCustomerPickerVisible(true)}>
              {customer ? (
                <View>
                  <Text style={styles.pickerValue}>{customer.name}</Text>
                  {customer.phone && <Text style={styles.pickerSub}>{customer.phone}</Text>}
                </View>
              ) : <Text style={styles.pickerPlaceholder}>顧客を選択</Text>}
              <Ionicons name="chevron-forward" size={18} color={COLORS.gray} />
            </TouchableOpacity>

            {customer && (
              <>
                <FieldLabel label="車両（任意）" />
                <TouchableOpacity style={styles.picker} onPress={() => setVehiclePickerVisible(true)}>
                  {vehicle
                    ? <Text style={styles.pickerValue}>{vehicle.plate}　{[vehicle.make, vehicle.model].filter(Boolean).join(' ')}</Text>
                    : <Text style={styles.pickerPlaceholder}>車両を選択（省略可）</Text>}
                  <Ionicons name="chevron-forward" size={18} color={COLORS.gray} />
                </TouchableOpacity>
              </>
            )}

            {/* ── 場所 ── */}
            <SectionHeader label="場所" icon="location" />
            <FormField
              label="現場住所"
              value={originAddress}
              onChangeText={setOriginAddress}
              placeholder="現場の住所"
            />
            <FormField
              label="入庫先住所"
              value={destAddress}
              onChangeText={setDestAddress}
              placeholder="入庫先の住所"
            />

            {/* ── 料金 ── */}
            <SectionHeader label="料金" icon="cash" />
            <FormField
              label="請求金額（円）"
              value={fareAmount}
              onChangeText={setFareAmount}
              placeholder="例: 25000"
              keyboardType="numeric"
            />

            {/* ── 保険情報（折りたたみ） ── */}
            <TouchableOpacity style={styles.accordionHeader} onPress={() => setInsuranceOpen((o) => !o)}>
              <View style={styles.accordionLeft}>
                <Ionicons name="shield-checkmark-outline" size={16} color={COLORS.gold} />
                <Text style={styles.accordionLabel}>保険情報（任意）</Text>
              </View>
              <Ionicons name={insuranceOpen ? 'chevron-up' : 'chevron-down'} size={18} color={COLORS.gray} />
            </TouchableOpacity>

            {insuranceOpen && (
              <View style={styles.accordionBody}>
                <FormField label="保険会社名"   value={insurerName}    onChangeText={setInsurerName}    placeholder="例: 東京海上日動" />
                <FormField label="証券番号"     value={policyNumber}   onChangeText={setPolicyNumber}   placeholder="証券番号" />
                <FormField label="クレーム番号" value={claimNumber}    onChangeText={setClaimNumber}    placeholder="クレーム番号" />
                <FormField label="担当者名"     value={adjusterName}   onChangeText={setAdjusterName}   placeholder="担当者名" />
                <FormField label="担当者電話"   value={adjusterPhone}  onChangeText={setAdjusterPhone}  placeholder="担当者電話番号" keyboardType="phone-pad" />
                <FormField label="補償タイプ"   value={coverageType}   onChangeText={setCoverageType}   placeholder="例: 車両保険" />
              </View>
            )}

            {/* ── 備考 ── */}
            <SectionHeader label="備考" icon="document-text-outline" />
            <FormField
              label="備考・特記事項"
              value={notes}
              onChangeText={setNotes}
              placeholder="特記事項があれば入力"
              multiline
              numberOfLines={3}
            />

          </ScrollView>

          {/* フッター */}
          <View style={styles.footer}>
            {submitting ? (
              <View style={styles.submittingRow}>
                <ActivityIndicator color={COLORS.gold} />
                <Text style={styles.submittingText}>{submitStatus}</Text>
              </View>
            ) : (
              <GoldButton label="案件を登録して完了" onPress={handleSubmit} />
            )}
          </View>
        </View>
      </View>

      <CustomerPicker
        visible={customerPickerVisible}
        onSelect={(c) => { setCustomer(c); setVehicle(null); setCustomerPickerVisible(false); }}
        onClose={() => setCustomerPickerVisible(false)}
      />
      {customer && (
        <VehiclePicker
          visible={vehiclePickerVisible}
          customerId={customer.id}
          onSelect={(v) => { setVehicle(v); setVehiclePickerVisible(false); }}
          onClose={() => setVehiclePickerVisible(false)}
        />
      )}
    </Modal>
  );
}

// ── 小コンポーネント ──────────────────────────────────────

function SummaryChip({ icon, label, value }: { icon: React.ComponentProps<typeof Ionicons>['name']; label: string; value: string }) {
  return (
    <View style={styles.chip}>
      <Ionicons name={icon} size={13} color={COLORS.gold} />
      <Text style={styles.chipLabel}>{label}</Text>
      <Text style={styles.chipValue}>{value}</Text>
    </View>
  );
}

function SectionHeader({ label, icon }: { label: string; icon: React.ComponentProps<typeof Ionicons>['name'] }) {
  return (
    <View style={styles.sectionHeader}>
      <Ionicons name={icon} size={14} color={COLORS.gold} />
      <Text style={styles.sectionLabel}>{label}</Text>
    </View>
  );
}

function FieldLabel({ label, required }: { label: string; required?: boolean }) {
  return (
    <Text style={styles.fieldLabel}>
      {label}
      {required && <Text style={styles.required}> *</Text>}
    </Text>
  );
}

// ── スタイル ─────────────────────────────────────────────

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: COLORS.navy,
    borderTopLeftRadius: LAYOUT.borderRadius.xl,
    borderTopRightRadius: LAYOUT.borderRadius.xl,
    maxHeight: '94%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: LAYOUT.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.navyLight,
  },
  title: {
    color: COLORS.gold,
    fontSize: LAYOUT.fontSize.xl,
    fontWeight: '700',
  },
  body: {
    padding: LAYOUT.spacing.lg,
    gap: LAYOUT.spacing.sm,
  },

  // サマリ
  summaryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: LAYOUT.spacing.xs,
    backgroundColor: COLORS.navyLight,
    borderRadius: LAYOUT.borderRadius.md,
    padding: LAYOUT.spacing.md,
    marginBottom: LAYOUT.spacing.sm,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(196,160,80,0.15)',
    paddingHorizontal: LAYOUT.spacing.sm,
    paddingVertical: 4,
    borderRadius: LAYOUT.borderRadius.full,
    borderWidth: 1,
    borderColor: COLORS.gold,
  },
  chipLabel: { color: COLORS.gray, fontSize: 11 },
  chipValue: { color: COLORS.white, fontSize: 11, fontWeight: '700' },

  // セクション
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: LAYOUT.spacing.xs,
    marginTop: LAYOUT.spacing.md,
    marginBottom: LAYOUT.spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.navyLight,
    paddingBottom: LAYOUT.spacing.xs,
  },
  sectionLabel: {
    color: COLORS.gold,
    fontSize: LAYOUT.fontSize.sm,
    fontWeight: '700',
    letterSpacing: 0.5,
  },

  // フィールドラベル
  fieldLabel: {
    color: COLORS.white,
    fontSize: LAYOUT.fontSize.sm,
    fontWeight: '600',
    marginBottom: 2,
  },
  required: { color: COLORS.error },

  // ピッカー
  picker: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.navyLight,
    borderRadius: LAYOUT.borderRadius.md,
    padding: LAYOUT.spacing.md,
    marginBottom: LAYOUT.spacing.xs,
  },
  pickerValue: { color: COLORS.white, fontSize: LAYOUT.fontSize.md, fontWeight: '600' },
  pickerSub: { color: COLORS.gray, fontSize: LAYOUT.fontSize.sm },
  pickerPlaceholder: { color: COLORS.gray, fontSize: LAYOUT.fontSize.md },

  // 保険アコーディオン
  accordionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.navyLight,
    borderRadius: LAYOUT.borderRadius.md,
    padding: LAYOUT.spacing.md,
    marginTop: LAYOUT.spacing.md,
  },
  accordionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: LAYOUT.spacing.xs,
  },
  accordionLabel: {
    color: COLORS.white,
    fontSize: LAYOUT.fontSize.sm,
    fontWeight: '600',
  },
  accordionBody: {
    backgroundColor: 'rgba(26,46,90,0.5)',
    borderRadius: LAYOUT.borderRadius.md,
    padding: LAYOUT.spacing.md,
    gap: LAYOUT.spacing.xs,
    borderWidth: 1,
    borderColor: COLORS.navyLight,
  },

  // フッター
  footer: {
    padding: LAYOUT.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: COLORS.navyLight,
  },
  submittingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: LAYOUT.spacing.sm,
    paddingVertical: LAYOUT.spacing.md,
  },
  submittingText: { color: COLORS.gold, fontSize: LAYOUT.fontSize.md },
});
