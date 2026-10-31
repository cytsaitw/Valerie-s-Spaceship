import React from 'react';
import { motion } from 'motion/react';
import { ValerieExpression } from '../types';

interface ValerieMascotProps {
  expression?: ValerieExpression;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showHelmet?: boolean;
  speechText?: string;
  onClick?: () => void;
  className?: string;
}

export const ValerieMascot: React.FC<ValerieMascotProps> = ({
  expression = 'happy',
  size = 'md',
  showHelmet = false,
  speechText,
  onClick,
  className = '',
}) => {
  const sizePixels = {
    sm: 90,
    md: 140,
    lg: 200,
    xl: 280,
  }[size];

  // Eye stalk animations based on expression
  const eyeLeftAnim = {
    happy: { y: [0, -3, 0], rotate: [-2, 2, -2] },
    thinking: { y: -8, rotate: -10 },
    surprised: { y: -12, scale: 1.1 },
    focused: { y: 2, rotate: 5 },
    proud: { y: -4, rotate: -3 },
    waving: { y: [0, -4, 0], rotate: [-5, 5, -5] },
  }[expression];

  const eyeRightAnim = {
    happy: { y: [0, -3, 0], rotate: [2, -2, 2] },
    thinking: { y: 2, rotate: 8 },
    surprised: { y: -12, scale: 1.1 },
    focused: { y: 2, rotate: -5 },
    proud: { y: -4, rotate: 3 },
    waving: { y: [0, -4, 0], rotate: [5, -5, 5] },
  }[expression];

  // Mouth path based on expression
  const getMouthPath = () => {
    switch (expression) {
      case 'happy':
      case 'proud':
      case 'waving':
        return 'M 62 110 Q 75 125 88 110'; // Big smile
      case 'thinking':
        return 'M 65 114 Q 75 110 85 114'; // Subtle straight mouth
      case 'surprised':
        return 'M 70 115 A 6 6 0 1 0 80 115 A 6 6 0 1 0 70 115'; // Wide O mouth
      case 'focused':
        return 'M 65 112 L 85 112'; // Focused line
      default:
        return 'M 62 110 Q 75 125 88 110';
    }
  };

  return (
    <div className={`relative inline-flex flex-col items-center justify-center ${className}`}>
      {/* Speech Bubble */}
      {speechText && (
        <motion.div
          initial={{ opacity: 0, y: 10, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.25 }}
          className="absolute -top-16 z-20 max-w-xs bg-purple-900/90 border-2 border-purple-400 text-purple-100 text-xs sm:text-sm px-3.5 py-2 rounded-2xl shadow-lg backdrop-blur-md text-center pointer-events-none"
        >
          <span className="font-medium">{speechText}</span>
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-3 h-3 bg-purple-900 border-r-2 border-b-2 border-purple-400 rotate-45" />
        </motion.div>
      )}

      {/* Valerie Mascot Body SVG */}
      <motion.div
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.96 }}
        onClick={onClick}
        className={`cursor-pointer relative flex items-center justify-center group`}
        style={{ width: sizePixels, height: sizePixels * 1.2 }}
      >
        <svg
          viewBox="0 0 150 180"
          className="w-full h-full drop-shadow-xl overflow-visible"
          style={{ filter: expression === 'surprised' ? 'drop-shadow(0 0 12px rgba(168,85,247,0.8))' : undefined }}
        >
          {/* Background Glow */}
          <circle cx="75" cy="110" r="55" fill="rgba(168, 85, 247, 0.15)" className="blur-xl" />

          {/* LEFT EYE STALK */}
          <motion.g
            animate={eyeLeftAnim}
            transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
          >
            {/* Left Stalk */}
            <path
              d="M 52 90 Q 35 50 30 25"
              fill="none"
              stroke="#A855F7"
              strokeWidth="11"
              strokeLinecap="round"
            />
            <path
              d="M 52 90 Q 35 50 30 25"
              fill="none"
              stroke="#2E1065"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            {/* Left Eye Ball */}
            <ellipse cx="28" cy="22" rx="19" ry="17" fill="#C084FC" stroke="#2E1065" strokeWidth="2.5" />
            <ellipse cx="28" cy="22" rx="13" ry="11" fill="#FFFFFF" />
            <circle cx={expression === 'thinking' ? 24 : 28} cy={expression === 'thinking' ? 18 : 22} r="8" fill="#1E1B4B" />
            <circle cx={expression === 'thinking' ? 22 : 26} cy={expression === 'thinking' ? 16 : 20} r="3" fill="#FFFFFF" />
          </motion.g>

          {/* RIGHT EYE STALK */}
          <motion.g
            animate={eyeRightAnim}
            transition={{ repeat: Infinity, duration: 3.2, ease: 'easeInOut' }}
          >
            {/* Right Stalk */}
            <path
              d="M 98 90 Q 115 50 120 25"
              fill="none"
              stroke="#A855F7"
              strokeWidth="11"
              strokeLinecap="round"
            />
            <path
              d="M 98 90 Q 115 50 120 25"
              fill="none"
              stroke="#2E1065"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            {/* Right Eye Ball */}
            <ellipse cx="122" cy="22" rx="19" ry="17" fill="#C084FC" stroke="#2E1065" strokeWidth="2.5" />
            <ellipse cx="122" cy="22" rx="13" ry="11" fill="#FFFFFF" />
            <circle cx={expression === 'thinking' ? 124 : 122} cy={expression === 'thinking' ? 18 : 22} r="8" fill="#1E1B4B" />
            <circle cx={expression === 'thinking' ? 122 : 120} cy={expression === 'thinking' ? 16 : 20} r="3" fill="#FFFFFF" />
          </motion.g>

          {/* MAIN BODY */}
          <g>
            {/* Feet / Base */}
            <path
              d="M 40 148 Q 30 168 45 168 Q 60 168 75 160 Q 90 168 105 168 Q 120 168 110 148 Z"
              fill="#9333EA"
              stroke="#2E1065"
              strokeWidth="3"
            />

            {/* Torso/Head Round Body */}
            <path
              d="M 38 120 C 30 80, 120 80, 112 120 C 120 155, 30 155, 38 120 Z"
              fill="#A855F7"
              stroke="#2E1065"
              strokeWidth="3.5"
            />

            {/* Light Purple Belly Patch */}
            <path
              d="M 52 110 C 50 95, 100 95, 98 110 C 102 138, 48 138, 52 110 Z"
              fill="#D8B4FE"
              opacity="0.85"
            />

            {/* Cute Cheeks */}
            <ellipse cx="50" cy="112" rx="5" ry="3" fill="#F472B6" opacity="0.6" />
            <ellipse cx="100" cy="112" rx="5" ry="3" fill="#F472B6" opacity="0.6" />

            {/* Mouth */}
            <path
              d={getMouthPath()}
              fill={expression === 'surprised' ? '#2E1065' : 'none'}
              stroke="#2E1065"
              strokeWidth="3"
              strokeLinecap="round"
            />
          </g>

          {/* ASTRO HELMET OPTION */}
          {showHelmet && (
            <g className="pointer-events-none">
              <path
                d="M 20 85 C 10 10, 140 10, 130 85 C 135 150, 15 150, 20 85 Z"
                fill="rgba(56, 189, 248, 0.25)"
                stroke="#38BDF8"
                strokeWidth="3"
                className="backdrop-blur-xs"
              />
              {/* Helmet Shine */}
              <path
                d="M 35 45 Q 75 25 110 40"
                fill="none"
                stroke="#FFFFFF"
                strokeWidth="4"
                strokeLinecap="round"
                opacity="0.6"
              />
              {/* Gold Antenna */}
              <circle cx="75" cy="12" r="5" fill="#F59E0B" />
              <line x1="75" y1="12" x2="75" y2="25" stroke="#F59E0B" strokeWidth="3" />
            </g>
          )}

          {/* SPARKS ON OVERLOAD */}
          {expression === 'surprised' && (
            <motion.g
              animate={{ opacity: [0.2, 1, 0.2], scale: [0.9, 1.1, 0.9] }}
              transition={{ repeat: Infinity, duration: 0.3 }}
            >
              <path d="M 20 15 L 10 5 L 18 2 L 12 -8" fill="none" stroke="#FACC15" strokeWidth="3" />
              <path d="M 130 15 L 140 5 L 132 2 L 138 -8" fill="none" stroke="#FACC15" strokeWidth="3" />
              <path d="M 75 165 L 75 178 L 82 172" fill="none" stroke="#38BDF8" strokeWidth="3" />
            </motion.g>
          )}
        </svg>

        {/* Floating Badge */}
        <div className="absolute -bottom-1 bg-purple-950/90 border border-purple-500/50 text-purple-200 text-[10px] font-bold px-2 py-0.5 rounded-full shadow-md flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span>Valerie 瓦莉莉</span>
        </div>
      </motion.div>
    </div>
  );
};
