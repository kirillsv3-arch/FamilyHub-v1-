'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import {
  ShoppingCart,
  Calendar,
  Wallet,
  Heart,
  Gift,
  UtensilsCrossed,
  LogOut,
  User as UserIcon,
  Settings
} from 'lucide-react';
import { auth } from '@/lib/firebase';
import { signOut } from 'firebase/auth';

const navItems = [
  { id: 'shopping-list', title: 'Список покупок', icon: ShoppingCart, color: 'bg-blue-500', href: '/shopping-list' },
  { id: 'planner', title: 'Планировщик', icon: Calendar, color: 'bg-green-500', href: '/planner' },
  { id: 'budget', title: 'Бюджет', icon: Wallet, color: 'bg-purple-500', href: '/budget' },
  { id: 'emotions', title: 'Эмоции', icon: Heart, color: 'bg-red-500', href: '/emotions' },
  { id: 'wishlist', title: 'Вишлисты', icon: Gift, color: 'bg-pink-500', href: '/wishlist' },
  { id: 'menu', title: 'Меню', icon: UtensilsCrossed, color: 'bg-orange-500', href: '/menu' },
];

export default function Dashboard() {
  const { user, profile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login');
      } else if (!profile?.familyId) {
        router.push('/family');
      }
    }
  }, [user, profile, loading, router]);

  const handleSignOut = async () => {
    await signOut(auth);
    router.push('/login');
  };

  if (loading || !user || !profile?.familyId) {
    return <div className="flex items-center justify-center min-h-screen">Загрузка...</div>;
  }

  return (
    <main className="min-h-screen p-4 pb-20">
      <header className="flex justify-between items-center mb-8 pt-4">
        <div>
          <h1 className="text-2xl font-bold">FamilyHub</h1>
          <p className="text-muted-foreground">Привет, {profile.name}!</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => router.push('/settings')}
            className="p-2 rounded-full bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors"
            title="Настройки"
          >
            <Settings size={20} />
          </button>
          <button
            onClick={() => router.push('/profile')}
            className="p-2 rounded-full bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors"
            title="Профиль"
          >
            <UserIcon size={20} />
          </button>
          <button
            onClick={handleSignOut}
            className="p-2 rounded-full bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors"
            title="Выйти"
          >
            <LogOut size={20} />
          </button>
        </div>
      </header>

      <div className="grid grid-cols-2 gap-4">
        {navItems.map((item) => (
          <Link
            key={item.id}
            href={item.href}
            className="flex flex-col items-center justify-center p-6 bg-card rounded-3xl border border-border hover:border-primary/50 transition-colors shadow-sm"
          >
            <div className={`p-4 rounded-2xl ${item.color} text-white mb-4 shadow-lg shadow-${item.color.split('-')[1]}-500/20`}>
              <item.icon size={32} />
            </div>
            <span className="font-bold text-center text-sm">{item.title}</span>
          </Link>
        ))}
      </div>
    </main>
  );
}
