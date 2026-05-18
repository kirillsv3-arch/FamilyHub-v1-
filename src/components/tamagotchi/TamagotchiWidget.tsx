'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { Tamagotchi } from '@/lib/types';
import Link from 'next/link';
import { motion } from 'framer-motion';

export default function TamagotchiWidget() {
  const { profile } = useAuth();
  const [tamagotchi, setTamagotchi] = useState<Tamagotchi | null>(null);

  useEffect(() => {
    if (!profile?.familyId) return;
    return onSnapshot(doc(db, 'tamagotchi', profile.familyId), (snapshot) => {
      if (snapshot.exists()) setTamagotchi(snapshot.data() as Tamagotchi);
    });
  }, [profile?.familyId]);

  if (!tamagotchi) return null;

  const getEmoji = () => {
    if (tamagotchi.stage === 'egg') return '🥚';
    const avg = (tamagotchi.satiety + tamagotchi.happiness + tamagotchi.energy) / 3;
    if (avg < 20) return '🤒';
    if (avg < 50) return '😿';
    if (avg > 90) return '😸';
    return '🐱';
  };

  return (
    <Link href="/tamagotchi">
      <motion.div
        whileTap={{ scale: 0.9 }}
        className="p-3 bg-card border border-border rounded-2xl shadow-sm flex items-center gap-3 active:bg-secondary transition-colors"
      >
        <div className="text-3xl animate-bounce-slow">{getEmoji()}</div>
        <div className="flex-1">
          <p className="text-[10px] font-black uppercase tracking-tighter text-muted-foreground leading-none mb-1">Питомец</p>
          <div className="w-full h-1 bg-secondary rounded-full overflow-hidden">
            <div
              className="h-full bg-primary"
              style={{ width: `${(tamagotchi.satiety + tamagotchi.happiness + tamagotchi.energy) / 3}%` }}
            />
          </div>
        </div>
      </motion.div>
    </Link>
  );
}
