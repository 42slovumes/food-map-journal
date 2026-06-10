import { create } from "zustand";

import { authApi, tokenStore } from "@/lib/api";
import type { User } from "@/types";

interface AuthState {
  user: User | null;
  status: "idle" | "loading" | "authed" | "guest";
  init: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (payload: {
    email: string;
    password: string;
    display_name?: string;
  }) => Promise<void>;
  loginWithGoogle: (credential: string) => Promise<void>;
  logout: () => void;
}

export const useAuth = create<AuthState>((set) => ({
  user: null,
  status: "idle",

  async init() {
    if (!tokenStore.access()) {
      set({ status: "guest" });
      return;
    }
    set({ status: "loading" });
    try {
      const user = await authApi.me();
      set({ user, status: "authed" });
    } catch {
      tokenStore.clear();
      set({ user: null, status: "guest" });
    }
  },

  async login(email, password) {
    const user = await authApi.login(email, password);
    set({ user, status: "authed" });
  },

  async register(payload) {
    const user = await authApi.register(payload);
    set({ user, status: "authed" });
  },

  async loginWithGoogle(credential) {
    const user = await authApi.google(credential);
    set({ user, status: "authed" });
  },

  logout() {
    authApi.logout();
    set({ user: null, status: "guest" });
  },
}));
