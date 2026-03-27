import { useWindowDimensions } from 'react-native';
import { LAYOUT } from '@/constants/layout';

export function useIPadLayout() {
  const { width, height } = useWindowDimensions();
  const isIPad = width >= LAYOUT.iPadBreakpoint;
  const isLandscape = width > height;
  const listWidth = isIPad ? LAYOUT.listColumnWidth : width;
  const detailWidth = isIPad ? width - LAYOUT.listColumnWidth : width;

  return { isIPad, isLandscape, listWidth, detailWidth, screenWidth: width, screenHeight: height };
}
