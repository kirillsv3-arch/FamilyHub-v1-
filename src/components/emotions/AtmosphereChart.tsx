'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format, subDays, startOfDay, isSameDay } from 'date-fns';
import { ru } from 'date-fns/locale';

interface AtmosphereChartProps {
  userId: string;
}

export default function AtmosphereChart({ userId }: AtmosphereChartProps) {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;

    const q = query(
      collection(db, `users/${userId}/emotion_history`),
      orderBy('date', 'desc'),
      limit(14)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        ...doc.data(),
        date: doc.data().date?.toDate() || new Date()
      }));
      setHistory(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userId]);

  const chartData = useMemo(() => {
    const days = Array.from({ length: 7 }).map((_, i) => subDays(new Date(), 6 - i));

    return days.map(day => {
      const dayData = history.filter(h => isSameDay(h.date, day));
      let avgIndex = null;

      if (dayData.length > 0) {
        avgIndex = dayData.reduce((sum, h) => sum + h.atmosphereIndex, 0) / dayData.length;
      }

      return {
        name: format(day, 'eee', { locale: ru }),
        index: avgIndex !== null ? Math.round(avgIndex) : null,
        fullDate: day
      };
    });
  }, [history]);

  const hasEnoughData = chartData.filter(d => d.index !== null).length >= 2;

  const averageIndex = useMemo(() => {
    const validData = chartData.filter(d => d.index !== null);
    if (validData.length === 0) return 50;
    return validData.reduce((sum, d) => sum + (d.index || 0), 0) / validData.length;
  }, [chartData]);

  const lineColor = averageIndex >= 65 ? '#10b981' : averageIndex >= 45 ? '#f59e0b' : '#f43f5e';

  if (loading) return <div className="h-48 flex items-center justify-center text-zinc-500">Загрузка...</div>;

  if (!hasEnoughData) {
    return (
      <div className="p-8 border-2 border-dashed border-zinc-800 rounded-[2.5rem] bg-zinc-950/50 flex flex-col items-center text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-zinc-900 flex items-center justify-center text-2xl">📈</div>
        <p className="text-zinc-500 font-bold text-sm leading-relaxed max-w-[240px]">
          Обновляй состояние каждый день — увидишь динамику атмосферы за неделю
        </p>
      </div>
    );
  }

  return (
    <div className="h-64 w-full">
      <div className="flex justify-between items-center mb-4 px-2">
        <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Динамика за 7 дней</span>
        <span className="text-xs font-black" style={{ color: lineColor }}>
          Среднее: {Math.round(averageIndex)}%
        </span>
      </div>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#27272a" />
          <XAxis
            dataKey="name"
            fontSize={10}
            tick={{fill: '#71717a', fontWeight: 'bold'}}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            domain={[0, 100]}
            fontSize={10}
            tick={{fill: '#71717a', fontWeight: 'bold'}}
            axisLine={false}
            tickLine={false}
            width={25}
          />
          <Tooltip
            formatter={(value: any) => [`${value}%`, 'Индекс']}
            contentStyle={{ backgroundColor: '#09090b', border: '1px solid #27272a', borderRadius: '16px' }}
            itemStyle={{ fontWeight: 'bold' }}
          />
          <Line
            type="monotone"
            dataKey="index"
            stroke={lineColor}
            strokeWidth={4}
            dot={{ r: 4, fill: lineColor, stroke: '#09090b', strokeWidth: 2 }}
            activeDot={{ r: 6, strokeWidth: 0 }}
            connectNulls
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
