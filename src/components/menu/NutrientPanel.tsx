'use client';

import React from 'react';
import { UserProfile, MealPlan } from '@/lib/types';
import { Zap, TrendingUp } from 'lucide-react';

interface NutrientPanelProps {
  profile: UserProfile | null;
  dailyPlans: MealPlan[];
  weeklyPlans: MealPlan[];
}

export default function NutrientPanel({ profile, dailyPlans, weeklyPlans }: NutrientPanelProps) {
  const goals = profile?.nutrientGoals || { calories: 2000, proteins: 100, fats: 65, carbs: 250 };

  const dailyTotals = dailyPlans.reduce((acc, plan) => ({
    calories: acc.calories + plan.nutrients.calories,
    proteins: acc.proteins + plan.nutrients.proteins,
    fats: acc.fats + plan.nutrients.fats,
    carbs: acc.carbs + plan.nutrients.carbs,
  }), { calories: 0, proteins: 0, fats: 0, carbs: 0 });

  const weeklyAvg = weeklyPlans.reduce((acc, plan) => ({
    calories: acc.calories + plan.nutrients.calories,
  }), { calories: 0 }).calories / 7;

  const getPercent = (current: number, target: number) => Math.min(Math.round((current / target) * 100), 100);

  return (
    <div className="space-y-6 pt-4">
      <div className="bg-card rounded-[32px] border border-border p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-sm font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
            <Zap size={14} className="text-primary" /> Итог дня
          </h3>
          <div className="text-right">
            <span className="text-2xl font-black">{dailyTotals.calories}</span>
            <span className="text-muted-foreground font-bold ml-1">/ {goals.calories} ккал</span>
          </div>
        </div>

        <div className="w-full h-3 bg-secondary rounded-full overflow-hidden mb-8">
          <div
            className="h-full bg-primary transition-all duration-500 ease-out"
            style={{ width: `${getPercent(dailyTotals.calories, goals.calories)}%` }}
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              <span>Белки</span>
              <span>{dailyTotals.proteins}г</span>
            </div>
            <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 transition-all duration-700"
                style={{ width: `${getPercent(dailyTotals.proteins, goals.proteins)}%` }}
              />
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              <span>Жиры</span>
              <span>{dailyTotals.fats}г</span>
            </div>
            <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
              <div
                className="h-full bg-yellow-500 transition-all duration-700"
                style={{ width: `${getPercent(dailyTotals.fats, goals.fats)}%` }}
              />
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              <span>Углев.</span>
              <span>{dailyTotals.carbs}г</span>
            </div>
            <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
              <div
                className="h-full bg-green-500 transition-all duration-700"
                style={{ width: `${getPercent(dailyTotals.carbs, goals.carbs)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-primary/5 rounded-3xl border border-primary/10 p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/20 rounded-xl text-primary">
            <TrendingUp size={20} />
          </div>
          <div>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Среднее за неделю</p>
            <p className="font-black text-lg">{Math.round(weeklyAvg)} ккал / день</p>
          </div>
        </div>
      </div>
    </div>
  );
}
