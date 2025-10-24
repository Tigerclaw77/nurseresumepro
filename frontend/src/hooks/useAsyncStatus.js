import { useEffect, useMemo, useRef, useState } from "react";

/**
 * useAsyncStatus
 * - Tracks an async request's lifecycle.
 * - Elevates user-facing messages as time passes (e.g., after 2s, 7s, 15s).
 * - Returns helpers to start, resolve, fail, and cancel.
 */
export default function useAsyncStatus({
  steps = [
    { atMs: 0,    label: "Preparing…",               sub: "Getting things ready." },
    { atMs: 1200, label: "Generating…",              sub: "This usually takes a few seconds." },
    { atMs: 5000, label: "Still working…",           sub: "Polishing sections and formatting." },
    { atMs: 12000,label: "Almost there…",            sub: "Final touches, hang tight." },
  ],
  graceDoneMs = 600, // leave the banner up briefly on success (feels smoother)
} = {}) {
  const [active, setActive] = useState(false);
  const [error, setError] = useState(null);
  const [startedAt, setStartedAt] = useState(null);
  const [done, setDone] = useState(false);
  const [aborted, setAborted] = useState(false);
  const tickRef = useRef(null);

  const nowMs = Date.now();
  const elapsed = startedAt ? nowMs - startedAt : 0;

  const currentStep = useMemo(() => {
    if (!active || startedAt == null) return null;
    let cur = steps[0];
    for (const s of steps) if (elapsed >= s.atMs) cur = s;
    return cur;
  }, [active, startedAt, elapsed, steps]);

  useEffect(() => {
    if (!active) return;
    tickRef.current = setInterval(() => {
      // force a re-render via state flip
      setStartedAt((t) => (t ? t : Date.now()));
    }, 250);
    return () => clearInterval(tickRef.current);
  }, [active]);

  function start() {
    setError(null);
    setAborted(false);
    setDone(false);
    setActive(true);
    setStartedAt(Date.now());
  }

  function resolve() {
    setDone(true);
    setTimeout(() => {
      setActive(false);
      setStartedAt(null);
    }, graceDoneMs);
  }

  function fail(err) {
    setError(err || new Error("Something went wrong"));
    setActive(false);
  }

  function cancel() {
    setAborted(true);
    setActive(false);
  }

  return {
    // state
    active,
    done,
    error,
    aborted,
    elapsed,
    currentStep, // { label, sub }

    // actions
    start,
    resolve,
    fail,
    cancel,
  };
}
