'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [items, setItems] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [customer, setCustomer] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);

  // Check auth on mount
  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.user) setCustomer(data.user);
      })
      .catch(() => {})
      .finally(() => setAuthChecked(true));
  }, []);

  // Load cart from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('stocksense_cart');
      if (saved) {
        setItems(JSON.parse(saved));
      }
    } catch (e) {
      console.error('Failed to load cart', e);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Save cart to localStorage whenever items change
  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem('stocksense_cart', JSON.stringify(items));
      } catch (e) {
        console.error('Failed to save cart', e);
      }
    }
  }, [items, isLoaded]);

  const isAuthenticated = !!customer;

  // Returns true if authenticated, otherwise redirects to login and returns false.
  // Callers should bail out when this returns false.
  const requireAuth = useCallback(() => {
    if (customer) return true;
    // Encode current page so login can redirect back
    const returnTo = encodeURIComponent(window.location.pathname);
    window.location.href = `/customer/login?returnTo=${returnTo}`;
    return false;
  }, [customer]);

  const addToCart = (product, qty = 1) => {
    if (!requireAuth()) return;
    setItems((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        const newQty = Math.min(existing.quantity + qty, product.totalStock || 999);
        return prev.map((item) =>
          item.id === product.id ? { ...item, quantity: newQty } : item
        );
      }
      return [
        ...prev,
        {
          id: product.id,
          name: product.name,
          sku: product.sku,
          price: Number(product.price),
          imageUrl: product.imageUrl,
          uom: product.uom,
          quantity: Math.min(qty, product.totalStock || 999),
          maxStock: product.totalStock,
        },
      ];
    });
  };

  const updateQuantity = (productId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setItems((prev) =>
      prev.map((item) => {
        if (item.id === productId) {
          const clamped = Math.min(quantity, item.maxStock || 999);
          return { ...item, quantity: clamped };
        }
        return item;
      })
    );
  };

  const removeFromCart = (productId) => {
    setItems((prev) => prev.filter((item) => item.id !== productId));
  };

  const clearCart = () => {
    setItems([]);
  };

  const setCustomerState = setCustomer;

  const cartCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const cartTotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        cartCount,
        cartTotal,
        isLoaded,
        customer,
        isAuthenticated,
        authChecked,
        requireAuth,
        setCustomer: setCustomerState,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
