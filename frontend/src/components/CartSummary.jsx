import React from "react";
import "../styles/CartSummary.css"; // optional for styling

const CartSummary = ({ items = [], total = 0, onRemove }) => (
  <div className="cart-summary">
    {items.length === 0 ? (
      <p>Your cart is empty.</p>
    ) : (
      <>
        {items.map((item, index) => (
          <div key={index} className="cart-item">
            <span className="cart-item-label">
              {item.type?.toUpperCase() || "Item"} — $10
            </span>
            <button className="remove-btn" onClick={() => onRemove?.(index)}>
              Remove
            </button>
          </div>
        ))}
        <div className="cart-total">
          <strong>Total:</strong> ${total}
        </div>
      </>
    )}
  </div>
);

export default CartSummary;
