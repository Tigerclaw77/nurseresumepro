// ATSMeter.jsx
import React from "react";

const ATSMeter = ({ score = 60 }) => {
  const width = 200;
  const height = 120;
  const radius = 80;
  const stroke = 14;
  const centerX = width / 2;
  const centerY = height;

  // Correct needle: 0% = 180°, 100% = 0°
  const angle = 180 - (score / 100) * 180;
  const needleAngle = angle;

  const polarToCartesian = (cx, cy, r, angleDeg) => {
    const rad = (angleDeg * Math.PI) / 180.0;
    return {
      x: cx + r * Math.cos(rad),
      y: cy + r * Math.sin(rad),
    };
  };

  const describeArc = (startAngle, endAngle) => {
    const start = polarToCartesian(centerX, centerY, radius, startAngle);
    const end = polarToCartesian(centerX, centerY, radius, endAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? 0 : 1;

    return [
      "M", start.x, start.y,
      "A", radius, radius, 0, largeArcFlag, 1, end.x, end.y // ← `1` flips the sweep direction
    ].join(" ");
  };

  const needleStart = polarToCartesian(centerX, centerY, -10, needleAngle);
  const needleEnd = polarToCartesian(centerX, centerY, radius, needleAngle);

  const getColor = () => {
    if (score < 50) return "#e74c3c";
    if (score < 75) return "#f1c40f";
    return "#2ecc71";
  };

  return (
    <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
      <svg width={width} height={height + 10}>
        {/* Background arc */}
        <path
          d={describeArc(180, 0)}
          fill="none"
          stroke="#eee"
          strokeWidth={stroke}
        />

        {/* Score arc */}
        <path
          d={describeArc(180, 180 - (score / 100) * 180)}
          fill="none"
          stroke={getColor()}
          strokeWidth={stroke}
          strokeLinecap="round"
        />

        {/* Needle */}
        <line
          x1={needleStart.x}
          y1={needleStart.y}
          x2={needleEnd.x}
          y2={needleEnd.y}
          stroke="#333"
          strokeWidth="3"
        />

        {/* Score text */}
        <text
          x={centerX}
          y={centerY - radius / 2}
          textAnchor="middle"
          fontSize="20"
          fill="#222"
          dominantBaseline="middle"
        >
          {score}%
        </text>
      </svg>
    </div>
  );
};

export default ATSMeter;
