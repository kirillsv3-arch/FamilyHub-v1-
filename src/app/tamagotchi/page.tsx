'use client';

import React, { useState, useEffect } from 'react';
import {
  ChevronLeft,
  Heart,
  Zap,
  Utensils,
  Star,
  ShoppingBag,
  Info,
  Coins
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import {
  doc,
  onSnapshot,
  updateDoc,
  setDoc,
  serverTimestamp,
  collection,
  query,
  where,
  getDocs
} from 'firebase/firestore';
import { Tamagotchi, Family } from '@/lib/types';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import TamagotchiCat from '@/components/tamagotchi/TamagotchiCat';

export default function TamagotchiPage() {
  const { user, profile } = useAuth();
  const [tamagotchi, setTamagotchi] = useState<Tamagotchi | null>(null);
  const [family, setFamily] = useState<Family | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile?.familyId) return;

    // Listen to Tamagotchi state
    const unsubTama = onSnapshot(doc(db, 'tamagotchi', profile.familyId), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data() as Tamagotchi;

        if (!profile?.familyId) return;

        // Decay logic (Client-side trigger)
        const lastChecked = data.lastChecked?.toMillis() || Date.now();
        const hoursPassed = (Date.now() - lastChecked) / (1000 * 60 * 60);

        if (hoursPassed >= 1 && profile.familyId) {
          const decay = Math.floor(hoursPassed);
          const newSatiety = Math.max(0, data.satiety - decay * 2);
          const newHappiness = Math.max(0, data.happiness - decay * 2);
          const newEnergy = Math.max(0, data.energy - decay * 2);

          updateDoc(doc(db, 'tamagotchi', profile.familyId), {
            satiety: newSatiety,
            happiness: newHappiness,
            energy: newEnergy,
            lastChecked: serverTimestamp()
          });
        }

        setTamagotchi(data);
      } else {
        if (!profile?.familyId) return;

        // Initialize if not exists
        const initial: Tamagotchi = {
          familyId: profile.familyId,
          level: 1,
          xp: 0,
          satiety: 80,
          happiness: 80,
          energy: 80,
          stage: 'egg',
          items: [],
          lastChecked: serverTimestamp()
        };
        setDoc(doc(db, 'tamagotchi', profile.familyId), initial);
      }
      setLoading(false);
    });

    // Listen to Family for currency
    const unsubFamily = onSnapshot(doc(db, 'families', profile.familyId), (snapshot) => {
      if (snapshot.exists()) {
        setFamily({ id: snapshot.id, ...snapshot.data() } as Family);
      }
    });

    return () => {
      unsubTama();
      unsubFamily();
    };
  }, [profile?.familyId]);

  if (loading || !tamagotchi) return null;

  const getMood = () => {
    const avg = (tamagotchi.satiety + tamagotchi.happiness + tamagotchi.energy) / 3;
    if (avg < 20) return 'sick';
    if (avg < 50) return 'sad';
    if (avg > 90) return 'happy';
    return 'normal';
  };

  const getStatColor = (val: number) => {
    if (val < 20) return 'bg-destructive';
    if (val < 50) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const xpToNextLevel = tamagotchi.level * 100;
  const xpPercent = (tamagotchi.xp / xpToNextLevel) * 100;

  return (
    <main className="min-h-screen pb-24 bg-background">
      <header className="p-4 pt-8 flex items-center justify-between">
        <div className="flex items-center">
          <Link href="/" className="p-2 -ml-2 rounded-full hover:bg-secondary transition-colors">
            <ChevronLeft size={24} />
          </Link>
          <h1 className="text-2xl font-black ml-2">Питомец</h1>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-secondary/50 rounded-full">
          <Coins size={18} className="text-yellow-500" />
          <span className="font-black">{family?.currency || 0}</span>
        </div>
      </header>

      <div className="px-4 space-y-8">
        {/* Level and XP */}
        <div className="bg-card rounded-3xl border border-border p-6 shadow-sm">
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center gap-2">
              <Star size={20} className="text-primary fill-primary" />
              <span className="text-lg font-black tracking-tight">Уровень {tamagotchi.level}</span>
            </div>
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
              {tamagotchi.xp} / {xpToNextLevel} XP
            </span>
          </div>
          <div className="w-full h-3 bg-secondary rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${xpPercent}%` }}
              className="h-full bg-primary"
            />
          </div>
        </div>

        {/* Character Stage */}
        <div className="relative">
           <TamagotchiCat stage={tamagotchi.stage} mood={getMood()} />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 gap-4">
          <StatBar icon={<Utensils size={16} />} label="Сытость" value={tamagotchi.satiety} color={getStatColor(tamagotchi.satiety)} />
          <StatBar icon={<Heart size={16} />} label="Любовь" value={tamagotchi.happiness} color={getStatColor(tamagotchi.happiness)} />
          <StatBar icon={<Zap size={16} />} label="Энергия" value={tamagotchi.energy} color={getStatColor(tamagotchi.energy)} />
        </div>

        {/* Shop Link */}
        <div className="flex justify-center">
          <Link
            href="/tamagotchi/shop"
            className="flex items-center gap-2 px-8 py-4 bg-primary text-primary-foreground rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-105 transition-transform"
          >
            <ShoppingBag size={20} />
            Магазин предметов
          </Link>
        </div>
      </div>
    </main>
  );
}

function StatBar({ icon, label, value, color }: { icon: React.ReactNode, label: string, value: number, color: string }) {
  return (
    <div className="bg-card rounded-2xl border border-border p-4 flex items-center gap-4">
      <div className={`p-2 rounded-xl text-white ${color} shadow-sm`}>
        {icon}
      </div>
      <div className="flex-1 space-y-1.5">
        <div className="flex justify-between items-center">
          <span className="text-xs font-black uppercase tracking-widest text-muted-foreground">{label}</span>
          <span className="text-xs font-black">{value}%</span>
        </div>
        <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${value}%` }}
            className={`h-full ${color}`}
          />
        </div>
      </div>
    </div>
  );
}
