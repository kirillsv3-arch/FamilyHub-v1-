import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Circle, ExternalLink, Trash2 } from 'lucide-react';
import { ShoppingItem as ShoppingItemType } from '@/lib/types';
import { cn } from '@/lib/utils';

interface ShoppingItemProps {
  item: ShoppingItemType;
  itemShop: any;
  activeTab: string;
  isSomeOneInShop: boolean;
  onToggle: () => void;
  onDelete: () => void;
  onEdit: () => void;
  longPressBind: any;
}

export function ShoppingItem({
  item,
  itemShop,
  activeTab,
  isSomeOneInShop,
  onToggle,
  onDelete,
  onEdit,
  longPressBind
}: ShoppingItemProps) {
  return (
    <motion.div
      layout
      {...longPressBind}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      onClick={onEdit}
      className={cn(
        "flex items-center p-4 rounded-3xl border transition-all cursor-pointer select-none",
        item.completed
          ? 'bg-secondary/20 border-transparent opacity-50'
          : 'bg-card border-border shadow-sm active:scale-[0.98]'
      )}
    >
      <div
        className={cn(
          "mr-4 flex-shrink-0 transition-colors",
          item.completed ? "text-muted-foreground" : (itemShop?.text || "text-primary")
        )}
        onClick={(e) => {
          e.stopPropagation();
          onToggle();
        }}
      >
        {item.completed ? <CheckCircle2 size={26} /> : <Circle size={26} />}
      </div>

      <div className="flex-1 min-w-0">
        <div className={cn("flex items-center gap-2", item.completed ? "line-through text-muted-foreground" : "")}>
          <p className="font-bold text-lg leading-tight truncate">
            {item.title}
          </p>
          <span className="text-sm opacity-60">
            {item.quantity} {item.unit}
          </span>
          {item.price && <span className="text-sm font-black text-primary">{item.price} ₽</span>}
          {item.priority === 'urgent' && !item.completed && (
            <span className="flex-shrink-0 w-2 h-2 rounded-full bg-destructive animate-pulse" />
          )}
          {item.isOrdered && activeTab === 'market' && (
             <span className="text-[8px] font-black uppercase bg-green-500/20 text-green-500 px-1.5 py-0.5 rounded">Заказано</span>
          )}
          {isSomeOneInShop && (
             <div className="w-2 h-2 rounded-full bg-primary animate-pulse" title="Кто-то в этом магазине" />
          )}
        </div>
        {activeTab === 'plan' && itemShop && (
          <div className="flex items-center gap-2 mt-1">
            <span className={cn("text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border", itemShop.text, "border-current opacity-70")}>
              {itemShop.emoji} {itemShop.name}
            </span>
          </div>
        )}
      </div>

      {activeTab === 'market' && item.link && (
        <button
          onClick={(e) => { e.stopPropagation(); window.open(item.link, '_blank'); }}
          className="p-2 text-primary"
        >
          <ExternalLink size={20} />
        </button>
      )}

      {activeTab === 'plan' && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="p-2 text-muted-foreground hover:text-destructive opacity-40 hover:opacity-100 transition-all"
        >
          <Trash2 size={20} />
        </button>
      )}
    </motion.div>
  );
}
