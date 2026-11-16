import type { CSSProperties } from "react";

export function Spiral() {
  // Aynı ince telin tekrarı, ağır bir görsel dosyası olmadan cilt hissi verir.
  return (
    <div className="spiral" aria-hidden="true">
      {Array.from({ length: 26 }, (_, index) => (
        <svg className="spiral-ring" viewBox="0 0 60 28" key={index}
          style={{ "--ring-index": index } as CSSProperties}>
          <defs>
            <linearGradient id={`wire-${index}`} x1="0" y1="0" x2="0" y2="1">
              <stop stopColor="#1F2230" stopOpacity=".65" />
              <stop offset=".3" stopColor="#E7DFCF" />
              <stop offset=".55" stopColor="#F7F2E8" />
              <stop offset="1" stopColor="#1F2230" stopOpacity=".7" />
            </linearGradient>
          </defs>
          <ellipse cx="45" cy="16" rx="5" ry="5.5" fill="#1F2230" opacity=".12" />
          <ellipse cx="45" cy="16" rx="3.2" ry="3.7" fill="#1F2230" opacity=".35" />
          <path d="M44 17C51 5 34 3 23 4C6 5 4 18 17 21C25 23 35 21 37 18"
            fill="none" stroke="#1F2230" strokeOpacity=".12" strokeWidth="4.5" transform="translate(0 1)" />
          <path d="M44 16C51 4 34 2 23 3C6 4 4 17 17 20C25 22 35 20 37 17"
            fill="none" stroke={`url(#wire-${index})`} strokeWidth="3.2" strokeLinecap="round" />
          <path className="spiral-highlight" d="M14 7C20 3 35 3 41 6"
            fill="none" stroke="#F7F2E8" strokeWidth=".8" strokeLinecap="round" />
        </svg>
      ))}
    </div>
  );
}
