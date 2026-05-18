import React from 'react';
import { AnimatePresence } from 'framer-motion';
import { Package } from 'lucide-react';
import { ShoppingItem } from './ShoppingItem';
import { ShoppingItem as ShoppingItemType } from '@/lib/types';

interface ShopGroupProps {
  items: ShoppingItemType[];
  shops: any[];
  activeTab: string;
  usersInShop: [string, any][];
  onToggleComplete: (item: ShoppingItemType) => void;
  onDeleteItem: (id: string) => void;
  onEditItem: (item: ShoppingItemType) => void;
  bindLongPress: any;
  triggerVibrate: (pattern?: number | number[]) => void;
}

export function ShopGroup({
  items,
  shops,
  activeTab,
  usersInShop,
  onToggleComplete,
  onDeleteItem,
  onEditItem,
  bindLongPress,
  triggerVibrate
}: ShopGroupProps) {
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center opacity-30 grayscale">
        <Package size={64} className="mb-4" />
        <p className="font-bold text-xl">Тут пока пусто</p>
        <p className="text-sm">Нажмите +, чтобы добавить товары</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <AnimatePresence mode="popLayout">
        {items.map((item) => {
          const itemShop = shops.find(s => s.id === item.shopId);
          const isSomeOneInShop = usersInShop.some(([uid, d]) => d.shopId === item.shopId);

          return (
            <ShoppingItem
              key={item.id}
              item={item}
              itemShop={itemShop}
              activeTab={activeTab}
              isSomeOneInShop={isSomeOneInShop}
              onToggle={() => {
                triggerVibrate(40);
                onToggleComplete(item);
              }}
              onDelete={() => onDeleteItem(item.id)}
              onEdit={() => {
                if (activeTab === 'plan') onEditItem(item);
                else {
                  triggerVibrate(40);
                  onToggleComplete(item);
                }
              }}
              longPressBind={bindLongPress(item)}
            />
          );
        })}
      </AnimatePresence>
    </div>
  );
}
