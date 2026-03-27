import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import type { InsuranceCase, TowStatus } from '@/types/database';
import type { CaseStackParamList } from '@/types/navigation';
import { fetchCaseById } from '@/lib/supabase';
import { useCaseStore } from '@/store/caseStore';
import { usePhotoUpload } from '@/hooks/usePhotoUpload';
import StatusBadge from '@/components/common/StatusBadge';
import SectionCard from '@/components/common/SectionCard';
import GoldButton from '@/components/common/GoldButton';
import StatusUpdateModal from '@/components/case/StatusUpdateModal';
import PhotoGallery from '@/components/case/PhotoGallery';
import SignaturePad from '@/components/case/SignaturePad';
import EventTimeline from '@/components/case/EventTimeline';
import { COLORS } from '@/constants/colors';
import { LAYOUT } from '@/constants/layout';
import { formatFare } from '@/constants/fare';

type Route = { key: string; name: 'CaseDetail'; params: { caseId: string } };
type Nav = NativeStackNavigationProp<CaseStackParamList>;

type Tab = 'info' | 'photos' | 'events';

export default function CaseDetailScreen() {
  const route = useRoute<Route>();
  const navigation = useNavigation<Nav>();
  const { caseId } = route.params;

  const updateCaseInStore = useCaseStore((s) => s.updateCase);

  const [caseData, setCaseData] = useState<InsuranceCase | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('info');
  const [statusModalVisible, setStatusModalVisible] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await fetchCaseById(caseId);
      setCaseData(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [caseId]);

  useEffect(() => {
    load();
  }, [load]);

  const photos = caseData?.photos ?? [];
  const { pickAndUpload, uploading } = usePhotoUpload(caseId, photos);

  const handlePhotoUpload = async (source: 'camera' | 'library') => {
    const updated = await pickAndUpload(source);
    if (updated && caseData) {
      setCaseData({ ...caseData, photos: updated });
    }
  };

  const handleStatusUpdated = (newStatus: TowStatus) => {
    if (caseData) {
      const updated = { ...caseData, tow_status: newStatus };
      setCaseData(updated);
      updateCaseInStore(updated);
    }
  };

  const handleOpenMap = () => {
    if (!caseData?.tow_origin_address || !caseData.tow_destination_address) {
      Alert.alert('エラー', '出発地・目的地が設定されていません');
      return;
    }
    navigation.navigate('MapRoute', {
      caseId,
      origin: caseData.tow_origin_address,
      destination: caseData.tow_destination_address,
    });
  };

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={COLORS.gold} />
      </View>
    );
  }

  if (!caseData) {
    return (
      <View style={styles.loading}>
        <Text style={{ color: COLORS.white }}>案件が見つかりません</Text>
      </View>
    );
  }

  const detail = caseData.insurance_details?.[0];

  return (
    <View style={styles.container}>
      {/* Header bar */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.customerName}>{caseData.customer?.name ?? '顧客名不明'}</Text>
          <StatusBadge status={caseData.tow_status} />
        </View>
        <GoldButton
          label="ステータス変更"
          onPress={() => setStatusModalVisible(true)}
          style={styles.statusBtn}
        />
      </View>

      {/* Tab bar */}
      <View style={styles.tabBar}>
        {(['info', 'photos', 'events'] as Tab[]).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab === 'info' ? '情報' : tab === 'photos' ? '写真' : 'メモ'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentPad}>
        {activeTab === 'info' && (
          <>
            {/* Customer */}
            <SectionCard title="顧客情報">
              <InfoRow icon="person" label="氏名" value={caseData.customer?.name} />
              <InfoRow icon="call" label="電話" value={caseData.customer?.phone} />
              <InfoRow icon="mail" label="メール" value={caseData.customer?.email} />
              <InfoRow icon="location" label="住所" value={caseData.customer?.address} />
            </SectionCard>

            {/* Vehicle */}
            {caseData.vehicle && (
              <SectionCard title="車両情報">
                <InfoRow icon="car" label="ナンバー" value={caseData.vehicle.plate} />
                <InfoRow icon="information-circle" label="車種" value={
                  [caseData.vehicle.make, caseData.vehicle.model].filter(Boolean).join(' ') || undefined
                } />
                <InfoRow icon="calendar" label="年式" value={caseData.vehicle.year?.toString()} />
                <InfoRow icon="barcode" label="VIN" value={caseData.vehicle.vin} />
              </SectionCard>
            )}

            {/* Insurance */}
            {detail && (
              <SectionCard title="保険情報">
                <InfoRow icon="shield" label="保険会社" value={detail.insurer_name} />
                <InfoRow icon="document-text" label="証券番号" value={detail.policy_number} />
                <InfoRow icon="receipt" label="クレーム番号" value={detail.claim_number} />
                <InfoRow icon="person-circle" label="担当者" value={detail.adjuster_name} />
                <InfoRow icon="call" label="担当者電話" value={detail.adjuster_phone} />
              </SectionCard>
            )}

            {/* Route & Fare */}
            <SectionCard title="経路・料金">
              <InfoRow icon="navigate" label="出発地" value={caseData.tow_origin_address} />
              <InfoRow icon="flag" label="目的地" value={caseData.tow_destination_address} />
              {caseData.distance_km && (
                <InfoRow icon="speedometer" label="距離" value={`${caseData.distance_km.toFixed(1)} km`} />
              )}
              {caseData.fare_amount && (
                <InfoRow icon="cash" label="料金" value={formatFare(caseData.fare_amount)} />
              )}
              <GoldButton
                label="経路を表示"
                onPress={handleOpenMap}
                variant="outline"
                style={{ marginTop: LAYOUT.spacing.sm }}
              />
            </SectionCard>

            {/* Signature */}
            <SectionCard title="お客様署名">
              <SignaturePad
                caseId={caseId}
                existingSignatureUrl={caseData.signature_url}
                onSaved={(url) => setCaseData({ ...caseData, signature_url: url })}
              />
            </SectionCard>
          </>
        )}

        {activeTab === 'photos' && (
          <SectionCard title="案件写真">
            <PhotoGallery photos={photos} />
            <View style={styles.photoButtons}>
              <GoldButton
                label="カメラで撮影"
                onPress={() => handlePhotoUpload('camera')}
                loading={uploading}
                style={styles.photoBtn}
              />
              <GoldButton
                label="ライブラリから選択"
                onPress={() => handlePhotoUpload('library')}
                loading={uploading}
                variant="outline"
                style={styles.photoBtn}
              />
            </View>
          </SectionCard>
        )}

        {activeTab === 'events' && (
          <SectionCard title="社内メモ">
            <EventTimeline caseId={caseId} />
          </SectionCard>
        )}
      </ScrollView>

      <StatusUpdateModal
        visible={statusModalVisible}
        caseId={caseId}
        currentStatus={caseData.tow_status}
        onClose={() => setStatusModalVisible(false)}
        onUpdated={handleStatusUpdated}
      />
    </View>
  );
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value?: string | null;
}) {
  if (!value) return null;
  return (
    <View style={infoStyles.row}>
      <Ionicons name={icon as 'person'} size={16} color={COLORS.gold} style={infoStyles.icon} />
      <Text style={infoStyles.label}>{label}</Text>
      <Text style={infoStyles.value}>{value}</Text>
    </View>
  );
}

const infoStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.offWhite,
    gap: LAYOUT.spacing.sm,
  },
  icon: { marginTop: 2, width: 18 },
  label: {
    width: 90,
    fontSize: LAYOUT.fontSize.sm,
    color: COLORS.gray,
    flexShrink: 0,
  },
  value: {
    flex: 1,
    fontSize: LAYOUT.fontSize.sm,
    color: COLORS.darkGray,
    fontWeight: '500',
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loading: {
    flex: 1,
    backgroundColor: COLORS.navy,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.navy,
    padding: LAYOUT.spacing.md,
    gap: LAYOUT.spacing.md,
  },
  headerLeft: {
    flex: 1,
    gap: LAYOUT.spacing.xs,
  },
  customerName: {
    color: COLORS.white,
    fontSize: LAYOUT.fontSize.lg,
    fontWeight: '700',
  },
  statusBtn: {
    paddingVertical: LAYOUT.spacing.sm,
    paddingHorizontal: LAYOUT.spacing.md,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderColor,
  },
  tab: {
    flex: 1,
    paddingVertical: LAYOUT.spacing.sm,
    alignItems: 'center',
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: COLORS.gold,
  },
  tabText: {
    fontSize: LAYOUT.fontSize.sm,
    color: COLORS.gray,
    fontWeight: '600',
  },
  tabTextActive: {
    color: COLORS.navy,
  },
  content: {
    flex: 1,
  },
  contentPad: {
    padding: LAYOUT.spacing.md,
  },
  photoButtons: {
    gap: LAYOUT.spacing.sm,
    marginTop: LAYOUT.spacing.sm,
  },
  photoBtn: {},
});
