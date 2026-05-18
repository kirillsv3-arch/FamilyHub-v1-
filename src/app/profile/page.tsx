'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { ChevronLeft, LogOut, Calendar, User as UserIcon, Save, Zap } from 'lucide-react';
import { auth, db } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import Link from 'next/link';

export default function ProfilePage() {
  const { user, profile, loading } = useAuth();
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [goals, setGoals] = useState({
    calories: profile?.nutrientGoals?.calories || 2000,
    proteins: profile?.nutrientGoals?.proteins || 100,
    fats: profile?.nutrientGoals?.fats || 65,
    carbs: profile?.nutrientGoals?.carbs || 250,
  });

  if (loading || !user || !profile) {
    return <div className="flex items-center justify-center min-h-screen">Загрузка...</div>;
  }

  const handleSignOut = async () => {
    await signOut(auth);
    router.push('/login');
  };

  const handleSaveGoals = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        nutrientGoals: goals
      });
    } catch (error) {
      console.error('Error saving goals:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="min-h-screen p-4">
      <header className="flex items-center mb-8 pt-4">
        <Link href="/" className="p-2 -ml-2 rounded-full hover:bg-secondary transition-colors">
          <ChevronLeft size={24} />
        </Link>
        <h1 className="text-2xl font-bold ml-2">Профиль</h1>
      </header>

      <div className="space-y-6">
        <div className="flex flex-col items-center p-8 bg-card rounded-3xl border border-border shadow-sm">
          <div className="w-24 h-24 bg-primary/20 rounded-full flex items-center justify-center mb-4 border-2 border-primary/30">
            <UserIcon size={48} className="text-primary" />
          </div>
          <h2 className="text-2xl font-bold">{profile.name}</h2>
          <p className="text-muted-foreground">{profile.email}</p>
        </div>

        <div className="bg-card rounded-3xl border border-border overflow-hidden">
          <div className="p-4 border-b border-border flex items-center gap-3">
            <Calendar size={20} className="text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Дата рождения</p>
              <p className="font-medium">{new Date(profile.dob).toLocaleDateString('ru-RU')}</p>
            </div>
          </div>
          
          <div className="p-4 flex items-center gap-3">
            <div className="w-5 h-5 rounded-full bg-green-500" />
            <div>
              <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">ID Семьи</p>
              <p className="font-mono text-sm">{profile.familyId}</p>
            </div>
          </div>
        </div>

        {/* Nutrient Goals */}
        <div className="bg-card rounded-3xl border border-border p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <Zap className="text-primary" size={24} />
            <h3 className="text-lg font-bold">Цели питания (КБЖУ)</h3>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground uppercase">Калории (ккал)</label>
              <input
                type="number"
                value={goals.calories}
                onChange={(e) => setGoals({ ...goals, calories: parseInt(e.target.value) })}
                className="w-full p-3 bg-secondary/50 rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground uppercase">Белки (г)</label>
              <input
                type="number"
                value={goals.proteins}
                onChange={(e) => setGoals({ ...goals, proteins: parseInt(e.target.value) })}
                className="w-full p-3 bg-secondary/50 rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground uppercase">Жиры (г)</label>
              <input
                type="number"
                value={goals.fats}
                onChange={(e) => setGoals({ ...goals, fats: parseInt(e.target.value) })}
                className="w-full p-3 bg-secondary/50 rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground uppercase">Углеводы (г)</label>
              <input
                type="number"
                value={goals.carbs}
                onChange={(e) => setGoals({ ...goals, carbs: parseInt(e.target.value) })}
                className="w-full p-3 bg-secondary/50 rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
          </div>

          <button
            onClick={handleSaveGoals}
            disabled={saving}
            className="w-full mt-6 p-3 bg-primary text-primary-foreground rounded-2xl font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            <Save size={18} />
            {saving ? 'Сохранение...' : 'Сохранить цели'}
          </button>
        </div>

        <button
          onClick={handleSignOut}
          className="w-full p-4 bg-destructive/10 text-destructive rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-destructive/20 transition-colors"
        >
          <LogOut size={20} />
          Выйти из аккаунта
        </button>
      </div>
    </main>
  );
}
