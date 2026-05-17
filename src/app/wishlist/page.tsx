'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  addDoc, 
  deleteDoc, 
  doc, 
  serverTimestamp,
  getDocs
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { WishlistItem, UserProfile } from '@/lib/types';
import Link from 'next/link';
import { ChevronLeft, Plus, Trash2, Gift, DollarSign, Heart } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

export default function WishlistPage() {
  const { user, profile } = useAuth();
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [familyMembers, setFamilyMembers] = useState<UserProfile[]>([]);
  const [activeOwnerId, setActiveOwnerId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [newItem, setNewItem] = useState({ title: '', price: '', isMaterial: true });

  useEffect(() => {
    if (!profile?.familyId) return;

    // Fetch family members
    const qMembers = query(collection(db, 'users'), where('familyId', '==', profile.familyId));
    getDocs(qMembers).then(snapshot => {
      const members = snapshot.docs.map(d => d.data() as UserProfile);
      setFamilyMembers(members);
      if (members.length > 0 && !activeOwnerId) {
        setActiveOwnerId(user?.uid || members[0].uid);
      }
    });

    const qItems = query(
      collection(db, 'wishlists'),
      where('familyId', '==', profile.familyId)
    );

    const unsubscribe = onSnapshot(qItems, (snapshot) => {
      const itemsList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as WishlistItem[];
      setItems(itemsList);
    });

    return () => unsubscribe();
  }, [profile?.familyId, user?.uid]);

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.title.trim() || !user || !profile?.familyId || !activeOwnerId) return;

    try {
      await addDoc(collection(db, 'wishlists'), {
        title: newItem.title.trim(),
        price: newItem.isMaterial ? parseFloat(newItem.price) || 0 : null,
        isMaterial: newItem.isMaterial,
        familyId: profile.familyId,
        ownerId: activeOwnerId,
        createdAt: serverTimestamp(),
        isCompleted: false
      });
      setNewItem({ title: '', price: '', isMaterial: true });
      setIsAdding(false);
    } catch (err) {
      console.error("Error adding wish:", err);
    }
  };

  const filteredItems = items.filter(item => item.ownerId === activeOwnerId);

  return (
    <main className="min-h-screen bg-background p-4 pb-24">
      <header className="flex items-center justify-between mb-6 pt-4">
        <div className="flex items-center gap-2">
          <Link href="/" className="p-2 -ml-2 rounded-full hover:bg-secondary transition-colors">
            <ChevronLeft size={24} />
          </Link>
          <h1 className="text-2xl font-bold">Вишлисты</h1>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="p-3 bg-pink-500 text-white rounded-2xl shadow-lg shadow-pink-500/20 active:scale-95 transition-all"
        >
          <Plus size={24} />
        </button>
      </header>

      {/* Member Tabs */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar mb-6">
        {familyMembers.map(member => (
          <button
            key={member.uid}
            onClick={() => setActiveOwnerId(member.uid)}
            className={cn(
              "px-6 py-3 rounded-2xl font-bold transition-all whitespace-nowrap",
              activeOwnerId === member.uid 
                ? "bg-pink-500 text-white shadow-lg shadow-pink-500/20" 
                : "bg-card text-muted-foreground border border-border"
            )}
          >
            {member.name} {member.uid === user?.uid ? "(Я)" : ""}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        <AnimatePresence mode="popLayout">
          {filteredItems.map(item => (
            <motion.div
              layout
              key={item.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-card border border-border p-5 rounded-[32px] flex items-center justify-between shadow-sm"
            >
              <div className="flex items-center gap-4">
                <div className={cn(
                  "p-3 rounded-2xl",
                  item.isMaterial ? "bg-blue-500/10 text-blue-500" : "bg-red-500/10 text-red-500"
                )}>
                  {item.isMaterial ? <DollarSign size={24} /> : <Heart size={24} />}
                </div>
                <div>
                  <h3 className="font-bold text-lg">{item.title}</h3>
                  {item.isMaterial && (
                    <p className="text-sm font-black text-primary">{item.price?.toLocaleString()} ₽</p>
                  )}
                  {!item.isMaterial && (
                    <p className="text-xs text-muted-foreground uppercase font-bold tracking-widest">Нематериальное</p>
                  )}
                </div>
              </div>
              
              {activeOwnerId === user?.uid && (
                <button 
                  onClick={() => deleteDoc(doc(db, 'wishlists', item.id))}
                  className="p-2 text-muted-foreground hover:text-destructive opacity-40 hover:opacity-100 transition-all"
                >
                  <Trash2 size={20} />
                </button>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {filteredItems.length === 0 && (
          <div className="py-20 text-center opacity-20 flex flex-col items-center">
            <Gift size={64} className="mb-4" />
            <p className="font-bold text-xl uppercase tracking-tighter">Список пуст</p>
          </div>
        )}
      </div>

      {/* Add Modal */}
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
              className="fixed inset-x-0 bottom-0 z-50 bg-card rounded-t-[40px] p-8 border-t border-border"
            >
              <div className="w-12 h-1.5 bg-muted rounded-full mx-auto mb-8" />
              <h2 className="text-2xl font-black mb-6">Новое желание</h2>
              <form onSubmit={handleAddItem} className="space-y-6">
                <input
                  autoFocus
                  type="text"
                  value={newItem.title}
                  onChange={(e) => setNewItem({...newItem, title: e.target.value})}
                  placeholder="Что хочется?"
                  className="w-full p-5 rounded-2xl bg-background border border-border focus:outline-none focus:ring-4 focus:ring-pink-500/20 text-xl font-bold transition-all"
                />

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setNewItem({...newItem, isMaterial: true})}
                    className={cn(
                      "flex-1 p-4 rounded-2xl font-bold border transition-all",
                      newItem.isMaterial ? "bg-blue-500 text-white border-transparent" : "bg-background border-border text-muted-foreground"
                    )}
                  >
                    Материальное
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewItem({...newItem, isMaterial: false})}
                    className={cn(
                      "flex-1 p-4 rounded-2xl font-bold border transition-all",
                      !newItem.isMaterial ? "bg-red-500 text-white border-transparent" : "bg-background border-border text-muted-foreground"
                    )}
                  >
                    Впечатление
                  </button>
                </div>

                {newItem.isMaterial && (
                  <div className="relative">
                    <input
                      type="number"
                      value={newItem.price}
                      onChange={(e) => setNewItem({...newItem, price: e.target.value})}
                      placeholder="Примерная цена"
                      className="w-full p-5 rounded-2xl bg-background border border-border focus:outline-none focus:ring-4 focus:ring-pink-500/20 text-xl font-bold transition-all pr-12"
                    />
                    <span className="absolute right-6 top-1/2 -translate-y-1/2 text-xl font-bold opacity-30">₽</span>
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full p-5 bg-pink-500 text-white rounded-2xl font-black text-lg shadow-xl shadow-pink-500/20 active:scale-95 transition-all"
                >
                  Добавить в список
                </button>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </main>
  );
}
