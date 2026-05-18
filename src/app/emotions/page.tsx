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
import AtmosphereChart from '@/components/emotions/AtmosphereChart';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow, differenceInHours } from 'date-fns';
import { ru } from 'date-fns/locale';

export default function EmotionsPage() {
  const { user, profile } = useAuth();
  const [partner, setPartner] = useState<any>(null);
  const [sentCount, setSentCount] = useState(0);
  const [receivedCount, setReceivedCount] = useState(0);
  const [period, setPeriod] = useState<'all' | 'month'>('month');
  const [incomingHearts, setIncomingHearts] = useState<{ id: string; count: number } | null>(null);
  const [isAtmosphereOpen, setIsAtmosphereOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Real-time partner data listener
  useEffect(() => {
    if (!profile?.familyId || !user?.uid) return;

    let unsubscribePartner: () => void;

    const setupPartnerListener = async () => {
      let partnerUid = profile.partnerId;

      // If no partnerId, find the first other family member (One-time check, no direct setDoc here to avoid loops)
      if (!partnerUid) {
        const q = query(
          collection(db, 'users'),
          where('familyId', '==', profile.familyId)
        );
        const querySnapshot = await getDocs(q);
        const partnerDoc = querySnapshot.docs.find(d => d.id !== user.uid);
        if (partnerDoc) {
          partnerUid = partnerDoc.id;
          // We don't call setDoc here because profile update triggers this effect again.
          // Instead, we just use the ID for the listener.
        }
      }

      if (partnerUid) {
        unsubscribePartner = onSnapshot(doc(db, 'users', partnerUid), (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            setPartner((prev: any) => {
              const newData = { uid: docSnap.id, ...data };
              if (JSON.stringify(prev) === JSON.stringify(newData)) return prev;
              return newData;
            });
          }
        }, (error) => console.warn("Partner listener error:", error));
      }
    };

    setupPartnerListener();
    return () => {
      if (unsubscribePartner) unsubscribePartner();
    };
  }, [profile?.familyId, profile?.partnerId, user?.uid]);

  // Listen to heart stats
  useEffect(() => {
    if (!user?.uid) return;
    const currentMonth = new Date().toISOString().slice(0, 7);
    const docId = period === 'all' ? 'total' : currentMonth;

    const unsub = onSnapshot(doc(db, 'users', user.uid, 'heart_stats', docId), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        // Update only if values actually changed to prevent re-renders
        setSentCount(prev => (prev !== data.sent ? (data.sent || 0) : prev));
        setReceivedCount(prev => (prev !== data.received ? (data.received || 0) : prev));
      } else {
        setSentCount(0);
        setReceivedCount(0);
      }
    }, (error) => {
      console.warn("Heart stats listener error:", error);
    });

    return () => unsub();
  }, [user?.uid, period]);

  // Listen for incoming heart signals - optimized and safer
  useEffect(() => {
    if (!user?.uid) return;

    const q = query(
      collection(db, 'heart_signals'),
      where('receiverId', '==', user.uid)
    );

    const unsub = onSnapshot(q, (snapshot) => {
      // metadata.hasPendingWrites check to avoid processing our own deletions as changes
      if (snapshot.empty || snapshot.metadata.hasPendingWrites) return;

      // Find the most recent signal from the added changes
      const additions = snapshot.docChanges()
        .filter(change => change.type === 'added')
        .map(change => ({ id: change.doc.id, ...change.doc.data() as any }))
        .sort((a, b) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0));

      if (additions.length > 0) {
        const latest = additions[0];

        // Only trigger if it's a "fresh" signal (from the last 10 seconds)
        // to avoid old signals stored in the database
        const now = Date.now();
        const signalTime = latest.timestamp?.toMillis() || now;
        if (now - signalTime < 10000) {
          setIncomingHearts({ id: latest.id, count: latest.count });

          // Delete the signal after processing to prevent replays
          deleteDoc(doc(db, 'heart_signals', latest.id)).catch(console.error);

          // Clear animation state after 3 seconds
          const timer = setTimeout(() => setIncomingHearts(null), 3000);
          return () => clearTimeout(timer);
        }
      }
    }, (error) => {
      console.warn("Heart signals listener error:", error);
    });

    return () => unsub();
  }, [user?.uid]);

  const handleSendHearts = async (count: number) => {
    if (!user || !partner) return;

    // Optimistic update
    setSentCount(prev => prev + count);

    try {
      const token = await user.getIdToken();
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000); // 8s timeout

      const response = await fetch('/api/emotions/send-hearts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          receiverId: partner.uid,
          count
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Error: ${response.status}`);
      }
    } catch (error: any) {
      console.error('Failed to send hearts:', error);
      // Revert optimistic update on failure
      setSentCount(prev => prev - count);
    }
  };

  const handleUpdateEmotions = async (emotions: any) => {
    if (!user || JSON.stringify(emotions) === JSON.stringify(profile?.emotions)) return;
    setIsSaving(true);
    try {
      const token = await user.getIdToken();
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      const response = await fetch('/api/emotions/update-state', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ emotions }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Error: ${response.status}`);
      }
    } catch (error) {
      console.error('Failed to update emotions:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateStatus = async (statusTag: any) => {
    if (!user || JSON.stringify(statusTag) === JSON.stringify(profile?.statusTag)) return;
    setIsSaving(true);
    try {
      const token = await user.getIdToken();
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      const response = await fetch('/api/emotions/update-state', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ statusTag }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Error: ${response.status}`);
      }
    } catch (error) {
      console.error('Failed to update status:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const atmosphereIndex = calculateAtmosphereIndex(profile?.emotions, partner?.emotions);
  const partnerAvg = partner?.emotions ? (partner.emotions.mood + partner.emotions.energy + partner.emotions.sleep + (11 - partner.emotions.stress)) / 4 * 10 : 100;
  const showCheckInBanner = !profile?.emotions?.updatedAt || differenceInHours(new Date(), profile.emotions.updatedAt.toDate()) > 20;

  return (
    <main className="min-h-screen pb-24 bg-zinc-950 text-zinc-100">
      {/* Header */}
      <header className="p-4 pt-8 sticky top-0 bg-zinc-950/80 backdrop-blur-lg z-50">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <Link href="/" className="p-2 -ml-2 rounded-full hover:bg-zinc-800 transition-colors">
              <ChevronLeft size={24} />
            </Link>
          <div className="ml-2">
            <h1 className="text-2xl font-bold leading-none">Эмоции</h1>
            <AnimatePresence>
              {isSaving && (
                <motion.span
                  initial={{ opacity: 0, x: -5 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 5 }}
                  className="text-[9px] font-black uppercase tracking-[0.2em] text-rose-500 absolute"
                >
                  Сохранение...
                </motion.span>
              )}
            </AnimatePresence>
          </div>
          </div>
          <button
            onClick={() => setPeriod(period === 'all' ? 'month' : 'all')}
            className="px-4 py-1.5 bg-zinc-900 border border-zinc-800 rounded-full text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-white transition-colors"
          >
            {period === 'month' ? 'Месяц' : 'Все время'}
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 rounded-[2rem] bg-zinc-900/50 border border-white/5 backdrop-blur-sm shadow-xl">
            <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-1">Отправлено</p>
            <div className="flex items-baseline space-x-1">
              <span className="text-2xl font-black text-white">{sentCount}</span>
              <span className="text-red-500 text-sm">❤️</span>
            </div>
          </div>
          <div className="p-4 rounded-[2rem] bg-zinc-900/50 border border-white/5 backdrop-blur-sm shadow-xl">
            <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-1">Получено</p>
            <div className="flex items-baseline space-x-1">
              <span className="text-2xl font-black text-white">{receivedCount}</span>
              <span className="text-red-500 text-sm">❤️</span>
            </div>
          </div>
        </div>
      </header>

      <div className="p-4 space-y-10 relative z-0">
        {/* Daily check-in banner */}
        {showCheckInBanner && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mx-1 p-4 rounded-2xl bg-primary/10 border border-primary/20 flex items-center gap-3"
          >
            <span className="text-2xl">🌅</span>
            <div>
              <p className="text-sm font-bold text-primary">Как ты сегодня?</p>
              <p className="text-xs text-zinc-400">Обнови своё состояние — партнёр увидит</p>
            </div>
          </motion.div>
        )}

        {/* Real-time incoming heart animation */}
        <AnimatePresence>
          {incomingHearts && (
            <motion.div
              initial={{ opacity: 0, scale: 0.5, y: 50 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 1.5, y: -100 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[2px]"
            >
              <div className="relative flex flex-col items-center">
                <div className="relative">
                  <div className="text-[120px] filter drop-shadow-[0_0_30px_rgba(244,63,94,0.5)] animate-bounce">❤️</div>
                  <div className="absolute -top-2 -right-2 bg-white text-rose-500 px-6 py-2 rounded-full font-black text-2xl shadow-[0_10px_30px_rgba(0,0,0,0.3)] border-2 border-rose-100">
                    +{incomingHearts.count}
                  </div>
                </div>
                <div className="bg-zinc-900/80 backdrop-blur-md px-6 py-3 rounded-full border border-white/10 mt-8 shadow-2xl">
                  <p className="text-center font-black text-white text-lg tracking-tight">
                    {partner?.name || 'Партнер'} шлет любовь!
                  </p>
                </div>

                <div className="flex gap-3 mt-8 pointer-events-auto">
                  <button
                    onClick={() => {
                      handleSendHearts(1);
                      setIncomingHearts(null);
                    }}
                    className="px-8 py-4 bg-rose-500 text-white rounded-full font-black text-sm shadow-lg shadow-rose-500/20 active:scale-95 transition-all"
                  >
                    ❤️ Ответить
                  </button>
                  <button
                    onClick={() => setIncomingHearts(null)}
                    className="px-8 py-4 bg-zinc-800 text-zinc-300 rounded-full font-black text-sm active:scale-95 transition-all"
                  >
                    🙂 Принято
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 1. Atmosphere Widget */}
        <div className="px-1">
          <AtmosphereWidget
            index={atmosphereIndex}
            onClick={() => setIsAtmosphereOpen(true)}
          />
        </div>

        {/* 2. Interactive Heart */}
        <div className="flex flex-col items-center py-4">
          <HeartComponent onSend={handleSendHearts} />
        </div>

        {/* 3. Status Tags */}
        <div className="px-1">
          <StatusTags
            currentTag={profile?.statusTag}
            onSelect={handleUpdateStatus}
          />
        </div>

        {/* 4. My State Sliders */}
        <div className="px-1">
          <EmotionSliders
            initialState={profile?.emotions}
            onSave={handleUpdateEmotions}
            lastUpdated={profile?.emotions?.updatedAt ? `Обновлено ${formatDistanceToNow(profile.emotions.updatedAt.toDate(), { addSuffix: true, locale: ru })}` : undefined}
          />
        </div>

        {/* 5. Partner State */}
        <div className="px-1 pt-4">
          {partner ? (
            <div className="space-y-4">
              <div className="flex items-center space-x-2 px-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse" />
                <span className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">Партнер на связи</span>
              </div>
              <EmotionSliders
                title={`Как там ${partner.name}?`}
                initialState={partner.emotions}
                onSave={() => {}}
                disabled={true}
                lastUpdated={partner.emotions?.updatedAt ? `Обновлено ${formatDistanceToNow(partner.emotions.updatedAt.toDate(), { addSuffix: true, locale: ru })}` : undefined}
                updatedAt={partner.emotions?.updatedAt}
              />
              {partnerAvg < 40 && (
                <div className="mt-4 p-4 rounded-2xl bg-rose-950/40 border border-rose-900/50">
                  <p className="text-sm text-rose-300 font-medium">
                    💙 Кажется, {partner.name} сейчас нелегко. Может, написать или обнять?
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="p-10 border border-dashed border-zinc-800 rounded-[2.5rem] bg-zinc-900/20 flex flex-col items-center justify-center text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-zinc-900 flex items-center justify-center">
                <Info size={20} className="text-zinc-600" />
              </div>
              <p className="text-sm font-medium text-zinc-500">Партнер еще не подключен<br/>или не установил статус</p>
            </div>
          )}
        </div>
      </div>

      {/* Atmosphere Sheet/Modal Placeholder */}
      <AnimatePresence>
        {isAtmosphereOpen && (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-md">
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="w-full max-w-xl bg-zinc-900 rounded-t-[3rem] p-8 pb-12 space-y-8 max-h-[85vh] overflow-y-auto border-t border-white/10 shadow-[0_-20px_50px_rgba(0,0,0,0.5)]"
            >
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-black tracking-tight">Динамика атмосферы</h2>
                <button
                  onClick={() => setIsAtmosphereOpen(false)}
                  className="p-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white rounded-full transition-colors"
                >
                  <ChevronLeft size={24} className="rotate-[270deg]" />
                </button>
              </div>

              <AtmosphereChart userId={user?.uid || ''} />

              <div className="space-y-5">
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 ml-2">Как это работает?</h3>
                <div className="grid gap-4">
                  {[
                    'Мы анализируем настроение, энергию, сон и уровень стресса.',
                    'Стресс инвертируется в "спокойствие" для баланса формулы.',
                    'Берется среднее значение показателей обоих партнеров.',
                    'Обновляйте статус ежедневно для точности!'
                  ].map((text, i) => (
                    <div key={i} className="flex items-start space-x-4 p-5 rounded-[2rem] bg-zinc-950 border border-white/5 shadow-xl">
                      <div className="mt-0.5 p-1.5 bg-zinc-900 rounded-lg">
                        <Info size={16} className="text-rose-500" />
                      </div>
                      <p className="text-sm font-bold text-zinc-300 leading-snug">{text}</p>
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
