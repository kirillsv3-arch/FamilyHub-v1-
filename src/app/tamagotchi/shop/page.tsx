'use client';

import React, { useState, useEffect } from 'react';
import {
  ChevronLeft,
  Coins,
  ShoppingBag,
  Check,
  X
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import {
  doc,
  onSnapshot,
  updateDoc,
  serverTimestamp,
  increment,
  writeBatch
} from 'firebase/firestore';
import { Tamagotchi, Family, TamagotchiItem } from '@/lib/types';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

const SHOP_ITEMS: TamagotchiItem[] = [
  { id: 'hat_1', name: 'Красная кепка', price: 50, image: '🧢', category: 'hat' },
  { id: 'hat_2', name: 'Корона', price: 500, image: '👑', category: 'hat' },
  { id: 'hat_3', name: 'Очки', price: 100, image: '🕶️', category: 'hat' },
  { id: 'decor_1', name: 'Коврик', price: 150, image: '🧶', category: 'decor' },
  { id: 'decor_2', name: 'Игрушка мышка', price: 80, image: '🐭', category: 'decor' },
  { id: 'furniture_1', name: 'Кроватка', price: 300, image: '🛏️', category: 'furniture' },
];

export default function TamagotchiShopPage() {
  const { profile } = useAuth();
  const [tamagotchi, setTamagotchi] = useState<Tamagotchi | null>(null);
  const [family, setFamily] = useState<Family | null>(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<string | null>(null);

  useEffect(() => {
    if (!profile?.familyId) return;

    const unsubTama = onSnapshot(doc(db, 'tamagotchi', profile.familyId), (snapshot) => {
      if (snapshot.exists()) setTamagotchi(snapshot.data() as Tamagotchi);
      setLoading(false);
    });

    const unsubFamily = onSnapshot(doc(db, 'families', profile.familyId), (snapshot) => {
      if (snapshot.exists()) setFamily({ id: snapshot.id, ...snapshot.data() } as Family);
    });

    return () => {
      unsubTama();
      unsubFamily();
    };
  }, [profile?.familyId]);

  const buyItem = async (item: TamagotchiItem) => {
    if (!family || !tamagotchi || (family.currency || 0) < item.price) return;
    if (tamagotchi.items.includes(item.id)) return;

    setPurchasing(item.id);
    try {
      const batch = writeBatch(db);

      // Deduct coins from family
      batch.update(doc(db, 'families', family.id), {
        currency: increment(-item.price)
      });

      // Add item to tamagotchi
      batch.update(doc(db, 'tamagotchi', family.id), {
        items: [...tamagotchi.items, item.id]
      });

      await batch.commit();
    } catch (error) {
      console.error('Purchase error:', error);
    } finally {
      setPurchasing(null);
    }
  };

  if (loading || !tamagotchi) return null;

  return (
    <main className="min-h-screen pb-24 bg-background">
      <header className="p-4 pt-8 sticky top-0 bg-background/80 backdrop-blur-md z-10 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Link href="/tamagotchi" className="p-2 -ml-2 rounded-full hover:bg-secondary transition-colors">
              <ChevronLeft size={24} />
            </Link>
            <h1 className="text-xl font-bold ml-2">Магазин</h1>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-secondary rounded-full">
            <Coins size={18} className="text-yellow-500" />
            <span className="font-black">{family?.currency || 0}</span>
          </div>
        </div>
      </header>

      <div className="p-4 grid grid-cols-2 gap-4">
        {SHOP_ITEMS.map((item) => {
          const isOwned = tamagotchi.items.includes(item.id);
          const canAfford = (family?.currency || 0) >= item.price;

          return (
            <motion.button
              key={item.id}
              whileTap={!isOwned && canAfford ? { scale: 0.95 } : {}}
              onClick={() => buyItem(item)}
              disabled={isOwned || !canAfford || purchasing === item.id}
              className={`p-5 rounded-[32px] border flex flex-col items-center text-center space-y-3 transition-all relative overflow-hidden ${
                isOwned
                ? 'bg-secondary/20 border-transparent opacity-60'
                : 'bg-card border-border shadow-sm active:shadow-inner'
              }`}
            >
              <div className="text-5xl mb-2">{item.image}</div>
              <div className="space-y-1">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{item.name}</p>
                {!isOwned && (
                  <div className="flex items-center justify-center gap-1">
                    <Coins size={14} className="text-yellow-500" />
                    <span className={`font-black ${!canAfford ? 'text-destructive' : ''}`}>{item.price}</span>
                  </div>
                )}
              </div>

              {isOwned && (
                <div className="absolute top-2 right-2 p-1 bg-green-500 text-white rounded-full">
                  <Check size={12} />
                </div>
              )}

              {purchasing === item.id && (
                <div className="absolute inset-0 bg-background/50 flex items-center justify-center">
                  <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </motion.button>
          );
        })}
      </div>
    </main>
  );
}
