import { create } from 'zustand';

export type TripPhase = 'idle' | 'heading' | 'arrived' | 'towing';

export interface Coord {
  lat: number;
  lng: number;
}

interface TripStore {
  phase: TripPhase;
  originAddress: string | null;   // 到着時GPS→住所
  destAddress: string | null;     // 業務終了時GPS→住所
  headingStartAt: string | null;
  arrivedAt: string | null;
  towingStartAt: string | null;
  towingEndAt: string | null;
  headingRoute: Coord[];
  towingRoute: Coord[];
  localPhotoUris: string[];       // 現場写真（アップロード前）
  localSignature: string | null;  // base64 data URI（アップロード前）

  startHeading: () => void;
  arrive: (address: string) => void;
  startTowing: () => void;
  endTowing: (address: string) => void;
  addPhoto: (uri: string) => void;
  removePhoto: (index: number) => void;
  setSignature: (dataUri: string) => void;
  reset: () => void;
  addHeadingPoint: (coord: Coord) => void;
  addTowingPoint: (coord: Coord) => void;
}

export const useTripStore = create<TripStore>((set) => ({
  phase: 'idle',
  originAddress: null,
  destAddress: null,
  headingStartAt: null,
  arrivedAt: null,
  towingStartAt: null,
  towingEndAt: null,
  headingRoute: [],
  towingRoute: [],
  localPhotoUris: [],
  localSignature: null,

  startHeading: () =>
    set({
      phase: 'heading',
      headingStartAt: new Date().toISOString(),
      originAddress: null,
      destAddress: null,
      arrivedAt: null,
      towingStartAt: null,
      towingEndAt: null,
      headingRoute: [],
      towingRoute: [],
      localPhotoUris: [],
      localSignature: null,
    }),

  arrive: (address) =>
    set({ phase: 'arrived', arrivedAt: new Date().toISOString(), originAddress: address }),

  startTowing: () =>
    set({ phase: 'towing', towingStartAt: new Date().toISOString(), towingRoute: [] }),

  endTowing: (address) =>
    set({ phase: 'idle', towingEndAt: new Date().toISOString(), destAddress: address }),

  addPhoto: (uri) =>
    set((s) => ({ localPhotoUris: [...s.localPhotoUris, uri] })),

  removePhoto: (index) =>
    set((s) => ({ localPhotoUris: s.localPhotoUris.filter((_, i) => i !== index) })),

  setSignature: (dataUri) => set({ localSignature: dataUri }),

  reset: () =>
    set({
      phase: 'idle',
      originAddress: null,
      destAddress: null,
      headingStartAt: null,
      arrivedAt: null,
      towingStartAt: null,
      towingEndAt: null,
      headingRoute: [],
      towingRoute: [],
      localPhotoUris: [],
      localSignature: null,
    }),

  addHeadingPoint: (coord) =>
    set((s) => ({ headingRoute: [...s.headingRoute, coord] })),

  addTowingPoint: (coord) =>
    set((s) => ({ towingRoute: [...s.towingRoute, coord] })),
}));

// ── GPS距離計算 ────────────────────────────────────────────
function haversineKm(a: Coord, b: Coord): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLon = ((b.lng - a.lng) * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) *
    Math.cos((b.lat * Math.PI) / 180) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

export function calcTotalKm(route: Coord[]): number {
  let total = 0;
  for (let i = 1; i < route.length; i++) total += haversineKm(route[i - 1], route[i]);
  return Math.round(total * 10) / 10;
}

export function elapsedMinutes(from: string | null, to: string | null = null): number {
  if (!from) return 0;
  return Math.floor((new Date(to ?? new Date()).getTime() - new Date(from).getTime()) / 60000);
}
