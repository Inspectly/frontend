import React, { createContext, useContext, useState } from "react";

interface CartContextType {
  cartItems: string[];
  addToCart: (id: string) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [cartItems, setCartItems] = useState<string[]>([]);

  const addToCart = (id: string) => {
    if (!cartItems.includes(id)) {
      setCartItems((prev) => [...prev, id]);
    }
  };

  return (
    <CartContext.Provider value={{ cartItems, addToCart }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = (): CartContextType => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};
