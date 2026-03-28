import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatInTimeZone } from 'date-fns-tz';
import { ja } from 'date-fns/locale';
import type { CaseEvent } from '@/types/database';
import { fetchCaseEvents, insertCaseEvent } from '@/lib/supabase';
import GoldButton from '@/components/common/GoldButton';
import { COLORS } from '@/constants/colors';
import { LAYOUT } from '@/constants/layout';

interface Props {
  caseId: string;
}

export default function EventTimeline({ caseId }: Props) {
  const [events, setEvents] = useState<CaseEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await fetchCaseEvents(caseId);
      setEvents(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [caseId]);

  useEffect(() => {
    load();
  }, [load]);

  const handleSubmit = async () => {
    if (!message.trim()) return;
    setSubmitting(true);
    try {
      const newEvent = await insertCaseEvent({
        case_id: caseId,
        event_type: 'memo',
        message: message.trim(),
        created_by: 'スタッフ',
      });
      setEvents((prev) => [...prev, newEvent]);
      setMessage('');
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const renderItem = ({ item }: { item: CaseEvent }) => (
    <View style={styles.event}>
      <View style={styles.dot} />
      <View style={styles.eventContent}>
        <Text style={styles.eventMessage}>{item.message}</Text>
        <Text style={styles.eventMeta}>
          {item.created_by} ·{' '}
          {formatInTimeZone(item.created_at, 'Asia/Tokyo', 'M/d HH:mm', { locale: ja })}
        </Text>
      </View>
    </View>
  );

  if (loading) {
    return <ActivityIndicator color={COLORS.navy} style={{ padding: 16 }} />;
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={events}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="chatbubble-outline" size={32} color={COLORS.lightGray} />
            <Text style={styles.emptyText}>メモなし</Text>
          </View>
        }
        scrollEnabled={false}
      />

      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder="社内メモを入力..."
          placeholderTextColor={COLORS.gray}
          value={message}
          onChangeText={setMessage}
          multiline
        />
        <GoldButton
          label="投稿"
          onPress={handleSubmit}
          loading={submitting}
          disabled={!message.trim()}
          style={styles.postBtn}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {},
  event: {
    flexDirection: 'row',
    gap: LAYOUT.spacing.sm,
    marginBottom: LAYOUT.spacing.sm,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.gold,
    marginTop: 4,
    flexShrink: 0,
  },
  eventContent: {
    flex: 1,
    backgroundColor: COLORS.offWhite,
    padding: LAYOUT.spacing.sm,
    borderRadius: LAYOUT.borderRadius.md,
  },
  eventMessage: {
    fontSize: LAYOUT.fontSize.sm,
    color: COLORS.darkGray,
  },
  eventMeta: {
    fontSize: LAYOUT.fontSize.xs,
    color: COLORS.gray,
    marginTop: 4,
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
  inputRow: {
    flexDirection: 'row',
    gap: LAYOUT.spacing.sm,
    marginTop: LAYOUT.spacing.sm,
    alignItems: 'flex-end',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.borderColor,
    borderRadius: LAYOUT.borderRadius.md,
    padding: LAYOUT.spacing.sm,
    fontSize: LAYOUT.fontSize.sm,
    color: COLORS.darkGray,
    maxHeight: 100,
    backgroundColor: COLORS.white,
  },
  postBtn: {
    paddingVertical: LAYOUT.spacing.sm,
    paddingHorizontal: LAYOUT.spacing.md,
  },
});
