'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface CatProps {
  stage: 'egg' | 'kitten' | 'junior' | 'adult';
  mood: 'happy' | 'normal' | 'sad' | 'sick';
}

export default function TamagotchiCat({ stage, mood }: CatProps) {
  const getStageSize = () => {
    switch(stage) {
      case 'egg': return 'w-24 h-32';
      case 'kitten': return 'w-32 h-32';
      case 'junior': return 'w-40 h-40';
      case 'adult': return 'w-52 h-52';
    }
  };

  const getCatEmoji = () => {
    if (stage === 'egg') return '🥚';

    switch(mood) {
      case 'happy': return '😸';
      case 'normal': return '🐱';
      case 'sad': return '😿';
      case 'sick': return '🤒';
    }
  };

  return (
    <div className="relative flex flex-col items-center justify-center h-64">
      {/* Background Glow */}
      <motion.div
        animate={{
          scale: mood === 'happy' ? [1, 1.2, 1] : [1, 1.05, 1],
          opacity: [0.1, 0.2, 0.1],
        }}
        transition={{ repeat: Infinity, duration: 3 }}
        className={`absolute inset-0 blur-3xl rounded-full ${
          mood === 'happy' ? 'bg-primary' : mood === 'sick' ? 'bg-destructive' : 'bg-primary/40'
        }`}
      />

      {/* Character */}
      <motion.div
        animate={{
          y: mood === 'happy' ? [0, -20, 0] : [0, -5, 0],
          rotate: mood === 'sad' ? [-2, 2, -2] : [0, 0, 0],
        }}
        transition={{ repeat: Infinity, duration: mood === 'happy' ? 0.6 : 2 }}
        className={`relative z-10 ${getStageSize()} flex items-center justify-center text-8xl select-none`}
      >
        {getCatEmoji()}

        {/* Floating Icons */}
        {mood === 'happy' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 0], y: [-20, -60], x: [0, 20] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
            className="absolute -top-4 -right-4 text-3xl"
          >
            ❤️
          </motion.div>
        )}
        {mood === 'sad' && (
          <motion.div
            animate={{ y: [0, 5, 0] }}
            transition={{ repeat: Infinity, duration: 1 }}
            className="absolute -top-8 left-1/2 -translate-x-1/2 text-2xl bg-card border border-border px-3 py-1 rounded-full shadow-lg"
          >
            💔
          </motion.div>
        )}
        {mood === 'sick' && (
          <div className="absolute inset-0 bg-white/20 backdrop-blur-[1px] rounded-full mix-blend-overlay" />
        )}
      </motion.div>

      {/* Shadow */}
      <motion.div
        animate={{ scale: mood === 'happy' ? [0.8, 0.6, 0.8] : [0.9, 0.85, 0.9] }}
        transition={{ repeat: Infinity, duration: mood === 'happy' ? 0.6 : 2 }}
        className="w-24 h-4 bg-black/10 blur-md rounded-full mt-4"
      />
    </div>
  );
}
