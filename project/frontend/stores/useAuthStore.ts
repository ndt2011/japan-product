"use client";

import type { AuthUser } from "@/types/api";
import { create } from "zustand";

interface AuthState {
  user: AuthUser | null;
  loaded: boolean;
  setUser: (user: AuthUser | null) => void;
  fetchUser: () => Promise<void>;
  clear: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loaded: false,
  setUser: (user) => set({ user, loaded: true }),
  fetchUser: async () => {
    try {
      const res = await fetch("/api/proxy/auth/me");
      const data = await res.json();
      if (data.success && data.data?.user) {
        set({ user: data.data.user, loaded: true });
      } else {
        set({ user: null, loaded: true });
      }
    } catch {
      set({ user: null, loaded: true });
    }
  },
  clear: () => set({ user: null, loaded: true }),
}));
