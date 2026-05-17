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
      <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground ml-1">Я сейчас...</h3>

      <div className="flex flex-wrap gap-2">
        {tags.map((tag, idx) => (
          <motion.button
            key={idx}
            whileTap={{ scale: 0.95 }}
            onClick={() => onSelect(tag)}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl border transition-all ${
              currentTag?.text === tag.text
                ? 'bg-primary border-primary text-primary-foreground shadow-lg shadow-primary/20'
                : 'bg-card border-border hover:border-primary/50'
            }`}
          >
            <span className="text-xl">{tag.emoji}</span>
            <span className="text-sm font-bold">{tag.text}</span>
          </motion.button>
        ))}

        <button
          onClick={() => setIsAdding(true)}
          className="flex items-center justify-center w-12 h-11 rounded-xl border border-dashed border-border hover:border-primary transition-colors"
        >
          <Plus size={20} />
        </button>
      </div>

      <AnimatePresence>
        {isAdding && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="p-4 rounded-xl border border-border bg-card space-y-4 shadow-xl"
          >
            <div className="flex justify-between items-center">
              <span className="font-bold">Свой статус</span>
              <button onClick={() => setIsAdding(false)}><X size={20}/></button>
            </div>
            <div className="flex space-x-2">
              <input
                type="text"
                value={customEmoji}
                onChange={(e) => setCustomEmoji(e.target.value)}
                className="w-12 p-2 rounded-lg bg-background border border-border text-center text-xl"
                maxLength={2}
              />
              <input
                type="text"
                value={customText}
                onChange={(e) => setCustomText(e.target.value)}
                placeholder="Что ты делаешь?"
                className="flex-1 p-2 px-4 rounded-lg bg-background border border-border focus:outline-none focus:ring-1 focus:ring-primary"
                autoFocus
              />
            </div>
            <button
              onClick={handleAddCustom}
              className="w-full py-2 bg-secondary text-secondary-foreground rounded-lg font-bold"
            >
              Добавить
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
