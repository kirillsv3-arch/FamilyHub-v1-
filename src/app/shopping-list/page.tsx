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
  orderBy
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { ShoppingItem } from '@/lib/types';
import Link from 'next/link';
import { ChevronLeft, Plus, CheckCircle2, Circle, Trash2, Edit2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ShoppingListPage() {
  const { user, profile } = useAuth();
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [newItemTitle, setNewItemTitle] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [editingItem, setEditingItem] = useState<ShoppingItem | null>(null);

  useEffect(() => {
    if (!profile?.familyId) return;

    const q = query(
      collection(db, 'shoppingList'),
      where('familyId', '==', profile.familyId),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const itemsList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ShoppingItem[];
      setItems(itemsList);
    });

    return () => unsubscribe();
  }, [profile?.familyId]);

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemTitle.trim() || !user || !profile?.familyId) return;

    try {
      await addDoc(collection(db, 'shoppingList'), {
        title: newItemTitle.trim(),
        completed: false,
        familyId: profile.familyId,
        createdBy: user.uid,
        createdAt: serverTimestamp(),
        shopId: 'plan',
        priority: 'normal'
      });
      setNewItemTitle('');
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
        title: editingItem.title.trim()
      });
      setEditingItem(null);
    } catch (err) {
      console.error("Error editing item:", err);
    }
  };

  return (
    <main className="min-h-screen p-4 pb-24">
      <header className="flex items-center justify-between mb-6 pt-4">
        <div className="flex items-center">
          <Link href="/" className="p-2 -ml-2 rounded-full hover:bg-secondary transition-colors">
            <ChevronLeft size={24} />
          </Link>
          <h1 className="text-2xl font-bold ml-2">Список покупок</h1>
        </div>
      </header>

      <div className="space-y-3">
        <AnimatePresence initial={false}>
          {items.map((item) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`flex items-center p-4 rounded-2xl border transition-colors ${
                item.completed
                  ? 'bg-secondary/30 border-transparent opacity-60'
                  : 'bg-card border-border shadow-sm'
              }`}
            >
              <button
                onClick={() => toggleComplete(item)}
                className="mr-3 text-primary"
              >
                {item.completed ? <CheckCircle2 size={24} /> : <Circle size={24} />}
              </button>

              <span className={`flex-1 font-medium ${item.completed ? 'line-through' : ''}`}>
                {item.title}
              </span>

              <div className="flex gap-1">
                <button
                  onClick={() => setEditingItem(item)}
                  className="p-2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Edit2 size={18} />
                </button>
                <button
                  onClick={() => handleDeleteItem(item.id)}
                  className="p-2 text-muted-foreground hover:text-destructive transition-colors"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {items.length === 0 && !isAdding && (
          <div className="text-center py-12 opacity-40 italic">
            Список пуст. Добавьте что-нибудь!
          </div>
        )}
      </div>

      {/* Floating Action Button */}
      {!isAdding && !editingItem && (
        <button
          onClick={() => setIsAdding(true)}
          className="fixed bottom-8 right-8 p-4 bg-primary text-primary-foreground rounded-full shadow-xl hover:scale-105 active:scale-95 transition-transform"
        >
          <Plus size={32} />
        </button>
      )}

      {/* Add Item Modal */}
      {isAdding && (
        <div className="fixed inset-0 bg-black/60 flex items-end sm:items-center justify-center p-0 sm:p-4 z-50">
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            className="w-full max-w-lg bg-card p-6 rounded-t-3xl sm:rounded-3xl border-t sm:border border-border"
          >
            <h2 className="text-xl font-bold mb-4">Добавить в список</h2>
            <form onSubmit={handleAddItem} className="space-y-4">
              <input
                autoFocus
                type="text"
                value={newItemTitle}
                onChange={(e) => setNewItemTitle(e.target.value)}
                placeholder="Что нужно купить?"
                className="w-full p-4 rounded-xl bg-background border border-border focus:outline-none focus:ring-2 focus:ring-primary text-lg"
              />
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="flex-1 p-4 bg-secondary text-secondary-foreground rounded-xl font-bold"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="flex-1 p-4 bg-primary text-primary-foreground rounded-xl font-bold"
                >
                  Добавить
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Edit Item Modal */}
      {editingItem && (
        <div className="fixed inset-0 bg-black/60 flex items-end sm:items-center justify-center p-0 sm:p-4 z-50">
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            className="w-full max-w-lg bg-card p-6 rounded-t-3xl sm:rounded-3xl border-t sm:border border-border"
          >
            <h2 className="text-xl font-bold mb-4">Редактировать</h2>
            <form onSubmit={handleEditItem} className="space-y-4">
              <input
                autoFocus
                type="text"
                value={editingItem.title}
                onChange={(e) => setEditingItem({...editingItem, title: e.target.value})}
                placeholder="Название товара"
                className="w-full p-4 rounded-xl bg-background border border-border focus:outline-none focus:ring-2 focus:ring-primary text-lg"
              />
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="flex-1 p-4 bg-secondary text-secondary-foreground rounded-xl font-bold"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="flex-1 p-4 bg-primary text-primary-foreground rounded-xl font-bold"
                >
                  Сохранить
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </main>
  );
}
