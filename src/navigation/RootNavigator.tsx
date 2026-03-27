import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { useIPadLayout } from '@/hooks/useIPadLayout';
import TabNavigator from './TabNavigator';
import IPadSplitNavigator from './IPadSplitNavigator';

export default function RootNavigator() {
  const { isIPad } = useIPadLayout();

  return (
    <NavigationContainer>
      {isIPad ? <IPadSplitNavigator /> : <TabNavigator />}
    </NavigationContainer>
  );
}
