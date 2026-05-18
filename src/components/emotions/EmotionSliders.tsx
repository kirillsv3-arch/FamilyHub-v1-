'use client';

import React, { useState, useEffect, useRef } from 'react';

interface EmotionSlidersProps {
  initialState?: {
    mood: number;
    stress: number;
    energy: number;
    sleep: number;
  };
  onSave: (state: { mood: number; stress: number; energy: number; sleep: number }) => void;
  disabled?: boolean;
  title?: string;
  lastUpdated?: string;
  updatedAt?: any;
}

const metrics = [
  { key: 'mood', label: 'Настроение', min: 'Ужасно', max: 'Эйфория', gradient: 'from-red-500 via-yellow-500 to-emerald-500' },
  { key: 'stress', label: 'Уровень стресса', min: 'Дзен', max: 'Выгорание', gradient: 'from-emerald-500 via-yellow-500 to-red-500' },
  { key: 'energy', label: 'Энергия', min: 'Истощен', max: 'Заряжен', gradient: 'from-zinc-700 via-blue-500 to-cyan-400' },
  { key: 'sleep', label: 'Качество сна', min: 'Не спал', max: 'Идеально', gradient: 'from-zinc-700 via-indigo-500 to-purple-400' },
] as const;

export default function EmotionSliders({ initialState, onSave, disabled = false, title = "Твое состояние", lastUpdated, updatedAt }: EmotionSlidersProps) {
  const [state, setState] = useState(initialState || { mood: 5, stress: 5, energy: 5, sleep: 5 });
  const prevStateRef = useRef(initialState);

  useEffect(() => {
    if (initialState && JSON.stringify(initialState) !== JSON.stringify(prevStateRef.current)) {
      setState(initialState);
      prevStateRef.current = initialState;
    }
  }, [initialState]);

  const handleChange = (key: keyof typeof state, value: number) => {
    if (disabled) return;
    setState(prev => ({ ...prev, [key]: value }));
  };

  const handleCommit = () => {
    if (disabled) return;
    onSave(state);
  };

  return (
    <div className={`p-8 rounded-[2.5rem] border border-white/5 bg-zinc-900/50 backdrop-blur-md shadow-2xl space-y-8 ${disabled ? 'opacity-80' : ''}`}>
      <div className="flex flex-col space-y-1">
        <div className="flex justify-between items-end">
          <h3 className="text-xl font-black tracking-tight">{title}</h3>
          {lastUpdated && (
            <span className={`text-[10px] font-bold uppercase tracking-widest ${
              updatedAt ? (
                (Date.now() - updatedAt.toMillis()) / 3600000 > 48 ? 'text-red-500' :
                (Date.now() - updatedAt.toMillis()) / 3600000 > 24 ? 'text-yellow-500' :
                'text-zinc-500'
              ) : 'text-zinc-500'
            }`}>
              {updatedAt && (Date.now() - updatedAt.toMillis()) / 3600000 > 24 && '⚠️ '}
              {lastUpdated}
            </span>
          )}
        </div>
        <div className="h-1 w-12 bg-rose-500 rounded-full" />
      </div>

      <div className="space-y-10">
        {metrics.map((m) => (
          <div key={m.key} className="space-y-4">
            <div className="flex justify-between items-end">
              <span className="text-sm font-black text-zinc-300 uppercase tracking-widest">{m.label}</span>
              <span className="text-lg font-black text-white">{state[m.key]}</span>
            </div>

            <div className="relative h-4 group">
              {/* Custom Track */}
              <div className={`absolute inset-0 rounded-full bg-gradient-to-r ${m.gradient} opacity-20`} />
              <div
                className={`absolute inset-y-0 left-0 rounded-full bg-gradient-to-r ${m.gradient}`}
                style={{ width: `${((state[m.key] - 1) / 9) * 100}%` }}
              />

              <input
                type="range"
                min="1"
                max="10"
                value={state[m.key]}
                onChange={(e) => handleChange(m.key, parseInt(e.target.value))}
                onPointerUp={handleCommit}
                onKeyUp={handleCommit}
                disabled={disabled}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-default"
              />

              {/* Visual Thumb Overlay (since input is hidden) */}
              <div
                className="absolute top-1/2 -translate-y-1/2 w-6 h-6 bg-white rounded-full shadow-[0_0_15px_rgba(255,255,255,0.5)] border-4 border-zinc-900 pointer-events-none transition-transform group-active:scale-125"
                style={{ left: `calc(${((state[m.key] - 1) / 9) * 100}% - 12px)` }}
              />
            </div>

            <div className="flex justify-between text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em]">
              <span>{m.min}</span>
              <span>{m.max}</span>
            </div>
          </div>
        ))}
      </div>

      {!disabled && (
        <button
          onClick={handleCommit}
          className="w-full py-4 bg-white text-black rounded-2xl font-black text-sm uppercase tracking-[0.2em] hover:bg-zinc-200 active:scale-[0.98] transition-all shadow-xl shadow-white/5"
        >
          Обновить статус
        </button>
      )}
    </div>
  );
}
