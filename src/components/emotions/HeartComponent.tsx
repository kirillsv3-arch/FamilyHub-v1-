'use client';

import React, { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLongPress } from 'use-long-press';

interface HeartComponentProps {
  onSend: (count: number) => void;
}

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  rotation: number;
}

export default function HeartComponent({ onSend }: HeartComponentProps) {
  const [isPressing, setIsPressing] = useState(false);
  const [charge, setCharge] = useState(0);
  const [particles, setParticles] = useState<Particle[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const particleIdRef = useRef(0);

  const createParticles = useCallback(() => {
    const newParticles: Particle[] = Array.from({ length: 12 }).map(() => ({
      id: particleIdRef.current++,
      x: (Math.random() - 0.5) * 200,
      y: (Math.random() - 0.5) * 200,
      size: Math.random() * 20 + 10,
      rotation: Math.random() * 360,
    }));

    setParticles(prev => [...prev, ...newParticles]);

    // Cleanup particles
    setTimeout(() => {
      setParticles(prev => prev.filter(p => !newParticles.find(np => np.id === p.id)));
    }, 1000);
  }, []);

  const handleTick = useCallback(() => {
    setCharge((prev) => {
      const next = prev + 1;
      // Max charge visual at 50, but it can go higher
      return next;
    });

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
          createParticles();
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
      createParticles();
    }
  };

  const fillPercentage = Math.min((charge / 20) * 100, 100);

  return (
    <div className="relative flex flex-col items-center justify-center py-8">
      {/* Charge indicator */}
      <AnimatePresence>
        {charge > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.5 }}
            animate={{ opacity: 1, y: -20, scale: 1 }}
            exit={{ opacity: 0, scale: 1.5 }}
            className="absolute -top-4 text-4xl font-black text-rose-500 z-20"
          >
            +{charge}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Particles Burst */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-30">
        <AnimatePresence>
          {particles.map((p) => (
            <motion.div
              key={p.id}
              initial={{ x: 0, y: 0, opacity: 1, scale: 0 }}
              animate={{ x: p.x, y: p.y, opacity: 0, scale: 1.5, rotate: p.rotation }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="absolute text-rose-500 drop-shadow-lg"
              style={{ fontSize: p.size }}
            >
              ❤️
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <motion.div
        {...(bind() as any)}
        onClick={handleTap}
        animate={{
          scale: isPressing ? [1, 1.05] : 1,
        }}
        transition={{
          scale: isPressing ? { duration: 0.4, repeat: Infinity, repeatType: "reverse" } : { duration: 0.3 },
          animate: { type: 'spring', stiffness: 300, damping: 20 }
        }}
        className="cursor-pointer relative z-10 select-none touch-none"
      >
        {/* Heart Pulse (Idle) */}
        <motion.div
          animate={{
            scale: isPressing ? 1 : [1, 1.03, 1],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="relative"
        >
          {/* Background Heart (Empty) */}
          <svg
            width="180"
            height="180"
            viewBox="0 0 24 24"
            className="text-zinc-900 drop-shadow-2xl fill-current stroke-zinc-800 stroke-[0.5px]"
          >
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
          </svg>

          {/* Liquid Fill Heart */}
          <div
            className="absolute inset-0 overflow-hidden"
            style={{
              clipPath: `inset(${100 - fillPercentage}% 0 0 0)`,
              transition: 'clip-path 0.2s ease-out'
            }}
          >
            <svg
              width="180"
              height="180"
              viewBox="0 0 24 24"
              className="text-rose-500 fill-current drop-shadow-[0_0_15px_rgba(244,63,94,0.5)]"
            >
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>

            {/* Liquid Surface Effect */}
            {fillPercentage > 0 && fillPercentage < 100 && (
              <motion.div
                animate={{ x: [-10, 10] }}
                transition={{ duration: 1, repeat: Infinity, repeatType: "reverse" }}
                className="absolute w-[200%] h-4 bg-rose-400/30 blur-md"
                style={{ top: `${100 - fillPercentage}%`, left: '-50%' }}
              />
            )}
          </div>
        </motion.div>
      </motion.div>

      <p className="mt-6 text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] animate-pulse">
        {isPressing ? 'Заряжаем любовь...' : 'Удерживай, чтобы наполнить'}
      </p>
    </div>
  );
}
