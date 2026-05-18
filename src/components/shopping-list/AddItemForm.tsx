import React from 'react';
import { Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

const UNITS = ['шт.', 'кг', 'л', 'упак.', 'г', 'мл'] as const;

interface AddItemFormProps {
  item: any;
  setItem: (val: any) => void;
  shops: any[];
  suggestions: string[];
  onSubmit: (e: React.FormEvent) => void;
  submitLabel: string;
}

export function AddItemForm({
  item,
  setItem,
  shops,
  suggestions,
  onSubmit,
  submitLabel
}: AddItemFormProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="space-y-2">
        <input
          autoFocus
          type="text"
          value={item.title}
          onChange={(e) => setItem({...item, title: e.target.value})}
          placeholder="Название товара..."
          className="w-full p-5 rounded-2xl bg-background border border-border focus:outline-none focus:ring-4 focus:ring-primary/20 text-xl font-bold transition-all"
        />
        {item.title?.length > 0 && suggestions.filter(s => s.toLowerCase().includes(item.title.toLowerCase()) && s !== item.title).length > 0 && (
          <div className="flex flex-wrap gap-2 px-1">
            {suggestions
              .filter(s => s.toLowerCase().includes(item.title.toLowerCase()) && s !== item.title)
              .slice(0, 3)
              .map(suggestion => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => setItem({...item, title: suggestion})}
                  className="text-xs bg-secondary px-3 py-1.5 rounded-full font-medium"
                >
                  {suggestion}
                </button>
              ))
            }
          </div>
        )}
      </div>

      <div className="flex items-center gap-4 px-1">
         <button
          type="button"
          onClick={() => setItem({...item, priority: (item.priority === 'urgent' ? 'normal' : 'urgent')})}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all border",
            item.priority === 'urgent'
              ? "bg-destructive/10 border-destructive text-destructive"
              : "bg-background border-border text-muted-foreground"
          )}
        >
          <Zap size={16} fill={item.priority === 'urgent' ? "currentColor" : "none"} />
          Срочно
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Кол-во</p>
          <input
            type="number"
            value={item.quantity}
            onChange={(e) => setItem({...item, quantity: e.target.value})}
            className="w-full p-4 rounded-xl bg-background border border-border font-bold"
          />
        </div>
        <div className="space-y-2">
          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Ед. изм.</p>
          <select
            value={item.unit}
            onChange={(e) => setItem({...item, unit: e.target.value})}
            className="w-full p-4 rounded-xl bg-background border border-border font-bold appearance-none"
          >
            {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
          </select>
        </div>
      </div>

      {item.shopId === 'market' && (
        <div className="space-y-2">
          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Ссылка</p>
          <input
            type="text"
            value={item.link || ''}
            onChange={(e) => setItem({...item, link: e.target.value})}
            placeholder="https://..."
            className="w-full p-4 rounded-xl bg-background border border-border text-sm font-bold"
          />
        </div>
      )}

      <div className="space-y-3">
        <p className="text-sm font-black text-muted-foreground uppercase tracking-widest ml-1">Где купить?</p>
        <div className="flex overflow-x-auto no-scrollbar gap-2 pb-2">
          {shops.map(shop => (
            <button
              key={shop.id}
              type="button"
              onClick={() => setItem({...item, shopId: shop.id})}
              className={cn(
                "px-4 py-2 rounded-xl text-sm font-bold border transition-all whitespace-nowrap",
                item.shopId === shop.id
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
          {submitLabel}
        </button>
      </div>
    </form>
  );
}
