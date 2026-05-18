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
  getDocs,
  orderBy,
  limit
} from 'firebase/firestore';
import { Tamagotchi, Family } from '@/lib/types';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import TamagotchiCat from '@/components/tamagotchi/TamagotchiCat';
import { ActionButton } from '@/components/tamagotchi/ActionButton';
import { formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';

export default function TamagotchiPage() {
  const { user, profile } = useAuth();
  const [tamagotchi, setTamagotchi] = useState<Tamagotchi | null>(null);
  const [family, setFamily] = useState<Family | null>(null);
  const [events, setEvents] = useState<any[]>([]);
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

    // Listen to events
    const qEvents = query(
      collection(db, `tamagotchi_events/${profile.familyId}/events`),
      orderBy('timestamp', 'desc'),
      limit(10)
    );
    const unsubEvents = onSnapshot(qEvents, (snap) => {
      setEvents(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    return () => {
      unsubTama();
      unsubFamily();
      unsubEvents();
    };
  }, [profile?.familyId]);

  if (loading || !tamagotchi || !profile) return null;

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

  const stageHints = {
    egg:    'Уровень 1–3 · Выполняйте задачи и отправляйте сердечки',
    kitten: 'Уровень 4–9 · Котёнок растёт! Планируйте меню каждую неделю',
    junior: 'Уровень 10–19 · Почти взрослый! Следите за бюджетом вместе',
    adult:  'Уровень 20+ · Взрослый кот. Он с вами навсегда 🐱',
  };

  const getEventEmoji = (type: string) => {
    const emojis: any = { fed: '🍖', played: '🎮', slept: '💤', level_up: '⭐', item_bought: '🛍️', hearts_received: '❤️', task_done: '✅', menu_confirmed: '🍽️' };
    return emojis[type] || '🐾';
  };

  const getEventText = (event: any) => {
    switch (event.type) {
      case 'fed': return `${event.userName} покормил(а) кота`;
      case 'played': return `${event.userName} поиграл(а) с котом`;
      case 'slept': return `${event.userName} уложил(а) кота спать`;
      case 'level_up': return `Уровень повышен! Теперь ${tamagotchi.level}`;
      case 'item_bought': return `${event.userName}: ${event.details || 'куплен предмет'}`;
      case 'hearts_received': return `Кот счастлив от ваших сердечек!`;
      case 'task_done': return `Задача выполнена — энергия выросла!`;
      case 'menu_confirmed': return `Меню на неделю готово! Кот сыт`;
      default: return 'Что-то произошло';
    }
  };

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
        <div className="relative flex flex-col items-center">
           <TamagotchiCat stage={tamagotchi.stage} mood={getMood()} items={tamagotchi.items} />
           <p className="mt-2 text-[10px] font-black uppercase tracking-widest text-primary text-center max-w-[200px]">
             {stageHints[tamagotchi.stage as keyof typeof stageHints]}
           </p>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-3 gap-3 px-1">
          <ActionButton
            icon="🍖"
            label="Покормить"
            cooldownKey="feed"
            cooldownMinutes={30}
            stat="satiety"
            boostAmount={15}
            disabled={tamagotchi.satiety >= 95}
            familyId={profile.familyId || ''}
            userName={profile.name}
          />
          <ActionButton
            icon="🎮"
            label="Поиграть"
            cooldownKey="play"
            cooldownMinutes={60}
            stat="happiness"
            boostAmount={20}
            disabled={tamagotchi.happiness >= 95}
            familyId={profile.familyId || ''}
            userName={profile.name}
          />
          <ActionButton
            icon="💤"
            label="Уложить спать"
            cooldownKey="sleep"
            cooldownMinutes={120}
            stat="energy"
            boostAmount={25}
            disabled={tamagotchi.energy >= 95}
            familyId={profile.familyId || ''}
            userName={profile.name}
          />
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

        {/* History Feed */}
        <div className="space-y-3 pt-4">
          <h2 className="text-xs font-black uppercase tracking-widest text-muted-foreground px-1">
            История
          </h2>
          <div className="space-y-2">
            {events.map(event => (
              <div key={event.id} className="flex items-center gap-3 p-3 bg-card rounded-2xl border border-border">
                <span className="text-xl">{getEventEmoji(event.type)}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold truncate">{getEventText(event)}</p>
                  <p className="text-[10px] text-muted-foreground font-black uppercase">
                    {event.timestamp?.toDate ? formatDistanceToNow(event.timestamp.toDate(), { addSuffix: true, locale: ru }) : 'недавно'}
                  </p>
                </div>
              </div>
            ))}
            {events.length === 0 && (
              <p className="text-xs text-muted-foreground italic text-center py-4">Событий пока нет</p>
            )}
          </div>
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
