'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { 
  Bell,
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
import { auth, db } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
import { doc, onSnapshot, collection, query, where } from 'firebase/firestore';
import { Family, Tamagotchi, ShoppingItem, Task, MealPlan } from '@/lib/types';
import { motion, AnimatePresence } from 'framer-motion';
import StatusWidget from '@/components/dashboard/StatusWidget';

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
  const [family, setFamily] = useState<Family | null>(null);
  const [tamagotchi, setTamagotchi] = useState<Tamagotchi | null>(null);
  const [shoppingItems, setShoppingItems] = useState<ShoppingItem[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [currentMeal, setCurrentMeal] = useState<MealPlan | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (!profile?.familyId) return;

    // 1. Family Listener
    const unsubFamily = onSnapshot(doc(db, 'families', profile.familyId), (snapshot) => {
      if (snapshot.exists()) setFamily(snapshot.data() as Family);
    });

    // 2. Tamagotchi Listener
    const unsubTama = onSnapshot(doc(db, 'tamagotchi', profile.familyId), (snapshot) => {
      if (snapshot.exists()) setTamagotchi(snapshot.data() as Tamagotchi);
    });

    // 3. Shopping List (Pending items)
    const unsubShopping = onSnapshot(
      query(collection(db, 'shoppingList'), where('familyId', '==', profile.familyId), where('completed', '==', false)),
      (snapshot) => {
        setShoppingItems(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as ShoppingItem)));
      }
    );

    // 4. Tasks (Pending items)
    const unsubTasks = onSnapshot(
      query(collection(db, 'tasks'), where('familyId', '==', profile.familyId), where('completed', '==', false)),
      (snapshot) => {
        setTasks(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Task)));
      }
    );

    // 5. Current Meal
    const todayStr = new Date().toISOString().slice(0, 10);
    const hour = new Date().getHours();
    let mealType = '';
    if (hour >= 5 && hour < 11) mealType = 'breakfast';
    else if (hour >= 11 && hour < 17) mealType = 'lunch';
    else if (hour >= 17 && hour < 23) mealType = 'dinner';

    const unsubMeal = onSnapshot(
      query(collection(db, 'mealPlans'), where('familyId', '==', profile.familyId), where('date', '==', todayStr)),
      (snapshot) => {
        const plans = snapshot.docs.map(d => d.data() as MealPlan);
        const current = plans.find(p => p.mealType === mealType);
        setCurrentMeal(current || null);
      }
    );

    return () => {
      unsubFamily();
      unsubTama();
      unsubShopping();
      unsubTasks();
      unsubMeal();
    };
  }, [profile?.familyId]);

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

  const usersInShop = family?.inShop ? Object.entries(family.inShop) : [];

  return (
    <main className="min-h-screen p-4 pb-20">
      {/* In Shop Banner */}
      <AnimatePresence>
        {usersInShop.length > 0 && (
          <motion.div 
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
            className="mb-4 bg-primary text-white p-3 rounded-2xl flex items-center gap-3 shadow-lg shadow-primary/20"
          >
            <Bell size={18} className="animate-bounce" />
            <div className="text-xs font-bold uppercase tracking-wider">
              {usersInShop.map(([uid, data]) => (
                <span key={uid}>{data.userName} в "{data.shopName}"!</span>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <header className="flex justify-between items-center mb-6 pt-4">
        <div className="flex-1">
          <h1 className="text-2xl font-black tracking-tight">FamilyHub</h1>
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

      {/* Main Status Widget */}
      <div className="mb-8">
        <StatusWidget
          profile={profile}
          tamagotchi={tamagotchi}
          shoppingItems={shoppingItems}
          tasks={tasks}
          currentMeal={currentMeal}
          hasEmotionCheckIn={!!profile.emotions && new Date(profile.emotions.updatedAt?.toMillis ? profile.emotions.updatedAt.toMillis() : Date.now()).toDateString() === new Date().toDateString()}
        />
      </div>

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
