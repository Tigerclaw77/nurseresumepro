// components/hooks/useCart.js
import { useState, useEffect } from "react";

const useCart = () => {
  const [items, setItems] = useState(() => {
    const stored = localStorage.getItem("resumeCart");
    return stored ? JSON.parse(stored) : [];
  });

  useEffect(() => {
    localStorage.setItem("resumeCart", JSON.stringify(items));
  }, [items]);

  const add = (item) => setItems((prev) => [...prev, item]);
  const remove = (index) =>
    setItems((prev) => prev.filter((_, i) => i !== index));
  const clear = () => setItems([]);

  const total = items.length * 10;

  return { items, add, remove, clear, total };
};

export default useCart;
