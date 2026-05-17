'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  increment
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { ShoppingItem } from '@/lib/types';
import Link from 'next/link';
import {
  ChevronLeft,
  Plus,
  CheckCircle2,
  Circle,
  Trash2,
  Edit2,
  MoreVertical,
  ClipboardList,
  Store,
  ShoppingCart as ShopIcon,
  Zap,
  Package,
  PlusCircle,
  Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

const SHOPS = [
  { id: 'plan', name: 'ПЛАН', emoji: '📋', color: 'bg-zinc-500', text: 'text-zinc-500' },
  { id: 'lenta', name: 'Лента', emoji: '🌻', color: 'bg-blue-600', text: 'text-blue-600' },
  { id: 'magnit', name: 'Магнит', emoji: '🔴', color: 'bg-red-600', text: 'text-red-600' },
  { id: 'samokat', name: 'Самокат', emoji: '🚲', color: 'bg-pink-500', text: 'text-pink-500' },
  { id: 'lavka', name: 'Я.Лавка', emoji: '🍋', color: 'bg-yellow-400', text: 'text-yellow-400' },
  { id: 'apteka', name: 'Аптека', emoji: '💊', color: 'bg-teal-500', text: 'text-teal-500' },
  { id: 'market', name: 'Маркетплейсы', emoji: '📦', color: 'bg-indigo-500', text: 'text-indigo-500' },
];

export default function ShoppingListPage() {
  const { user, profile } = useAuth();
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [activeTab, setActiveTab] = useState('plan');
  const [isAdding, setIsAdding] = useState(false);
  const [editingItem, setEditingItem] = useState<ShoppingItem | null>(null);
  const [newItem, setNewItem] = useState({ title: '', shopId: 'plan', priority: 'normal' as const });

  useEffect(() => {
    if (!profile?.familyId) return;

    const q = query(
      collection(db, 'shoppingList'),
      where('familyId', '==', profile.familyId)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const itemsList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ShoppingItem[];

      itemsList.sort((a, b) => {
        const dateA = a.createdAt?.seconds || 0;
        const dateB = b.createdAt?.seconds || 0;
        return dateB - dateA;
      });

      setItems(itemsList);
    });

    return () => unsubscribe();
  }, [profile?.familyId]);

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.title.trim() || !user || !profile?.familyId) return;

    try {
      await addDoc(collection(db, 'shoppingList'), {
        title: newItem.title.trim(),
        completed: false,
        familyId: profile.familyId,
        createdBy: user.uid,
        createdAt: serverTimestamp(),
        shopId: newItem.shopId,
        priority: newItem.priority
      });
      setNewItem({ title: '', shopId: activeTab === 'plan' ? 'plan' : activeTab, priority: 'normal' });
      setIsAdding(false);
    } catch (err) {
      console.error("Error adding item:", err);
    }
  };

  const toggleComplete = async (item: ShoppingItem) => {
    try {
      const itemRef = doc(db, 'shoppingList', item.id);
      await updateDoc(itemRef, {
        completed: !item.completed
      });
    } catch (err) {
      console.error("Error toggling complete:", err);
    }
  };

  const handleDeleteItem = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'shoppingList', id));
    } catch (err) {
      console.error("Error deleting item:", err);
    }
  };

  const handleEditItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem || !editingItem.title.trim()) return;

    try {
      const itemRef = doc(db, 'shoppingList', editingItem.id);
      await updateDoc(itemRef, {
        title: editingItem.title.trim(),
        shopId: editingItem.shopId,
        priority: editingItem.priority
      });
      setEditingItem(null);
    } catch (err) {
      console.error("Error editing item:", err);
    }
  };

  const filteredItems = activeTab === 'plan'
    ? items
    : items.filter(item => item.shopId === activeTab);

  const activeShop = SHOPS.find(s => s.id === activeTab);

  return (
    <main className="min-h-screen bg-background">
      {/* Sticky Header with Tabs */}
      <div className="sticky top-0 z-30 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link href="/" className="p-2 -ml-2 rounded-full hover:bg-secondary transition-colors">
              <ChevronLeft size={24} />
            </Link>
            <h1 className="text-xl font-bold">Список</h1>
          </div>
          <button
            onClick={() => {
              setNewItem(prev => ({ ...prev, shopId: activeTab === 'plan' ? 'plan' : activeTab }));
              setIsAdding(true);
            }}
            className={cn(
              "p-2 rounded-full transition-colors",
              activeShop?.color || "bg-primary",
              "text-white"
            )}
          >
            <Plus size={24} />
          </button>
        </div>

        {/* Telegram-style Tabs */}
        <div className="flex overflow-x-auto no-scrollbar px-4 pb-3 gap-2">
          {SHOPS.map((shop) => (
            <button
              key={shop.id}
              onClick={() => setActiveTab(shop.id)}
              className={cn(
                "flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all",
                activeTab === shop.id
                  ? `${shop.color} text-white shadow-lg`
                  : "bg-secondary text-muted-foreground hover:bg-secondary/80"
              )}
            >
              <span>{shop.emoji}</span>
              {shop.name}
              {activeTab === shop.id && items.filter(i => i.shopId === shop.id && !i.completed).length > 0 && (
                 <span className="ml-1 w-2 h-2 rounded-full bg-white animate-pulse" />
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 space-y-3 pb-24">
        <AnimatePresence mode="popLayout">
          {filteredItems.map((item) => {
            const itemShop = SHOPS.find(s => s.id === item.shopId);
            return (
              <motion.div
                layout
                key={item.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                onClick={() => {
                  if (activeTab === 'plan') setEditingItem(item);
                  else toggleComplete(item);
                }}
                className={cn(
                  "flex items-center p-4 rounded-3xl border transition-all cursor-pointer select-none",
                  item.completed
                    ? 'bg-secondary/20 border-transparent opacity-50'
                    : 'bg-card border-border shadow-sm active:scale-[0.98]'
                )}
              >
                <div
                  className={cn(
                    "mr-4 flex-shrink-0 transition-colors",
                    item.completed ? "text-muted-foreground" : (itemShop?.text || "text-primary")
                  )}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleComplete(item);
                  }}
                >
                  {item.completed ? <CheckCircle2 size={26} /> : <Circle size={26} />}
                </div>

                <div className="flex-1 min-w-0">
                  <p className={cn(
                    "font-bold text-lg leading-tight truncate",
                    item.completed ? 'line-through text-muted-foreground' : ''
                  )}>
                    {item.title}
                  </p>
                  {activeTab === 'plan' && itemShop && (
                    <div className="flex items-center gap-2 mt-1">
                      <span className={cn("text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border", itemShop.text, "border-current opacity-70")}>
                        {itemShop.emoji} {itemShop.name}
                      </span>
                    </div>
                  )}
                </div>

                {activeTab === 'plan' && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteItem(item.id);
                    }}
                    className="p-2 text-muted-foreground hover:text-destructive opacity-40 hover:opacity-100 transition-all"
                  >
                    <Trash2 size={20} />
                  </button>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>

        {filteredItems.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center opacity-30 grayscale">
            <Package size={64} className="mb-4" />
            <p className="font-bold text-xl">Тут пока пусто</p>
            <p className="text-sm">Нажмите +, чтобы добавить товары</p>
          </div>
        )}
      </div>

      {/* Add Item Sheet */}
      <AnimatePresence>
        {isAdding && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAdding(false)}
              className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed inset-x-0 bottom-0 z-50 bg-card rounded-t-[40px] p-8 border-t border-border shadow-2xl"
            >
              <div className="w-12 h-1.5 bg-muted rounded-full mx-auto mb-8" />
              <h2 className="text-2xl font-black mb-6">Что добавим?</h2>
              <form onSubmit={handleAddItem} className="space-y-6">
                <input
                  autoFocus
                  type="text"
                  value={newItem.title}
                  onChange={(e) => setNewItem({...newItem, title: e.target.value})}
                  placeholder="Название товара..."
                  className="w-full p-5 rounded-2xl bg-background border border-border focus:outline-none focus:ring-4 focus:ring-primary/20 text-xl font-bold transition-all"
                />

                <div className="space-y-3">
                  <p className="text-sm font-black text-muted-foreground uppercase tracking-widest ml-1">Где купить?</p>
                  <div className="flex overflow-x-auto no-scrollbar gap-2 pb-2">
                    {SHOPS.map(shop => (
                      <button
                        key={shop.id}
                        type="button"
                        onClick={() => setNewItem({...newItem, shopId: shop.id})}
                        className={cn(
                          "px-4 py-2 rounded-xl text-sm font-bold border transition-all whitespace-nowrap",
                          newItem.shopId === shop.id
                            ? `${shop.color} border-transparent text-white`
                            : "bg-background border-border text-muted-foreground"
                        )}
                      >
                        {shop.emoji} {shop.name}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    type="submit"
                    className="flex-1 p-5 bg-primary text-primary-foreground rounded-2xl font-black text-lg shadow-xl shadow-primary/20 active:scale-95 transition-all"
                  >
                    Добавить
                  </button>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Edit Item Sheet */}
      <AnimatePresence>
        {editingItem && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setEditingItem(null)}
              className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed inset-x-0 bottom-0 z-50 bg-card rounded-t-[40px] p-8 border-t border-border shadow-2xl"
            >
              <div className="w-12 h-1.5 bg-muted rounded-full mx-auto mb-8" />
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-black">Изменить</h2>
                <button
                  onClick={() => {
                    handleDeleteItem(editingItem.id);
                    setEditingItem(null);
                  }}
                  className="p-3 text-destructive bg-destructive/10 rounded-2xl active:scale-90 transition-all"
                >
                  <Trash2 size={24} />
                </button>
              </div>
              <form onSubmit={handleEditItem} className="space-y-6">
                <input
                  autoFocus
                  type="text"
                  value={editingItem.title}
                  onChange={(e) => setEditingItem({...editingItem, title: e.target.value})}
                  className="w-full p-5 rounded-2xl bg-background border border-border focus:outline-none focus:ring-4 focus:ring-primary/20 text-xl font-bold transition-all"
                />

                <div className="space-y-3">
                  <p className="text-sm font-black text-muted-foreground uppercase tracking-widest ml-1">Магазин</p>
                  <div className="flex overflow-x-auto no-scrollbar gap-2 pb-2">
                    {SHOPS.map(shop => (
                      <button
                        key={shop.id}
                        type="button"
                        onClick={() => setEditingItem({...editingItem, shopId: shop.id})}
                        className={cn(
                          "px-4 py-2 rounded-xl text-sm font-bold border transition-all whitespace-nowrap",
                          editingItem.shopId === shop.id
                            ? `${shop.color} border-transparent text-white`
                            : "bg-background border-border text-muted-foreground"
                        )}
                      >
                        {shop.emoji} {shop.name}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    type="submit"
                    className="flex-1 p-5 bg-secondary text-secondary-foreground rounded-2xl font-black text-lg active:scale-95 transition-all"
                  >
                    Сохранить
                  </button>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </main>
  );
}
