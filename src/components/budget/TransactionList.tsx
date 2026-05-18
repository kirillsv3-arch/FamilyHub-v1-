import React from 'react';
import { Transaction } from '@/lib/types';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface TransactionListProps {
  transactions: Transaction[];
  categories: any[];
  onEdit: (transaction: Transaction) => void;
}

export function TransactionList({ transactions, categories, onEdit }: TransactionListProps) {
  return (
    <div className="bg-card border border-border p-6 rounded-[32px] shadow-sm">
      <p className="text-sm font-black text-muted-foreground uppercase tracking-widest mb-1">История трат</p>
      <div className="space-y-4 mt-4">
        {transactions.map(t => {
          const cat = categories.find(c => c.id === t.categoryId);
          const subcat = cat?.subcategories?.find((s: any) => s.id === t.subcategoryId);
          return (
            <div
              key={t.id}
              onClick={() => onEdit(t)}
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
        {transactions.length === 0 && (
          <p className="text-center text-muted-foreground py-4 italic text-sm">Нет операций за этот период</p>
        )}
      </div>
    </div>
  );
}
