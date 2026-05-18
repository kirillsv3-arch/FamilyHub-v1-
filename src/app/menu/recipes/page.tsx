'use client';

import React, { useState, useEffect } from 'react';
import { ChevronLeft, Plus, Search, BookOpen, Utensils, Clock, ExternalLink } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { Recipe } from '@/lib/types';
import Link from 'next/link';
import { motion } from 'framer-motion';

export default function RecipesListPage() {
  const { profile } = useAuth();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  useEffect(() => {
    if (!profile?.familyId) return;

    const fetchRecipes = async () => {
      try {
        const q = query(
          collection(db, 'recipes'),
          where('familyId', '==', profile.familyId),
          orderBy('createdAt', 'desc')
        );
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Recipe));
        setRecipes(data);
      } catch (error) {
        console.error('Error fetching recipes:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRecipes();
  }, [profile?.familyId]);

  const filteredRecipes = recipes.filter(r => {
    const matchesSearch = r.title.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || r.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const categories = [
    { id: 'all', label: 'Все' },
    { id: 'breakfast', label: 'Завтрак' },
    { id: 'lunch', label: 'Обед' },
    { id: 'dinner', label: 'Ужин' },
    { id: 'snack', label: 'Перекусы' },
  ];

  return (
    <main className="min-h-screen pb-24 bg-background">
      <header className="p-4 pt-8 sticky top-0 bg-background/80 backdrop-blur-md z-10 border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <Link href="/menu" className="p-2 -ml-2 rounded-full hover:bg-secondary transition-colors">
              <ChevronLeft size={24} />
            </Link>
            <h1 className="text-2xl font-bold ml-2">Рецепты</h1>
          </div>
          <Link
            href="/menu/recipes/new"
            className="p-2 bg-primary text-primary-foreground rounded-full shadow-lg"
          >
            <Plus size={24} />
          </Link>
        </div>

        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
            <input
              type="text"
              placeholder="Поиск рецептов..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-card rounded-2xl border border-border focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setCategoryFilter(cat.id)}
                className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all ${
                  categoryFilter === cat.id
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-card border border-border text-muted-foreground'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      <div className="p-4 space-y-4">
        {loading ? (
          <div className="flex flex-col items-center py-12 opacity-50">
            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
            <p>Загрузка книги рецептов...</p>
          </div>
        ) : filteredRecipes.length > 0 ? (
          <div className="grid grid-cols-1 gap-4">
            {filteredRecipes.map((recipe) => (
              <motion.div
                layout
                key={recipe.id}
                className="bg-card rounded-[32px] border border-border p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="space-y-1">
                    <span className="text-[10px] font-black uppercase tracking-widest text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                      {categories.find(c => c.id === recipe.category)?.label}
                    </span>
                    <h3 className="text-xl font-bold leading-tight">{recipe.title}</h3>
                  </div>
                  {recipe.link && (
                    <a href={recipe.link} target="_blank" rel="noopener noreferrer" className="p-2 bg-secondary rounded-full text-muted-foreground">
                      <ExternalLink size={16} />
                    </a>
                  )}
                </div>

                <div className="flex items-center gap-4 mb-4 text-sm font-medium text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <Utensils size={14} className="text-primary" />
                    <span>{recipe.calories} ккал</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock size={14} className="text-primary" />
                    <span>{recipe.ingredients.length} ингр.</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <div className="flex-1 p-2 bg-secondary/30 rounded-xl text-center">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase">Б</p>
                    <p className="text-sm font-bold">{recipe.proteins}г</p>
                  </div>
                  <div className="flex-1 p-2 bg-secondary/30 rounded-xl text-center">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase">Ж</p>
                    <p className="text-sm font-bold">{recipe.fats}г</p>
                  </div>
                  <div className="flex-1 p-2 bg-secondary/30 rounded-xl text-center">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase">У</p>
                    <p className="text-sm font-bold">{recipe.carbs}г</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center py-20 text-center space-y-4 opacity-50">
            <BookOpen size={64} className="text-muted-foreground" />
            <div className="space-y-1">
              <p className="text-lg font-bold">Книга рецептов пуста</p>
              <p className="text-sm">Нажмите «+», чтобы добавить первое блюдо</p>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
