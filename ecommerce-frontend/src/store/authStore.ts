import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { JwtResponse, UserResponse } from "@/types";

interface AuthState {
  token: string | null;
  user: Omit<JwtResponse, "token" | "refreshToken"> | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  hasHydrated: boolean;

  setAuth: (data: JwtResponse) => void;
  setUser: (user: UserResponse) => void;
  logout: () => void;
  setHasHydrated: (value: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      isAuthenticated: false,
      isAdmin: false,
      hasHydrated: false,

      setAuth: (data: JwtResponse) => {
        set({
          token: data.token,
          user: {
            id: data.id,
            name: data.name,
            email: data.email,
            emailVerified: data.emailVerified,
            roles: data.roles,
            type: data.type,
          },
          isAuthenticated: true,
          isAdmin: data.roles.includes("ROLE_ADMIN"),
        });
      },

      setUser: (user: UserResponse) => {
        set((state) => ({
          token: state.token,
          user: state.user
            ? {
                ...state.user,
                name: user.name,
                email: user.email,
                emailVerified: user.emailVerified,
                roles: user.roles,
              }
            : {
                id: user.id,
                name: user.name,
                email: user.email,
                emailVerified: user.emailVerified,
                roles: user.roles,
                type: "Bearer",
              },
          isAuthenticated: true,
          isAdmin: user.roles.includes("ROLE_ADMIN"),
        }));
      },

      logout: () => {
        set({ token: null, user: null, isAuthenticated: false, isAdmin: false });
      },
      setHasHydrated: (value: boolean) => set({ hasHydrated: value }),
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        isAdmin: state.isAdmin,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
