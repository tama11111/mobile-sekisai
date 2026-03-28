import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Image,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Animated,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import { useBatteryState, BatteryState } from 'expo-battery';
import * as Location from 'expo-location';
import type { RootTabParamList } from '@/types/navigation';
import { useTripStore, calcTotalKm, elapsedMinutes } from '@/store/tripStore';
import ArrivalModal from '@/components/home/ArrivalModal';
import QuickCaseModal from '@/components/home/QuickCaseModal';
import { COLORS } from '@/constants/colors';
import { LAYOUT } from '@/constants/layout';

type Nav = BottomTabNavigationProp<RootTabParamList>;

const MENU_ITEMS: Array<{
  label: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  tab: keyof RootTabParamList;
}> = [
  { label: '案件一覧', icon: 'list',       tab: 'CasesTab'   },
  { label: '新規案件', icon: 'add-circle', tab: 'NewCaseTab'  },
  { label: '地図',     icon: 'map',        tab: 'MapTab'      },
  { label: 'AI音声',   icon: 'mic',        tab: 'VoiceTab'    },
];

const KEEP_AWAKE_TAG = 'HomeScreen';

async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    const [result] = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
    if (!result) return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
    return [result.street, result.city, result.region].filter(Boolean).join(' ');
  } catch {
    return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  }
}

export default function HomeScreen() {
  const navigation = useNavigation<Nav>();
  const trip = useTripStore();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const watchRef = useRef<Location.LocationSubscription | null>(null);
  const lastPosRef = useRef<{ lat: number; lng: number } | null>(null);

  const [showArrival, setShowArrival] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [elapsedMin, setElapsedMin] = useState(0);
  const [prefilled, setPrefilled] = useState({
    originAddress: '',
    destAddress: '',
    distanceKm: 0,
    headingMinutes: 0,
    towingMinutes: 0,
  });

  // 充電で画面ON/OFF
  const batteryState = useBatteryState();
  const isCharging = batteryState === BatteryState.CHARGING || batteryState === BatteryState.FULL;
  useEffect(() => {
    if (isCharging) activateKeepAwakeAsync(KEEP_AWAKE_TAG);
    else deactivateKeepAwake(KEEP_AWAKE_TAG);
    return () => { deactivateKeepAwake(KEEP_AWAKE_TAG); };
  }, [isCharging]);

  // 搬送中フェード
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: trip.phase === 'towing' ? 1 : 0,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, [trip.phase]);

  // 移動中の経過タイマー
  useEffect(() => {
    if (trip.phase !== 'heading') { setElapsedMin(0); return; }
    const timer = setInterval(() => {
      setElapsedMin(elapsedMinutes(trip.headingStartAt));
    }, 30000);
    setElapsedMin(elapsedMinutes(trip.headingStartAt));
    return () => clearInterval(timer);
  }, [trip.phase, trip.headingStartAt]);

  // GPS管理
  const startGPS = async (mode: 'heading' | 'towing') => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('GPS権限エラー', '設定からGPS権限を許可してください。');
      return;
    }
    watchRef.current?.remove();
    watchRef.current = await Location.watchPositionAsync(
      { accuracy: Location.Accuracy.Balanced, timeInterval: 15000, distanceInterval: 50 },
      ({ coords }) => {
        const point = { lat: coords.latitude, lng: coords.longitude };
        lastPosRef.current = point;
        if (mode === 'heading') trip.addHeadingPoint(point);
        else trip.addTowingPoint(point);
      }
    );
  };

  const stopGPS = () => {
    watchRef.current?.remove();
    watchRef.current = null;
  };

  // ── 現場に向かう ──────────────────────────────────────
  const handleGoToScene = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('GPS権限エラー', '設定からGPS権限を許可してください。');
      return;
    }
    trip.startHeading();
    await startGPS('heading');
  };

  // ── 到着 ───────────────────────────────────────────────
  const handleArrive = async () => {
    stopGPS();
    // 現在地を住所に変換
    let address = '';
    if (lastPosRef.current) {
      address = await reverseGeocode(lastPosRef.current.lat, lastPosRef.current.lng);
    }
    trip.arrive(address);
    setShowArrival(true);
  };

  // ── 搬送開始（ArrivalModal内） ─────────────────────────
  const handleStartTowing = async () => {
    setShowArrival(false);
    trip.startTowing();
    await startGPS('towing');
  };

  // ── 業務終了 ───────────────────────────────────────────
  const handleEndTowing = async () => {
    stopGPS();
    // 現在地を入庫先住所に変換
    let destAddress = '';
    if (lastPosRef.current) {
      destAddress = await reverseGeocode(lastPosRef.current.lat, lastPosRef.current.lng);
    }
    const distanceKm = calcTotalKm(trip.towingRoute);
    const headingMin = elapsedMinutes(trip.headingStartAt, trip.arrivedAt);
    const towingMin = elapsedMinutes(trip.towingStartAt);

    trip.endTowing(destAddress);

    setPrefilled({
      originAddress: trip.originAddress ?? '',
      destAddress,
      distanceKm,
      headingMinutes: headingMin,
      towingMinutes: towingMin,
    });
    setShowRegister(true);
  };

  // ── アクションボタン（写真右上に浮かせる） ───────────
  const renderActionButton = () => {
    switch (trip.phase) {
      case 'idle':
        return (
          <TouchableOpacity style={[styles.actionBtn, styles.btnGo]} onPress={handleGoToScene} activeOpacity={0.85}>
            <Ionicons name="navigate" size={28} color={COLORS.white} />
            <Text style={styles.actionLabel}>現場に向かう</Text>
          </TouchableOpacity>
        );
      case 'heading':
        return (
          <TouchableOpacity style={[styles.actionBtn, styles.btnArrive]} onPress={handleArrive} activeOpacity={0.85}>
            <Ionicons name="location" size={28} color={COLORS.white} />
            <Text style={styles.actionLabel}>到　着</Text>
            <Text style={styles.elapsedText}>{elapsedMin}分経過</Text>
          </TouchableOpacity>
        );
      case 'arrived':
        return (
          <TouchableOpacity style={[styles.actionBtn, styles.btnScene]} onPress={() => setShowArrival(true)} activeOpacity={0.85}>
            <Ionicons name="camera" size={28} color={COLORS.white} />
            <Text style={styles.actionLabel}>現場記録</Text>
          </TouchableOpacity>
        );
      case 'towing':
        return (
          <TouchableOpacity style={[styles.actionBtn, styles.btnEnd]} onPress={handleEndTowing} activeOpacity={0.85}>
            <Ionicons name="flag" size={28} color={COLORS.white} />
            <Text style={styles.actionLabel}>業務終了</Text>
          </TouchableOpacity>
        );
    }
  };

  const statusLabel = {
    idle: '空　送',
    heading: '移動中',
    arrived: '現場待機',
    towing: '搬送中',
  }[trip.phase];

  const statusIcon: React.ComponentProps<typeof Ionicons>['name'] = {
    idle: 'car-outline',
    heading: 'navigate',
    arrived: 'location',
    towing: 'car',
  }[trip.phase];

  return (
    <View style={styles.container}>
      {/* 状態写真 */}
      <View style={styles.imageWrapper}>
        <Image source={require('../../assets/top1.png')} style={styles.image} resizeMode="cover" />
        <Animated.Image
          source={require('../../assets/top2.png')}
          style={[styles.image, styles.imageOverlay, { opacity: fadeAnim }]}
          resizeMode="cover"
        />

        {/* 状態バッジ */}
        <View style={[styles.badge, trip.phase === 'towing' ? styles.badgeTowing : styles.badgeDefault]}>
          <Ionicons name={statusIcon} size={16} color={trip.phase === 'towing' ? COLORS.white : COLORS.gold} />
          <Text style={[styles.badgeText, trip.phase === 'towing' ? styles.badgeTextTowing : styles.badgeTextDefault]}>
            {statusLabel}
          </Text>
        </View>

        {/* 充電インジケーター */}
        <View style={styles.chargingBadge}>
          <Ionicons
            name={isCharging ? 'battery-charging' : 'battery-dead-outline'}
            size={14}
            color={isCharging ? '#66BB6A' : COLORS.gray}
          />
        </View>

        {/* アクションボタン（右上・大きめ） */}
        <View style={styles.actionBtnWrapper}>
          {renderActionButton()}
        </View>
      </View>

      {/* ボタンバー（メニューのみ） */}
      <View style={styles.buttonBar}>
        {MENU_ITEMS.map((item) => (
          <TouchableOpacity
            key={item.tab}
            style={styles.menuButton}
            onPress={() => navigation.navigate(item.tab)}
            activeOpacity={0.75}
          >
            <Ionicons name={item.icon} size={22} color={COLORS.gold} />
            <Text style={styles.menuLabel}>{item.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* 現場記録モーダル */}
      <ArrivalModal
        visible={showArrival}
        onStartTowing={handleStartTowing}
        onClose={() => setShowArrival(false)}
      />

      {/* 業務終了 → 案件登録モーダル */}
      <QuickCaseModal
        visible={showRegister}
        prefilled={prefilled}
        onCompleted={() => setShowRegister(false)}
        onClose={() => setShowRegister(false)}
      />
    </View>
  );
}

const BAR_HEIGHT = 72;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.navy },
  imageWrapper: { flex: 1 },
  image: { width: '100%', height: '100%' },
  imageOverlay: { position: 'absolute', top: 0, left: 0 },

  badge: {
    position: 'absolute',
    top: LAYOUT.spacing.md,
    left: LAYOUT.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: LAYOUT.spacing.xs,
    paddingHorizontal: LAYOUT.spacing.md,
    paddingVertical: LAYOUT.spacing.sm,
    borderRadius: LAYOUT.borderRadius.full,
    borderWidth: 1.5,
  },
  badgeTowing:  { backgroundColor: 'rgba(196,160,80,0.85)', borderColor: COLORS.gold },
  badgeDefault: { backgroundColor: 'rgba(14,30,65,0.75)',   borderColor: COLORS.gold },
  badgeText:    { fontSize: LAYOUT.fontSize.lg, fontWeight: '700', letterSpacing: 2 },
  badgeTextTowing:  { color: COLORS.white },
  badgeTextDefault: { color: COLORS.gold  },

  chargingBadge: {
    position: 'absolute',
    top: LAYOUT.spacing.md,
    right: LAYOUT.spacing.md,
    backgroundColor: 'rgba(14,30,65,0.6)',
    padding: LAYOUT.spacing.xs,
    borderRadius: LAYOUT.borderRadius.full,
  },

  actionBtnWrapper: {
    position: 'absolute',
    top: LAYOUT.spacing.md,
    right: LAYOUT.spacing.md,
  },
  actionBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: LAYOUT.spacing.xs,
    paddingHorizontal: LAYOUT.spacing.xl,
    paddingVertical: LAYOUT.spacing.md,
    borderRadius: LAYOUT.borderRadius.xl,
    minWidth: 140,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 8,
  },
  btnGo:     { backgroundColor: '#1565C0' },
  btnArrive: { backgroundColor: '#F57F17' },
  btnScene:  { backgroundColor: '#6A1B9A' },
  btnEnd:    { backgroundColor: '#C62828' },
  actionLabel: { color: COLORS.white, fontSize: LAYOUT.fontSize.lg, fontWeight: '700' },
  elapsedText: { color: 'rgba(255,255,255,0.8)', fontSize: LAYOUT.fontSize.sm },

  buttonBar: {
    height: BAR_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.navyDark,
    borderTopWidth: 1,
    borderTopColor: COLORS.navyLight,
  },
  menuButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    height: '100%',
  },
  menuLabel: { color: COLORS.gray, fontSize: LAYOUT.fontSize.xs, fontWeight: '600' },
});
