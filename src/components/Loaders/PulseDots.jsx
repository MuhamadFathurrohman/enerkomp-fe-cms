// src/components/Animations/PulseDots.jsx
import React from "react";
import "../../sass/components/Loader/PulseDots/PulseDots.css";

const PulseDots = ({
  size = "md",
  color = "currentColor",
  count = 3,
  className = "",
}) => {
  const sizeClasses = {
    sm: "pulse-dots--sm",
    md: "pulse-dots--md",
    lg: "pulse-dots--lg",
  };

  // Buat array titik dinamis
  const dots = Array.from({ length: count }, (_, i) => (
    <span
      key={i}
      className="pulse-dot"
      style={{
        animationDelay: `${i * 0.2}s`,
      }}
    />
  ));

  return (
    <span
      className={`pulse-dots ${sizeClasses[size]} ${className}`}
      style={{ "--pulse-color": color }}
      aria-label="Loading"
      aria-live="polite"
    >
      {dots}
    </span>
  );
};

export default PulseDots;
