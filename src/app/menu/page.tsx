'use client';

import React, { useState, useEffect } from 'react';
import {
  ChevronLeft,
  Calendar as CalendarIcon,
  Plus,
  ChevronRight,
  Utensils,
  ShoppingCart,
  Check,
  X,
  History,
  Dices
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import {
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  serverTimestamp,
  doc,
  updateDoc,
  deleteDoc,
  writeBatch,
  getDocs,
  orderBy,
  limit
} from 'firebase/firestore';
import { Recipe, MealPlan, ShoppingItem } from '@/lib/types';
import Link from 'next/link';
import { format, addDays, startOfToday, isSameDay, parseISO, startOfWeek, endOfWeek } from 'date-fns';
import { ru } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';
import NutrientPanel from '@/components/menu/NutrientPanel';

export default function MealPlannerPage() {
  const { user, profile } = useAuth();
  const [selectedDate, setSelectedDate] = useState(startOfToday());
  const [mealPlans, setMealPlans] = useState<MealPlan[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [activeMealType, setActiveMealType] = useState<'breakfast' | 'lunch' | 'dinner' | 'snack'>('breakfast');
  const [duplicateDays, setDuplicateDays] = useState(1);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [showIngredientCheck, setShowIngredientCheck] = useState(false);
  const [currentMealPlanToConfirm, setCurrentMealPlanToConfirm] = useState<MealPlan | null>(null);

  // Generate week dates for the slider
  const weekDates = Array.from({ length: 14 }).map((_, i) => addDays(startOfToday(), i - 3));

  useEffect(() => {
    if (!profile?.familyId) return;

    // Listen to meal plans for the current family
    const q = query(
      collection(db, 'mealPlans'),
      where('familyId', '==', profile.familyId)
    );

    const unsub = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MealPlan));
      setMealPlans(data);
    });

    // Fetch recipes for the selection
    const fetchRecipes = async () => {
      const qRec = query(
        collection(db, 'recipes'),
        where('familyId', '==', profile.familyId)
      );
      const snap = await getDocs(qRec);
      setRecipes(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Recipe)));
    };

    fetchRecipes();
    return () => unsub();
  }, [profile?.familyId]);

  const plansForSelectedDate = mealPlans.filter(p => p.date === format(selectedDate, 'yyyy-MM-dd'));

  const handleAddMeal = (type: 'breakfast' | 'lunch' | 'dinner' | 'snack') => {
    setActiveMealType(type);
    setIsAddModalOpen(true);
  };

  const selectRecipe = (recipe: Recipe) => {
    setSelectedRecipe(recipe);
  };

  const confirmMeal = async () => {
    if (!selectedRecipe || !profile?.familyId || !user) return;

    const baseDateStr = format(selectedDate, 'yyyy-MM-dd');
    const batch = writeBatch(db);

    for (let i = 0; i < duplicateDays; i++) {
      const date = addDays(selectedDate, i);
      const dateStr = format(date, 'yyyy-MM-dd');

      const newPlanRef = doc(collection(db, 'mealPlans'));
      const planData: Omit<MealPlan, 'id'> = {
        date: dateStr,
        mealType: activeMealType,
        recipeId: selectedRecipe.id,
        recipeTitle: selectedRecipe.title,
        familyId: profile.familyId,
        nutrients: {
          calories: selectedRecipe.calories,
          proteins: selectedRecipe.proteins,
          fats: selectedRecipe.fats,
          carbs: selectedRecipe.carbs
        },
        ingredients: selectedRecipe.ingredients.map(ing => ({
          ...ing,
          haveAtHome: true
        }))
      };
      batch.set(newPlanRef, planData);
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
        body: JSON.stringify({ familyId: profile.familyId, plansCount: duplicateDays })
      });
    } catch (err) {
      console.error('Tama boost failed:', err);
    }

    setIsAddModalOpen(false);
    setSelectedRecipe(null);
    setDuplicateDays(1);
  };

  const toggleIngredient = async (plan: MealPlan, ingIdx: number) => {
    const newIngredients = [...plan.ingredients];
    const isMissing = newIngredients[ingIdx].haveAtHome;
    newIngredients[ingIdx].haveAtHome = !isMissing;

    await updateDoc(doc(db, 'mealPlans', plan.id), {
      ingredients: newIngredients
    });

    // If marked as missing, add to shopping list
    if (isMissing) {
      const ingredient = newIngredients[ingIdx];

      // Smart shop selection: check history
      const historyQ = query(
        collection(db, 'shoppingList'),
        where('familyId', '==', profile?.familyId),
        where('title', '==', ingredient.name),
        where('completed', '==', true),
        orderBy('createdAt', 'desc'),
        limit(1)
      );

      const historySnap = await getDocs(historyQ);
      let shopId = 'plan'; // Default
      if (!historySnap.empty) {
        shopId = historySnap.docs[0].data().shopId;
      }

      await addDoc(collection(db, 'shoppingList'), {
        title: ingredient.name,
        completed: false,
        familyId: profile?.familyId,
        createdBy: user?.uid,
        createdAt: serverTimestamp(),
        shopId: shopId,
        priority: 'normal',
        quantity: ingredient.amount,
        unit: ingredient.unit,
        metadata: {
          source: `из меню: ${getMealTypeLabel(plan.mealType)}`,
          recipeId: plan.recipeId
        }
      });
    }
  };

  const removePlan = async (id: string) => {
    await deleteDoc(doc(db, 'mealPlans', id));
  };

  const getMealTypeLabel = (type: string) => {
    switch(type) {
      case 'breakfast': return 'Завтрак';
      case 'lunch': return 'Обед';
      case 'dinner': return 'Ужин';
      case 'snack': return 'Перекус';
      default: return type;
    }
  };

  return (
    <main className="min-h-screen pb-24 bg-background">
      <header className="p-4 pt-8 sticky top-0 bg-background/80 backdrop-blur-md z-10">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <Link href="/" className="p-2 -ml-2 rounded-full hover:bg-secondary transition-colors">
              <ChevronLeft size={24} />
            </Link>
            <h1 className="text-2xl font-bold ml-2">Питание</h1>
          </div>
          <div className="flex gap-2">
            <Link href="/menu/slots" className="p-2 bg-primary/10 text-primary rounded-full">
              <Dices size={24} />
            </Link>
            <Link href="/menu/recipes" className="flex items-center gap-2 px-4 py-2 bg-secondary rounded-full text-sm font-bold">
              <BookOpen size={18} />
              Рецепты
            </Link>
          </div>
        </div>

        {/* Date Slider */}
        <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide -mx-4 px-4">
          {weekDates.map((date, i) => {
            const isSelected = isSameDay(date, selectedDate);
            const isToday = isSameDay(date, startOfToday());
            return (
              <button
                key={i}
                onClick={() => setSelectedDate(date)}
                className={`flex flex-col items-center min-w-[60px] p-3 rounded-2xl transition-all ${
                  isSelected
                  ? 'bg-primary text-primary-foreground shadow-lg scale-110 z-10'
                  : 'bg-card border border-border text-muted-foreground'
                }`}
              >
                <span className="text-[10px] font-black uppercase tracking-widest mb-1 opacity-70">
                  {format(date, 'EEE', { locale: ru })}
                </span>
                <span className="text-lg font-black">{format(date, 'd')}</span>
                {isToday && !isSelected && <div className="w-1 h-1 bg-primary rounded-full mt-1" />}
              </button>
            );
          })}
        </div>
      </header>

      <div className="p-4 space-y-6">
        {/* Meal Blocks */}
        {(['breakfast', 'lunch', 'dinner', 'snack'] as const).map((type) => {
          const plans = plansForSelectedDate.filter(p => p.mealType === type);
          return (
            <section key={type} className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <h2 className="text-sm font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                  <Utensils size={14} className="text-primary" />
                  {getMealTypeLabel(type)}
                </h2>
                <button
                  onClick={() => handleAddMeal(type)}
                  className="p-1.5 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors"
                >
                  <Plus size={18} />
                </button>
              </div>

              {plans.length > 0 ? (
                <div className="space-y-3">
                  {plans.map((plan) => (
                    <motion.div
                      layout
                      key={plan.id}
                      className="bg-card rounded-[28px] border border-border p-4 shadow-sm"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <h3 className="text-lg font-bold leading-tight">{plan.recipeTitle}</h3>
                        <button onClick={() => removePlan(plan.id)} className="p-2 text-muted-foreground opacity-30 hover:opacity-100">
                          <X size={18} />
                        </button>
                      </div>

                      <div className="space-y-2">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Ингредиенты</p>
                        <div className="grid grid-cols-1 gap-2">
                          {plan.ingredients.map((ing, idx) => (
                            <button
                              key={idx}
                              onClick={() => toggleIngredient(plan, idx)}
                              className={`flex items-center justify-between p-3 rounded-xl border transition-all text-sm ${
                                ing.haveAtHome
                                ? 'bg-secondary/30 border-transparent text-foreground'
                                : 'bg-destructive/5 border-destructive/20 text-destructive'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <div className={`w-5 h-5 rounded-md flex items-center justify-center border ${
                                  ing.haveAtHome ? 'bg-primary border-primary' : 'border-destructive/30'
                                }`}>
                                  {ing.haveAtHome && <Check size={14} className="text-primary-foreground" />}
                                </div>
                                <span className={ing.haveAtHome ? '' : 'font-bold'}>{ing.name}</span>
                              </div>
                              <span className="opacity-60">{ing.amount} {ing.unit}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div
                  onClick={() => handleAddMeal(type)}
                  className="p-6 border-2 border-dashed border-border rounded-[28px] flex flex-col items-center justify-center text-muted-foreground/40 hover:text-primary/40 hover:border-primary/20 transition-all cursor-pointer"
                >
                  <Plus size={24} className="mb-1" />
                  <span className="text-xs font-bold uppercase tracking-widest">Добавить блюдо</span>
                </div>
              )}
            </section>
          );
        })}

        <NutrientPanel
          profile={profile}
          dailyPlans={plansForSelectedDate}
          weeklyPlans={mealPlans.filter(p => {
            const date = parseISO(p.date);
            return date >= startOfWeek(selectedDate, { weekStartsOn: 1 }) &&
                   date <= endOfWeek(selectedDate, { weekStartsOn: 1 });
          })}
        />
      </div>

      {/* Add Meal Modal */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="w-full max-w-xl bg-card rounded-t-[40px] p-6 max-h-[90vh] overflow-hidden flex flex-col"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-black">Добавить в меню</h2>
                <button
                  onClick={() => { setIsAddModalOpen(false); setSelectedRecipe(null); }}
                  className="p-2 bg-secondary rounded-full"
                >
                  <X size={24} />
                </button>
              </div>

              {!selectedRecipe ? (
                <div className="flex-1 overflow-y-auto space-y-4 pb-12">
                  <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">
                    Выберите из {getMealTypeLabel(activeMealType).toLowerCase()}в
                  </p>
                  <div className="grid gap-3">
                    {recipes.filter(r => r.category === activeMealType).map(recipe => (
                      <button
                        key={recipe.id}
                        onClick={() => selectRecipe(recipe)}
                        className="flex items-center justify-between p-4 bg-secondary/30 rounded-2xl border border-transparent hover:border-primary/30 transition-all text-left"
                      >
                        <div>
                          <p className="font-bold">{recipe.title}</p>
                          <p className="text-xs text-muted-foreground">{recipe.calories} ккал | {recipe.ingredients.length} инг.</p>
                        </div>
                        <ChevronRight size={20} className="text-muted-foreground" />
                      </button>
                    ))}
                    {recipes.filter(r => r.category === activeMealType).length === 0 && (
                      <div className="text-center py-8 space-y-4">
                        <p className="text-muted-foreground">В этой категории еще нет рецептов</p>
                        <Link
                          href="/menu/recipes/new"
                          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-full font-bold"
                        >
                          <Plus size={18} /> Создать рецепт
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-8 pb-12">
                  <div className="p-6 bg-primary/10 rounded-3xl border border-primary/20">
                    <p className="text-xs font-black text-primary uppercase tracking-widest mb-1">Выбрано блюдо</p>
                    <h3 className="text-2xl font-black">{selectedRecipe.title}</h3>
                  </div>

                  <div className="space-y-4">
                    <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">На сколько дней планируем?</p>
                    <div className="flex items-center gap-6">
                      <button
                        onClick={() => setDuplicateDays(Math.max(1, duplicateDays - 1))}
                        className="w-12 h-12 bg-secondary rounded-2xl flex items-center justify-center font-bold text-xl"
                      >
                        -
                      </button>
                      <span className="text-4xl font-black">{duplicateDays}</span>
                      <button
                        onClick={() => setDuplicateDays(Math.min(7, duplicateDays + 1))}
                        className="w-12 h-12 bg-secondary rounded-2xl flex items-center justify-center font-bold text-xl"
                      >
                        +
                      </button>
                      <span className="text-muted-foreground font-medium">
                        {duplicateDays === 1 ? 'день' : duplicateDays < 5 ? 'дня' : 'дней'}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={confirmMeal}
                    className="w-full p-4 bg-primary text-primary-foreground rounded-2xl font-black text-lg shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
                  >
                    <Check size={24} />
                    Подтвердить
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </main>
  );
}

const BookOpen = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
  </svg>
);
