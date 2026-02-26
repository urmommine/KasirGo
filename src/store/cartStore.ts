import { create } from 'zustand';

export interface Product {
    id: number;
    name: string;
    price: number;
    cost_price: number;
    stock: number;
    use_stock: number;
    sku?: string;
    barcode?: string;
    image?: string;
    category_id?: number;
}

export interface CartItem extends Product {
    qty: number;
    discount: number; // nominal amount or percentage
    discountType: 'fixed' | 'percentage';
}

interface CartState {
    items: CartItem[];
    transactionDiscount: { value: number; type: 'fixed' | 'percentage' };
    addToCart: (product: Product) => void;
    removeFromCart: (id: number) => void;
    updateQty: (id: number, qty: number) => void;
    setItemDiscount: (id: number, discount: number, discountType?: 'fixed' | 'percentage') => void;
    setTransactionDiscount: (value: number, type: 'fixed' | 'percentage') => void;
    clearCart: () => void;
    getSubtotal: () => number; // Sum of items (qty * (price - discount))
    getDiscountTotal: (subtotal: number) => number; // Transaction level discount
    getTotal: () => number; // Final total after all discounts
}

export const useCartStore = create<CartState>((set, get) => ({
    items: [],
    transactionDiscount: { value: 0, type: 'fixed' },
    addToCart: (product) => set((state) => {
        const existing = state.items.find(i => i.id === product.id);
        if (existing) {
            return {
                items: state.items.map(i => i.id === product.id ? { ...i, qty: i.qty + 1 } : i)
            };
        }
        return { items: [...state.items, { ...product, qty: 1, discount: 0, discountType: 'fixed' }] };
    }),
    removeFromCart: (id) => set((state) => ({
        items: state.items.filter(i => i.id !== id)
    })),
    updateQty: (id, qty) => set((state) => {
        if (qty <= 0) {
            return { items: state.items.filter(i => i.id !== id) };
        }
        return {
            items: state.items.map(i => i.id === id ? { ...i, qty } : i)
        };
    }),
    setItemDiscount: (id, discount, discountType) => set((state) => ({
        items: state.items.map(item => item.id === id ? { ...item, discount, discountType: discountType || item.discountType } : item)
    })),
    setTransactionDiscount: (value, type) => set({
        transactionDiscount: { value, type }
    }),
    clearCart: () => set({ items: [], transactionDiscount: { value: 0, type: 'fixed' } }),
    getSubtotal: () => {
        return get().items.reduce((sum, item) => {
            const discountAmt = item.discountType === 'percentage' ? (item.price * item.discount) / 100 : item.discount;
            return sum + ((item.price - discountAmt) * item.qty);
        }, 0);
    },
    getDiscountTotal: (subtotal) => {
        const { value, type } = get().transactionDiscount;
        if (type === 'percentage') {
            return (subtotal * value) / 100;
        }
        return value;
    },
    getTotal: () => {
        const subtotal = get().getSubtotal();
        const discountTotal = get().getDiscountTotal(subtotal);
        return Math.max(0, subtotal - discountTotal);
    },
}));
