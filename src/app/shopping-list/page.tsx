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
  increment,
  getDoc,
  setDoc,
  deleteField
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { ShoppingItem, Family } from '@/lib/types';
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
  Clock,
  Navigation,
  Bell,
  ExternalLink,
  Barcode
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useLongPress } from 'use-long-press';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ShoppingItem as ShoppingItemCard } from '@/components/shopping-list/ShoppingItem';
import { AddItemForm } from '@/components/shopping-list/AddItemForm';
import { ShopGroup } from '@/components/shopping-list/ShopGroup';

const UNITS = ['шт.', 'кг', 'л', 'упак.', 'г', 'мл'] as const;

function PriceChart({ itemName, familyId }: { itemName: string, familyId: string }) {
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    const q = query(
      collection(db, 'priceHistory'),
      where('familyId', '==', familyId),
      where('itemName', '==', itemName.trim().toLowerCase())
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => {
        const d = doc.data();
        return {
          price: d.price,
          date: d.timestamp?.toDate() ? new Date(d.timestamp.toDate()).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' }) : '',
          rawDate: d.timestamp?.toDate() || new Date()
        };
      });
      data.sort((a, b) => a.rawDate - b.rawDate);
      setHistory(data);
    });

    return () => unsubscribe();
  }, [itemName, familyId]);

  const avgPrice = history.length > 0 ? (history.reduce((sum, item) => sum + parseFloat(item.price || 0), 0) / history.length).toFixed(2) : 0;

  if (history.length < 2) return (
    <div className="text-center py-4">
      {history.length === 1 && (
        <p className="text-sm font-bold text-primary mb-1">Средняя цена: {history[0].price} ₽</p>
      )}
      <p className="text-xs text-muted-foreground italic">Недостаточно данных для графика</p>
    </div>
  );

  return (
    <div className="h-32 w-full mt-4">
      <div className="flex justify-between items-center mb-2 px-2">
        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">История цен</span>
        <span className="text-xs font-black text-primary">Средняя: {avgPrice} ₽</span>
      </div>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={history}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#333" />
          <XAxis dataKey="date" fontSize={10} tick={{fill: '#666'}} axisLine={false} tickLine={false} />
          <YAxis fontSize={10} tick={{fill: '#666'}} axisLine={false} tickLine={false} width={25} />
          <Tooltip 
            formatter={(value: any) => [`${value} ₽`, 'Цена']}
            labelStyle={{ color: '#888' }}
            contentStyle={{ backgroundColor: '#111', border: 'none', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' }}
            itemStyle={{ color: '#3b82f6' }}
          />
          <Line type="monotone" dataKey="price" stroke="#3b82f6" strokeWidth={2} dot={{r: 4, fill: '#3b82f6', stroke: '#0a0a0a', strokeWidth: 2}} activeDot={{r: 6}} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

const SHOPS = [
  { id: 'other', name: 'Другое', emoji: '✨', color: 'bg-zinc-500', text: 'text-zinc-500' },
  { id: 'lenta', name: 'Лента', emoji: '🌻', color: 'bg-[#004a99]', text: 'text-[#004a99]' },
  { id: 'magnit', name: 'Магнит', emoji: '🔴', color: 'bg-[#e30613]', text: 'text-[#e30613]' },
  { id: 'samokat', name: 'Самокат', emoji: '🚲', color: 'bg-pink-500', text: 'text-pink-500' },
  { id: 'lavka', name: 'Я.Лавка', emoji: '🍋', color: 'bg-yellow-400', text: 'text-yellow-400' },
  { id: 'apteka', name: 'Аптека', emoji: '💊', color: 'bg-teal-500', text: 'text-teal-500' },
  { id: 'market', name: 'Маркетплейсы', emoji: '📦', color: 'bg-indigo-500', text: 'text-indigo-500' },
];

const TABS = [
  { id: 'plan', name: 'ПЛАН', emoji: '📋', color: 'bg-zinc-800' },
  ...SHOPS
];

export default function ShoppingListPage() {
  const { user, profile } = useAuth();
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [family, setFamily] = useState<Family | null>(null);
  const [activeTab, setActiveTab] = useState('plan');
  const [isAdding, setIsAdding] = useState(false);
  const [editingItem, setEditingItem] = useState<ShoppingItem | null>(null);
  const [pricingItem, setPricingItem] = useState<ShoppingItem | null>(null);
  const [newItem, setNewItem] = useState<{title: string, shopId: string, priority: 'normal' | 'urgent', quantity: string, unit: typeof UNITS[number], link: string}>({ 
    title: '', 
    shopId: 'other', 
    priority: 'normal',
    quantity: '1',
    unit: 'шт.',
    link: ''
  });
  const [itemPrice, setItemPrice] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);

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
        // First sort by completion status (completed items go to bottom)
        if (a.completed !== b.completed) {
          return a.completed ? 1 : -1;
        }
        // Then sort by creation date (newest first)
        const dateA = a.createdAt?.seconds || 0;
        const dateB = b.createdAt?.seconds || 0;
        return dateB - dateA;
      });
      
      setItems(itemsList);
    });

    const unsubscribeFamily = onSnapshot(doc(db, 'families', profile.familyId), (snapshot) => {
      if (snapshot.exists()) {
        setFamily(snapshot.data() as Family);
      }
    });

    return () => {
      unsubscribe();
      unsubscribeFamily();
    };
  }, [profile?.familyId]);

  useEffect(() => {
    // Unique item titles for suggestions
    const titles = Array.from(new Set(items.map(i => i.title)));
    setSuggestions(titles.slice(0, 10));
  }, [items]);

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
        priority: newItem.priority,
        quantity: parseFloat(newItem.quantity) || 1,
        unit: newItem.unit,
        link: newItem.shopId === 'market' ? newItem.link : '',
        isOrdered: false
      });
      setNewItem({ title: '', shopId: activeTab === 'plan' || activeTab === 'other' ? 'other' : activeTab, priority: 'normal', quantity: '1', unit: 'шт.', link: '' });
      setIsAdding(false);
    } catch (err) {
      console.error("Error adding item:", err);
    }
  };

  const toggleComplete = async (item: ShoppingItem) => {
    try {
      const itemRef = doc(db, 'shoppingList', item.id);
      const newStatus = !item.completed;
      
      await updateDoc(itemRef, {
        completed: newStatus,
        isOrdered: item.shopId === 'market' ? newStatus : false
      });

      if (newStatus && item.shopId !== 'market') {
        setPricingItem(item);
        setItemPrice('');
      }
    } catch (err) {
      console.error("Error toggling complete:", err);
    }
  };

  const handleSavePrice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pricingItem || !itemPrice) return;

    try {
      const price = parseFloat(itemPrice);
      if (isNaN(price)) return;

      // Update item with price
      const itemRef = doc(db, 'shoppingList', pricingItem.id);
      await updateDoc(itemRef, { price });

      // Save to history
      await addDoc(collection(db, 'priceHistory'), {
        familyId: profile?.familyId,
        itemName: pricingItem.title.trim().toLowerCase(),
        price,
        shopId: pricingItem.shopId,
        timestamp: serverTimestamp(),
        userId: user?.uid
      });

      // Budget Sync: Automatically create an expense transaction
      await addDoc(collection(db, 'transactions'), {
        amount: price,
        type: 'expense',
        categoryId: 'food', // Default category for shopping list items
        description: `Покупка: ${pricingItem.title}`,
        date: serverTimestamp(),
        familyId: profile?.familyId,
        userId: user?.uid,
        userName: profile?.name
      });

      setPricingItem(null);
      setItemPrice('');
    } catch (err) {
      console.error("Error saving price:", err);
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
        priority: editingItem.priority,
        quantity: editingItem.quantity,
        unit: editingItem.unit,
        link: editingItem.shopId === 'market' ? editingItem.link : '',
      });
      setEditingItem(null);
    } catch (err) {
      console.error("Error editing item:", err);
    }
  };

  const filteredItems = activeTab === 'plan' 
    ? items 
    : items.filter(item => item.shopId === activeTab);

  const activeShop = TABS.find(s => s.id === activeTab);

  const bindLongPress = useLongPress((event, { context }: { context?: any }) => {
    if (activeTab === 'plan' && context) {
      triggerVibrate([50, 30, 50]);
      handleDeleteItem(context.id);
    }
  }, {
    threshold: 600,
    captureEvent: true,
    cancelOnMovement: true,
  });

  const triggerVibrate = (pattern: number | number[] = 50) => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(pattern);
    }
  };

  const handleTabChange = (id: string) => {
    setActiveTab(id);
    triggerVibrate(30);
  };

  const toggleInShop = async () => {
    if (!user || !profile?.familyId || activeTab === 'plan') return;
    
    const isInThisShop = family?.inShop?.[user.uid]?.shopId === activeTab;
    const familyRef = doc(db, 'families', profile.familyId);

    try {
      if (isInThisShop) {
        await updateDoc(familyRef, {
          [`inShop.${user.uid}`]: deleteField()
        });
      } else {
        await updateDoc(familyRef, {
          [`inShop.${user.uid}`]: {
            userName: profile.name,
            shopId: activeTab,
            shopName: activeShop?.name || '',
            timestamp: serverTimestamp()
          }
        });
      }
    } catch (err) {
      console.error("Error toggling in shop status:", err);
    }
  };

  const usersInShop = family?.inShop ? Object.entries(family.inShop) : [];

  return (
    <main className="min-h-screen bg-background">
      {/* In Shop Banner */}
      <AnimatePresence>
        {usersInShop.length > 0 && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-primary text-white overflow-hidden"
          >
            <div className="px-4 py-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider">
              <Bell size={14} className="animate-bounce" />
              {usersInShop.map(([uid, data]) => (
                <span key={uid}>{data.userName} сейчас в "{data.shopName}"!</span>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sticky Header with Tabs */}
      <div className="sticky top-0 z-30 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link href="/" className="p-2 -ml-2 rounded-full hover:bg-secondary transition-colors">
              <ChevronLeft size={24} />
            </Link>
            <h1 className="text-xl font-bold">Список</h1>
          </div>
          <div className="flex gap-2">
            {activeTab === 'plan' && items.filter(i => i.completed).length > 0 && (
              <button 
                onClick={async () => {
                  const toDelete = items.filter(i => i.completed);
                  for (const item of toDelete) {
                    await deleteDoc(doc(db, 'shoppingList', item.id));
                  }
                }}
                className="p-2 rounded-full bg-secondary text-muted-foreground hover:text-destructive transition-colors"
                title="Очистить купленное"
              >
                <Trash2 size={24} />
              </button>
            )}
            <button 
              onClick={() => {
                setNewItem(prev => ({ ...prev, shopId: activeTab === 'plan' ? 'other' : activeTab }));
                setIsAdding(true);
              }}
              className={cn(
                "p-2 rounded-full transition-colors",
                activeShop?.id === 'plan' ? "bg-primary" : (activeShop?.color || "bg-primary"),
                "text-white"
              )}
            >
              <Plus size={24} />
            </button>
          </div>
        </div>

        {/* Telegram-style Tabs */}
        <div className="flex overflow-x-auto no-scrollbar px-4 pb-3 gap-2">
          {TABS.map((tab) => (
            <button
              key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
              className={cn(
                "flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all",
                activeTab === tab.id 
                  ? `${tab.color} text-white shadow-lg` 
                  : "bg-secondary text-muted-foreground hover:bg-secondary/80"
              )}
            >
              <span>{tab.emoji}</span>
              {tab.name}
              {tab.id !== 'plan' && items.filter(i => i.shopId === tab.id && !i.completed).length > 0 && (
                 <span className="ml-1 w-2 h-2 rounded-full bg-white animate-pulse" />
              )}
              {tab.id === 'plan' && items.filter(i => !i.completed).length > 0 && (
                 <span className="ml-1 px-1.5 py-0.5 rounded-full bg-white/20 text-[10px]">
                   {items.filter(i => !i.completed).length}
                 </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 space-y-3 pb-24">
        {/* In Shop Toggle Button */}
        {activeTab !== 'plan' && (
          <button
            onClick={toggleInShop}
            className={cn(
              "w-full p-4 rounded-3xl border flex items-center justify-between transition-all active:scale-[0.98]",
              family?.inShop?.[user?.uid || '']?.shopId === activeTab
                ? "bg-primary border-transparent text-white shadow-lg shadow-primary/30"
                : "bg-card border-border text-foreground"
            )}
          >
            <div className="flex items-center gap-3 font-bold">
              <Navigation size={20} className={family?.inShop?.[user?.uid || '']?.shopId === activeTab ? "animate-pulse" : ""} />
              <span>{family?.inShop?.[user?.uid || '']?.shopId === activeTab ? "Я в магазине" : "Я зашел в магазин"}</span>
            </div>
            {family?.inShop?.[user?.uid || '']?.shopId === activeTab && (
              <span className="text-xs bg-white/20 px-2 py-1 rounded-full">АКТИВНО</span>
            )}
          </button>
        )}

        <ShopGroup
          items={filteredItems}
          shops={SHOPS}
          activeTab={activeTab}
          usersInShop={usersInShop}
          onToggleComplete={toggleComplete}
          onDeleteItem={handleDeleteItem}
          onEditItem={setEditingItem}
          bindLongPress={bindLongPress}
          triggerVibrate={triggerVibrate}
        />
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
              <AddItemForm
                item={newItem}
                setItem={setNewItem}
                shops={SHOPS}
                suggestions={suggestions}
                onSubmit={handleAddItem}
                submitLabel="Добавить"
              />
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
              <div className="space-y-6">
                {profile?.familyId && (
                  <PriceChart itemName={editingItem.title} familyId={profile.familyId} />
                )}
                <AddItemForm
                  item={editingItem}
                  setItem={setEditingItem}
                  shops={SHOPS}
                  suggestions={suggestions}
                  onSubmit={handleEditItem}
                  submitLabel="Сохранить"
                />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Price Input Sheet */}
      <AnimatePresence>
        {pricingItem && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => setPricingItem(null)}
              className="fixed inset-0 bg-black/60 z-[60] backdrop-blur-sm" 
            />
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed inset-x-0 bottom-0 z-[70] bg-card rounded-t-[40px] p-8 border-t border-border shadow-2xl"
            >
              <div className="w-12 h-1.5 bg-muted rounded-full mx-auto mb-8" />
              <h2 className="text-2xl font-black mb-2 truncate">Цена: {pricingItem.title}</h2>
              <p className="text-sm text-muted-foreground mb-6">Введите стоимость для статистики</p>
              
              <form onSubmit={handleSavePrice} className="space-y-6">
                <div className="relative">
                  <input
                    autoFocus
                    type="number"
                    inputMode="decimal"
                    value={itemPrice}
                    onChange={(e) => setItemPrice(e.target.value)}
                    placeholder="0.00"
                    className="w-full p-5 rounded-2xl bg-background border border-border focus:outline-none focus:ring-4 focus:ring-primary/20 text-3xl font-black transition-all pr-12 text-center"
                  />
                  <span className="absolute right-6 top-1/2 -translate-y-1/2 text-2xl font-bold opacity-30">₽</span>
                </div>
                
                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => setPricingItem(null)}
                    className="flex-1 p-5 bg-secondary text-secondary-foreground rounded-2xl font-black text-lg active:scale-95 transition-all"
                  >
                    Пропустить
                  </button>
                  <button
                    type="submit"
                    className="flex-1 p-5 bg-primary text-primary-foreground rounded-2xl font-black text-lg shadow-xl shadow-primary/20 active:scale-95 transition-all"
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
