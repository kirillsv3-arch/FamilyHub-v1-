'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { ChevronLeft, TrendingUp, History, Info } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import {
  doc,
  onSnapshot,
  collection,
  query,
  where,
  getDocs,
  deleteDoc,
  orderBy,
  limit,
  setDoc,
  getDoc
} from 'firebase/firestore';
import { calculateAtmosphereIndex, cn } from '@/lib/utils';
import HeartComponent from '@/components/emotions/HeartComponent';
import EmotionSliders from '@/components/emotions/EmotionSliders';
import AtmosphereWidget from '@/components/emotions/AtmosphereWidget';
import StatusTags from '@/components/emotions/StatusTags';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';

export default function EmotionsPage() {
  const { user, profile } = useAuth();
  const [partner, setPartner] = useState<any>(null);
  const [sentCount, setSentCount] = useState(0);
  const [receivedCount, setReceivedCount] = useState(0);
  const [period, setPeriod] = useState<'all' | 'month'>('month');
  const [incomingHearts, setIncomingHearts] = useState<{ id: string; count: number } | null>(null);
  const [isAtmosphereOpen, setIsAtmosphereOpen] = useState(false);

  // Fetch partner data
  useEffect(() => {
    if (!profile?.familyId || !user) return;

    const fetchPartner = async () => {
      // Use partnerId if explicitly set
      if (profile.partnerId) {
        const partnerDoc = await getDoc(doc(db, 'users', profile.partnerId));
        if (partnerDoc.exists()) {
          setPartner({ uid: partnerDoc.id, ...partnerDoc.data() });
          return;
        }
      }

      // Fallback: search for partner in the family if not set yet
      const q = query(
        collection(db, 'users'),
        where('familyId', '==', profile.familyId)
      );
      const querySnapshot = await getDocs(q);
      const partnerDoc = querySnapshot.docs.find(d => d.id !== user.uid);
      if (partnerDoc) {
        setPartner({ uid: partnerDoc.id, ...partnerDoc.data() });
        // Implicitly set partnerId for the future to fix the logic
        await setDoc(doc(db, 'users', user.uid), { partnerId: partnerDoc.id }, { merge: true });
      }
    };

    fetchPartner();
  }, [profile?.familyId, profile?.partnerId, user]);

  // Listen to heart stats
  useEffect(() => {
    if (!user) return;
    const currentMonth = new Date().toISOString().slice(0, 7);
    const docId = period === 'all' ? 'total' : currentMonth;

    const unsub = onSnapshot(doc(db, 'users', user.uid, 'heart_stats', docId), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setSentCount(data.sent || 0);
        setReceivedCount(data.received || 0);
      } else {
        setSentCount(0);
        setReceivedCount(0);
      }
    });

    return () => unsub();
  }, [user, period]);

  // Listen for incoming heart signals
  useEffect(() => {
    if (!user) return;

    // To avoid composite index requirement, we remove orderBy on the server side
    // and handle the latest signal logic on the client.
    const q = query(
      collection(db, 'heart_signals'),
      where('receiverId', '==', user.uid)
    );

    const unsub = onSnapshot(q, (snapshot) => {
      // Find the most recent signal from the added changes
      const additions = snapshot.docChanges()
        .filter(change => change.type === 'added')
        .map(change => ({ id: change.doc.id, ...change.doc.data() as any }))
        .sort((a, b) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0));

      if (additions.length > 0) {
        const latest = additions[0];
        setIncomingHearts({ id: latest.id, count: latest.count });

        // Delete the signal after processing to prevent replays
        deleteDoc(doc(db, 'heart_signals', latest.id));

        // Clear animation state after 3 seconds
        setTimeout(() => setIncomingHearts(null), 3000);
      }
    });

    return () => unsub();
  }, [user]);

  const handleSendHearts = async (count: number) => {
    if (!user || !partner) return;

    // Optimistic update
    setSentCount(prev => prev + count);

    try {
      await fetch('/api/emotions/send-hearts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderId: user.uid,
          receiverId: partner.uid,
          count
        })
      });
    } catch (error) {
      console.error('Failed to send hearts:', error);
    }
  };

  const handleUpdateEmotions = async (emotions: any) => {
    if (!user) return;
    try {
      await fetch('/api/emotions/update-state', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.uid, emotions })
      });
    } catch (error) {
      console.error('Failed to update emotions:', error);
    }
  };

  const handleUpdateStatus = async (statusTag: any) => {
    if (!user) return;
    try {
      await fetch('/api/emotions/update-state', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.uid, statusTag })
      });
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  const atmosphereIndex = calculateAtmosphereIndex(profile?.emotions, partner?.emotions);

  return (
    <main className="min-h-screen pb-24 bg-background">
      {/* Header */}
      <header className="p-4 pt-8 sticky top-0 bg-background/80 backdrop-blur-md z-10">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <Link href="/" className="p-2 -ml-2 rounded-full hover:bg-secondary transition-colors">
              <ChevronLeft size={24} />
            </Link>
            <h1 className="text-2xl font-bold ml-2">Эмоции</h1>
          </div>
          <button
            onClick={() => setPeriod(period === 'all' ? 'month' : 'all')}
            className="px-3 py-1 bg-secondary rounded-full text-xs font-bold uppercase tracking-wider"
          >
            {period === 'month' ? 'Месяц' : 'Все время'}
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 rounded-2xl bg-card border border-border shadow-sm">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">Отправлено</p>
            <div className="flex items-baseline space-x-1">
              <span className="text-2xl font-black text-primary">{sentCount}</span>
              <span className="text-red-500">❤️</span>
            </div>
          </div>
          <div className="p-4 rounded-2xl bg-card border border-border shadow-sm">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">Получено</p>
            <div className="flex items-baseline space-x-1">
              <span className="text-2xl font-black text-primary">{receivedCount}</span>
              <span className="text-red-500">❤️</span>
            </div>
          </div>
        </div>
      </header>

      <div className="p-4 space-y-8">
        {/* Real-time incoming heart animation */}
        <AnimatePresence>
          {incomingHearts && (
            <motion.div
              initial={{ opacity: 0, scale: 0.5, y: 50 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 1.5, y: -100 }}
              className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center"
            >
              <div className="relative">
                <div className="text-8xl animate-bounce">❤️</div>
                <div className="absolute -top-4 -right-4 bg-primary text-primary-foreground px-4 py-2 rounded-full font-black text-xl shadow-2xl">
                  +{incomingHearts.count}
                </div>
                <p className="text-center font-bold text-xl mt-4 drop-shadow-lg">
                  {partner?.name || 'Партнер'} шлет любовь!
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 1. Atmosphere Widget */}
        <AtmosphereWidget
          index={atmosphereIndex}
          onClick={() => setIsAtmosphereOpen(true)}
        />

        {/* 2. Interactive Heart */}
        <div className="flex flex-col items-center">
          <HeartComponent onSend={handleSendHearts} />
        </div>

        {/* 3. Status Tags */}
        <StatusTags
          currentTag={profile?.statusTag}
          onSelect={handleUpdateStatus}
        />

        {/* 4. My State Sliders */}
        <div className="relative z-0">
          <EmotionSliders
            initialState={profile?.emotions}
            onSave={handleUpdateEmotions}
            lastUpdated={profile?.emotions?.updatedAt ? `Обновлено ${formatDistanceToNow(profile.emotions.updatedAt.toDate(), { addSuffix: true, locale: ru })}` : undefined}
          />
        </div>

        {/* 5. Partner State */}
        {partner && (
          <EmotionSliders
            title={`Статус ${partner.name}`}
            initialState={partner.emotions}
            onSave={() => {}}
            disabled={true}
            lastUpdated={partner.emotions?.updatedAt ? `Обновлено ${formatDistanceToNow(partner.emotions.updatedAt.toDate(), { addSuffix: true, locale: ru })}` : undefined}
          />
        )}
      </div>

      {/* Atmosphere Sheet/Modal Placeholder */}
      <AnimatePresence>
        {isAtmosphereOpen && (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm">
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="w-full max-w-xl bg-card rounded-t-[32px] p-8 space-y-8 max-h-[80vh] overflow-y-auto border-t border-border"
            >
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-black">Динамика атмосферы</h2>
                <button
                  onClick={() => setIsAtmosphereOpen(false)}
                  className="p-2 bg-secondary rounded-full"
                >
                  <ChevronLeft size={24} className="rotate-270" />
                </button>
              </div>

              <div className="p-12 border-2 border-dashed border-border rounded-3xl flex flex-col items-center text-center space-y-4">
                <TrendingUp size={48} className="text-muted-foreground opacity-20" />
                <p className="text-muted-foreground font-medium">
                  Здесь будет отображаться график изменения индекса за неделю.
                  Функционал в разработке.
                </p>
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Как это работает?</h3>
                <div className="grid gap-3">
                  {[
                    'Мы анализируем настроение, энергию, сон и уровень стресса.',
                    'Стресс инвертируется в "спокойствие" для баланса формулы.',
                    'Берется среднее значение показателей обоих партнеров.',
                    'Обновляйте статус ежедневно для точности!'
                  ].map((text, i) => (
                    <div key={i} className="flex items-start space-x-3 p-3 rounded-xl bg-secondary/30">
                      <div className="mt-1"><Info size={16} className="text-primary" /></div>
                      <p className="text-sm font-medium">{text}</p>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </main>
  );
}
