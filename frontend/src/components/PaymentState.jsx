import React, { useEffect, useState } from "react";

const PaymentState = ({ setPaymentComplete }) => {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const paid = params.get("payment_success") === "true";
    const paidTime = localStorage.getItem("paymentComplete");
    const now = Date.now();
    const EXPIRE_MS = 8 * 60 * 60 * 1000;
    const hasPaid = paid || (paidTime && now - Number(paidTime) < EXPIRE_MS);

    if (hasPaid) setPaymentComplete(true);
    else localStorage.removeItem("paymentComplete");

    if (paid) localStorage.setItem("paymentComplete", Date.now().toString());
  }, [setPaymentComplete]);

  return null;
};

export default PaymentState;
