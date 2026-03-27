import { useState, useCallback } from 'react';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { uploadFile, updateCasePhotos } from '@/lib/supabase';

function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

export function usePhotoUpload(caseId: string, existingPhotos: string[]) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pickAndUpload = useCallback(
    async (source: 'camera' | 'library'): Promise<string[] | null> => {
      setError(null);

      const result =
        source === 'camera'
          ? await ImagePicker.launchCameraAsync({
              mediaTypes: ImagePicker.MediaTypeOptions.Images,
              quality: 0.8,
              allowsEditing: false,
            })
          : await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ImagePicker.MediaTypeOptions.Images,
              quality: 0.8,
              allowsMultipleSelection: true,
            });

      if (result.canceled) return null;

      setUploading(true);
      try {
        const newUrls: string[] = [];
        for (const asset of result.assets) {
          const base64 = await FileSystem.readAsStringAsync(asset.uri, {
            encoding: FileSystem.EncodingType.Base64,
          });
          const ext = asset.uri.split('.').pop() ?? 'jpg';
          const fileName = `${caseId}/${generateId()}.${ext}`;
          const contentType = `image/${ext === 'jpg' ? 'jpeg' : ext}`;

          // Convert base64 to Blob
          const byteCharacters = atob(base64);
          const byteNumbers = new Array(byteCharacters.length);
          for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
          }
          const byteArray = new Uint8Array(byteNumbers);
          const blob = new Blob([byteArray], { type: contentType });

          const url = await uploadFile('case-photos', fileName, blob, contentType);
          newUrls.push(url);
        }

        const updatedPhotos = [...existingPhotos, ...newUrls];
        await updateCasePhotos(caseId, updatedPhotos);
        return updatedPhotos;
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'アップロードエラー');
        return null;
      } finally {
        setUploading(false);
      }
    },
    [caseId, existingPhotos]
  );

  return { pickAndUpload, uploading, error };
}
