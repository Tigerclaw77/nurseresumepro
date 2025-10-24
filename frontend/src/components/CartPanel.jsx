import React from "react";
import "../styles/CartPanel.css";

const CartPanel = ({ open, items, total, onClose, onRemove, onCheckout }) => {
  if (!open) return null;

  return (
    <div className="cart-overlay">
      <div className="cart-panel">
        <div className="cart-header">
          <h4>Your Purchase</h4>
          <button onClick={onClose} className="cart-close">×</button>
        </div>

        <ul className="cart-items">
          {items.map((item, index) => (
            <li key={index} className="cart-item">
              <div>
                <strong>{item.type === "resume" ? "Resume" : "Cover Letter"}</strong>
                <div className="cart-timestamp">
                  {new Date(item.timestamp).toLocaleDateString()}
                </div>
              </div>
              <button onClick={() => onRemove(index)} className="remove-btn">Remove</button>
            </li>
          ))}
        </ul>

        <div className="cart-footer">
          <span>Total:</span>
          <strong>${total.toFixed(2)}</strong>
          <button className="checkout-btn" onClick={onCheckout}>Checkout</button>
        </div>
      </div>
    </div>
  );
};

export default CartPanel;
