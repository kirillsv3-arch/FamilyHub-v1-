'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  ChevronLeft,
  Lock,
  Play,
  RefreshCcw,
  Check,
  X,
  ShoppingCart
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import {
  collection,
  query,
  where,
  getDocs,
  writeBatch,
  doc,
  addDoc,
  serverTimestamp,
  orderBy,
  limit
} from 'firebase/firestore';
import { Recipe, MealPlan } from '@/lib/types';
import Link from 'next/link';
import { format, startOfToday } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';

export default function SlotMachinePage() {
  const { user, profile } = useAuth();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [spinning, setSpinning] = useState(false);
  const [currentStep, setCurrentStep] = useState<'slots' | 'verify'>('slots');
  const [verifyIdx, setVerifyIdx] = useState(0);

  const [slots, setSlots] = useState<{
    type: 'breakfast' | 'lunch' | 'dinner';
    locked: boolean;
    recipe: Recipe | null;
  }[]>([
    { type: 'breakfast', locked: false, recipe: null },
    { type: 'lunch', locked: false, recipe: null },
    { type: 'dinner', locked: false, recipe: null },
  ]);

  useEffect(() => {
    if (!profile?.familyId) return;

    const fetchRecipes = async () => {
      const q = query(
        collection(db, 'recipes'),
        where('familyId', '==', profile.familyId)
      );
      const snap = await getDocs(q);
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Recipe));
      setRecipes(data);

      // Initial random set
      setSlots(prev => prev.map(slot => ({
        ...slot,
        recipe: getRandomRecipe(data, slot.type)
      })));
      setLoading(false);
    };

    fetchRecipes();
  }, [profile?.familyId]);

  const getRandomRecipe = (allRecipes: Recipe[], type: string) => {
    const filtered = allRecipes.filter(r => r.category === type);
    if (filtered.length === 0) return null;
    return filtered[Math.floor(Math.random() * filtered.length)];
  };

  const spin = () => {
    if (spinning) return;
    setSpinning(true);

    // Simulate spinning effect
    let iterations = 0;
    const interval = setInterval(() => {
      setSlots(prev => prev.map(slot => {
        if (slot.locked) return slot;
        return { ...slot, recipe: getRandomRecipe(recipes, slot.type) };
      }));
      iterations++;
      if (iterations > 20) {
        clearInterval(interval);
        setSpinning(false);
      }
    }, 100);
  };

  const toggleLock = (index: number) => {
    setSlots(prev => prev.map((s, i) => i === index ? { ...s, locked: !s.locked } : s));
  };

  const startVerification = () => {
    setCurrentStep('verify');
    setVerifyIdx(0);
  };

  const nextVerify = () => {
    if (verifyIdx < slots.length - 1) {
      setVerifyIdx(verifyIdx + 1);
    } else {
      finishAndSave();
    }
  };

  const finishAndSave = async () => {
    if (!user || !profile?.familyId) return;

    const dateStr = format(startOfToday(), 'yyyy-MM-dd');
    const batch = writeBatch(db);

    for (const slot of slots) {
      if (!slot.recipe) continue;

      const newPlanRef = doc(collection(db, 'mealPlans'));
      batch.set(newPlanRef, {
        date: dateStr,
        mealType: slot.type,
        recipeId: slot.recipe.id,
        recipeTitle: slot.recipe.title,
        familyId: profile.familyId,
        nutrients: {
          calories: slot.recipe.calories,
          proteins: slot.recipe.proteins,
          fats: slot.recipe.fats,
          carbs: slot.recipe.carbs
        },
        ingredients: slot.recipe.ingredients.map(ing => ({
          ...ing,
          haveAtHome: (slot.recipe as any).ingredientsState?.[ing.name] ?? true
        }))
      });

      // Add missing ingredients to shopping list
      const ingredientsState = (slot.recipe as any).ingredientsState || {};
      for (const ing of slot.recipe.ingredients) {
        if (ingredientsState[ing.name] === false) {
          // Check history for shopId
          const historyQ = query(
            collection(db, 'shoppingList'),
            where('familyId', '==', profile.familyId),
            where('title', '==', ing.name),
            where('completed', '==', true),
            orderBy('createdAt', 'desc'),
            limit(1)
          );
          const historySnap = await getDocs(historyQ);
          let shopId = 'plan';
          if (!historySnap.empty) {
            shopId = historySnap.docs[0].data().shopId;
          }

          const shopRef = collection(db, 'shoppingList');
          await addDoc(shopRef, {
            title: ing.name,
            completed: false,
            familyId: profile.familyId,
            createdBy: user.uid,
            createdAt: serverTimestamp(),
            shopId: shopId,
            priority: 'normal',
            quantity: ing.amount,
            unit: ing.unit,
            metadata: {
              source: `из меню: Слот-машина`,
              recipeId: slot.recipe.id
            }
          });
        }
      }
    }

    await batch.commit();

    // Boost Tamagotchi Satiety
    try {
      const token = await user.getIdToken();
      await fetch('/api/menu/confirm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ familyId: profile.familyId, plansCount: slots.length })
      });
    } catch (err) {
      console.error('Tama boost failed:', err);
    }

    window.location.href = '/menu';
  };

  const toggleIngredientState = (recipeId: string, ingName: string) => {
    setSlots(prev => prev.map(slot => {
      if (slot.recipe?.id === recipeId) {
        const recipe = { ...slot.recipe } as any;
        if (!recipe.ingredientsState) recipe.ingredientsState = {};
        recipe.ingredientsState[ingName] = recipe.ingredientsState[ingName] === false;
        return { ...slot, recipe };
      }
      return slot;
    }));
  };

  const getMealTypeLabel = (type: string) => {
    switch(type) {
      case 'breakfast': return 'Завтрак';
      case 'lunch': return 'Обед';
      case 'dinner': return 'Ужин';
      default: return type;
    }
  };

  if (loading) return null;

  return (
    <main className="min-h-screen pb-24 bg-background overflow-hidden flex flex-col">
      <header className="p-4 pt-8 sticky top-0 bg-background/80 backdrop-blur-md z-10">
        <div className="flex items-center">
          <Link href="/menu" className="p-2 -ml-2 rounded-full hover:bg-secondary transition-colors">
            <ChevronLeft size={24} />
          </Link>
          <h1 className="text-2xl font-bold ml-2">Слот-машина</h1>
        </div>
      </header>

      <div className="flex-1 flex flex-col p-4">
        {currentStep === 'slots' ? (
          <div className="flex-1 flex flex-col space-y-8">
            <div className="flex-1 flex flex-col justify-center gap-4">
              {slots.map((slot, i) => (
                <div key={i} className="relative group">
                  <motion.div
                    animate={spinning && !slot.locked ? {
                      y: [0, -20, 20, 0],
                      scale: [1, 0.95, 1.05, 1],
                    } : {}}
                    transition={{ repeat: Infinity, duration: 0.2 }}
                    className={`p-6 rounded-[32px] border-2 transition-all flex items-center justify-between overflow-hidden ${
                      slot.locked
                      ? 'bg-primary/5 border-primary/20 shadow-inner'
                      : 'bg-card border-border shadow-lg'
                    }`}
                  >
                    <div className="space-y-1">
                      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60">
                        {getMealTypeLabel(slot.type)}
                      </p>
                      <h3 className="text-xl font-black">{slot.recipe?.title || 'Нет рецептов'}</h3>
                    </div>
                    <button
                      onClick={() => toggleLock(i)}
                      className={`p-3 rounded-2xl transition-all ${
                        slot.locked ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'
                      }`}
                    >
                      {slot.locked ? <Lock size={20} /> : <Unlock size={20} />}
                    </button>
                  </motion.div>
                </div>
              ))}
            </div>

            <div className="space-y-4">
              <button
                onClick={spin}
                disabled={spinning || slots.every(s => s.locked)}
                className="w-full p-6 bg-secondary text-foreground rounded-3xl font-black text-xl flex items-center justify-center gap-3 active:scale-95 transition-transform disabled:opacity-50"
              >
                <RefreshCcw size={28} className={spinning ? 'animate-spin' : ''} />
                КРУТИТЬ
              </button>

              <button
                onClick={startVerification}
                disabled={spinning || slots.some(s => !s.recipe)}
                className="w-full p-6 bg-primary text-primary-foreground rounded-3xl font-black text-xl flex items-center justify-center gap-3 shadow-xl shadow-primary/20 active:scale-95 transition-transform"
              >
                <Check size={28} />
                ДОБАВИТЬ В МЕНЮ
              </button>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col space-y-6">
            <div className="flex items-center justify-between px-2">
              <div className="space-y-1">
                <h2 className="text-2xl font-black">{getMealTypeLabel(slots[verifyIdx].type)}</h2>
                <p className="text-muted-foreground font-bold">{slots[verifyIdx].recipe?.title}</p>
              </div>
              <div className="text-xs font-black bg-primary/10 text-primary px-3 py-1 rounded-full">
                ШАГ {verifyIdx + 1} ИЗ 3
              </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3">
              <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest px-2">Проверка ингредиентов</p>
              {slots[verifyIdx].recipe?.ingredients.map((ing, i) => {
                const isHave = (slots[verifyIdx].recipe as any).ingredientsState?.[ing.name] !== false;
                return (
                  <button
                    key={i}
                    onClick={() => toggleIngredientState(slots[verifyIdx].recipe!.id, ing.name)}
                    className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all ${
                      isHave
                      ? 'bg-secondary/30 border-transparent text-foreground'
                      : 'bg-destructive/5 border-destructive/20 text-destructive'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-6 h-6 rounded-lg flex items-center justify-center border transition-colors ${
                        isHave ? 'bg-primary border-primary' : 'border-destructive/30'
                      }`}>
                        {isHave && <Check size={16} className="text-primary-foreground" />}
                      </div>
                      <span className={`font-bold ${!isHave && 'line-through opacity-60'}`}>{ing.name}</span>
                    </div>
                    <span className="text-sm opacity-60">{ing.amount} {ing.unit}</span>
                  </button>
                );
              })}
            </div>

            <button
              onClick={nextVerify}
              className="w-full p-6 bg-primary text-primary-foreground rounded-3xl font-black text-xl flex items-center justify-center gap-3 shadow-xl shadow-primary/20"
            >
              <span>{verifyIdx === 2 ? 'ГОТОВО' : 'ДАЛЕЕ'}</span>
              <ChevronRight size={24} />
            </button>
          </div>
        )}
      </div>
    </main>
  );
}

const Unlock = ({ size, className }: { size: number, className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 9.9-1" />
  </svg>
);

const ChevronRight = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="m9 18 6-6-6-6" />
  </svg>
);
