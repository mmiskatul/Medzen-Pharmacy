"use client";

import * as React from "react";

/**
 * The cart is a request basket, not a checkout: it holds what the customer
 * wants the pharmacy to prepare, and nothing about payment. It lives in
 * localStorage so no visitor account or server-side session is needed.
 */

export type CartLine = {
  productId: string;
  slug: string;
  name: string;
  sku: string;
  priceFils: number | null;
  imageUrl: string | null;
  prescriptionRequired: boolean;
  quantity: number;
};

type CartState = {
  lines: CartLine[];
  ready: boolean;
  count: number;
  subtotalFils: number;
  hasPricelessLine: boolean;
  add: (line: Omit<CartLine, "quantity">, quantity?: number) => void;
  setQuantity: (productId: string, quantity: number) => void;
  remove: (productId: string) => void;
  clear: () => void;
};

const STORAGE_KEY = "medzen.cart.v1";
const MAX_QUANTITY = 50;

const CartContext = React.createContext<CartState | null>(null);

function readStorage(): CartLine[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (line): line is CartLine =>
        typeof line === "object" &&
        line !== null &&
        typeof (line as CartLine).productId === "string" &&
        typeof (line as CartLine).quantity === "number",
    );
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [lines, setLines] = React.useState<CartLine[]>([]);
  const [ready, setReady] = React.useState(false);

  React.useEffect(() => {
    setLines(readStorage());
    setReady(true);
  }, []);

  React.useEffect(() => {
    if (!ready) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
    } catch {
      // Storage can be full or blocked; the cart still works for this visit.
    }
  }, [lines, ready]);

  const add = React.useCallback(
    (line: Omit<CartLine, "quantity">, quantity = 1) => {
      setLines((current) => {
        const existing = current.find((l) => l.productId === line.productId);
        if (existing) {
          return current.map((l) =>
            l.productId === line.productId
              ? { ...l, quantity: Math.min(MAX_QUANTITY, l.quantity + quantity) }
              : l,
          );
        }
        return [...current, { ...line, quantity: Math.min(MAX_QUANTITY, quantity) }];
      });
    },
    [],
  );

  const setQuantity = React.useCallback((productId: string, quantity: number) => {
    setLines((current) =>
      quantity <= 0
        ? current.filter((l) => l.productId !== productId)
        : current.map((l) =>
            l.productId === productId
              ? { ...l, quantity: Math.min(MAX_QUANTITY, quantity) }
              : l,
          ),
    );
  }, []);

  const remove = React.useCallback((productId: string) => {
    setLines((current) => current.filter((l) => l.productId !== productId));
  }, []);

  const clear = React.useCallback(() => setLines([]), []);

  const value = React.useMemo<CartState>(() => {
    const count = lines.reduce((sum, l) => sum + l.quantity, 0);
    const subtotalFils = lines.reduce(
      (sum, l) => sum + (l.priceFils ?? 0) * l.quantity,
      0,
    );
    return {
      lines,
      ready,
      count,
      subtotalFils,
      hasPricelessLine: lines.some((l) => l.priceFils === null),
      add,
      setQuantity,
      remove,
      clear,
    };
  }, [lines, ready, add, setQuantity, remove, clear]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartState {
  const context = React.useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used inside CartProvider.");
  }
  return context;
}
