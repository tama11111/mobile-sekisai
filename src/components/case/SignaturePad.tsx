import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
} from 'react-native';
import SignatureCanvas from 'react-native-signature-canvas';
import * as FileSystem from 'expo-file-system';
import { Ionicons } from '@expo/vector-icons';
import { uploadFile, updateCaseSignature } from '@/lib/supabase';
import GoldButton from '@/components/common/GoldButton';
import { COLORS } from '@/constants/colors';
import { LAYOUT } from '@/constants/layout';

function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

interface Props {
  caseId: string;
  existingSignatureUrl?: string | null;
  onSaved: (url: string) => void;
}

// ScrollView内でのズレを防ぐwebStyle
const SIG_WEB_STYLE = `
  * { margin: 0; padding: 0; box-sizing: border-box; touch-action: none; }
  html, body { width: 100%; height: 100%; overflow: hidden; background: #fff; }
  .m-signature-pad {
    width: 100% !important; height: 100% !important;
    margin: 0 !important; position: absolute; top: 0; left: 0;
  }
  .m-signature-pad--body {
    position: absolute; top: 0; left: 0; right: 0; bottom: 48px;
    border: none !important;
  }
  .m-signature-pad--footer {
    position: absolute; bottom: 0; left: 0; right: 0; height: 48px;
    background: #0E1E41;
    display: flex; align-items: center; justify-content: space-around; padding: 0 16px;
  }
  .m-signature-pad--footer .button { color: #C4A050; font-weight: 700; font-size: 15px; background: none; border: none; }
`;

export default function SignaturePad({ caseId, existingSignatureUrl, onSaved }: Props) {
  const sigRef = useRef<SignatureCanvas>(null);
  const [saving, setSaving] = useState(false);
  const [showCanvas, setShowCanvas] = useState(!existingSignatureUrl);
  const [currentUrl, setCurrentUrl] = useState(existingSignatureUrl ?? null);

  const handleSignature = async (signature: string) => {
    if (!signature) return;
    setSaving(true);
    try {
      const base64 = signature.replace('data:image/png;base64,', '');
      const fileName = `signatures/${caseId}/${generateId()}.png`;
      const localUri = FileSystem.cacheDirectory + 'signature_temp.png';
      await FileSystem.writeAsStringAsync(localUri, base64, {
        encoding: FileSystem.EncodingType.Base64,
      });
      const base64Data = await FileSystem.readAsStringAsync(localUri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      const byteCharacters = atob(base64Data);
      const arr = new Uint8Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) arr[i] = byteCharacters.charCodeAt(i);
      const blob = new Blob([arr], { type: 'image/png' });

      const url = await uploadFile('signatures', fileName, blob, 'image/png');
      await updateCaseSignature(caseId, url);
      setCurrentUrl(url);
      setShowCanvas(false);
      onSaved(url);
    } catch (err: unknown) {
      Alert.alert('エラー', err instanceof Error ? err.message : '署名の保存に失敗しました');
    } finally {
      setSaving(false);
    }
  };

  // 署名画像を表示
  if (!showCanvas && currentUrl) {
    return (
      <View style={styles.container}>
        <View style={styles.imageWrapper}>
          <Image
            source={{ uri: currentUrl }}
            style={styles.signatureImage}
            resizeMode="contain"
          />
        </View>
        <View style={styles.savedFooter}>
          <Ionicons name="checkmark-circle" size={16} color={COLORS.success} />
          <Text style={styles.savedText}>署名取得済み</Text>
          <TouchableOpacity onPress={() => setShowCanvas(true)}>
            <Text style={styles.reSignText}>再署名</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // サインキャンバス
  return (
    <View style={styles.container}>
      <View style={styles.canvasWrap}>
        {saving && (
          <View style={styles.savingOverlay}>
            <ActivityIndicator color={COLORS.navy} size="large" />
            <Text style={styles.savingText}>保存中...</Text>
          </View>
        )}
        <SignatureCanvas
          ref={sigRef}
          onOK={handleSignature}
          descriptionText=""
          clearText="クリア"
          confirmText="保存"
          webStyle={SIG_WEB_STYLE}
          scrollable={false}
        />
      </View>
      {currentUrl && (
        <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowCanvas(false)}>
          <Text style={styles.cancelText}>キャンセル（既存の署名に戻る）</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: LAYOUT.spacing.sm,
  },

  // 署名画像表示
  imageWrapper: {
    backgroundColor: COLORS.white,
    borderRadius: LAYOUT.borderRadius.md,
    borderWidth: 1,
    borderColor: COLORS.borderColor,
    overflow: 'hidden',
    minHeight: 160,
    justifyContent: 'center',
    alignItems: 'center',
    padding: LAYOUT.spacing.sm,
  },
  signatureImage: {
    width: '100%',
    height: 160,
  },
  savedFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: LAYOUT.spacing.xs,
    marginTop: LAYOUT.spacing.sm,
    paddingHorizontal: LAYOUT.spacing.xs,
  },
  savedText: {
    flex: 1,
    color: COLORS.success,
    fontSize: LAYOUT.fontSize.sm,
    fontWeight: '600',
  },
  reSignText: {
    color: COLORS.gold,
    fontSize: LAYOUT.fontSize.sm,
    textDecorationLine: 'underline',
  },

  // キャンバス
  canvasWrap: {
    height: 280,
    borderRadius: LAYOUT.borderRadius.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.borderColor,
    backgroundColor: COLORS.white,
  },
  savingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    gap: LAYOUT.spacing.sm,
  },
  savingText: {
    color: COLORS.navy,
    fontWeight: '600',
  },
  cancelBtn: {
    marginTop: LAYOUT.spacing.sm,
    alignItems: 'center',
  },
  cancelText: {
    color: COLORS.gray,
    fontSize: LAYOUT.fontSize.sm,
    textDecorationLine: 'underline',
  },
});
