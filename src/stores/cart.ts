import { create } from "zustand";
import { persist } from "zustand/middleware";
import { CartItem, Product, ProductVariant } from "@/types";

interface CartStore {
  items: CartItem[];
  isOpen: boolean;

  // Actions
  addItem: (product: Product, variant: ProductVariant, quantity?: number) => void;
  removeItem: (variantId: string) => void;
  updateQuantity: (variantId: string, quantity: number) => void;
  clearCart: () => void;
  toggleCart: () => void;
  openCart: () => void;
  closeCart: () => void;

  /** Apply fresh price/stock from the server. Returns human-readable changes. */
  syncWithServer: (
    lines: { variantId: string; available: boolean; stock: number; price: number; salePrice: number | null }[]
  ) => string[];

  // Computed
  getSubtotal: () => number;
  getItemCount: () => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,

      addItem: (product, variant, quantity = 1) => {
        const items = get().items;
        const existingItem = items.find((item) => item.variantId === variant.id);

        if (existingItem) {
          set({
            items: items.map((item) =>
              item.variantId === variant.id
                ? { ...item, quantity: item.quantity + quantity }
                : item
            ),
          });
        } else {
          set({
            items: [
              ...items,
              {
                productId: product.id,
                variantId: variant.id,
                product,
                variant,
                quantity,
              },
            ],
          });
        }
      },

      removeItem: (variantId) => {
        set({ items: get().items.filter((item) => item.variantId !== variantId) });
      },

      updateQuantity: (variantId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(variantId);
          return;
        }
        set({
          items: get().items.map((item) =>
            item.variantId === variantId ? { ...item, quantity } : item
          ),
        });
      },

      syncWithServer: (lines) => {
        const changes: string[] = [];
        const next: CartItem[] = [];
        for (const item of get().items) {
          const line = lines.find((l) => l.variantId === item.variantId);
          if (!line) { next.push(item); continue; }
          const label = `${item.product.name} (${item.variant.size})`;
          if (!line.available || line.stock <= 0) {
            changes.push(`${label} is sold out and was removed from your bag.`);
            continue;
          }
          const quantity = Math.min(item.quantity, line.stock);
          if (quantity < item.quantity) changes.push(`Only ${line.stock} of ${label} left — quantity updated.`);
          const oldUnit = item.variant.salePrice || item.variant.price;
          const newUnit = line.salePrice || line.price;
          if (oldUnit !== newUnit) changes.push(`The price of ${label} changed.`);
          next.push({
            ...item,
            quantity,
            variant: { ...item.variant, price: line.price, salePrice: line.salePrice ?? undefined, stockQuantity: line.stock },
          });
        }
        set({ items: next });
        return changes;
      },

      clearCart: () => set({ items: [] }),
      toggleCart: () => set({ isOpen: !get().isOpen }),
      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),

      getSubtotal: () => {
        return get().items.reduce((total, item) => {
          const price = item.variant.salePrice || item.variant.price;
          return total + price * item.quantity;
        }, 0);
      },

      getItemCount: () => {
        return get().items.reduce((total, item) => total + item.quantity, 0);
      },
    }),
    {
      name: "asur-cart",
      partialize: (state) => ({ items: state.items }),
    }
  )
);
