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
      className={`p-1 rounded-[2.5rem] bg-gradient-to-br ${status.gradient} shadow-2xl cursor-pointer group relative overflow-hidden`}
    >
      {/* Glass Overlay */}
      <div className="absolute inset-0 bg-black/10 backdrop-blur-[2px] transition-opacity group-hover:opacity-0" />

      <div className="relative p-6 bg-zinc-900/40 backdrop-blur-md rounded-[2.3rem] border border-white/10 flex items-center justify-between">
        <div className="flex items-center space-x-5">
          <div className="text-5xl drop-shadow-lg filter grayscale-[0.2] group-hover:grayscale-0 transition-all duration-500 transform group-hover:scale-110">
            {status.icon}
          </div>
          <div>
            <div className="flex items-center space-x-3">
              <span className="text-4xl font-black text-white tracking-tighter">{index}%</span>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded-full bg-white/10 text-white border border-white/10">
                Индекс
              </span>
            </div>
            <p className="text-xs text-white/70 font-bold mt-1.5 leading-relaxed max-w-[200px]">
              {status.text}
            </p>
          </div>
        </div>
        <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center border border-white/10 group-hover:bg-white/20 transition-all">
          <ChevronRight size={20} className="text-white group-hover:translate-x-0.5 transition-transform" />
        </div>
      </div>
    </motion.div>
  );
}
