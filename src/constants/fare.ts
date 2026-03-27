export const FARE = {
  baseFare: 10000,
  ratePerKm: 700,
} as const;

export function calculateFare(distanceKm: number): number {
  return FARE.baseFare + Math.ceil(distanceKm) * FARE.ratePerKm;
}

export function formatFare(amount: number): string {
  return `¥${amount.toLocaleString('ja-JP')}`;
}
