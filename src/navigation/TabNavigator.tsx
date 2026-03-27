import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import type { RootTabParamList } from '@/types/navigation';
import CaseStackNavigator from './CaseStackNavigator';
import NewCaseScreen from '@/screens/NewCaseScreen';
import VoiceAssistantScreen from '@/screens/VoiceAssistantScreen';
import { COLORS } from '@/constants/colors';
import { LAYOUT } from '@/constants/layout';

const Tab = createBottomTabNavigator<RootTabParamList>();

export default function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          const icons: Record<string, string> = {
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
        tabBarLabelStyle: {
          fontSize: LAYOUT.fontSize.xs,
          fontWeight: '600',
        },
        headerShown: false,
      })}
    >
      <Tab.Screen name="CasesTab" component={CaseStackNavigator} options={{ title: '案件' }} />
      <Tab.Screen name="NewCaseTab" component={NewCaseScreen} options={{ title: '新規案件', headerShown: true, headerStyle: { backgroundColor: COLORS.navy }, headerTintColor: COLORS.white, headerTitleStyle: { fontWeight: '700' } }} />
      <Tab.Screen name="MapTab" component={PlaceholderMapTab} options={{ title: '地図' }} />
      <Tab.Screen name="VoiceTab" component={VoiceAssistantScreen} options={{ title: 'AIアシスタント', headerShown: true, headerStyle: { backgroundColor: COLORS.navy }, headerTintColor: COLORS.white, headerTitleStyle: { fontWeight: '700' } }} />
    </Tab.Navigator>
  );
}

// MapTab via tab just shows a prompt to open from case detail
import { View, Text, StyleSheet } from 'react-native';
function PlaceholderMapTab() {
  return (
    <View style={styles.placeholder}>
      <Ionicons name="map-outline" size={48} color={COLORS.gold} />
      <Text style={styles.text}>案件詳細から経路を開いてください</Text>
    </View>
  );
}
const styles = StyleSheet.create({
  placeholder: {
    flex: 1,
    backgroundColor: COLORS.navy,
    alignItems: 'center',
    justifyContent: 'center',
    gap: LAYOUT.spacing.md,
  },
  text: { color: COLORS.white, fontSize: LAYOUT.fontSize.md },
});
