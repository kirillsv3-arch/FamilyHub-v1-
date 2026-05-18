'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface CatProps {
  stage: 'egg' | 'kitten' | 'junior' | 'adult';
  mood: 'happy' | 'normal' | 'sad' | 'sick';
  items?: string[];
}

export default function TamagotchiCat({ stage, mood, items = [] }: CatProps) {
  const getStageSize = () => {
    switch(stage) {
      case 'egg': return 'w-24 h-32';
      case 'kitten': return 'w-32 h-32';
      case 'junior': return 'w-40 h-40';
      case 'adult': return 'w-52 h-52';
    }
  };

  const bodyFill = mood === 'sick' ? '#94A3B8' : '#F97316';
  const earFill = mood === 'sick' ? '#CBD5E1' : '#FCA5A5';

  if (stage === 'egg') {
    return (
      <div className="relative flex flex-col items-center justify-center h-64 group">
        <motion.svg viewBox="0 0 120 150" className="w-28 h-36"
          animate={{ rotate: [-3, 3, -3] }}
          transition={{ repeat: Infinity, duration: 1.5 }}>
          <ellipse cx="60" cy="80" rx="45" ry="60" fill="#FEF3C7" stroke="#D97706" strokeWidth="2"/>
          <path d="M55,50 L60,60 L52,70 L62,80" stroke="#92400E" strokeWidth="2" fill="none"/>
          <text x="38" y="100" fontSize="28">🐾</text>
        </motion.svg>
        <div className="absolute bottom-0 opacity-0 group-hover:opacity-100 transition-opacity bg-zinc-900/80 px-3 py-1 rounded-full text-[10px] text-zinc-300 font-bold">
          Заботься о семье, чтобы я вылупился!
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex flex-col items-center justify-center h-64">
      {/* Background Furniture */}
      {items.includes('furniture_1') && <div className="absolute -z-10 text-8xl opacity-40">🛏️</div>}

      {/* Glow */}
      <motion.div
        animate={{
          scale: mood === 'happy' ? [1, 1.2, 1] : [1, 1.05, 1],
          opacity: [0.1, 0.2, 0.1],
        }}
        transition={{ repeat: Infinity, duration: 3 }}
        className={`absolute inset-0 blur-3xl rounded-full ${
          mood === 'happy' ? 'bg-primary' : mood === 'sick' ? 'bg-slate-500' : 'bg-primary/40'
        }`}
      />

      <motion.svg
        viewBox="0 0 200 220"
        className={getStageSize()}
        animate={{
          y: mood === 'happy' ? [0, -15, 0] : mood === 'normal' ? [0, -4, 0] : 0,
          rotate: mood === 'sad' ? [-2, 2, -2] : 0
        }}
        transition={{
          y: { repeat: Infinity, duration: mood === 'happy' ? 0.6 : 2.5 },
          rotate: { repeat: Infinity, duration: 2 }
        }}
      >
        {/* Decor items under cat */}
        {items.includes('decor_1') && <ellipse cx="100" cy="200" rx="80" ry="20" fill="#4B5563" opacity="0.5" />}
        {items.includes('decor_2') && <text x="140" y="190" fontSize="30">🐭</text>}

        {/* Body */}
        <ellipse cx="100" cy="140" rx="55" ry="50" fill={bodyFill} />

        {/* Head */}
        <circle cx="100" cy="85" r="45" fill={bodyFill} />

        {/* Ears */}
        <polygon points="65,50 75,20 90,50" fill={bodyFill} />
        <polygon points="110,50 125,20 135,50" fill={bodyFill} />
        <polygon points="69,48 76,27 88,48" fill={earFill} />
        <polygon points="112,48 124,27 132,48" fill={earFill} />

        {/* Eyes */}
        {mood === 'happy' ? (
          <>
            <text x="78" y="94" fontSize="20" fill="#1c1c1c">★</text>
            <text x="103" y="94" fontSize="20" fill="#1c1c1c">★</text>
          </>
        ) : mood === 'sad' ? (
          <>
            <path d="M80,85 Q87,92 94,85" stroke="#1c1c1c" strokeWidth="2.5" fill="none"/>
            <path d="M106,85 Q113,92 120,85" stroke="#1c1c1c" strokeWidth="2.5" fill="none"/>
          </>
        ) : (
          <>
            <circle cx="87" cy="87" r="7" fill="#1c1c1c"/>
            <circle cx="113" cy="87" r="7" fill="#1c1c1c"/>
            <circle cx="89" cy="85" r="2" fill="white"/>
            <circle cx="115" cy="85" r="2" fill="white"/>
          </>
        )}

        {/* Nose and mouth */}
        <polygon points="97,96 100,93 103,96" fill="#DB2777" />
        <path d="M97,97 Q100,102 103,97" stroke="#DB2777" strokeWidth="1.5" fill="none"/>

        {/* Whiskers */}
        <line x1="60" y1="95" x2="90" y2="98" stroke="#78716c" strokeWidth="1.5"/>
        <line x1="60" y1="100" x2="90" y2="100" stroke="#78716c" strokeWidth="1.5"/>
        <line x1="110" y1="98" x2="140" y2="95" stroke="#78716c" strokeWidth="1.5"/>
        <line x1="110" y1="100" x2="140" y2="100" stroke="#78716c" strokeWidth="1.5"/>

        {/* Tail */}
        <motion.path
          d="M150,160 Q180,130 160,100"
          stroke={bodyFill}
          strokeWidth="14"
          fill="none"
          strokeLinecap="round"
          animate={{ rotate: mood === 'happy' ? [0, 15, -15, 0] : [0, 5, -5, 0] }}
          transition={{ repeat: Infinity, duration: mood === 'happy' ? 0.5 : 2 }}
          style={{ transformOrigin: '150px 160px' }}
        />

        {/* Paws */}
        <ellipse cx="75" cy="182" rx="18" ry="12" fill={mood === 'sick' ? '#64748B' : "#EA580C"} />
        <ellipse cx="125" cy="182" rx="18" ry="12" fill={mood === 'sick' ? '#64748B' : "#EA580C"} />

        {/* Wearable items */}
        {items.includes('hat_2') && <text x="72" y="48" fontSize="36">👑</text>}
        {items.includes('hat_1') && <text x="74" y="52" fontSize="32">🧢</text>}
        {items.includes('hat_3') && <text x="74" y="100" fontSize="28">🕶️</text>}
        {items.includes('hat_4') && <text x="72" y="48" fontSize="36">🎩</text>}
        {items.includes('hat_5') && <text x="74" y="52" fontSize="32">🎓</text>}
      </motion.svg>

      {/* Floating Mood Icons */}
      {mood === 'happy' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 0], y: [-20, -80], x: [0, 30] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
          className="absolute top-10 right-10 text-3xl"
        >
          ❤️
        </motion.div>
      )}
      {mood === 'sad' && (
        <div className="absolute top-0 text-3xl animate-bounce">😿</div>
      )}
      {mood === 'sick' && (
        <div className="absolute top-0 text-3xl animate-pulse">🤒</div>
      )}

      {/* Shadow */}
      <motion.div
        animate={{ scale: mood === 'happy' ? [0.8, 0.6, 0.8] : [0.9, 0.85, 0.9] }}
        transition={{ repeat: Infinity, duration: mood === 'happy' ? 0.6 : 2 }}
        className="w-24 h-4 bg-black/10 blur-md rounded-full mt-4"
      />
    </div>
  );
}
