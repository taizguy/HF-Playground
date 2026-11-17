import React from 'react';
import { Direction } from '../types/game';

interface NovaSpriteProps {
  dir: Direction;
  mood?: 'happy' | 'oops' | 'won';
}

const DIR_ROTATION: Record<Direction, number> = {
  UP: 0,
  RIGHT: 90,
  DOWN: 180,
  LEFT: 270,
};

export const NovaSprite: React.FC<NovaSpriteProps> = ({ dir, mood = 'happy' }) => {
  const rotation = DIR_ROTATION[dir];

  return (
    <div
      className="relative flex items-center justify-center w-full h-full transition-transform duration-200 ease-out"
      style={{ transform: `rotate(${rotation}deg)` }}
      aria-label={`Nova facing ${dir.toLowerCase()}`}
    >
      <svg viewBox="0 0 64 64" className="w-[82%] h-[82%] drop-shadow-sm">
        {/* Forward direction pointer */}
        <polygon points="32,2 25,11 39,11" fill="#0284C7" />
        {/* Wheels */}
        <rect x="8" y="18" width="7" height="14" rx="3" fill="#334155" />
        <rect x="49" y="18" width="7" height="14" rx="3" fill="#334155" />
        <rect x="8" y="36" width="7" height="14" rx="3" fill="#334155" />
        <rect x="49" y="36" width="7" height="14" rx="3" fill="#334155" />
        {/* Chassis */}
        <rect
          x="14"
          y="13"
          width="36"
          height="40"
          rx="11"
          fill="#E0F2FE"
          stroke="#0284C7"
          strokeWidth="3"
        />
        {/* Visor / Screen */}
        <rect x="19" y="19" width="26" height="18" rx="6" fill="#0F172A" />
        {/* Eyes */}
        {mood === 'oops' ? (
          <>
            <path d="M24 25 L29 30 M29 25 L24 30" stroke="#F87171" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M35 25 L40 30 M40 25 L35 30" stroke="#F87171" strokeWidth="2.5" strokeLinecap="round" />
          </>
        ) : mood === 'won' ? (
          <>
            <path d="M23 29 Q26.5 24 30 29" fill="none" stroke="#34D399" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M34 29 Q37.5 24 41 29" fill="none" stroke="#34D399" strokeWidth="2.5" strokeLinecap="round" />
          </>
        ) : (
          <>
            <circle cx="26.5" cy="28" r="3" fill="#38BDF8" />
            <circle cx="37.5" cy="28" r="3" fill="#38BDF8" />
          </>
        )}
        {/* Solar stripe */}
        <rect x="22" y="42" width="20" height="5" rx="2.5" fill="#0284C7" />
      </svg>
    </div>
  );
};
