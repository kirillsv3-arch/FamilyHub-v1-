import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface BudgetSummaryCardsProps {
  balance: number;
  income: number;
  expense: number;
}

export function BudgetSummaryCards({ balance, income, expense }: BudgetSummaryCardsProps) {
  return (
    <div className="bg-card border border-border p-8 rounded-[40px] shadow-sm mb-6 flex flex-col items-center">
      <p className="text-xs font-black text-muted-foreground uppercase tracking-[0.2em] mb-2">Общий баланс</p>
      <h2 className="text-4xl font-black mb-6">{balance.toLocaleString()} ₽</h2>
      <div className="flex gap-4 w-full">
        <div className="flex-1 bg-green-500/10 p-4 rounded-3xl border border-green-500/20 flex items-center gap-3">
          <div className="w-8 h-8 bg-green-500 text-white rounded-xl flex items-center justify-center shadow-lg shadow-green-500/20">
            <TrendingUp size={18} />
          </div>
          <div>
            <p className="text-[10px] font-black text-green-500 uppercase tracking-widest">Доходы</p>
            <p className="font-bold">{income.toLocaleString()} ₽</p>
          </div>
        </div>
        <div className="flex-1 bg-red-500/10 p-4 rounded-3xl border border-red-500/20 flex items-center gap-3">
          <div className="w-8 h-8 bg-red-500 text-white rounded-xl flex items-center justify-center shadow-lg shadow-red-500/20">
            <TrendingDown size={18} />
          </div>
          <div>
            <p className="text-[10px] font-black text-red-500 uppercase tracking-widest">Расходы</p>
            <p className="font-bold">{expense.toLocaleString()} ₽</p>
          </div>
        </div>
      </div>
    </div>
  );
}
