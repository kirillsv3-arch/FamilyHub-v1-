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
}

const metrics = [
  { key: 'mood', label: 'Настроение', min: 'Ужасно', max: 'Эйфория' },
  { key: 'stress', label: 'Уровень стресса', min: 'Дзен', max: 'Выгорание' },
  { key: 'energy', label: 'Энергия', min: 'Истощен', max: 'Заряжен' },
  { key: 'sleep', label: 'Качество сна', min: 'Не спал', max: 'Идеально' },
] as const;

export default function EmotionSliders({ initialState, onSave, disabled = false, title = "Твоё состояние", lastUpdated }: EmotionSlidersProps) {
  const [state, setState] = useState(initialState || { mood: 5, stress: 5, energy: 5, sleep: 5 });
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const prevStateRef = useRef(initialState);

  useEffect(() => {
    if (initialState && JSON.stringify(initialState) !== JSON.stringify(prevStateRef.current)) {
      setState(initialState);
      prevStateRef.current = initialState;
    }
  }, [initialState]);

  const handleChange = (key: keyof typeof state, value: number) => {
    if (disabled) return;
    const newValue = value;

    // Immediate local update for UI responsiveness
    setState(prev => {
      const newState = { ...prev, [key]: newValue };

      // Debounced save of the WHOLE state
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        onSave(newState);
      }, 2000); // 2 seconds as requested

      return newState;
    });
  };

  return (
    <div className={`p-6 rounded-2xl border border-border bg-card space-y-6 ${disabled ? 'opacity-60' : ''}`}>
      <div className="flex justify-between items-end relative z-0">
        <h3 className="text-xl font-bold">{title}</h3>
        {lastUpdated && <span className="text-xs text-muted-foreground italic">{lastUpdated}</span>}
      </div>

      <div className="space-y-8">
        {metrics.map((m) => (
          <div key={m.key} className="space-y-3">
            <div className="flex justify-between text-sm font-medium">
              <span>{m.label}</span>
              <span className="text-primary font-bold">{state[m.key]} / 10</span>
            </div>
            <input
              type="range"
              min="1"
              max="10"
              value={state[m.key]}
              onChange={(e) => handleChange(m.key, parseInt(e.target.value))}
              disabled={disabled}
              className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
            />
            <div className="flex justify-between text-[10px] text-muted-foreground uppercase tracking-wider font-bold">
              <span>{m.min}</span>
              <span>{m.max}</span>
            </div>
          </div>
        ))}
      </div>

      {!disabled && (
        <button
          onClick={() => {
            if (timerRef.current) clearTimeout(timerRef.current);
            onSave(state);
          }}
          className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-bold hover:opacity-90 transition-opacity"
        >
          Сохранить состояние
        </button>
      )}
    </div>
  );
}
