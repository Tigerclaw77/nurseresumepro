import { useCallback } from "react";

export default function usePhoneMask() {
  return useCallback((value) => {
    const digits = (value || "").replace(/\D/g, "").slice(0, 10);
    const parts = [];
    if (digits.length > 0) parts.push("(" + digits.slice(0, 3));
    if (digits.length >= 4) parts[0] += ") " + digits.slice(3, 6);
    if (digits.length >= 7) parts[0] += "-" + digits.slice(6, 10);
    return parts[0] || "";
  }, []);
}
