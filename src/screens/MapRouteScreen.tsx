import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Alert, ScrollView } from 'react-native';
import { useRoute } from '@react-navigation/native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { getDirections, decodePolyline, type DirectionsResult } from '@/lib/googleMaps';
import { updateCaseFare } from '@/lib/supabase';
import { calculateFare } from '@/constants/fare';
import FareCard from '@/components/map/FareCard';
import GoldButton from '@/components/common/GoldButton';
import { COLORS } from '@/constants/colors';
import { LAYOUT } from '@/constants/layout';

type Route = {
  key: string;
  name: 'MapRoute';
  params: { caseId: string; origin: string; destination: string };
};

export default function MapRouteScreen() {
  const route = useRoute<Route>();
  const { caseId, origin, destination } = route.params;

  const [directions, setDirections] = useState<DirectionsResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const polylineCoords =
    directions ? decodePolyline(directions.polyline) : [];

  // Calculate initial region from polyline or fallback
  const initialRegion = polylineCoords.length > 0
    ? {
        latitude: (polylineCoords[0].latitude + polylineCoords[polylineCoords.length - 1].latitude) / 2,
        longitude: (polylineCoords[0].longitude + polylineCoords[polylineCoords.length - 1].longitude) / 2,
        latitudeDelta: Math.abs(polylineCoords[0].latitude - polylineCoords[polylineCoords.length - 1].latitude) * 1.5 + 0.02,
        longitudeDelta: Math.abs(polylineCoords[0].longitude - polylineCoords[polylineCoords.length - 1].longitude) * 1.5 + 0.02,
      }
    : { latitude: 35.2627, longitude: 139.1503, latitudeDelta: 0.1, longitudeDelta: 0.1 };

  useEffect(() => {
    (async () => {
      try {
        const result = await getDirections(origin, destination);
        setDirections(result);
      } catch (err: unknown) {
        Alert.alert('経路取得エラー', err instanceof Error ? err.message : '経路を取得できませんでした');
      } finally {
        setLoading(false);
      }
    })();
  }, [origin, destination]);

  const handleSaveFare = async () => {
    if (!directions) return;
    setSaving(true);
    try {
      const fare = calculateFare(directions.distanceKm);
      await updateCaseFare(caseId, directions.distanceKm, fare);
      setSaved(true);
    } catch (err: unknown) {
      Alert.alert('エラー', err instanceof Error ? err.message : '保存に失敗しました');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Map */}
      <View style={styles.mapContainer}>
        <MapView
          provider={PROVIDER_GOOGLE}
          style={styles.map}
          region={initialRegion}
          showsUserLocation
          showsTraffic
        >
          {polylineCoords.length > 0 && (
            <>
              <Marker
                coordinate={polylineCoords[0]}
                title="出発地"
                description={origin}
                pinColor={COLORS.statusTow}
              />
              <Marker
                coordinate={polylineCoords[polylineCoords.length - 1]}
                title="目的地"
                description={destination}
                pinColor={COLORS.statusClaim}
              />
              <Polyline
                coordinates={polylineCoords}
                strokeColor={COLORS.gold}
                strokeWidth={4}
              />
            </>
          )}
        </MapView>

        {loading && (
          <View style={styles.mapOverlay}>
            <Text style={styles.loadingText}>経路を取得中...</Text>
          </View>
        )}
      </View>

      {/* Info panel */}
      <ScrollView style={styles.infoPanel}>
        {/* Address cards */}
        <View style={styles.addresses}>
          <View style={styles.addressCard}>
            <View style={[styles.addressDot, { backgroundColor: COLORS.statusTow }]} />
            <View style={styles.addressText}>
              <Text style={styles.addressLabel}>出発地</Text>
              <Text style={styles.addressValue}>{origin}</Text>
            </View>
          </View>
          <View style={styles.addressDivider}>
            <Ionicons name="arrow-down" size={16} color={COLORS.gray} />
          </View>
          <View style={styles.addressCard}>
            <View style={[styles.addressDot, { backgroundColor: COLORS.statusClaim }]} />
            <View style={styles.addressText}>
              <Text style={styles.addressLabel}>目的地</Text>
              <Text style={styles.addressValue}>{destination}</Text>
            </View>
          </View>
        </View>

        {/* Fare card */}
        {directions && (
          <>
            <FareCard
              distanceKm={directions.distanceKm}
              durationSeconds={directions.durationSeconds}
            />

            {!saved ? (
              <View style={styles.saveRow}>
                <GoldButton
                  label="料金を案件に保存"
                  onPress={handleSaveFare}
                  loading={saving}
                  style={styles.saveBtn}
                />
              </View>
            ) : (
              <View style={styles.savedBadge}>
                <Ionicons name="checkmark-circle" size={20} color={COLORS.success} />
                <Text style={styles.savedText}>案件に保存しました</Text>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  mapContainer: {
    flex: 1,
    minHeight: 300,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  mapOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(14,30,65,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: COLORS.white,
    fontSize: LAYOUT.fontSize.md,
  },
  infoPanel: {
    maxHeight: 340,
    backgroundColor: COLORS.white,
  },
  addresses: {
    padding: LAYOUT.spacing.md,
    gap: LAYOUT.spacing.xs,
  },
  addressCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: LAYOUT.spacing.sm,
  },
  addressDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginTop: 4,
    flexShrink: 0,
  },
  addressText: { flex: 1 },
  addressLabel: {
    fontSize: LAYOUT.fontSize.xs,
    color: COLORS.gray,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  addressValue: {
    fontSize: LAYOUT.fontSize.sm,
    color: COLORS.darkGray,
    fontWeight: '500',
  },
  addressDivider: {
    paddingLeft: 3,
  },
  saveRow: {
    paddingHorizontal: LAYOUT.spacing.md,
    paddingBottom: LAYOUT.spacing.md,
  },
  saveBtn: {},
  savedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: LAYOUT.spacing.sm,
    marginHorizontal: LAYOUT.spacing.md,
    marginBottom: LAYOUT.spacing.md,
    padding: LAYOUT.spacing.sm,
    backgroundColor: '#F0FFF0',
    borderRadius: LAYOUT.borderRadius.md,
    borderWidth: 1,
    borderColor: COLORS.success,
  },
  savedText: {
    color: COLORS.success,
    fontWeight: '700',
  },
});
