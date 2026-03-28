import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import type { CaseStackParamList, RootTabParamList } from '@/types/navigation';
import HomeScreen from '@/screens/HomeScreen';
import CaseListScreen from '@/screens/CaseListScreen';
import CaseDetailScreen from '@/screens/CaseDetailScreen';
import MapRouteScreen from '@/screens/MapRouteScreen';
import NewCaseScreen from '@/screens/NewCaseScreen';
import VoiceAssistantScreen from '@/screens/VoiceAssistantScreen';
import { useCaseStore } from '@/store/caseStore';
import { COLORS } from '@/constants/colors';
import { LAYOUT } from '@/constants/layout';

const DetailStack = createNativeStackNavigator<CaseStackParamList>();
const Tab = createBottomTabNavigator<RootTabParamList>();

function CaseSplitView() {
  const selectedCaseId = useCaseStore((s) => s.selectedCaseId);

  return (
    <View style={styles.split}>
      {/* Left: case list — fixed width */}
      <View style={styles.listPane}>
        <CaseListScreen />
      </View>

      {/* Right: detail / map */}
      <View style={styles.detailPane}>
        <DetailStack.Navigator
          screenOptions={{
            headerStyle: { backgroundColor: COLORS.navy },
            headerTintColor: COLORS.white,
            headerTitleStyle: { fontWeight: '700' },
          }}
        >
          {selectedCaseId ? (
            <>
              <DetailStack.Screen
                name="CaseDetail"
                component={CaseDetailScreen}
                options={{ title: '案件詳細' }}
                initialParams={{ caseId: selectedCaseId }}
              />
              <DetailStack.Screen
                name="MapRoute"
                component={MapRouteScreen}
                options={{ title: '経路・料金' }}
              />
            </>
          ) : (
            <DetailStack.Screen
              name="CaseList"
              component={EmptyDetailPane}
              options={{ title: 'たま積載' }}
            />
          )}
        </DetailStack.Navigator>
      </View>
    </View>
  );
}

import { Text } from 'react-native';
function EmptyDetailPane() {
  return (
    <View style={styles.emptyDetail}>
      <Ionicons name="car-sport-outline" size={64} color={COLORS.gold} />
      <Text style={styles.emptyText}>案件を選択してください</Text>
    </View>
  );
}

export default function IPadSplitNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          const icons: Record<string, string> = {
            HomeTab: focused ? 'home' : 'home-outline',
            CasesTab: focused ? 'list' : 'list-outline',
            NewCaseTab: focused ? 'add-circle' : 'add-circle-outline',
            MapTab: focused ? 'map' : 'map-outline',
            VoiceTab: focused ? 'mic' : 'mic-outline',
          };
          return <Ionicons name={icons[route.name] as 'list'} size={size} color={color} />;
        },
        tabBarActiveTintColor: COLORS.gold,
        tabBarInactiveTintColor: COLORS.gray,
        tabBarStyle: {
          backgroundColor: COLORS.navy,
          borderTopColor: COLORS.navyLight,
          height: LAYOUT.tabBarHeight,
        },
        tabBarLabelStyle: { fontSize: LAYOUT.fontSize.xs, fontWeight: '600' },
        headerShown: false,
      })}
    >
      <Tab.Screen name="HomeTab" component={HomeScreen} options={{ title: 'ホーム', headerShown: false }} />
      <Tab.Screen name="CasesTab" component={CaseSplitView} options={{ title: '案件' }} />
      <Tab.Screen
        name="NewCaseTab"
        component={NewCaseScreen}
        options={{
          title: '新規案件',
          headerShown: true,
          headerStyle: { backgroundColor: COLORS.navy },
          headerTintColor: COLORS.white,
          headerTitleStyle: { fontWeight: '700' },
        }}
      />
      <Tab.Screen name="MapTab" component={PlaceholderMapTab} options={{ title: '地図' }} />
      <Tab.Screen
        name="VoiceTab"
        component={VoiceAssistantScreen}
        options={{
          title: 'AIアシスタント',
          headerShown: true,
          headerStyle: { backgroundColor: COLORS.navy },
          headerTintColor: COLORS.white,
          headerTitleStyle: { fontWeight: '700' },
        }}
      />
    </Tab.Navigator>
  );
}

function PlaceholderMapTab() {
  return (
    <View style={styles.emptyDetail}>
      <Ionicons name="map-outline" size={48} color={COLORS.gold} />
      <Text style={styles.emptyText}>案件詳細から経路を開いてください</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  split: {
    flex: 1,
    flexDirection: 'row',
  },
  listPane: {
    width: LAYOUT.listColumnWidth,
    borderRightWidth: 1,
    borderRightColor: COLORS.borderColor,
    backgroundColor: COLORS.white,
  },
  detailPane: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  emptyDetail: {
    flex: 1,
    backgroundColor: COLORS.navy,
    alignItems: 'center',
    justifyContent: 'center',
    gap: LAYOUT.spacing.md,
  },
  emptyText: {
    color: COLORS.white,
    fontSize: LAYOUT.fontSize.md,
  },
});
