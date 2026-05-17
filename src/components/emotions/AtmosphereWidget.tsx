'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { getAtmosphereStatus } from '@/lib/utils';
import { ChevronRight } from 'lucide-react';

interface AtmosphereWidgetProps {
  index: number;
  onClick?: () => void;
}

export default function AtmosphereWidget({ index, onClick }: AtmosphereWidgetProps) {
  const status = getAtmosphereStatus(index);

  return (
    <motion.div
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="p-6 rounded-2xl border border-border bg-card shadow-lg cursor-pointer group"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="text-5xl">{status.icon}</div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-3xl font-black">{index}%</span>
              <span className={`text-xs font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-secondary ${status.color}`}>
                Индекс
              </span>
            </div>
            <p className="text-sm text-muted-foreground font-medium mt-1 pr-4">
              {status.text}
            </p>
          </div>
        </div>
        <ChevronRight className="text-muted-foreground group-hover:translate-x-1 transition-transform" />
      </div>
    </motion.div>
  );
}
