export const COLORS = {
  navy: '#0E1E41',
  navyLight: '#1A2E5A',
  navyDark: '#081630',
  gold: '#C4A050',
  goldLight: '#D4B570',
  goldDark: '#A08030',
  white: '#FFFFFF',
  offWhite: '#F5F5F5',
  lightGray: '#E0E0E0',
  gray: '#9E9E9E',
  darkGray: '#424242',
  black: '#000000',
  // tow_status colors
  statusTow: '#FFA726',          // amber - dispatched
  statusArrival: '#42A5F5',      // blue - on scene
  statusRepair: '#FF7043',       // deep orange - in shop
  statusClaim: '#66BB6A',        // green - insurance filed
  statusPaid: '#9E9E9E',         // gray - completed/paid
  // accident_status colors
  statusReception: '#AB47BC',    // purple - received
  statusAdjuster: '#26A69A',     // teal - adjuster
  statusRepairing: '#EF5350',    // red - repairing
  statusAgreement: '#66BB6A',    // green - agreement reached
  // case_type colors
  typeTow: '#1565C0',            // dark blue - tow
  typeAccident: '#B71C1C',       // dark red - accident
  // UI
  error: '#EF5350',
  success: '#66BB6A',
  warning: '#FFA726',
  info: '#42A5F5',
  // Background
  background: '#F0F2F5',
  cardBackground: '#FFFFFF',
  borderColor: '#E0E0E0',
} as const;

export type ColorKey = keyof typeof COLORS;
