'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X } from 'lucide-react';

const DEFAULT_TAGS = [
  { emoji: '🧑‍💻', text: 'Занят на работе' },
  { emoji: '🍕', text: 'Хочу кушать' },
  { emoji: '🔋', text: 'Устал, не трогать' },
  { emoji: '🤗', text: 'Готов обниматься' },
  { emoji: '🏃', text: 'На тренировке' },
  { emoji: '😴', text: 'Ложусь спать' },
];

interface StatusTagsProps {
  currentTag?: { emoji: string; text: string };
  onSelect: (tag: { emoji: string; text: string }) => void;
  onAddCustom?: (tag: { emoji: string; text: string }) => void;
}

export default function StatusTags({ currentTag, onSelect }: StatusTagsProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [customText, setCustomText] = useState('');
  const [customEmoji, setCustomEmoji] = useState('💭');
  const [tags, setTags] = useState(DEFAULT_TAGS);

  const handleAddCustom = () => {
    if (customText.trim()) {
      const newTag = { emoji: customEmoji, text: customText.trim() };
      setTags([newTag, ...tags]);
      onSelect(newTag);
      setCustomText('');
      setIsAdding(false);
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 ml-2">Я сейчас...</h3>

      <div className="flex flex-wrap gap-2">
        {tags.map((tag, idx) => {
          const isActive = currentTag?.text === tag.text;
          return (
            <motion.button
              key={idx}
              whileTap={{ scale: 0.95 }}
              onClick={() => onSelect(tag)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-full border transition-all duration-300 ${
                isActive
                  ? 'bg-rose-500/10 border-rose-500/50 text-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.15)]'
                  : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:border-zinc-700'
              }`}
            >
              <span className="text-lg">{tag.emoji}</span>
              <span className="text-xs font-bold whitespace-nowrap">{tag.text}</span>
            </motion.button>
          );
        })}

        <button
          onClick={() => setIsAdding(true)}
          className="flex items-center justify-center w-10 h-10 rounded-full border border-dashed border-zinc-800 text-zinc-500 hover:border-rose-500/50 hover:text-rose-500 transition-all"
        >
          <Plus size={18} />
        </button>
      </div>

      <AnimatePresence>
        {isAdding && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="p-5 rounded-[2rem] border border-zinc-800 bg-zinc-900 space-y-4 shadow-2xl relative z-10"
          >
            <div className="flex justify-between items-center">
              <span className="text-sm font-black uppercase tracking-widest text-zinc-400">Свой статус</span>
              <button
                onClick={() => setIsAdding(false)}
                className="p-1 hover:bg-zinc-800 rounded-full transition-colors"
              >
                <X size={18} className="text-zinc-500" />
              </button>
            </div>
            <div className="flex space-x-3">
              <input
                type="text"
                value={customEmoji}
                onChange={(e) => setCustomEmoji(e.target.value)}
                className="w-12 h-12 rounded-2xl bg-zinc-950 border border-zinc-800 text-center text-2xl focus:border-rose-500/50 outline-none transition-colors"
                maxLength={2}
              />
              <input
                type="text"
                value={customText}
                onChange={(e) => setCustomText(e.target.value)}
                placeholder="Что ты делаешь?"
                className="flex-1 h-12 px-5 rounded-2xl bg-zinc-950 border border-zinc-800 text-sm focus:border-rose-500/50 outline-none transition-colors"
                autoFocus
              />
            </div>
            <button
              onClick={handleAddCustom}
              className="w-full py-3.5 bg-rose-500 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-rose-600 active:scale-[0.98] transition-all"
            >
              Добавить
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
