import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { CaseStackParamList } from '@/types/navigation';
import CaseListScreen from '@/screens/CaseListScreen';
import CaseDetailScreen from '@/screens/CaseDetailScreen';
import MapRouteScreen from '@/screens/MapRouteScreen';
import { COLORS } from '@/constants/colors';

const Stack = createNativeStackNavigator<CaseStackParamList>();

export default function CaseStackNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: COLORS.navy },
        headerTintColor: COLORS.white,
        headerTitleStyle: { fontWeight: '700', color: COLORS.white },
      }}
    >
      <Stack.Screen name="CaseList" component={CaseListScreen} options={{ title: '案件一覧' }} />
      <Stack.Screen name="CaseDetail" component={CaseDetailScreen} options={{ title: '案件詳細' }} />
      <Stack.Screen name="MapRoute" component={MapRouteScreen} options={{ title: '経路・料金' }} />
    </Stack.Navigator>
  );
}
