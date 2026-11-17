import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { GraduationCap, School, Sparkles, User, X } from 'lucide-react';
import { sound } from '../utils/sound';

interface OwnerModalProps {
  open: boolean;
  onClose: () => void;
}

export const OwnerModal: React.FC<OwnerModalProps> = ({ open, onClose }) => {
  const [tilt, setTilt] = useState({ rotateX: 0, rotateY: 0 });

  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const xPct = (e.clientX - rect.left) / rect.width - 0.5;
    const yPct = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt({
      rotateX: -yPct * 10,
      rotateY: xPct * 12,
    });
  };

  const resetTilt = () => {
    setTilt({ rotateX: 0, rotateY: 0 });
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-labelledby="owner-modal-title"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          onClick={() => {
            sound.click();
            onClose();
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/55 backdrop-blur-sm"
          style={{ perspective: '1200px' }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, rotateX: 18, y: 24 }}
            animate={{
              opacity: 1,
              scale: 1,
              rotateX: tilt.rotateX,
              rotateY: tilt.rotateY,
              y: 0,
            }}
            exit={{ opacity: 0, scale: 0.92, rotateX: -12, y: 16 }}
            transition={{ type: 'spring', stiffness: 260, damping: 22 }}
            onPointerMove={handlePointerMove}
            onPointerLeave={resetTilt}
            onClick={(e) => e.stopPropagation()}
            style={{
              transformStyle: 'preserve-3d',
              boxShadow:
                '0 25px 50px -12px rgba(15, 23, 42, 0.35), 0 0 0 1px rgba(226, 232, 240, 0.9)',
            }}
            className="relative w-full max-w-lg bg-white rounded-2xl overflow-hidden"
          >
            {/* Top 3D Accent Strip */}
            <div className="h-2 w-full bg-gradient-to-r from-sky-500 via-sky-600 to-emerald-500" />

            <div className="p-6 sm:p-7" style={{ transformStyle: 'preserve-3d' }}>
              {/* Header */}
              <div className="flex items-start justify-between gap-4 mb-5">
                <div>
                  <p className="text-xs font-semibold text-sky-700 mb-0.5">App Creator</p>
                  <h2 id="owner-modal-title" className="text-2xl font-bold text-slate-900">
                    Made By Hareem
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    sound.click();
                    onClose();
                  }}
                  aria-label="Close creator modal"
                  className="p-2.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* 3D Floating Character + Greeting Stage */}
              <div
                className="relative mb-6 p-4 rounded-2xl bg-gradient-to-b from-sky-50 to-slate-50 border border-sky-200/80 flex flex-col sm:flex-row items-center gap-4"
                style={{
                  transform: 'translateZ(26px)',
                  boxShadow: '0 12px 24px -10px rgba(2, 132, 199, 0.18)',
                }}
              >
                <div className="w-36 h-36 shrink-0 rounded-2xl bg-white border border-slate-200 flex items-center justify-center overflow-hidden shadow-sm">
                  <WavingGirlCharacter />
                </div>

                <div className="text-center sm:text-left">
                  <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-sky-700 mb-1">
                    <Sparkles className="w-3.5 h-3.5" />
                    Hello Inventor!
                  </div>
                  <p className="text-sm text-slate-700 leading-relaxed">
                    Welcome to <strong className="text-slate-900">SparkQuest Lab</strong>! I built
                    these story missions and coding puzzles so kids can have fun learning technology.
                  </p>
                </div>
              </div>

              {/* Creator Details Card */}
              <div
                className="grid grid-cols-1 sm:grid-cols-2 gap-3"
                style={{ transform: 'translateZ(14px)' }}
              >
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                  <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500 mb-0.5">
                    <User className="w-3.5 h-3.5 text-sky-600" />
                    Name
                  </div>
                  <p className="text-sm font-bold text-slate-900">Hareem Fatima</p>
                </div>

                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                  <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500 mb-0.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                    Age
                  </div>
                  <p className="text-sm font-bold text-slate-900 font-mono tabular-nums">11</p>
                </div>

                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                  <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500 mb-0.5">
                    <GraduationCap className="w-3.5 h-3.5 text-emerald-600" />
                    Grade
                  </div>
                  <p className="text-sm font-bold text-slate-900 font-mono tabular-nums">6</p>
                </div>

                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                  <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500 mb-0.5">
                    <School className="w-3.5 h-3.5 text-sky-600" />
                    School
                  </div>
                  <p className="text-sm font-bold text-slate-900">
                    Roots Millennium Gujranwala
                  </p>
                </div>
              </div>

              {/* Footer Action */}
              <div className="mt-6 flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    sound.click();
                    onClose();
                  }}
                  className="px-5 py-2.5 text-sm font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-xl transition-colors cursor-pointer"
                >
                  Back to Lab
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Expressive animated female character waving her hand continuously
const WavingGirlCharacter: React.FC = () => {
  return (
    <motion.svg
      viewBox="0 0 160 160"
      className="w-full h-full"
      aria-label="Animated character of Hareem waving her hand"
      animate={{ y: [0, -2.5, 0] }}
      transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
    >
      {/* Soft radial studio backdrop */}
      <circle cx="80" cy="84" r="64" fill="#E0F2FE" />

      {/* Back Hair */}
      <path
        d="M44 68 C40 94 42 120 52 132 L108 132 C118 120 120 94 116 68 C114 38 98 26 80 26 C62 26 46 38 44 68 Z"
        fill="#27272A"
      />

      {/* Waving Arm: Upper arm anchored at shoulder, forearm & wrist wave smoothly around exact joint pivots */}
      <g>
        {/* Upper Arm (Shoulder 103,106 to Elbow 124,96) */}
        <path
          d="M103 106 L124 96"
          stroke="#0284C7"
          strokeWidth="15"
          strokeLinecap="round"
        />
        {/* Elbow Joint Pivot at exact (124, 96) */}
        <g
          className="animate-wave-forearm"
          style={{ transformOrigin: '124px 96px', transformBox: 'view-box' }}
        >
          {/* Forearm Sleeve & Skin from (124,96) up to Wrist (130, 72) */}
          <path
            d="M124 96 L127 86"
            stroke="#0284C7"
            strokeWidth="14"
            strokeLinecap="round"
          />
          <path
            d="M127 86 L130 72"
            stroke="#F5CBA7"
            strokeWidth="10.5"
            strokeLinecap="round"
          />

          {/* Wrist Joint Pivot at exact (130, 72) */}
          <g
            className="animate-wave-hand"
            style={{ transformOrigin: '130px 72px', transformBox: 'view-box' }}
          >
            {/* Palm */}
            <ellipse cx="130" cy="67" rx="7.5" ry="7" fill="#F5CBA7" />
            {/* Thumb */}
            <path
              d="M124 68 L120 63"
              stroke="#F5CBA7"
              strokeWidth="3.5"
              strokeLinecap="round"
            />
            {/* Fingers */}
            <path
              d="M126 62 L125 54 M129.5 61 L129.5 52 M133.5 61.5 L134.5 53 M136.5 64 L139 57"
              stroke="#F5CBA7"
              strokeWidth="3"
              strokeLinecap="round"
            />
          </g>
        </g>
      </g>

      {/* Left Resting Arm */}
      <path
        d="M56 108 L44 134"
        stroke="#0284C7"
        strokeWidth="15"
        strokeLinecap="round"
      />
      <circle cx="43" cy="136" r="7" fill="#F5CBA7" />

      {/* Torso / STEM Hoodie */}
      <path
        d="M52 106 C52 98 62 94 80 94 C98 94 108 98 108 106 L112 148 L48 148 Z"
        fill="#0284C7"
      />
      {/* White Collar / Hoodie Strings */}
      <path d="M68 96 L80 107 L92 96" fill="none" stroke="#E0F2FE" strokeWidth="3" strokeLinecap="round" />
      <circle cx="80" cy="122" r="8" fill="#38BDF8" opacity="0.35" />
      <path d="M80 116 L77 123 H81 L79 128 L84 121 H80 Z" fill="#FDE047" />

      {/* Neck */}
      <rect x="73" y="84" width="14" height="14" rx="5" fill="#F5CBA7" />

      {/* Ears */}
      <circle cx="52" cy="68" r="6" fill="#F5CBA7" />
      <circle cx="108" cy="68" r="6" fill="#F5CBA7" />

      {/* Face */}
      <ellipse cx="80" cy="66" rx="26" ry="28" fill="#F5CBA7" />

      {/* Rosy Cheeks */}
      <ellipse cx="64" cy="74" rx="4.5" ry="2.5" fill="#FCA5A5" opacity="0.6" />
      <ellipse cx="96" cy="74" rx="4.5" ry="2.5" fill="#FCA5A5" opacity="0.6" />

      {/* Eyes with Blinking Animation anchored at y=64 */}
      <g
        className="animate-character-blink"
        style={{ transformOrigin: '80px 64px', transformBox: 'view-box' }}
      >
        <circle cx="69" cy="64" r="4" fill="#0F172A" />
        <circle cx="91" cy="64" r="4" fill="#0F172A" />
        <circle cx="70.5" cy="62.5" r="1.4" fill="#FFFFFF" />
        <circle cx="92.5" cy="62.5" r="1.4" fill="#FFFFFF" />
      </g>

      {/* Eyebrows */}
      <path d="M63 56 Q69 53 75 56" fill="none" stroke="#27272A" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M85 56 Q91 53 97 56" fill="none" stroke="#27272A" strokeWidth="2.2" strokeLinecap="round" />

      {/* Cheerful Smile */}
      <path
        d="M71 76 Q80 84 89 76"
        fill="none"
        stroke="#9A3412"
        strokeWidth="2.8"
        strokeLinecap="round"
      />

      {/* Front Hair Bangs & Sky-Blue Headband */}
      <path
        d="M52 56 C55 34 70 28 80 28 C92 28 105 35 108 56 C100 44 88 42 80 46 C70 42 58 45 52 56 Z"
        fill="#27272A"
      />
      <path
        d="M54 46 C64 34 96 34 106 46"
        fill="none"
        stroke="#0EA5E9"
        strokeWidth="5"
        strokeLinecap="round"
      />
    </motion.svg>
  );
};
