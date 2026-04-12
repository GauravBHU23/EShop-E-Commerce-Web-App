import { create } from "zustand";
import type { CartResponse } from "@/types";

interface CartState {
  cart: CartResponse | null;
  isLoading: boolean;
  setCart: (cart: CartResponse | null) => void;
  setLoading: (loading: boolean) => void;
  clearCart: () => void;
  itemCount: () => number;
}

export const useCartStore = create<CartState>((set, get) => ({
  cart: null,
  isLoading: false,

  setCart: (cart) => set({ cart }),
  setLoading: (isLoading) => set({ isLoading }),
  clearCart: () => set({ cart: null }),

  itemCount: () => {
    const { cart } = get();
    return cart?.totalItems ?? 0;
  },
}));
