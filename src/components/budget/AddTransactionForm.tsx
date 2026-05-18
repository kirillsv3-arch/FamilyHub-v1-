import React from 'react';
import { cn } from '@/lib/utils';

interface AddTransactionFormProps {
  newTransaction: {
    amount: string;
    type: 'income' | 'expense';
    categoryId: string;
    subcategoryId: string;
    description: string;
  };
  setNewTransaction: (val: any) => void;
  categories: any[];
  onSubmit: (e: React.FormEvent) => void;
}

export function AddTransactionForm({
  newTransaction,
  setNewTransaction,
  categories,
  onSubmit
}: AddTransactionFormProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setNewTransaction({...newTransaction, type: 'expense'})}
          className={cn(
            "flex-1 p-4 rounded-2xl font-bold border transition-all",
            newTransaction.type === 'expense' ? "bg-red-500 text-white" : "bg-background border-border"
          )}
        >
          Расход
        </button>
        <button
          type="button"
          onClick={() => setNewTransaction({...newTransaction, type: 'income'})}
          className={cn(
            "flex-1 p-4 rounded-2xl font-bold border transition-all",
            newTransaction.type === 'income' ? "bg-green-500 text-white" : "bg-background border-border"
          )}
        >
          Доход
        </button>
      </div>
      <div className="relative">
        <input
          autoFocus
          type="number"
          value={newTransaction.amount}
          onChange={(e) => setNewTransaction({...newTransaction, amount: e.target.value})}
          placeholder="0.00"
          className="w-full p-5 rounded-2xl bg-background border border-border focus:outline-none focus:ring-4 focus:ring-primary/20 text-4xl font-black text-center"
        />
        <span className="absolute right-6 top-1/2 -translate-y-1/2 text-2xl font-bold opacity-30">₽</span>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {categories.map(cat => (
          <button
            key={cat.id}
            type="button"
            onClick={() => setNewTransaction({...newTransaction, categoryId: cat.id, subcategoryId: ''})}
            className={cn(
              "p-3 rounded-2xl border text-center transition-all",
              newTransaction.categoryId === cat.id ? "bg-primary text-white border-transparent" : "bg-background border-border"
            )}
          >
            <p className="text-lg">{cat.icon}</p>
            <p className="text-[8px] font-black uppercase">{cat.name}</p>
          </button>
        ))}
      </div>

      <div className="space-y-2">
        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Подкатегория</p>
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
          {categories.find(c => c.id === newTransaction.categoryId)?.subcategories?.map((s: any) => (
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

      <input
        type="text"
        value={newTransaction.description}
        onChange={(e) => setNewTransaction({...newTransaction, description: e.target.value})}
        placeholder="Описание (необязательно)"
        className="w-full p-4 rounded-2xl bg-background border border-border font-bold"
      />
      <button
        type="submit"
        className="w-full p-5 bg-primary text-white rounded-2xl font-black text-lg shadow-xl shadow-primary/20"
      >
        Добавить
      </button>
    </form>
  );
}
