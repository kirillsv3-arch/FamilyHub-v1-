'use client';

import React, { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { doc, updateDoc, increment, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { motion } from 'framer-motion';

interface ActionButtonProps {
  icon: string;
  label: string;
  cooldownKey: string;
  cooldownMinutes: number;
  stat: 'satiety' | 'happiness' | 'energy';
  boostAmount: number;
  disabled?: boolean;
  familyId: string;
  userName: string;
}

export function ActionButton({
  icon,
  label,
  cooldownKey: key,
  cooldownMinutes,
  stat,
  boostAmount,
  disabled,
  familyId,
  userName
}: ActionButtonProps) {
  const [remainingTime, setRemainingTime] = useState(0);
  const cooldownKey = `tama_cooldown_${familyId}_${key}`;

  useEffect(() => {
    const checkCooldown = () => {
      const lastUsed = parseInt(localStorage.getItem(cooldownKey) || '0');
      const remainingMs = cooldownMinutes * 60000 - (Date.now() - lastUsed);
      setRemainingTime(Math.max(0, remainingMs));
    };

    checkCooldown();
    const interval = setInterval(checkCooldown, 1000);
    return () => clearInterval(interval);
  }, [cooldownKey, cooldownMinutes]);

  const handleAction = async () => {
    if (remainingTime > 0 || disabled) return;

    try {
      const tamaRef = doc(db, 'tamagotchi', familyId);

      // Update stats and XP
      await updateDoc(tamaRef, {
        [stat]: increment(boostAmount),
        xp: increment(10),
        lastChecked: serverTimestamp()
      });

      // Log event
      const eventTypeMap: Record<string, string> = {
        feed: 'fed',
        play: 'played',
        sleep: 'slept'
      };

      await addDoc(collection(db, `tamagotchi_events/${familyId}/events`), {
        type: eventTypeMap[key],
        userName,
        timestamp: serverTimestamp()
      });

      // Set cooldown
      localStorage.setItem(cooldownKey, Date.now().toString());
    } catch (error) {
      console.error('Tama action error:', error);
    }
  };

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const isOnCooldown = remainingTime > 0;
  const isFullyDisabled = disabled || isOnCooldown;

  return (
    <button
      onClick={handleAction}
      disabled={isFullyDisabled}
      className={`relative flex flex-col items-center gap-1.5 p-3 rounded-2xl border transition-all active:scale-95 ${
        isOnCooldown
          ? 'bg-secondary/50 border-border opacity-70 cursor-not-allowed'
          : disabled
          ? 'bg-emerald-500/10 border-emerald-500/20 opacity-50 cursor-not-allowed'
          : 'bg-card border-border hover:border-primary shadow-sm'
      }`}
    >
      <span className="text-2xl">{icon}</span>
      <span className="text-[10px] font-black uppercase tracking-tighter text-center leading-none">
        {isOnCooldown ? formatTime(remainingTime) : disabled ? (stat === 'satiety' ? 'Сыт' : stat === 'happiness' ? 'Счастлив' : 'Выспался') : label}
      </span>
      {isOnCooldown && (
        <div className="absolute inset-0 bg-black/5 rounded-2xl overflow-hidden pointer-events-none">
          <motion.div
            initial={{ height: '100%' }}
            animate={{ height: 0 }}
            transition={{ duration: remainingTime / 1000, ease: 'linear' }}
            className="absolute bottom-0 inset-x-0 bg-primary/5"
          />
        </div>
      )}
    </button>
  );
}
