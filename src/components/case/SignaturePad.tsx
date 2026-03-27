import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import SignatureCanvas from 'react-native-signature-canvas';
import * as FileSystem from 'expo-file-system';
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

export default function SignaturePad({ caseId, existingSignatureUrl, onSaved }: Props) {
  const sigRef = useRef<SignatureCanvas>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(!!existingSignatureUrl);

  const handleSave = () => {
    sigRef.current?.readSignature();
  };

  const handleSignature = async (signature: string) => {
    if (!signature) return;
    setSaving(true);
    try {
      // signature is a base64 data URI: data:image/png;base64,...
      const base64 = signature.replace('data:image/png;base64,', '');
      const fileName = `signatures/${caseId}/${generateId()}.png`;
      const localUri = FileSystem.cacheDirectory + 'signature_temp.png';
      await FileSystem.writeAsStringAsync(localUri, base64, {
        encoding: FileSystem.EncodingType.Base64,
      });
      const fileInfo = await FileSystem.getInfoAsync(localUri);
      if (!fileInfo.exists) throw new Error('署名ファイルの作成に失敗しました');

      const base64Data = await FileSystem.readAsStringAsync(localUri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'image/png' });

      const url = await uploadFile('signatures', fileName, blob, 'image/png');
      await updateCaseSignature(caseId, url);
      setSaved(true);
      onSaved(url);
    } catch (err: unknown) {
      Alert.alert('エラー', err instanceof Error ? err.message : '署名の保存に失敗しました');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      {saved && existingSignatureUrl ? (
        <View style={styles.savedContainer}>
          <Text style={styles.savedText}>署名取得済み</Text>
          <GoldButton
            label="再署名"
            variant="outline"
            onPress={() => setSaved(false)}
            style={styles.reSignBtn}
          />
        </View>
      ) : (
        <>
          <View style={styles.canvasWrap}>
            <SignatureCanvas
              ref={sigRef}
              onOK={handleSignature}
              descriptionText="ここにサインしてください"
              clearText="クリア"
              confirmText="確認"
              webStyle={`.m-signature-pad { background: #fff; border: 1px solid #e0e0e0; border-radius: 8px; }`}
            />
          </View>
          <View style={styles.buttons}>
            <GoldButton
              label="クリア"
              variant="outline"
              onPress={() => sigRef.current?.clearSignature()}
              style={styles.btn}
            />
            {saving ? (
              <ActivityIndicator color={COLORS.navy} />
            ) : (
              <GoldButton label="署名を保存" onPress={handleSave} style={styles.btn} />
            )}
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: LAYOUT.spacing.sm,
  },
  canvasWrap: {
    height: 200,
    borderRadius: LAYOUT.borderRadius.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.borderColor,
  },
  buttons: {
    flexDirection: 'row',
    gap: LAYOUT.spacing.sm,
    marginTop: LAYOUT.spacing.sm,
  },
  btn: {
    flex: 1,
  },
  savedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: LAYOUT.spacing.md,
    padding: LAYOUT.spacing.md,
    backgroundColor: '#F0FFF0',
    borderRadius: LAYOUT.borderRadius.md,
    borderWidth: 1,
    borderColor: COLORS.success,
  },
  savedText: {
    flex: 1,
    color: COLORS.success,
    fontWeight: '700',
  },
  reSignBtn: {
    paddingVertical: LAYOUT.spacing.sm,
    paddingHorizontal: LAYOUT.spacing.md,
  },
});
