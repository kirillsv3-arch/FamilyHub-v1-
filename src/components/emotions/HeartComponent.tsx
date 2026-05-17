'use client';

import React, { useState, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { useLongPress } from 'use-long-press';
import confetti from 'canvas-confetti';

interface HeartComponentProps {
  onSend: (count: number) => void;
}

export default function HeartComponent({ onSend }: HeartComponentProps) {
  const [isPressing, setIsPressing] = useState(false);
  const [charge, setCharge] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const fireConfetti = useCallback(() => {
    const scalar = 2;
    const heart = confetti.shapeFromText({ text: '❤️', scalar });

    confetti({
      shapes: [heart],
      particleCount: 15,
      spread: 70,
      origin: { y: 0.5, x: 0.5 },
      colors: ['#ff0000', '#ff4d4d', '#ff8080'],
      scalar
    });
  }, []);

  const handleTick = useCallback(() => {
    setCharge((prev) => prev + 1);

    if (navigator.vibrate) {
      navigator.vibrate(10);
    }

    if (typeof window !== 'undefined' && (window as any).Capacitor?.Plugins?.Haptics) {
      (window as any).Capacitor.Plugins.Haptics.impact({ style: 'LIGHT' });
    }
  }, []);

  const bind = useLongPress(
    () => {},
    {
      onStart: () => {
        setIsPressing(true);
        setCharge(1);
        timerRef.current = setInterval(handleTick, 200);
      },
      onFinish: () => {
        setIsPressing(false);
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
        if (charge > 0) {
          onSend(charge);
          fireConfetti();
          setCharge(0);
        }
      },
      onCancel: () => {
        setIsPressing(false);
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
        setCharge(0);
      },
      threshold: 300,
    }
  );

  const handleTap = () => {
    if (!isPressing) {
      onSend(1);
      fireConfetti();
    }
  };

  return (
    <div className="relative flex flex-col items-center justify-center py-12">
      <div className="absolute top-0 text-2xl font-bold text-primary h-8">
        {charge > 0 && `+${charge}`}
      </div>

      <motion.div
        {...(bind() as any)}
        onClick={handleTap}
        animate={{
          scale: isPressing ? [1, 1.15] : 1,
        }}
        transition={{
          scale: isPressing ? { duration: 0.2, repeat: Infinity, repeatType: "reverse" } : { duration: 0.2 }
        }}
        className="cursor-pointer relative z-10"
      >
        <svg
          width="160"
          height="160"
          viewBox="0 0 24 24"
          fill="currentColor"
          className="text-red-500 drop-shadow-xl"
        >
          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
        </svg>
      </motion.div>

      <p className="mt-4 text-muted-foreground text-sm font-medium">
        Зажми, чтобы зарядить любовь
      </p>
    </div>
  );
}
