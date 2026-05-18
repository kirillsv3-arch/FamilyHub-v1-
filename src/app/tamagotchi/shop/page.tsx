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
  writeBatch,
  collection
} from 'firebase/firestore';
import { Tamagotchi, Family, TamagotchiItem } from '@/lib/types';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

const SHOP_ITEMS: TamagotchiItem[] = [
  // Головные уборы
  { id: 'hat_1', name: 'Кепка', price: 50, image: '🧢', category: 'hat' },
  { id: 'hat_2', name: 'Корона', price: 500, image: '👑', category: 'hat' },
  { id: 'hat_3', name: 'Очки', price: 100, image: '🕶️', category: 'hat' },
  { id: 'hat_4', name: 'Шляпа волшебника', price: 350, image: '🎩', category: 'hat' },
  { id: 'hat_5', name: 'Шапка', price: 80, image: '🎓', category: 'hat' },
  // Декор
  { id: 'decor_1', name: 'Уютный коврик', price: 150, image: '🧶', category: 'decor' },
  { id: 'decor_2', name: 'Мышка-игрушка', price: 80, image: '🐭', category: 'decor' },
  { id: 'decor_3', name: 'Рыбка', price: 200, image: '🐠', category: 'decor' },
  { id: 'decor_4', name: 'Клубок ниток', price: 60, image: '🧵', category: 'decor' },
  // Мебель
  { id: 'furniture_1', name: 'Кроватка', price: 300, image: '🛏️', category: 'furniture' },
  { id: 'furniture_2', name: 'Когтеточка', price: 250, image: '🪵', category: 'furniture' },
  { id: 'furniture_3', name: 'Домик', price: 600, image: '🏠', category: 'furniture' },
  // Еда
  { id: 'food_1', name: 'Рыбный деликатес', price: 30, image: '🐟', category: 'food' },
  { id: 'food_2', name: 'Тунец премиум', price: 80, image: '🍣', category: 'food' },
];

const CATEGORIES = [
  { id: 'all', name: 'Все' },
  { id: 'hat', name: 'Шляпы' },
  { id: 'decor', name: 'Декор' },
  { id: 'furniture', name: 'Мебель' },
  { id: 'food', name: 'Еда' },
];

export default function TamagotchiShopPage() {
  const { profile } = useAuth();
  const [tamagotchi, setTamagotchi] = useState<Tamagotchi | null>(null);
  const [family, setFamily] = useState<Family | null>(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [activeCategory, setActiveTab] = useState('all');

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
    const isFood = item.category === 'food';
    if (!isFood && tamagotchi.items.includes(item.id)) return;

    setPurchasing(item.id);
    try {
      const batch = writeBatch(db);

      // Deduct coins from family
      batch.update(doc(db, 'families', family.id), {
        currency: increment(-item.price)
      });

      if (isFood) {
        // Boost stats immediately
        batch.update(doc(db, 'tamagotchi', family.id), {
          satiety: increment(20),
          xp: increment(15),
          lastChecked: serverTimestamp()
        });
      } else {
        // Add item to tamagotchi
        batch.update(doc(db, 'tamagotchi', family.id), {
          items: [...tamagotchi.items, item.id]
        });
      }

      // Log event
      const eventRef = doc(collection(db, `tamagotchi_events/${family.id}/events`));
      batch.set(eventRef, {
        type: 'item_bought',
        userName: profile?.name || 'Кто-то',
        details: isFood ? `Скормлено: ${item.name}` : `Куплено: ${item.name}`,
        timestamp: serverTimestamp()
      });

      await batch.commit();
    } catch (error) {
      console.error('Purchase error:', error);
    } finally {
      setPurchasing(null);
    }
  };

  if (loading || !tamagotchi) return null;

  const filteredItems = activeCategory === 'all'
    ? SHOP_ITEMS
    : SHOP_ITEMS.filter(i => i.category === activeCategory);

  return (
    <main className="min-h-screen pb-24 bg-background">
      <header className="p-4 pt-8 sticky top-0 bg-background/80 backdrop-blur-md z-30 border-b border-border">
        <div className="flex items-center justify-between mb-4">
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

        {/* Category Tabs */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveTab(cat.id)}
              className={cn(
                "px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest whitespace-nowrap transition-all",
                activeCategory === cat.id ? "bg-primary text-white shadow-lg shadow-primary/20" : "bg-secondary text-muted-foreground"
              )}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </header>

      <div className="p-4 grid grid-cols-2 gap-4">
        {filteredItems.map((item) => {
          const isOwned = tamagotchi.items.includes(item.id);
          const isFood = item.category === 'food';
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
