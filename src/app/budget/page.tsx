'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  addDoc, 
  serverTimestamp,
  orderBy,
  updateDoc,
  doc,
  deleteDoc
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Transaction, BudgetCategory, SavingsGoal, Loan, RecurringTemplate } from '@/lib/types';
import Link from 'next/link';
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  TrendingUp, 
  TrendingDown, 
  PieChart as PieIcon,
  Target,
  CreditCard,
  History,
  LayoutGrid,
  MoreVertical,
  PlusCircle,
  PiggyBank,
  Calendar as CalendarIcon,
  Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { format, startOfMonth, endOfMonth, subMonths, isWithinInterval } from 'date-fns';
import { ru } from 'date-fns/locale';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

const DEFAULT_CATEGORIES = [
  { 
    id: 'food', name: 'Продукты', icon: '🛒', color: '#3b82f6',
    subcategories: [{id: 'supermarket', name: 'Супермаркет'}, {id: 'delivery', name: 'Доставка'}, {id: 'cafe', name: 'Кафе/Рестораны'}]
  },
  { 
    id: 'housing', name: 'Жилье', icon: '🏠', color: '#10b981',
    subcategories: [{id: 'rent', name: 'Аренда/Ипотека'}, {id: 'communal', name: 'ЖКХ'}, {id: 'repair', name: 'Ремонт'}]
  },
  { 
    id: 'transport', name: 'Транспорт', icon: '🚗', color: '#f59e0b',
    subcategories: [{id: 'fuel', name: 'Бензин'}, {id: 'taxi', name: 'Такси'}, {id: 'public', name: 'Общественный транспорт'}]
  },
  { 
    id: 'fun', name: 'Развлечения', icon: '🎬', color: '#ec4899',
    subcategories: [{id: 'cinema', name: 'Кино'}, {id: 'games', name: 'Игры'}, {id: 'hobby', name: 'Хобби'}]
  },
  { 
    id: 'health', name: 'Здоровье', icon: '💊', color: '#14b8a6',
    subcategories: [{id: 'pharmacy', name: 'Аптека'}, {id: 'doctor', name: 'Врачи'}, {id: 'sport', name: 'Спорт'}]
  },
  { 
    id: 'other', name: 'Другое', icon: '✨', color: '#6366f1',
    subcategories: [{id: 'clothes', name: 'Одежда'}, {id: 'gifts', name: 'Подарки'}, {id: 'services', name: 'Сервисы'}]
  },
];

export default function BudgetPage() {
  const { user, profile } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'categories' | 'goals' | 'loans'>('overview');
  const [dateRange, setDateRange] = useState({ start: startOfMonth(new Date()), end: endOfMonth(new Date()) });
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<BudgetCategory[]>([]);
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [isAddingTransaction, setIsAddingTransaction] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [isAddingGoal, setIsAddingGoal] = useState(false);
  const [isAddingLoan, setIsAddingLoan] = useState(false);
  const [newTransaction, setNewTransaction] = useState({ amount: '', type: 'expense' as 'income' | 'expense', categoryId: 'food', subcategoryId: '', description: '' });
  const [isImportingFromWishlist, setIsImportingFromWishlist] = useState(false);
  const [wishlistItems, setWishlistItems] = useState<any[]>([]);
  const [templates, setTemplates] = useState<RecurringTemplate[]>([]);
  const [isAddingTemplate, setIsAddingTemplate] = useState(false);
  const [newTemplate, setNewTemplate] = useState({ title: '', amount: '', type: 'expense' as 'income' | 'expense', categoryId: 'food', dayOfMonth: '1' });

  useEffect(() => {
    if (!profile?.familyId) return;

    const unsubT = onSnapshot(query(collection(db, 'transactions'), where('familyId', '==', profile.familyId)), (snap) => {
      setTransactions(snap.docs.map(d => ({ id: d.id, ...d.data() } as Transaction)));
    });
    
    const unsubC = onSnapshot(query(collection(db, 'budgetCategories'), where('familyId', '==', profile.familyId)), (snap) => {
      setCategories(snap.docs.map(d => ({ id: d.id, ...d.data() } as BudgetCategory)));
    });

    const unsubG = onSnapshot(query(collection(db, 'savingsGoals'), where('familyId', '==', profile.familyId)), (snap) => {
      setGoals(snap.docs.map(d => ({ id: d.id, ...d.data() } as SavingsGoal)));
    });

    const unsubL = onSnapshot(query(collection(db, 'loans'), where('familyId', '==', profile.familyId)), (snap) => {
      setLoans(snap.docs.map(d => ({ id: d.id, ...d.data() } as Loan)));
    });

    const unsubW = onSnapshot(query(collection(db, 'wishlists'), where('familyId', '==', profile.familyId), where('isMaterial', '==', true)), (snap) => {
      setWishlistItems(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    const unsubTempl = onSnapshot(query(collection(db, 'recurringTemplates'), where('familyId', '==', profile.familyId)), (snap) => {
      setTemplates(snap.docs.map(d => ({ id: d.id, ...d.data() } as RecurringTemplate)));
    });

    return () => { unsubT(); unsubC(); unsubG(); unsubL(); unsubW(); unsubTempl(); };
  }, [profile?.familyId]);

  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const d = t.date?.toDate ? t.date.toDate() : new Date();
      return isWithinInterval(d, { start: dateRange.start, end: dateRange.end });
    }).sort((a, b) => (b.date?.seconds || 0) - (a.date?.seconds || 0));
  }, [transactions, dateRange]);

  const stats = useMemo(() => {
    const income = filteredTransactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const expense = filteredTransactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    return { income, expense, balance: income - expense };
  }, [filteredTransactions]);

  const chartData = useMemo(() => {
    const data: any[] = [];
    DEFAULT_CATEGORIES.forEach(cat => {
      const amount = filteredTransactions.filter(t => t.type === 'expense' && t.categoryId === cat.id).reduce((s, t) => s + t.amount, 0);
      if (amount > 0) data.push({ name: cat.name, value: amount, color: cat.color });
    });
    return data;
  }, [filteredTransactions]);

  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTransaction.amount || !user || !profile?.familyId) return;
    await addDoc(collection(db, 'transactions'), {
      amount: parseFloat(newTransaction.amount),
      type: newTransaction.type,
      categoryId: newTransaction.categoryId,
      subcategoryId: newTransaction.subcategoryId,
      description: newTransaction.description,
      date: serverTimestamp(),
      familyId: profile.familyId,
      userId: user.uid,
      userName: profile.name
    });
    setNewTransaction({ amount: '', type: 'expense', categoryId: 'food', subcategoryId: '', description: '' });
    setIsAddingTransaction(false);
  };

  const handleUpdateTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTransaction || !editingTransaction.amount) return;
    await updateDoc(doc(db, 'transactions', editingTransaction.id), {
      amount: parseFloat(editingTransaction.amount as any),
      type: editingTransaction.type,
      categoryId: editingTransaction.categoryId,
      subcategoryId: editingTransaction.subcategoryId || '',
      description: editingTransaction.description,
    });
    setEditingTransaction(null);
  };

  const handleDeleteTransaction = async (id: string) => {
    if (confirm('Удалить эту операцию?')) {
      await deleteDoc(doc(db, 'transactions', id));
    }
  };

  const [newGoal, setNewGoal] = useState({ name: '', targetAmount: '' });
  const [newLoan, setNewLoan] = useState({ 
    name: '', 
    type: 'consumer' as 'consumer' | 'card', 
    totalAmount: '', 
    remainingAmount: '', 
    monthlyPayment: '', 
    paymentDate: '1',
    interestRate: '',
    paymentType: 'annuity' as 'annuity' | 'differentiated'
  });

  const handleAddGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGoal.name || !newGoal.targetAmount || !profile?.familyId) return;
    await addDoc(collection(db, 'savingsGoals'), {
      name: newGoal.name,
      targetAmount: parseFloat(newGoal.targetAmount),
      currentAmount: 0,
      familyId: profile.familyId
    });
    setNewGoal({ name: '', targetAmount: '' });
    setIsAddingGoal(false);
  };

  const handleAddLoan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLoan.name || !newLoan.totalAmount || !profile?.familyId) return;
    await addDoc(collection(db, 'loans'), {
      name: newLoan.name,
      type: newLoan.type,
      totalAmount: parseFloat(newLoan.totalAmount),
      remainingAmount: parseFloat(newLoan.remainingAmount),
      monthlyPayment: parseFloat(newLoan.monthlyPayment),
      paymentDate: parseInt(newLoan.paymentDate),
      interestRate: parseFloat(newLoan.interestRate) || 0,
      paymentType: newLoan.paymentType,
      familyId: profile.familyId
    });
    setNewLoan({ name: '', type: 'consumer', totalAmount: '', remainingAmount: '', monthlyPayment: '', paymentDate: '1', interestRate: '', paymentType: 'annuity' });
    setIsAddingLoan(false);
  };

  const handleAddTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTemplate.title || !newTemplate.amount || !profile?.familyId) return;
    await addDoc(collection(db, 'recurringTemplates'), {
      title: newTemplate.title,
      amount: parseFloat(newTemplate.amount),
      type: newTemplate.type,
      categoryId: newTemplate.categoryId,
      dayOfMonth: parseInt(newTemplate.dayOfMonth),
      familyId: profile.familyId
    });
    setNewTemplate({ title: '', amount: '', type: 'expense', categoryId: 'food', dayOfMonth: '1' });
    setIsAddingTemplate(false);
  };

  const renderOverview = () => (
    <div className="space-y-6">
      <div className="bg-card border border-border p-6 rounded-[32px] shadow-sm">
        <p className="text-sm font-black text-muted-foreground uppercase tracking-widest mb-1">История трат</p>
        <div className="space-y-4 mt-4">
          {filteredTransactions.map(t => {
            const cat = DEFAULT_CATEGORIES.find(c => c.id === t.categoryId);
            const subcat = cat?.subcategories.find(s => s.id === t.subcategoryId);
            return (
              <div 
                key={t.id} 
                onClick={() => setEditingTransaction(t)}
                className="flex items-center justify-between group cursor-pointer active:scale-95 transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-secondary rounded-2xl flex items-center justify-center text-lg">{cat?.icon || '✨'}</div>
                  <div>
                    <p className="font-bold">{t.description || subcat?.name || cat?.name}</p>
                    <p className="text-[10px] text-muted-foreground uppercase font-black tracking-wider">
                      {t.userName} • {t.date?.toDate ? format(t.date.toDate(), 'd MMM', { locale: ru }) : ''}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={cn("font-black", t.type === 'income' ? "text-green-500" : "text-foreground")}>
                    {t.type === 'income' ? '+' : ''}{t.amount.toLocaleString()} ₽
                  </p>
                  {subcat && <p className="text-[8px] font-black uppercase text-muted-foreground">{subcat.name}</p>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  const renderCategories = () => (
    <div className="space-y-6">
       <div className="bg-card border border-border p-6 rounded-[32px] flex flex-col items-center">
        <div className="h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={chartData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                {chartData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />)}
              </Pie>
              <Tooltip contentStyle={{ backgroundColor: '#111', border: 'none', borderRadius: '16px' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex flex-wrap justify-center gap-4 mt-4">
          {chartData.map(item => (
            <div key={item.name} className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
              <span className="text-[10px] font-black uppercase tracking-widest opacity-60">{item.name}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {DEFAULT_CATEGORIES.map(cat => {
          const spent = transactions.filter(t => t.type === 'expense' && t.categoryId === cat.id && isWithinInterval(t.date?.toDate ? t.date.toDate() : new Date(), {start: dateRange.start, end: dateRange.end})).reduce((s, t) => s + t.amount, 0);
          const limit = categories.find(c => c.id === cat.id)?.limit;
          const percent = limit ? Math.min((spent / limit) * 100, 100) : 100;
          
          return (
            <div key={cat.id} className="bg-card border border-border p-5 rounded-3xl space-y-3">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{cat.icon}</span>
                  <span className="font-bold">{cat.name}</span>
                </div>
                <div className="text-right">
                  <p className="font-black">{spent.toLocaleString()} ₽</p>
                  <p className="text-[10px] text-muted-foreground uppercase font-black">лимит: {limit ? limit.toLocaleString() : '—'}</p>
                </div>
              </div>
              <div className="h-2 bg-secondary rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }} animate={{ width: `${percent}%` }}
                  className={cn("h-full rounded-full transition-all", percent >= 100 && limit ? "bg-red-500" : "bg-primary")}
                  style={{ backgroundColor: !limit ? cat.color : undefined }}
                />
              </div>
              {!limit && (
                <button 
                  onClick={() => {
                    const l = prompt("Введите лимит для категории " + cat.name);
                    if (l) {
                       addDoc(collection(db, 'budgetCategories'), { id: cat.id, name: cat.name, limit: parseFloat(l), familyId: profile?.familyId });
                    }
                  }}
                  className="w-full py-2 text-[10px] font-black text-primary uppercase tracking-widest"
                >
                  Установить лимит
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderGoals = () => (
    <div className="space-y-4">
      <button 
        onClick={() => setIsAddingGoal(true)}
        className="w-full p-6 border-2 border-dashed border-border rounded-[32px] flex flex-col items-center gap-2 opacity-50 hover:opacity-100 transition-all"
      >
        <PlusCircle size={32} />
        <span className="font-bold uppercase tracking-widest text-xs">Добавить цель</span>
      </button>
      {goals.map(goal => (
        <div key={goal.id} className="bg-card border border-border p-6 rounded-[32px] space-y-4">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-500/10 text-green-500 rounded-2xl"><PiggyBank size={24} /></div>
              <div>
                <h3 className="font-bold text-lg">{goal.name}</h3>
                <p className="text-xs text-muted-foreground">Накоплено: {goal.currentAmount.toLocaleString()} ₽</p>
              </div>
            </div>
            <p className="font-black text-xl">{goal.targetAmount.toLocaleString()} ₽</p>
          </div>
          <div className="h-3 bg-secondary rounded-full overflow-hidden">
            <div className="h-full bg-green-500" style={{ width: `${(goal.currentAmount / goal.targetAmount) * 100}%` }} />
          </div>
          <button 
            onClick={() => {
              const amount = prompt("Сколько добавить?");
              if (amount) updateDoc(doc(db, 'savingsGoals', goal.id), { currentAmount: goal.currentAmount + parseFloat(amount) });
            }}
            className="w-full py-3 bg-secondary rounded-2xl font-bold text-sm"
          >
            Пополнить
          </button>
        </div>
      ))}
    </div>
  );

  const renderLoans = () => (
    <div className="space-y-4">
      <button 
        onClick={() => setIsAddingLoan(true)}
        className="w-full p-6 border-2 border-dashed border-border rounded-[32px] flex flex-col items-center gap-2 opacity-50 hover:opacity-100 transition-all"
      >
        <PlusCircle size={32} />
        <span className="font-bold uppercase tracking-widest text-xs">Добавить кредит</span>
      </button>
      {loans.map(loan => (
        <div key={loan.id} className="bg-card border border-border p-6 rounded-[32px] space-y-4">
           <div className="flex justify-between items-start">
            <div className="flex items-center gap-3">
              <div className={cn("p-3 rounded-2xl", loan.type === 'card' ? "bg-orange-500/10 text-orange-500" : "bg-blue-500/10 text-blue-500")}>
                <CreditCard size={24} />
              </div>
              <div>
                <h3 className="font-bold text-lg">{loan.name}</h3>
                <p className="text-xs text-muted-foreground">{loan.type === 'card' ? 'Кредитная карта' : 'Потреб. кредит'}</p>
              </div>
            </div>
            <div className="text-right">
               <p className="font-black text-xl">{loan.remainingAmount.toLocaleString()} ₽</p>
               <p className="text-[10px] text-muted-foreground uppercase font-black">из {loan.totalAmount.toLocaleString()}</p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="flex-1 bg-background/50 p-3 rounded-2xl border border-border">
              <p className="text-[10px] font-black text-muted-foreground uppercase mb-1">Платеж</p>
              <p className="font-bold">{loan.monthlyPayment.toLocaleString()} ₽</p>
            </div>
            <div className="flex-1 bg-background/50 p-3 rounded-2xl border border-border">
              <p className="text-[10px] font-black text-muted-foreground uppercase mb-1">Дата</p>
              <div className="flex items-center gap-1">
                <CalendarIcon size={12} className="text-muted-foreground" />
                <p className="font-bold">{loan.paymentDate} число</p>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <main className="min-h-screen bg-background p-4 pb-24">
      <header className="flex items-center justify-between mb-8 pt-4">
        <div className="flex items-center gap-2">
          <Link href="/" className="p-2 -ml-2 rounded-full hover:bg-secondary transition-colors">
            <ChevronLeft size={24} />
          </Link>
          <h1 className="text-2xl font-bold">Бюджет</h1>
        </div>
        <button 
          onClick={() => setIsAddingTransaction(true)}
          className="p-3 bg-primary text-white rounded-2xl shadow-lg shadow-primary/20 active:scale-95 transition-all"
        >
          <Plus size={24} />
        </button>
      </header>

      {/* Balance Block */}
      <div className="bg-card border border-border p-8 rounded-[40px] shadow-sm mb-6 flex flex-col items-center">
        <p className="text-xs font-black text-muted-foreground uppercase tracking-[0.2em] mb-2">Общий баланс</p>
        <h2 className="text-4xl font-black mb-6">{stats.balance.toLocaleString()} ₽</h2>
        <div className="flex gap-4 w-full">
          <div className="flex-1 bg-green-500/10 p-4 rounded-3xl border border-green-500/20 flex items-center gap-3">
            <div className="w-8 h-8 bg-green-500 text-white rounded-xl flex items-center justify-center shadow-lg shadow-green-500/20">
              <TrendingUp size={18} />
            </div>
            <div>
              <p className="text-[10px] font-black text-green-500 uppercase tracking-widest">Доходы</p>
              <p className="font-bold">{stats.income.toLocaleString()} ₽</p>
            </div>
          </div>
          <div className="flex-1 bg-red-500/10 p-4 rounded-3xl border border-red-500/20 flex items-center gap-3">
            <div className="w-8 h-8 bg-red-500 text-white rounded-xl flex items-center justify-center shadow-lg shadow-red-500/20">
              <TrendingDown size={18} />
            </div>
            <div>
              <p className="text-[10px] font-black text-red-500 uppercase tracking-widest">Расходы</p>
              <p className="font-bold">{stats.expense.toLocaleString()} ₽</p>
            </div>
          </div>
        </div>
      </div>

      {/* Month Slider */}
      <div className="flex items-center justify-between mb-8 px-2">
        <button 
          onClick={() => {
            const newDate = subMonths(dateRange.start, 1);
            setDateRange({ start: startOfMonth(newDate), end: endOfMonth(newDate) });
          }}
          className="p-2 text-muted-foreground"
        >
          <ChevronLeft size={20} />
        </button>
        <span className="font-black uppercase tracking-widest text-sm">
          {format(dateRange.start, 'LLLL yyyy', { locale: ru })}
        </span>
        <button 
           onClick={() => {
            const newDate = subMonths(dateRange.start, -1);
            setDateRange({ start: startOfMonth(newDate), end: endOfMonth(newDate) });
          }}
          className="p-2 text-muted-foreground"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar mb-8">
        {[
          { id: 'overview', name: 'Обзор', icon: LayoutGrid },
          { id: 'categories', name: 'Категории', icon: PieIcon },
          { id: 'goals', name: 'Цели', icon: Target },
          { id: 'loans', name: 'Кредиты', icon: CreditCard },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={cn(
              "px-6 py-3 rounded-2xl font-bold flex items-center gap-2 transition-all whitespace-nowrap",
              activeTab === tab.id ? "bg-primary text-white shadow-lg" : "bg-card text-muted-foreground border border-border"
            )}
          >
            <tab.icon size={18} />
            {tab.name}
          </button>
        ))}
      </div>

      <div className="mb-8">
        <div className="flex justify-between items-center mb-4 px-2">
          <h2 className="text-sm font-black text-muted-foreground uppercase tracking-widest">Шаблоны (ЗП/Подписки)</h2>
          <button onClick={() => setIsAddingTemplate(true)} className="p-1.5 bg-secondary rounded-lg text-primary"><Plus size={18}/></button>
        </div>
        <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2 px-1">
          {templates.map(templ => (
            <div key={templ.id} className="min-w-[140px] p-4 bg-card border border-border rounded-2xl relative overflow-hidden group">
               <div className={cn("absolute top-0 left-0 w-1 h-full", templ.type === 'income' ? "bg-green-500" : "bg-red-500")} />
               <p className="text-[10px] font-black uppercase text-muted-foreground mb-1 truncate">{templ.title}</p>
               <p className="font-bold text-sm">{templ.amount.toLocaleString()} ₽</p>
               <p className="text-[8px] font-black text-primary uppercase mt-2">{templ.dayOfMonth} число</p>
               <button onClick={() => deleteDoc(doc(db, 'recurringTemplates', templ.id))} className="absolute top-1 right-1 p-1 opacity-0 group-hover:opacity-40"><Trash2 size={12}/></button>
            </div>
          ))}
          {templates.length === 0 && <p className="text-xs text-muted-foreground italic px-2">Нет шаблонов</p>}
        </div>
      </div>

      {activeTab === 'overview' && renderOverview()}
      {activeTab === 'categories' && renderCategories()}
      {activeTab === 'goals' && renderGoals()}
      {activeTab === 'loans' && renderLoans()}

      {/* Add Transaction Modal */}
      <AnimatePresence>
        {isAddingTransaction && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsAddingTransaction(false)} className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm" />
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} className="fixed inset-x-0 bottom-0 z-50 bg-card rounded-t-[40px] p-8 border-t border-border">
              <div className="w-12 h-1.5 bg-muted rounded-full mx-auto mb-8" />
              <h2 className="text-2xl font-black mb-6">Новая операция</h2>
              <form onSubmit={handleAddTransaction} className="space-y-6">
                <div className="flex gap-2">
                  <button type="button" onClick={() => setNewTransaction({...newTransaction, type: 'expense'})} className={cn("flex-1 p-4 rounded-2xl font-bold border transition-all", newTransaction.type === 'expense' ? "bg-red-500 text-white" : "bg-background border-border")}>Расход</button>
                  <button type="button" onClick={() => setNewTransaction({...newTransaction, type: 'income'})} className={cn("flex-1 p-4 rounded-2xl font-bold border transition-all", newTransaction.type === 'income' ? "bg-green-500 text-white" : "bg-background border-border")}>Доход</button>
                </div>
                <div className="relative">
                  <input autoFocus type="number" value={newTransaction.amount} onChange={(e) => setNewTransaction({...newTransaction, amount: e.target.value})} placeholder="0.00" className="w-full p-5 rounded-2xl bg-background border border-border focus:outline-none focus:ring-4 focus:ring-primary/20 text-4xl font-black text-center" />
                  <span className="absolute right-6 top-1/2 -translate-y-1/2 text-2xl font-bold opacity-30">₽</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {DEFAULT_CATEGORIES.map(cat => (
                    <button key={cat.id} type="button" onClick={() => setNewTransaction({...newTransaction, categoryId: cat.id, subcategoryId: ''})} className={cn("p-3 rounded-2xl border text-center transition-all", newTransaction.categoryId === cat.id ? "bg-primary text-white border-transparent" : "bg-background border-border")}>
                      <p className="text-lg">{cat.icon}</p>
                      <p className="text-[8px] font-black uppercase">{cat.name}</p>
                    </button>
                  ))}
                </div>

                <div className="space-y-2">
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Подкатегория</p>
                  <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
                    {DEFAULT_CATEGORIES.find(c => c.id === newTransaction.categoryId)?.subcategories.map(s => (
                      <button 
                        key={s.id} 
                        type="button" 
                        onClick={() => setNewTransaction({...newTransaction, subcategoryId: s.id})}
                        className={cn(
                          "px-4 py-2 rounded-xl text-xs font-bold border whitespace-nowrap transition-all",
                          newTransaction.subcategoryId === s.id ? "bg-primary text-white border-transparent" : "bg-background border-border text-muted-foreground"
                        )}
                      >
                        {s.name}
                      </button>
                    ))}
                  </div>
                </div>

                <input type="text" value={newTransaction.description} onChange={(e) => setNewTransaction({...newTransaction, description: e.target.value})} placeholder="Описание (необязательно)" className="w-full p-4 rounded-2xl bg-background border border-border font-bold" />
                <button type="submit" className="w-full p-5 bg-primary text-white rounded-2xl font-black text-lg shadow-xl shadow-primary/20">Добавить</button>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
      
      {/* Edit Transaction Modal */}
      <AnimatePresence>
        {editingTransaction && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setEditingTransaction(null)} className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm" />
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} className="fixed inset-x-0 bottom-0 z-50 bg-card rounded-t-[40px] p-8 border-t border-border">
              <div className="w-12 h-1.5 bg-muted rounded-full mx-auto mb-8" />
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-black">Изменить</h2>
                <button onClick={() => { handleDeleteTransaction(editingTransaction.id); setEditingTransaction(null); }} className="p-3 text-destructive bg-destructive/10 rounded-2xl"><Trash2 size={24} /></button>
              </div>
              <form onSubmit={handleUpdateTransaction} className="space-y-6">
                <div className="relative">
                  <input autoFocus type="number" value={editingTransaction.amount} onChange={(e) => setEditingTransaction({...editingTransaction, amount: parseFloat(e.target.value)})} className="w-full p-5 rounded-2xl bg-background border border-border text-4xl font-black text-center" />
                  <span className="absolute right-6 top-1/2 -translate-y-1/2 text-2xl font-bold opacity-30">₽</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {DEFAULT_CATEGORIES.map(cat => (
                    <button key={cat.id} type="button" onClick={() => setEditingTransaction({...editingTransaction, categoryId: cat.id})} className={cn("p-3 rounded-2xl border text-center transition-all", editingTransaction.categoryId === cat.id ? "bg-primary text-white border-transparent" : "bg-background border-border")}>
                      <p className="text-lg">{cat.icon}</p>
                      <p className="text-[8px] font-black uppercase">{cat.name}</p>
                    </button>
                  ))}
                </div>
                <input type="text" value={editingTransaction.description} onChange={(e) => setEditingTransaction({...editingTransaction, description: e.target.value})} className="w-full p-4 rounded-2xl bg-background border border-border font-bold" />
                <button type="submit" className="w-full p-5 bg-primary text-white rounded-2xl font-black text-lg">Сохранить</button>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Add Goal Modal */}
      <AnimatePresence>
        {isAddingGoal && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsAddingGoal(false)} className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm" />
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} className="fixed inset-x-0 bottom-0 z-50 bg-card rounded-t-[40px] p-8 border-t border-border">
              <div className="w-12 h-1.5 bg-muted rounded-full mx-auto mb-8" />
              <div className="flex justify-between items-center mb-6">
                 <h2 className="text-2xl font-black">Новая цель</h2>
                 <button onClick={() => setIsImportingFromWishlist(!isImportingFromWishlist)} className="text-xs font-black uppercase text-primary tracking-widest">{isImportingFromWishlist ? "Вручную" : "Из вишлиста"}</button>
              </div>

              {isImportingFromWishlist ? (
                 <div className="space-y-3 mb-6 max-h-[40vh] overflow-y-auto no-scrollbar">
                    {wishlistItems.map(item => (
                       <button 
                        key={item.id} 
                        onClick={() => {
                          setNewGoal({ name: item.title, targetAmount: item.price?.toString() || '' });
                          setIsImportingFromWishlist(false);
                        }}
                        className="w-full p-4 rounded-2xl bg-background border border-border flex justify-between items-center"
                       >
                          <span className="font-bold">{item.title}</span>
                          <span className="text-sm font-black text-primary">{item.price} ₽</span>
                       </button>
                    ))}
                    {wishlistItems.length === 0 && <p className="text-center text-xs text-muted-foreground italic">Вишлист пуст (или нет материальных желаний)</p>}
                 </div>
              ) : (
                <form onSubmit={handleAddGoal} className="space-y-6">
                  <input autoFocus type="text" value={newGoal.name} onChange={(e) => setNewGoal({...newGoal, name: e.target.value})} placeholder="На что копим?" className="w-full p-5 rounded-2xl bg-background border border-border text-xl font-bold" />
                  <div className="relative">
                    <input type="number" value={newGoal.targetAmount} onChange={(e) => setNewGoal({...newGoal, targetAmount: e.target.value})} placeholder="Сумма цели" className="w-full p-5 rounded-2xl bg-background border border-border text-2xl font-black" />
                    <span className="absolute right-6 top-1/2 -translate-y-1/2 text-xl font-bold opacity-30">₽</span>
                  </div>
                  <button type="submit" className="w-full p-5 bg-primary text-white rounded-2xl font-black text-lg">Создать цель</button>
                </form>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Add Loan Modal */}
      <AnimatePresence>
        {isAddingLoan && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsAddingLoan(false)} className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm" />
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} className="fixed inset-x-0 bottom-0 z-50 bg-card rounded-t-[40px] p-8 border-t border-border max-h-[90vh] overflow-y-auto">
              <div className="w-12 h-1.5 bg-muted rounded-full mx-auto mb-8" />
              <h2 className="text-2xl font-black mb-6">Добавить кредит</h2>
              <form onSubmit={handleAddLoan} className="space-y-4">
                <input autoFocus type="text" value={newLoan.name} onChange={(e) => setNewLoan({...newLoan, name: e.target.value})} placeholder="Название (например, Ипотека)" className="w-full p-4 rounded-xl bg-background border border-border font-bold" />
                <div className="flex gap-2">
                  <button type="button" onClick={() => setNewLoan({...newLoan, type: 'consumer'})} className={cn("flex-1 p-3 rounded-xl border text-xs font-bold", newLoan.type === 'consumer' ? "bg-primary text-white" : "bg-background")}>Потреб</button>
                  <button type="button" onClick={() => setNewLoan({...newLoan, type: 'card'})} className={cn("flex-1 p-3 rounded-xl border text-xs font-bold", newLoan.type === 'card' ? "bg-primary text-white" : "bg-background")}>Карта</button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input type="number" value={newLoan.totalAmount} onChange={(e) => setNewLoan({...newLoan, totalAmount: e.target.value})} placeholder="Сумма кредита" className="p-4 rounded-xl bg-background border border-border font-bold" />
                  <input type="number" value={newLoan.interestRate} onChange={(e) => setNewLoan({...newLoan, interestRate: e.target.value})} placeholder="Ставка %" className="p-4 rounded-xl bg-background border border-border font-bold" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input type="number" value={newLoan.remainingAmount} onChange={(e) => setNewLoan({...newLoan, remainingAmount: e.target.value})} placeholder="Остаток" className="p-4 rounded-xl bg-background border border-border" />
                  <input type="number" value={newLoan.monthlyPayment} onChange={(e) => setNewLoan({...newLoan, monthlyPayment: e.target.value})} placeholder="Платеж" className="p-4 rounded-xl bg-background border border-border" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                   <div className="space-y-1">
                      <p className="text-[8px] font-black text-muted-foreground uppercase ml-1">Тип платежа</p>
                      <select value={newLoan.paymentType} onChange={(e) => setNewLoan({...newLoan, paymentType: e.target.value as any})} className="w-full p-3 rounded-xl bg-background border border-border text-xs font-bold appearance-none">
                        <option value="annuity">Аннуитетный</option>
                        <option value="differentiated">Дифференц.</option>
                      </select>
                   </div>
                   <div className="space-y-1">
                      <p className="text-[8px] font-black text-muted-foreground uppercase ml-1">День платежа</p>
                      <input type="number" value={newLoan.paymentDate} onChange={(e) => setNewLoan({...newLoan, paymentDate: e.target.value})} placeholder="1-31" min="1" max="31" className="w-full p-3 rounded-xl bg-background border border-border font-bold" />
                   </div>
                </div>
                <button type="submit" className="w-full p-5 bg-primary text-white rounded-2xl font-black text-lg">Добавить</button>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Add Template Modal */}
      <AnimatePresence>
        {isAddingTemplate && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsAddingTemplate(false)} className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm" />
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} className="fixed inset-x-0 bottom-0 z-50 bg-card rounded-t-[40px] p-8 border-t border-border">
              <div className="w-12 h-1.5 bg-muted rounded-full mx-auto mb-8" />
              <h2 className="text-2xl font-black mb-6">Новый шаблон</h2>
              <form onSubmit={handleAddTemplate} className="space-y-4">
                <input autoFocus type="text" value={newTemplate.title} onChange={(e) => setNewTemplate({...newTemplate, title: e.target.value})} placeholder="Название (например, Зарплата)" className="w-full p-4 rounded-xl bg-background border border-border font-bold" />
                <div className="flex gap-2">
                  <button type="button" onClick={() => setNewTemplate({...newTemplate, type: 'expense'})} className={cn("flex-1 p-3 rounded-xl border text-xs font-bold", newTemplate.type === 'expense' ? "bg-red-500 text-white" : "bg-background")}>Расход</button>
                  <button type="button" onClick={() => setNewTemplate({...newTemplate, type: 'income'})} className={cn("flex-1 p-3 rounded-xl border text-xs font-bold", newTemplate.type === 'income' ? "bg-green-500 text-white" : "bg-background")}>Доход</button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input type="number" value={newTemplate.amount} onChange={(e) => setNewTemplate({...newTemplate, amount: e.target.value})} placeholder="Сумма" className="p-4 rounded-xl bg-background border border-border font-bold" />
                  <input type="number" value={newTemplate.dayOfMonth} onChange={(e) => setNewTemplate({...newTemplate, dayOfMonth: e.target.value})} placeholder="День (1-31)" min="1" max="31" className="p-4 rounded-xl bg-background border border-border font-bold" />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {DEFAULT_CATEGORIES.map(cat => (
                    <button key={cat.id} type="button" onClick={() => setNewTemplate({...newTemplate, categoryId: cat.id})} className={cn("p-2 rounded-xl border text-center transition-all", newTemplate.categoryId === cat.id ? "bg-primary text-white border-transparent" : "bg-background border-border opacity-50")}>
                      <p className="text-lg">{cat.icon}</p>
                    </button>
                  ))}
                </div>
                <button type="submit" className="w-full p-5 bg-primary text-white rounded-2xl font-black text-lg">Создать шаблон</button>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </main>
  );
}
