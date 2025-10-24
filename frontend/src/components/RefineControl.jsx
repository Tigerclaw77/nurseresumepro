import React, { useState, useEffect } from "react";
import Button from "react-bootstrap/esm/Button";

const RefineControl = ({ text, setText, setScore }) => {
  const [cooldown, setCooldown] = useState(false);

  useEffect(() => {
    const lastRefine = localStorage.getItem("lastRefineTime");
    if (lastRefine) {
      const diff = Date.now() - parseInt(lastRefine, 10);
      if (diff < 60000) {
        setCooldown(true);
        const timeout = setTimeout(() => setCooldown(false), 60000 - diff);
        return () => clearTimeout(timeout);
      }
    }
  }, []);

  const handleRefine = async () => {
    if (cooldown) {
      alert("Please wait 1 minute between refinements.");
      return;
    }

    try {
      const res = await fetch(`${process.env.REACT_APP_API_BASE}/refine/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const data = await res.json();
      const refined = data.output || text;
      setText(refined);

      if (setScore) {
        const score = estimateATSScore(refined);
        setScore(score);
      }

      localStorage.setItem("lastRefineTime", Date.now().toString());
      setCooldown(true);
      setTimeout(() => setCooldown(false), 60000); // reset in 1 minute
    } catch {
      alert("Refinement failed.");
    }
  };

  return (
    <Button
      onClick={handleRefine}
      variant="outline-primary"
      className="me-2 refine"
      disabled={cooldown}
    >
      {cooldown ? "Please wait..." : "Refine (1/min)"}
    </Button>
  );
};

function estimateATSScore(content) {
  // optional reuse logic for resumes
  return { score: 100, issues: [] };
}

export default RefineControl;
