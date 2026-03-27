import React, { useState } from 'react';
import {
  View,
  Image,
  ScrollView,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Text,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/constants/colors';
import { LAYOUT } from '@/constants/layout';

interface Props {
  photos: string[];
}

export default function PhotoGallery({ photos }: Props) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  if (photos.length === 0) {
    return (
      <View style={styles.empty}>
        <Ionicons name="images-outline" size={32} color={COLORS.lightGray} />
        <Text style={styles.emptyText}>写真なし</Text>
      </View>
    );
  }

  return (
    <>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scroll}>
        {photos.map((uri, index) => (
          <TouchableOpacity key={index} onPress={() => setSelectedIndex(index)} activeOpacity={0.8}>
            <Image source={{ uri }} style={styles.thumbnail} />
          </TouchableOpacity>
        ))}
      </ScrollView>

      <Modal
        visible={selectedIndex !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedIndex(null)}
      >
        <View style={styles.lightbox}>
          <TouchableOpacity style={styles.closeBtn} onPress={() => setSelectedIndex(null)}>
            <Ionicons name="close-circle" size={36} color={COLORS.white} />
          </TouchableOpacity>
          {selectedIndex !== null && (
            <Image
              source={{ uri: photos[selectedIndex] }}
              style={styles.fullImage}
              resizeMode="contain"
            />
          )}
          <Text style={styles.counter}>
            {selectedIndex !== null ? `${selectedIndex + 1} / ${photos.length}` : ''}
          </Text>
        </View>
      </Modal>
    </>
  );
}

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
  scroll: {
    flexDirection: 'row',
  },
  thumbnail: {
    width: 80,
    height: 80,
    borderRadius: LAYOUT.borderRadius.md,
    marginRight: LAYOUT.spacing.sm,
    backgroundColor: COLORS.lightGray,
  },
  empty: {
    alignItems: 'center',
    padding: LAYOUT.spacing.lg,
    gap: LAYOUT.spacing.sm,
  },
  emptyText: {
    color: COLORS.gray,
    fontSize: LAYOUT.fontSize.sm,
  },
  lightbox: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeBtn: {
    position: 'absolute',
    top: 48,
    right: 24,
    zIndex: 10,
  },
  fullImage: {
    width: width,
    height: height * 0.8,
  },
  counter: {
    color: COLORS.white,
    marginTop: LAYOUT.spacing.md,
    fontSize: LAYOUT.fontSize.sm,
  },
});
