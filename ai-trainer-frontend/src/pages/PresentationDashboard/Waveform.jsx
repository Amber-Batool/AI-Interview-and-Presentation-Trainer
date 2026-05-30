
import React, { useEffect, useState } from "react";

export default function Waveform({ recording }) {
  const [bars, setBars] = useState(Array(24).fill(3));

  useEffect(() => {
    if (!recording) {
      setBars(Array(24).fill(3));
      return;
    }

    const interval = setInterval(() => {
      setBars(
        Array.from({ length: 24 }, (_, i) => {
          const center = 12;
          const dist = Math.abs(i - center);
          const base = Math.max(5, 28 - dist * 1.5);
          return Math.floor(Math.random() * base) + 4;
        })
      );
    }, 110);

    return () => clearInterval(interval);
  }, [recording]);

  return (
    <div className="wave-container">
      {bars.map((h, i) => (
        <div
          key={i}
          className="wave-bar"
          style={{
            height: `${h}px`,
            opacity: recording ? 0.65 + (h / 50) * 0.35 : 0.3,
            background: recording
              ? `hsl(${38 + (h / 40) * 12}, 70%, ${48 + (h / 40) * 8}%)`
              : "var(--border)",
            transform: recording ? `scaleY(1)` : "scaleY(0.6)",
            transition: recording
              ? `height 0.1s ease, opacity 0.1s ease, background 0.1s ease`
              : `all 0.4s ease`,
          }}
        />
      ))}
    </div>
  );
}