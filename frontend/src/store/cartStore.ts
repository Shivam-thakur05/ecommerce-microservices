import { create } from "zustand";
import { persist } from "zustand/middleware";
import { CartState, CartItem, Product, ProductVariant } from "../types";

interface CartStore extends CartState {
  addItem: (
    product: Product,
    quantity: number,
    variant?: ProductVariant
  ) => void;
  removeItem: (productId: string, variantId?: string) => void;
  updateQuantity: (
    productId: string,
    quantity: number,
    variantId?: string
  ) => void;
  clearCart: () => void;
  getItemQuantity: (productId: string, variantId?: string) => number;
  isInCart: (productId: string, variantId?: string) => boolean;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      total: 0,
      itemCount: 0,

      addItem: (
        product: Product,
        quantity: number,
        variant?: ProductVariant
      ) => {
        const { items } = get();
        const existingItemIndex = items.findIndex(
          (item) =>
            item.productId === product.id && item.variantId === variant?.id
        );

        if (existingItemIndex > -1) {
          // Update existing item quantity
          const updatedItems = [...items];
          updatedItems[existingItemIndex].quantity += quantity;

          const total = updatedItems.reduce((sum, item) => {
            const price = variant ? variant.price : product.price;
            return sum + price * item.quantity;
          }, 0);

          const itemCount = updatedItems.reduce(
            (sum, item) => sum + item.quantity,
            0
          );

          set({
            items: updatedItems,
            total,
            itemCount,
          });
        } else {
          // Add new item
          const newItem: CartItem = {
            productId: product.id,
            variantId: variant?.id,
            quantity,
            product,
            variant,
          };

          const updatedItems = [...items, newItem];
          const total = updatedItems.reduce((sum, item) => {
            const price = variant ? variant.price : product.price;
            return sum + price * item.quantity;
          }, 0);

          const itemCount = updatedItems.reduce(
            (sum, item) => sum + item.quantity,
            0
          );

          set({
            items: updatedItems,
            total,
            itemCount,
          });
        }
      },

      removeItem: (productId: string, variantId?: string) => {
        const { items } = get();
        const updatedItems = items.filter(
          (item) =>
            !(item.productId === productId && item.variantId === variantId)
        );

        const total = updatedItems.reduce((sum, item) => {
          const price = item.variant
            ? item.variant.price
            : item.product?.price || 0;
          return sum + price * item.quantity;
        }, 0);

        const itemCount = updatedItems.reduce(
          (sum, item) => sum + item.quantity,
          0
        );

        set({
          items: updatedItems,
          total,
          itemCount,
        });
      },

      updateQuantity: (
        productId: string,
        quantity: number,
        variantId?: string
      ) => {
        const { items } = get();
        const updatedItems = items
          .map((item) => {
            if (item.productId === productId && item.variantId === variantId) {
              return { ...item, quantity: Math.max(0, quantity) };
            }
            return item;
          })
          .filter((item) => item.quantity > 0);

        const total = updatedItems.reduce((sum, item) => {
          const price = item.variant
            ? item.variant.price
            : item.product?.price || 0;
          return sum + price * item.quantity;
        }, 0);

        const itemCount = updatedItems.reduce(
          (sum, item) => sum + item.quantity,
          0
        );

        set({
          items: updatedItems,
          total,
          itemCount,
        });
      },

      clearCart: () => {
        set({
          items: [],
          total: 0,
          itemCount: 0,
        });
      },

      getItemQuantity: (productId: string, variantId?: string) => {
        const { items } = get();
        const item = items.find(
          (item) => item.productId === productId && item.variantId === variantId
        );
        return item?.quantity || 0;
      },

      isInCart: (productId: string, variantId?: string) => {
        const { items } = get();
        return items.some(
          (item) => item.productId === productId && item.variantId === variantId
        );
      },
    }),
    {
      name: "cart-storage",
      partialize: (state) => ({
        items: state.items,
        total: state.total,
        itemCount: state.itemCount,
      }),
    }
  )
);
