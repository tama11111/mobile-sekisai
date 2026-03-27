import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { Ionicons } from '@expo/vector-icons';
import type { Customer, Vehicle, NewCaseFormData } from '@/types/database';
import { insertCase, insertInsuranceDetail } from '@/lib/supabase';
import CustomerPicker from '@/components/form/CustomerPicker';
import VehiclePicker from '@/components/form/VehiclePicker';
import FormField from '@/components/form/FormField';
import SectionCard from '@/components/common/SectionCard';
import GoldButton from '@/components/common/GoldButton';
import { COLORS } from '@/constants/colors';
import { LAYOUT } from '@/constants/layout';

const STEPS = ['顧客・車両', '場所・内容', '保険情報', '確認'];

export default function NewCaseScreen() {
  const [step, setStep] = useState(0);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [customerPickerVisible, setCustomerPickerVisible] = useState(false);
  const [vehiclePickerVisible, setVehiclePickerVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
    getValues,
    trigger,
  } = useForm<NewCaseFormData>({
    defaultValues: {
      customer_id: '',
      vehicle_id: null,
      tow_origin_address: '',
      tow_destination_address: '',
      notes: '',
      insurer_name: '',
      policy_number: '',
      claim_number: '',
      adjuster_name: '',
      adjuster_phone: '',
      coverage_type: '',
    },
  });

  const handleNext = async () => {
    let valid = true;
    if (step === 0) valid = !!selectedCustomer;
    if (step === 1) valid = await trigger(['tow_origin_address', 'tow_destination_address']);
    if (valid) setStep((s) => s + 1);
    else if (step === 0) Alert.alert('エラー', '顧客を選択してください');
  };

  const onSubmit = async (data: NewCaseFormData) => {
    if (!selectedCustomer) return;
    setSubmitting(true);
    try {
      const newCase = await insertCase({
        customer_id: selectedCustomer.id,
        vehicle_id: selectedVehicle?.id ?? null,
        tow_status: 'tow',
        tow_origin_address: data.tow_origin_address,
        tow_destination_address: data.tow_destination_address,
        distance_km: null,
        fare_amount: null,
        photos: null,
        signature_url: null,
        notes: data.notes || null,
      });

      if (data.insurer_name) {
        await insertInsuranceDetail({
          case_id: newCase.id,
          insurer_name: data.insurer_name || null,
          policy_number: data.policy_number || null,
          claim_number: data.claim_number || null,
          adjuster_name: data.adjuster_name || null,
          adjuster_phone: data.adjuster_phone || null,
          coverage_type: data.coverage_type || null,
        });
      }

      Alert.alert('登録完了', '新規案件を登録しました', [
        { text: 'OK', onPress: () => setStep(0) },
      ]);
      setSelectedCustomer(null);
      setSelectedVehicle(null);
    } catch (err: unknown) {
      Alert.alert('エラー', err instanceof Error ? err.message : '登録に失敗しました');
    } finally {
      setSubmitting(false);
    }
  };

  const values = getValues();

  return (
    <View style={styles.container}>
      {/* Step indicator */}
      <View style={styles.stepIndicator}>
        {STEPS.map((label, i) => (
          <View key={i} style={styles.stepItem}>
            <View style={[styles.stepCircle, i <= step && styles.stepCircleActive]}>
              {i < step ? (
                <Ionicons name="checkmark" size={14} color={COLORS.white} />
              ) : (
                <Text style={styles.stepNumber}>{i + 1}</Text>
              )}
            </View>
            <Text style={[styles.stepLabel, i === step && styles.stepLabelActive]}>{label}</Text>
          </View>
        ))}
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollPad}>
        {/* Step 0: Customer & Vehicle */}
        {step === 0 && (
          <>
            <SectionCard title="顧客選択">
              <TouchableOpacity
                style={styles.pickerBtn}
                onPress={() => setCustomerPickerVisible(true)}
              >
                {selectedCustomer ? (
                  <View>
                    <Text style={styles.pickerSelected}>{selectedCustomer.name}</Text>
                    {selectedCustomer.phone && (
                      <Text style={styles.pickerSub}>{selectedCustomer.phone}</Text>
                    )}
                  </View>
                ) : (
                  <Text style={styles.pickerPlaceholder}>顧客を選択してください</Text>
                )}
                <Ionicons name="chevron-forward" size={20} color={COLORS.gray} />
              </TouchableOpacity>
            </SectionCard>

            {selectedCustomer && (
              <SectionCard title="車両選択（任意）">
                <TouchableOpacity
                  style={styles.pickerBtn}
                  onPress={() => setVehiclePickerVisible(true)}
                >
                  {selectedVehicle ? (
                    <View>
                      <Text style={styles.pickerSelected}>{selectedVehicle.plate}</Text>
                      <Text style={styles.pickerSub}>
                        {[selectedVehicle.make, selectedVehicle.model].filter(Boolean).join(' ')}
                      </Text>
                    </View>
                  ) : (
                    <Text style={styles.pickerPlaceholder}>車両を選択（省略可）</Text>
                  )}
                  <Ionicons name="chevron-forward" size={20} color={COLORS.gray} />
                </TouchableOpacity>
              </SectionCard>
            )}
          </>
        )}

        {/* Step 1: Location */}
        {step === 1 && (
          <SectionCard title="場所・内容">
            <Controller
              control={control}
              name="tow_origin_address"
              rules={{ required: '出発地は必須です' }}
              render={({ field }) => (
                <FormField
                  label="出発地（現場住所）"
                  required
                  placeholder="例: 神奈川県小田原市栄町1-1-1"
                  value={field.value}
                  onChangeText={field.onChange}
                  error={errors.tow_origin_address?.message}
                />
              )}
            />
            <Controller
              control={control}
              name="tow_destination_address"
              rules={{ required: '目的地は必須です' }}
              render={({ field }) => (
                <FormField
                  label="目的地（入庫先）"
                  required
                  placeholder="例: 神奈川県小田原市城山3-2-1"
                  value={field.value}
                  onChangeText={field.onChange}
                  error={errors.tow_destination_address?.message}
                />
              )}
            />
            <Controller
              control={control}
              name="notes"
              render={({ field }) => (
                <FormField
                  label="備考"
                  placeholder="特記事項があれば入力"
                  value={field.value}
                  onChangeText={field.onChange}
                  multiline
                  numberOfLines={3}
                />
              )}
            />
          </SectionCard>
        )}

        {/* Step 2: Insurance */}
        {step === 2 && (
          <SectionCard title="保険情報（任意）">
            <Controller control={control} name="insurer_name" render={({ field }) => (
              <FormField label="保険会社名" placeholder="例: 東京海上日動" value={field.value} onChangeText={field.onChange} />
            )} />
            <Controller control={control} name="policy_number" render={({ field }) => (
              <FormField label="証券番号" value={field.value} onChangeText={field.onChange} />
            )} />
            <Controller control={control} name="claim_number" render={({ field }) => (
              <FormField label="クレーム番号" value={field.value} onChangeText={field.onChange} />
            )} />
            <Controller control={control} name="adjuster_name" render={({ field }) => (
              <FormField label="担当者名" value={field.value} onChangeText={field.onChange} />
            )} />
            <Controller control={control} name="adjuster_phone" render={({ field }) => (
              <FormField label="担当者電話" keyboardType="phone-pad" value={field.value} onChangeText={field.onChange} />
            )} />
            <Controller control={control} name="coverage_type" render={({ field }) => (
              <FormField label="補償タイプ" placeholder="例: 車両保険" value={field.value} onChangeText={field.onChange} />
            )} />
          </SectionCard>
        )}

        {/* Step 3: Confirm */}
        {step === 3 && (
          <>
            <SectionCard title="確認">
              <ConfirmRow label="顧客" value={selectedCustomer?.name} />
              <ConfirmRow label="車両" value={selectedVehicle?.plate} />
              <ConfirmRow label="出発地" value={values.tow_origin_address} />
              <ConfirmRow label="目的地" value={values.tow_destination_address} />
              {values.insurer_name && <ConfirmRow label="保険会社" value={values.insurer_name} />}
              {values.notes && <ConfirmRow label="備考" value={values.notes} />}
            </SectionCard>
            <GoldButton
              label="案件を登録する"
              onPress={handleSubmit(onSubmit)}
              loading={submitting}
              style={styles.submitBtn}
            />
          </>
        )}
      </ScrollView>

      {/* Navigation buttons */}
      <View style={styles.footer}>
        {step > 0 && (
          <GoldButton
            label="戻る"
            variant="outline"
            onPress={() => setStep((s) => s - 1)}
            style={styles.footerBtn}
          />
        )}
        {step < 3 && (
          <GoldButton
            label="次へ"
            onPress={handleNext}
            style={[styles.footerBtn, { flex: 2 }]}
          />
        )}
      </View>

      <CustomerPicker
        visible={customerPickerVisible}
        onSelect={(c) => {
          setSelectedCustomer(c);
          setSelectedVehicle(null);
          setCustomerPickerVisible(false);
        }}
        onClose={() => setCustomerPickerVisible(false)}
      />

      {selectedCustomer && (
        <VehiclePicker
          visible={vehiclePickerVisible}
          customerId={selectedCustomer.id}
          onSelect={(v) => {
            setSelectedVehicle(v);
            setVehiclePickerVisible(false);
          }}
          onClose={() => setVehiclePickerVisible(false)}
        />
      )}
    </View>
  );
}

function ConfirmRow({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <View style={confirmStyles.row}>
      <Text style={confirmStyles.label}>{label}</Text>
      <Text style={confirmStyles.value}>{value}</Text>
    </View>
  );
}

const confirmStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.offWhite,
  },
  label: { width: 80, fontSize: LAYOUT.fontSize.sm, color: COLORS.gray },
  value: { flex: 1, fontSize: LAYOUT.fontSize.sm, color: COLORS.darkGray, fontWeight: '500' },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  stepIndicator: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    paddingVertical: LAYOUT.spacing.md,
    paddingHorizontal: LAYOUT.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderColor,
  },
  stepItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  stepCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.lightGray,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepCircleActive: {
    backgroundColor: COLORS.navy,
  },
  stepNumber: {
    color: COLORS.white,
    fontSize: LAYOUT.fontSize.xs,
    fontWeight: '700',
  },
  stepLabel: {
    fontSize: LAYOUT.fontSize.xs,
    color: COLORS.gray,
  },
  stepLabelActive: {
    color: COLORS.navy,
    fontWeight: '700',
  },
  scroll: { flex: 1 },
  scrollPad: { padding: LAYOUT.spacing.md },
  pickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: LAYOUT.spacing.sm,
    borderWidth: 1,
    borderColor: COLORS.borderColor,
    borderRadius: LAYOUT.borderRadius.md,
    backgroundColor: COLORS.offWhite,
  },
  pickerSelected: {
    fontSize: LAYOUT.fontSize.md,
    color: COLORS.navy,
    fontWeight: '600',
  },
  pickerSub: {
    fontSize: LAYOUT.fontSize.sm,
    color: COLORS.gray,
  },
  pickerPlaceholder: {
    fontSize: LAYOUT.fontSize.md,
    color: COLORS.gray,
  },
  footer: {
    flexDirection: 'row',
    gap: LAYOUT.spacing.sm,
    padding: LAYOUT.spacing.md,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderColor,
  },
  footerBtn: {
    flex: 1,
  },
  submitBtn: {
    marginTop: LAYOUT.spacing.md,
  },
});
