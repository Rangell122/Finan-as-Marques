import React from "react";

export function Logo({ className = "w-8 h-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      {/* Background container - Rounded premium card matching the squircle icon image */}
      <rect width="100" height="100" rx="26" fill="url(#logo-bg-grad)" />

      {/* Golden F */}
      <path
        d="M20.5 73 V35 C20.5 29.5 25 25 30.5 25 H60.5 L54.5 32 H27 V43 H45.5 L38.5 50 H27 V73 Z"
        fill="url(#gold-grad)"
      />

      {/* Silver/White M */}
      <path
        d="M38.5 73 V53.5 L47.5 43.5 L60 57.5 L79.5 33.5 V73 H73 V44.5 L60 61 L45 49 V73 Z"
        fill="url(#silver-grad)"
      />

      <defs>
        {/* Deep Navy gradient for the background icon */}
        <linearGradient
          id="logo-bg-grad"
          x1="0"
          y1="0"
          x2="100"
          y2="100"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#0E2C63" />
          <stop offset="50%" stopColor="#071A3D" />
          <stop offset="100%" stopColor="#040D1F" />
        </linearGradient>
        {/* Rich Golden gradient matching #D4A63A and #F4C95D */}
        <linearGradient
          id="gold-grad"
          x1="20.5"
          y1="25"
          x2="60.5"
          y2="73"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#F4C95D" /> {/* Gold light */}
          <stop offset="100%" stopColor="#D4A63A" /> {/* Gold premium */}
        </linearGradient>
        {/* Silver-White gradient for the M */}
        <linearGradient
          id="silver-grad"
          x1="38.5"
          y1="33.5"
          x2="79.5"
          y2="73"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#E2E8F0" />
        </linearGradient>
      </defs>
    </svg>
  );
}
