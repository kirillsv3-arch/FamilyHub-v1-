'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { Tamagotchi } from '@/lib/types';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import TamagotchiCat from './TamagotchiCat';

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

  const isStressed = tamagotchi.satiety < 20 || tamagotchi.happiness < 20 || tamagotchi.energy < 20;

  return (
    <Link href="/tamagotchi">
      <motion.div
        whileTap={{ scale: 0.95 }}
        animate={isStressed ? { borderColor: ['#27272a', '#ef4444', '#27272a'] } : {}}
        transition={{ repeat: Infinity, duration: 2 }}
        className={cn(
          "p-3 bg-card border rounded-2xl shadow-sm flex items-center gap-3 active:bg-secondary transition-all",
          isStressed ? "border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.1)]" : "border-border"
        )}
      >
        <div className="w-10 h-10 flex items-center justify-center bg-zinc-900 rounded-xl overflow-hidden">
           <div className="scale-[0.25] transform-gpu">
              <TamagotchiCat
                stage={tamagotchi.stage}
                mood={
                  (Math.max(0, tamagotchi.satiety) + Math.max(0, tamagotchi.happiness) + Math.max(0, tamagotchi.energy)) / 3 < 20 ? 'sick' :
                  (Math.max(0, tamagotchi.satiety) + Math.max(0, tamagotchi.happiness) + Math.max(0, tamagotchi.energy)) / 3 < 50 ? 'sad' :
                  (Math.max(0, tamagotchi.satiety) + Math.max(0, tamagotchi.happiness) + Math.max(0, tamagotchi.energy)) / 3 > 90 ? 'happy' : 'normal'
                }
                items={tamagotchi.items}
              />
           </div>
        </div>
        <div className="flex-1">
          <p className="text-[10px] font-black uppercase tracking-tighter text-muted-foreground leading-none mb-1.5">Питомец</p>
          <div className="flex gap-1">
            {[tamagotchi.satiety, tamagotchi.happiness, tamagotchi.energy].map((v, i) => (
              <div
                key={i}
                className={cn(
                  "w-1.5 h-1.5 rounded-full transition-colors",
                  v < 20 ? 'bg-red-500' : v < 50 ? 'bg-yellow-500' : 'bg-green-500'
                )}
              />
            ))}
          </div>
        </div>
      </motion.div>
    </Link>
  );
}
