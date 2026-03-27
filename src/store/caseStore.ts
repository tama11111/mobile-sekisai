import { create } from 'zustand';
import type { InsuranceCase } from '@/types/database';

interface CaseStore {
  cases: InsuranceCase[];
  selectedCaseId: string | null;
  loading: boolean;
  error: string | null;
  setCases: (cases: InsuranceCase[]) => void;
  updateCase: (updated: InsuranceCase) => void;
  setSelectedCaseId: (id: string | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useCaseStore = create<CaseStore>((set) => ({
  cases: [],
  selectedCaseId: null,
  loading: false,
  error: null,
  setCases: (cases) => set({ cases }),
  updateCase: (updated) =>
    set((state) => ({
      cases: state.cases.map((c) => (c.id === updated.id ? updated : c)),
    })),
  setSelectedCaseId: (id) => set({ selectedCaseId: id }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
}));
