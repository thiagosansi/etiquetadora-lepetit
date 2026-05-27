import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Operator } from '@/shared/types';

interface AuthState {
  operator: Operator | null;
  isAuthenticated: boolean;
  actions: {
    login: (operator: Operator) => void;
    logout: () => void;
  };
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      operator: null,
      isAuthenticated: false,

      actions: {
        login: (operator) => set({ operator, isAuthenticated: true }),
        logout: () => set({ operator: null, isAuthenticated: false }),
      },
    }),
    {
      name: 'fila-auth',
      partialize: (state) => ({
        operator: state.operator,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);

export const useOperator = () => useAuthStore((s) => s.operator);
export const useIsAuthenticated = () => useAuthStore((s) => s.isAuthenticated);
export const useAuthActions = () => useAuthStore((s) => s.actions);
