'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Heart,
  ShoppingCart,
  Utensils,
  ClipboardList,
  AlertCircle
} from 'lucide-react';
import Link from 'next/link';
import TamagotchiCat from '@/components/tamagotchi/TamagotchiCat';
import { Tamagotchi, MealPlan, ShoppingItem, Task, UserProfile } from '@/lib/types';
import { format, isToday } from 'date-fns';

interface StatusWidgetProps {
  profile: UserProfile | null;
  tamagotchi: Tamagotchi | null;
  shoppingItems: ShoppingItem[];
  tasks: Task[];
  currentMeal: MealPlan | null;
  hasEmotionCheckIn: boolean;
}

export default function StatusWidget({
  profile,
  tamagotchi,
  shoppingItems,
  tasks,
  currentMeal,
  hasEmotionCheckIn
}: StatusWidgetProps) {

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 11) return 'Доброе утро';
    if (hour >= 11 && hour < 17) return 'Добрый день';
    if (hour >= 17 && hour < 23) return 'Добрый вечер';
    return 'Доброй ночи';
  };

  const getMealType = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 11) return 'завтрак';
    if (hour >= 11 && hour < 17) return 'обед';
    if (hour >= 17 && hour < 23) return 'ужин';
    return null;
  };

  const newItemsCount = shoppingItems.filter(item =>
    !item.completed && isToday(item.createdAt?.toMillis ? item.createdAt.toMillis() : item.createdAt)
  ).length;

  const urgentTasks = tasks.filter(t => !t.completed && (t.matrix === 'urgent-important' || t.matrix === 'urgent-unimportant'));
  const totalPendingTasks = tasks.filter(t => !t.completed).length;

  const isNewShoppingItems = shoppingItems.some(item =>
    !item.completed && isToday(item.createdAt?.toMillis ? item.createdAt.toMillis() : item.createdAt)
  );

  const getTamaMood = () => {
    if (!tamagotchi) return 'normal';
    const avg = (tamagotchi.satiety + tamagotchi.happiness + tamagotchi.energy) / 3;
    if (avg < 20) return 'sick';
    if (avg < 50) return 'sad';
    if (avg > 90) return 'happy';
    return 'normal';
  };

  return (
    <div className="w-full bg-card border border-border rounded-[40px] p-6 shadow-sm overflow-hidden relative">
      <div className="flex gap-6 items-center">
        {/* Left: Tamagotchi character */}
        <Link href="/tamagotchi" className="relative group shrink-0">
          <div className="w-28 h-28 flex items-center justify-center bg-secondary/30 rounded-full border border-border shadow-inner group-active:scale-95 transition-transform">
             {tamagotchi && (
               <div className="scale-[0.45] pointer-events-none">
                 <TamagotchiCat stage={tamagotchi.stage} mood={getTamaMood()} />
               </div>
             )}
          </div>
          <div className="absolute -bottom-1 -right-1 bg-primary text-primary-foreground text-[10px] font-black px-2 py-0.5 rounded-full shadow-sm">
            LVL {tamagotchi?.level || 1}
          </div>
        </Link>

        {/* Right: Info & Statuses */}
        <div className="flex-1 space-y-4">
          <div>
            <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider leading-none mb-1">
              {getGreeting()}, {profile?.name?.split(' ')[0]}
            </h2>
            <div className="flex items-center gap-2">
               <span className="text-xl font-black tracking-tight">В семье всё хорошо</span>
               <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            </div>
          </div>

          <div className="grid grid-cols-4 gap-2">
            {/* Emotion Status */}
            <Link href="/emotions">
              <StatusIcon
                icon={<Heart size={18} fill={hasEmotionCheckIn ? "currentColor" : "none"} />}
                active={!hasEmotionCheckIn}
                alert={!hasEmotionCheckIn}
                pulse={!hasEmotionCheckIn}
                color="text-red-500"
              />
            </Link>

            {/* Shopping Status */}
            <Link href="/shopping-list">
              <StatusIcon
                icon={<ShoppingCart size={18} />}
                active={newItemsCount > 0}
                badge={newItemsCount > 0 ? newItemsCount : undefined}
                pulse={isNewShoppingItems}
                color="text-blue-500"
              />
            </Link>

            {/* Menu Status */}
            <Link href="/menu">
              <StatusIcon
                icon={<Utensils size={18} />}
                active={!!currentMeal}
                color="text-orange-500"
                tooltip={currentMeal?.recipeTitle}
              />
            </Link>

            {/* Planner Status */}
            <Link href="/planner">
              <StatusIcon
                icon={<ClipboardList size={18} />}
                active={totalPendingTasks > 0}
                alert={urgentTasks.length > 0}
                color="text-green-500"
              />
            </Link>
          </div>
        </div>
      </div>

      {/* Bottom context bar (Optional/Conditional) */}
      <AnimatePresence>
        {(currentMeal || urgentTasks.length > 0) && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            className="mt-6 pt-4 border-t border-border flex items-center justify-between"
          >
            {getMealType() && currentMeal ? (
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-orange-500/10 text-orange-500 rounded-lg">
                  <Utensils size={14} />
                </div>
                <p className="text-xs font-bold">
                  На {getMealType()}: <span className="text-muted-foreground">{currentMeal.recipeTitle}</span>
                </p>
              </div>
            ) : urgentTasks.length > 0 ? (
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-red-500/10 text-red-500 rounded-lg">
                  <AlertCircle size={14} />
                </div>
                <p className="text-xs font-bold">
                  Срочное дело: <span className="text-muted-foreground">{urgentTasks[0].title}</span>
                </p>
              </div>
            ) : null}

            <ChevronRight size={14} className="text-muted-foreground opacity-30" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function StatusIcon({
  icon,
  active,
  alert,
  pulse,
  badge,
  color,
  tooltip
}: {
  icon: React.ReactNode,
  active: boolean,
  alert?: boolean,
  pulse?: boolean,
  badge?: number,
  color: string,
  tooltip?: string
}) {
  return (
    <div className="relative group">
      <motion.div
        animate={pulse ? { scale: [1, 1.05, 1], boxShadow: [
          '0 0 0px rgba(0,0,0,0)',
          '0 0 15px currentColor',
          '0 0 0px rgba(0,0,0,0)'
        ] } : {}}
        transition={{ repeat: Infinity, duration: 2 }}
        className={`w-10 h-10 rounded-xl border flex items-center justify-center transition-all ${
          active
          ? `bg-card border-border ${color} shadow-sm`
          : 'bg-secondary/20 border-transparent text-muted-foreground opacity-40'
        } ${alert ? 'border-destructive/30' : ''}`}
      >
        {icon}
      </motion.div>
      {badge !== undefined && (
        <div className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-[8px] font-black w-4 h-4 flex items-center justify-center rounded-full shadow-sm">
          {badge}
        </div>
      )}
      {alert && badge === undefined && (
        <div className="absolute -top-1 -right-1 bg-destructive w-2.5 h-2.5 rounded-full border-2 border-card shadow-sm" />
      )}
    </div>
  );
}

const ChevronRight = ({ size, className }: { size: number, className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="m9 18 6-6-6-6" />
  </svg>
);
