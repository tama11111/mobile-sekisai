import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { CompositeScreenProps } from '@react-navigation/native';

export type RootTabParamList = {
  HomeTab: undefined;
  CasesTab: undefined;
  NewCaseTab: undefined;
  MapTab: { caseId?: string } | undefined;
  VoiceTab: undefined;
};

export type CaseStackParamList = {
  CaseList: undefined;
  CaseDetail: { caseId: string };
  MapRoute: { caseId: string; origin: string; destination: string };
};

export type NewCaseStackParamList = {
  NewCase: undefined;
};

// Screen props shortcuts
export type CaseListScreenProps = CompositeScreenProps<
  NativeStackScreenProps<CaseStackParamList, 'CaseList'>,
  BottomTabScreenProps<RootTabParamList>
>;

export type CaseDetailScreenProps = CompositeScreenProps<
  NativeStackScreenProps<CaseStackParamList, 'CaseDetail'>,
  BottomTabScreenProps<RootTabParamList>
>;

export type MapRouteScreenProps = CompositeScreenProps<
  NativeStackScreenProps<CaseStackParamList, 'MapRoute'>,
  BottomTabScreenProps<RootTabParamList>
>;

export type VoiceAssistantScreenProps = BottomTabScreenProps<RootTabParamList, 'VoiceTab'>;
