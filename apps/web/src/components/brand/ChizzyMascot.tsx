import React from 'react';

interface ChizzyProps {
  className?: string;
  size?: number;
  mood?: 'excited' | 'studying' | 'supercharged' | 'thinking' | 'celebrating' | 'explaining';
  animated?: boolean;
}

/**
 * Chizzy ⚡🦉 - The hyper-smart energetic lightning-owl mascot of Chizmo
 * Original brand vector mascot with electric aura and expressive eyes
 */
export function ChizzyMascot({ className = '', size = 64, mood = 'excited', animated = false }: ChizzyProps) {
  const isAnimated = animated || mood === 'celebrating' || mood === 'thinking';
  return (
    <div
      className={`relative inline-block select-none ${isAnimated ? 'animate-bounce-subtle' : ''} ${className}`}
      style={{ width: size, height: size }}
    >
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-md"
      >
        {/* Glow / Lightning Aura */}
        <circle cx="50" cy="50" r="42" fill="url(#chizzy-glow)" opacity="0.3" />

        {/* Head & Body Feathers (Electric Indigo Gradient) */}
        <ellipse cx="50" cy="54" rx="36" ry="34" fill="url(#body-gradient)" />

        {/* Owl Ear Tufts */}
        <path d="M22 28L32 44L18 42Z" fill="#4F46E5" />
        <path d="M78 28L68 44L82 42Z" fill="#4F46E5" />

        {/* Belly Plumes */}
        <ellipse cx="50" cy="62" rx="22" ry="18" fill="#EEF2FF" />

        {/* Eye Circles */}
        <circle cx="37" cy="48" r="14" fill="#FFFFFF" />
        <circle cx="63" cy="48" r="14" fill="#FFFFFF" />

        {/* Pupils & Eyebrows */}
        <circle cx="38" cy="48" r="7" fill="#0F172A" />
        <circle cx="62" cy="48" r="7" fill="#0F172A" />
        {/* Pupil Sparkle Highlights */}
        <circle cx="36" cy="45" r="2.5" fill="#FFFFFF" />
        <circle cx="60" cy="45" r="2.5" fill="#FFFFFF" />

        {/* Beak */}
        <polygon points="50,53 44,61 56,61" fill="#F59E0B" />

        {/* Lightning Crest Forehead Gem */}
        <path
          d="M50 20L53 28L47 30L51 38L44 32L49 30Z"
          fill="#FBBF24"
          stroke="#D97706"
          strokeWidth="1"
        />

        {/* Subtle Specs / Graduation Cap if studying */}
        {mood === 'studying' && (
          <path
            d="M24 48Q37 42 50 48Q63 42 76 48"
            stroke="#6366F1"
            strokeWidth="2.5"
            strokeLinecap="round"
            fill="none"
          />
        )}

        <defs>
          <radialGradient id="chizzy-glow" cx="0.5" cy="0.5" r="0.5">
            <stop stopColor="#F59E0B" />
            <stop offset="1" stopColor="#6366F1" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="body-gradient" x1="50" y1="20" x2="50" y2="88" gradientUnits="userSpaceOnUse">
            <stop stopColor="#6366F1" />
            <stop offset="1" stopColor="#3730A3" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}
