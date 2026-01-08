// src/components/Animations/AnimatedNumber.jsx
import React, { useEffect, useState, useRef } from "react";
import "../../sass/components/Animations/AnimatedNumber/AnimatedNumber.css";

const easeOutExpo = (t) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t));

const AnimatedNumber = ({
  value = 0,
  duration = 1000,
  delay = 0,
  className = "",
  formatter,
}) => {
  const [displayValue, setDisplayValue] = useState(0);
  const requestRef = useRef();
  const startTimeRef = useRef();

  // Fungsi animasi
  const animate = (timestamp) => {
    if (!startTimeRef.current) {
      // Tambahkan delay ke startTime
      startTimeRef.current = timestamp + delay;
      return (requestRef.current = requestAnimationFrame(animate));
    }

    const elapsed = timestamp - startTimeRef.current;
    const progress = Math.min(elapsed / duration, 1);
    const easedProgress = easeOutExpo(progress);
    const currentValue = value * easedProgress;

    setDisplayValue(currentValue);

    if (progress < 1) {
      requestRef.current = requestAnimationFrame(animate);
    }
  };

  useEffect(() => {
    // Validasi input
    if (typeof value !== "number" || isNaN(value) || value < 0) {
      setDisplayValue(0);
      return;
    }

    // Reset dan mulai animasi
    startTimeRef.current = null;

    requestRef.current = requestAnimationFrame(animate);

    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [value, duration, delay]);

  // Format nilai akhir
  const formattedValue = formatter
    ? formatter(displayValue)
    : Math.round(displayValue).toLocaleString("id-ID");

  return (
    <span className={`animated-number ${className}`}>{formattedValue}</span>
  );
};

export default AnimatedNumber;
