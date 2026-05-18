'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Plus, Trash2, Save, Link as LinkIcon, Info } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import Link from 'next/link';

export default function NewRecipePage() {
  const { user, profile } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [recipe, setRecipe] = useState({
    title: '',
    category: 'breakfast',
    calories: 0,
    proteins: 0,
    fats: 0,
    carbs: 0,
    link: '',
    comment: '',
    ingredients: [{ name: '', amount: 0, unit: 'шт.' }]
  });

  const handleAddIngredient = () => {
    setRecipe({
      ...recipe,
      ingredients: [...recipe.ingredients, { name: '', amount: 0, unit: 'шт.' }]
    });
  };

  const handleRemoveIngredient = (index: number) => {
    const newIngredients = [...recipe.ingredients];
    newIngredients.splice(index, 1);
    setRecipe({ ...recipe, ingredients: newIngredients });
  };

  const handleIngredientChange = (index: number, field: string, value: any) => {
    const newIngredients = [...recipe.ingredients];
    (newIngredients[index] as any)[field] = value;
    setRecipe({ ...recipe, ingredients: newIngredients });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profile?.familyId || !recipe.title) return;

    setLoading(true);
    try {
      await addDoc(collection(db, 'recipes'), {
        ...recipe,
        familyId: profile.familyId,
        createdBy: user.uid,
        createdAt: serverTimestamp(),
        // Filter out empty ingredients
        ingredients: recipe.ingredients.filter(ing => ing.name.trim() !== '')
      });
      router.push('/menu');
    } catch (error) {
      console.error('Error adding recipe:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen pb-24 bg-background">
      <header className="p-4 pt-8 sticky top-0 bg-background/80 backdrop-blur-md z-10 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Link href="/menu" className="p-2 -ml-2 rounded-full hover:bg-secondary transition-colors">
              <ChevronLeft size={24} />
            </Link>
            <h1 className="text-xl font-bold ml-2">Новый рецепт</h1>
          </div>
          <button
            form="recipe-form"
            disabled={loading || !recipe.title}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-full text-sm font-bold flex items-center gap-2 disabled:opacity-50"
          >
            <Save size={18} />
            {loading ? '...' : 'Создать'}
          </button>
        </div>
      </header>

      <form id="recipe-form" onSubmit={handleSubmit} className="p-4 space-y-6">
        {/* Basic Info */}
        <section className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-muted-foreground uppercase ml-1">Название блюда</label>
            <input
              type="text"
              required
              placeholder="Например: Сырники с изюмом"
              value={recipe.title}
              onChange={(e) => setRecipe({ ...recipe, title: e.target.value })}
              className="w-full p-4 bg-card rounded-2xl border border-border focus:outline-none focus:ring-2 focus:ring-primary/50 text-lg font-medium"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-muted-foreground uppercase ml-1">Категория</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'breakfast', label: 'Завтрак' },
                { id: 'lunch', label: 'Обед' },
                { id: 'dinner', label: 'Ужин' },
                { id: 'snack', label: 'Перекус' }
              ].map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setRecipe({ ...recipe, category: cat.id as any })}
                  className={`p-3 rounded-xl border text-sm font-bold transition-all ${
                    recipe.category === cat.id
                    ? 'bg-primary border-primary text-primary-foreground shadow-sm'
                    : 'bg-card border-border text-muted-foreground'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Nutrients */}
        <section className="bg-card p-5 rounded-3xl border border-border space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
            <Info size={16} /> КБЖУ (на порцию)
          </h3>
          <div className="grid grid-cols-4 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase block text-center">Ккал</label>
              <input
                type="number"
                value={recipe.calories}
                onChange={(e) => setRecipe({ ...recipe, calories: parseInt(e.target.value) || 0 })}
                className="w-full p-2 bg-secondary/50 rounded-lg border border-border text-center text-sm focus:outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase block text-center">Белки</label>
              <input
                type="number"
                value={recipe.proteins}
                onChange={(e) => setRecipe({ ...recipe, proteins: parseInt(e.target.value) || 0 })}
                className="w-full p-2 bg-secondary/50 rounded-lg border border-border text-center text-sm focus:outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase block text-center">Жиры</label>
              <input
                type="number"
                value={recipe.fats}
                onChange={(e) => setRecipe({ ...recipe, fats: parseInt(e.target.value) || 0 })}
                className="w-full p-2 bg-secondary/50 rounded-lg border border-border text-center text-sm focus:outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase block text-center">Угл.</label>
              <input
                type="number"
                value={recipe.carbs}
                onChange={(e) => setRecipe({ ...recipe, carbs: parseInt(e.target.value) || 0 })}
                className="w-full p-2 bg-secondary/50 rounded-lg border border-border text-center text-sm focus:outline-none"
              />
            </div>
          </div>
        </section>

        {/* Ingredients */}
        <section className="space-y-4">
          <div className="flex items-center justify-between ml-1">
            <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Ингредиенты</h3>
            <button
              type="button"
              onClick={handleAddIngredient}
              className="p-1.5 bg-primary/10 text-primary rounded-lg"
            >
              <Plus size={20} />
            </button>
          </div>

          <div className="space-y-3">
            {recipe.ingredients.map((ing, idx) => (
              <div key={idx} className="flex gap-2 items-start">
                <input
                  type="text"
                  placeholder="Продукт"
                  value={ing.name}
                  onChange={(e) => handleIngredientChange(idx, 'name', e.target.value)}
                  className="flex-grow p-3 bg-card rounded-xl border border-border focus:outline-none text-sm"
                />
                <input
                  type="number"
                  placeholder="0"
                  value={ing.amount}
                  onChange={(e) => handleIngredientChange(idx, 'amount', parseFloat(e.target.value) || 0)}
                  className="w-16 p-3 bg-card rounded-xl border border-border focus:outline-none text-sm text-center"
                />
                <select
                  value={ing.unit}
                  onChange={(e) => handleIngredientChange(idx, 'unit', e.target.value)}
                  className="w-20 p-3 bg-card rounded-xl border border-border focus:outline-none text-sm appearance-none"
                >
                  {['шт.', 'г', 'мл', 'кг', 'л', 'упак.'].map(u => (
                    <option key={u} value={u}>{u}</option>
                  ))}
                </select>
                {recipe.ingredients.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveIngredient(idx)}
                    className="p-3 text-destructive hover:bg-destructive/10 rounded-xl transition-colors"
                  >
                    <Trash2 size={20} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Links & Comments */}
        <section className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-muted-foreground uppercase ml-1 flex items-center gap-2">
              <LinkIcon size={14} /> Ссылка на источник
            </label>
            <input
              type="url"
              placeholder="https://..."
              value={recipe.link}
              onChange={(e) => setRecipe({ ...recipe, link: e.target.value })}
              className="w-full p-4 bg-card rounded-2xl border border-border focus:outline-none text-sm"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-muted-foreground uppercase ml-1">Заметка</label>
            <textarea
              placeholder="Важные детали приготовления..."
              rows={3}
              value={recipe.comment}
              onChange={(e) => setRecipe({ ...recipe, comment: e.target.value })}
              className="w-full p-4 bg-card rounded-2xl border border-border focus:outline-none text-sm resize-none"
            />
          </div>
        </section>
      </form>
    </main>
  );
}
