import React from 'react';
import { CreditCard, Calendar as CalendarIcon } from 'lucide-react';
import { Loan } from '@/lib/types';
import { cn } from '@/lib/utils';

interface LoanCardProps {
  loan: Loan;
}

export function LoanCard({ loan }: LoanCardProps) {
  return (
    <div className="bg-card border border-border p-6 rounded-[32px] space-y-4">
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-3">
          <div className={cn(
            "p-3 rounded-2xl",
            loan.type === 'card' ? "bg-orange-500/10 text-orange-500" : "bg-blue-500/10 text-blue-500"
          )}>
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
  );
}
