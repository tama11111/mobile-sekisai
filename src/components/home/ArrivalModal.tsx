import React, { useRef, useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Image,
  Alert,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import SignatureCanvas from 'react-native-signature-canvas';
import { useTripStore } from '@/store/tripStore';
import GoldButton from '@/components/common/GoldButton';
import { COLORS } from '@/constants/colors';
import { LAYOUT } from '@/constants/layout';

interface Props {
  visible: boolean;
  onStartTowing: () => void;
  onClose: () => void;
}

const NOTICE_ITEMS = [
  '事故等による既存の破損はそのままの状態で搬送するため、破損箇所が大きく見える場合があります。',
  '搬送中・積み込み・積み下ろし作業の際に、車体の損傷が増える場合があります。あらかじめご了承ください。',
  '夜間など無人になる時間帯が生じる場合があります。車内の貴重品はあらかじめお持ちください。',
  '上記内容をご確認いただき、サインをお願いします。お客様不在の場合はスキップできます。',
];

const SIG_HEIGHT = 300;

// SignatureCanvasのズレを防ぐwebStyle（ScrollView外でも正確に描画）
const SIG_WEB_STYLE = `
  * { margin: 0; padding: 0; box-sizing: border-box; touch-action: none; }
  html, body { width: 100%; height: 100%; overflow: hidden; background: #fff; }
  .m-signature-pad {
    width: 100% !important;
    height: 100% !important;
    margin: 0 !important;
    position: absolute; top: 0; left: 0;
  }
  .m-signature-pad--body {
    position: absolute; top: 0; left: 0; right: 0; bottom: 48px;
    border: none !important;
  }
  .m-signature-pad--footer {
    position: absolute; bottom: 0; left: 0; right: 0; height: 48px;
    background: #0E1E41;
    display: flex; align-items: center; justify-content: space-around;
    padding: 0 16px;
  }
  .m-signature-pad--footer .button {
    color: #C4A050; font-weight: 700; font-size: 15px;
    background: none; border: none; cursor: pointer;
  }
`;

export default function ArrivalModal({ visible, onStartTowing, onClose }: Props) {
  const trip = useTripStore();
  const sigRef = useRef<SignatureCanvas>(null);
  const [signatureCaptured, setSignatureCaptured] = useState(false);
  const [signatureSkipped, setSignatureSkipped] = useState(false);

  const handleCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') { Alert.alert('エラー', 'カメラの権限が必要です'); return; }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.8 });
    if (!result.canceled && result.assets[0]) trip.addPhoto(result.assets[0].uri);
  };

  const handleLibrary = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ quality: 0.8, allowsMultipleSelection: true });
    if (!result.canceled) result.assets.forEach((a) => trip.addPhoto(a.uri));
  };

  const handleSignatureOK = (sig: string) => {
    trip.setSignature(sig);
    setSignatureCaptured(true);
  };

  const handleSkipSignature = () => {
    Alert.alert(
      'サインをスキップ',
      'お客様不在のためサインなしで進みますか？',
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: 'スキップする',
          onPress: () => {
            setSignatureSkipped(true);
            setSignatureCaptured(false);
            trip.setSignature('');
          },
        },
      ]
    );
  };

  const handleStartTowing = () => {
    if (trip.localPhotoUris.length === 0) {
      Alert.alert(
        '確認',
        '写真が撮影されていません。このまま搬送を開始しますか？',
        [
          { text: 'キャンセル', style: 'cancel' },
          { text: '開始する', onPress: onStartTowing },
        ]
      );
      return;
    }
    onStartTowing();
  };

  const resetSignature = () => {
    setSignatureCaptured(false);
    setSignatureSkipped(false);
    trip.setSignature('');
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>

          {/* ヘッダー */}
          <View style={styles.header}>
            <Text style={styles.title}>現場記録</Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
              <Ionicons name="close" size={24} color={COLORS.white} />
            </TouchableOpacity>
          </View>

          {/* スクロール部分（写真 + 注意事項） */}
          <ScrollView
            contentContainerStyle={styles.body}
            keyboardShouldPersistTaps="handled"
            nestedScrollEnabled
          >
            {/* 写真 */}
            <Text style={styles.sectionLabel}>現場写真</Text>
            <View style={styles.photoButtons}>
              <TouchableOpacity style={styles.photoBtn} onPress={handleCamera}>
                <Ionicons name="camera" size={22} color={COLORS.navy} />
                <Text style={styles.photoBtnText}>カメラ撮影</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.photoBtn} onPress={handleLibrary}>
                <Ionicons name="images" size={22} color={COLORS.navy} />
                <Text style={styles.photoBtnText}>ライブラリ</Text>
              </TouchableOpacity>
            </View>

            {trip.localPhotoUris.length > 0 && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photoRow}>
                {trip.localPhotoUris.map((uri, i) => (
                  <View key={i} style={styles.thumbWrap}>
                    <Image source={{ uri }} style={styles.thumb} />
                    <TouchableOpacity style={styles.removeBtn} onPress={() => trip.removePhoto(i)}>
                      <Ionicons name="close-circle" size={20} color={COLORS.error} />
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
            )}

            {/* 注意事項（写真撮影後に表示） */}
            <View style={styles.noticeBox}>
              <View style={styles.noticeHeader}>
                <Ionicons name="warning" size={16} color={COLORS.warning} />
                <Text style={styles.noticeTitle}>確認事項</Text>
              </View>
              {NOTICE_ITEMS.map((item, i) => (
                <View key={i} style={styles.noticeItem}>
                  <Text style={styles.noticeDot}>・</Text>
                  <Text style={styles.noticeText}>{item}</Text>
                </View>
              ))}
            </View>

            {/* サインラベル + スキップ */}
            <View style={styles.signatureHeader}>
              <Text style={styles.sectionLabel}>お客様サイン</Text>
              {!signatureCaptured && !signatureSkipped && (
                <TouchableOpacity style={styles.skipBtn} onPress={handleSkipSignature}>
                  <Ionicons name="person-remove-outline" size={14} color={COLORS.gray} />
                  <Text style={styles.skipText}>お客様不在</Text>
                </TouchableOpacity>
              )}
            </View>
          </ScrollView>

          {/* サインエリア（ScrollView外に配置してズレを防ぐ） */}
          <View style={styles.sigSection}>
            {signatureCaptured ? (
              <View style={styles.signedBadge}>
                <Ionicons name="checkmark-circle" size={22} color={COLORS.success} />
                <Text style={styles.signedText}>サイン取得済み</Text>
                <TouchableOpacity onPress={resetSignature}>
                  <Text style={styles.reSignText}>再サイン</Text>
                </TouchableOpacity>
              </View>
            ) : signatureSkipped ? (
              <View style={styles.skippedBadge}>
                <Ionicons name="person-remove-outline" size={22} color={COLORS.gray} />
                <Text style={styles.skippedText}>お客様不在のためスキップ</Text>
                <TouchableOpacity onPress={resetSignature}>
                  <Text style={styles.reSignText}>取り消す</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.sigWrap}>
                <SignatureCanvas
                  ref={sigRef}
                  onOK={handleSignatureOK}
                  descriptionText=""
                  clearText="クリア"
                  confirmText="確認"
                  webStyle={SIG_WEB_STYLE}
                  scrollable={false}
                />
              </View>
            )}
          </View>

          {/* フッター */}
          <View style={styles.footer}>
            <GoldButton label="搬送開始" onPress={handleStartTowing} />
          </View>

        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: COLORS.navy,
    borderTopLeftRadius: LAYOUT.borderRadius.xl,
    borderTopRightRadius: LAYOUT.borderRadius.xl,
    maxHeight: '92%',
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
  },
  sectionLabel: {
    color: COLORS.white,
    fontSize: LAYOUT.fontSize.md,
    fontWeight: '700',
    marginBottom: LAYOUT.spacing.sm,
  },

  // 写真
  photoButtons: {
    flexDirection: 'row',
    gap: LAYOUT.spacing.sm,
    marginBottom: LAYOUT.spacing.md,
  },
  photoBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: LAYOUT.spacing.xs,
    backgroundColor: COLORS.gold,
    paddingVertical: LAYOUT.spacing.md,
    borderRadius: LAYOUT.borderRadius.md,
  },
  photoBtnText: { color: COLORS.navy, fontWeight: '700', fontSize: LAYOUT.fontSize.md },
  photoRow: { marginBottom: LAYOUT.spacing.md },
  thumbWrap: { position: 'relative', marginRight: LAYOUT.spacing.sm },
  thumb: { width: 88, height: 88, borderRadius: LAYOUT.borderRadius.md, backgroundColor: COLORS.navyLight },
  removeBtn: { position: 'absolute', top: -6, right: -6, backgroundColor: COLORS.navy, borderRadius: 10 },

  // 注意事項
  noticeBox: {
    backgroundColor: 'rgba(255,167,38,0.1)',
    borderWidth: 1,
    borderColor: COLORS.warning,
    borderRadius: LAYOUT.borderRadius.md,
    padding: LAYOUT.spacing.md,
    marginBottom: LAYOUT.spacing.lg,
  },
  noticeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: LAYOUT.spacing.xs,
    marginBottom: LAYOUT.spacing.sm,
  },
  noticeTitle: { color: COLORS.warning, fontWeight: '700', fontSize: LAYOUT.fontSize.sm },
  noticeItem: { flexDirection: 'row', marginBottom: 3 },
  noticeDot: { color: COLORS.gray, fontSize: LAYOUT.fontSize.sm },
  noticeText: { flex: 1, color: COLORS.lightGray, fontSize: LAYOUT.fontSize.sm, lineHeight: 18 },

  // サインヘッダー
  signatureHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 0,
  },
  skipBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: LAYOUT.spacing.sm,
    paddingVertical: 4,
    borderRadius: LAYOUT.borderRadius.full,
    borderWidth: 1,
    borderColor: COLORS.gray,
  },
  skipText: { color: COLORS.gray, fontSize: LAYOUT.fontSize.xs },

  // サインエリア（ScrollView外）
  sigSection: {
    marginHorizontal: LAYOUT.spacing.lg,
    marginBottom: LAYOUT.spacing.sm,
  },
  sigWrap: {
    height: SIG_HEIGHT,
    borderRadius: LAYOUT.borderRadius.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.navyLight,
    backgroundColor: '#fff',
  },
  signedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: LAYOUT.spacing.sm,
    backgroundColor: 'rgba(102,187,106,0.12)',
    borderRadius: LAYOUT.borderRadius.md,
    padding: LAYOUT.spacing.md,
    borderWidth: 1,
    borderColor: COLORS.success,
    height: SIG_HEIGHT,
    justifyContent: 'center',
  },
  signedText: { flex: 1, color: COLORS.success, fontWeight: '700', fontSize: LAYOUT.fontSize.md },
  skippedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: LAYOUT.spacing.sm,
    backgroundColor: 'rgba(158,158,158,0.1)',
    borderRadius: LAYOUT.borderRadius.md,
    padding: LAYOUT.spacing.md,
    borderWidth: 1,
    borderColor: COLORS.gray,
    height: SIG_HEIGHT,
    justifyContent: 'center',
  },
  skippedText: { flex: 1, color: COLORS.gray, fontWeight: '600', fontSize: LAYOUT.fontSize.md },
  reSignText: { color: COLORS.gold, fontSize: LAYOUT.fontSize.sm, textDecorationLine: 'underline' },

  // フッター
  footer: {
    padding: LAYOUT.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: COLORS.navyLight,
  },
});
