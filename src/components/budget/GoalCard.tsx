import React from 'react';
import { PiggyBank } from 'lucide-react';
import { SavingsGoal } from '@/lib/types';

interface GoalCardProps {
  goal: SavingsGoal;
  onAddFunds: (goalId: string, currentAmount: number) => void;
}

export function GoalCard({ goal, onAddFunds }: GoalCardProps) {
  return (
    <div className="bg-card border border-border p-6 rounded-[32px] space-y-4">
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-green-500/10 text-green-500 rounded-2xl">
            <PiggyBank size={24} />
          </div>
          <div>
            <h3 className="font-bold text-lg">{goal.name}</h3>
            <p className="text-xs text-muted-foreground">Накоплено: {goal.currentAmount.toLocaleString()} ₽</p>
          </div>
        </div>
        <p className="font-black text-xl">{goal.targetAmount.toLocaleString()} ₽</p>
      </div>
      <div className="h-3 bg-secondary rounded-full overflow-hidden">
        <div
          className="h-full bg-green-500"
          style={{ width: `${Math.min((goal.currentAmount / goal.targetAmount) * 100, 100)}%` }}
        />
      </div>
      <button
        onClick={() => onAddFunds(goal.id, goal.currentAmount)}
        className="w-full py-3 bg-secondary rounded-2xl font-bold text-sm"
      >
        Пополнить
      </button>
    </div>
  );
}
