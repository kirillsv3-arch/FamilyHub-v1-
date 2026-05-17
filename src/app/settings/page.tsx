'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Copy, Check, Users, Settings as SettingsIcon } from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Family } from '@/lib/types';
import Link from 'next/link';

export default function SettingsPage() {
  const { user, profile, loading } = useAuth();
  const [family, setFamily] = useState<Family | null>(null);
  const [copied, setCopied] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchFamily = async () => {
      if (profile?.familyId) {
        const familyDoc = await getDoc(doc(db, 'families', profile.familyId));
        if (familyDoc.exists()) {
          setFamily(familyDoc.data() as Family);
        }
      }
    };
    fetchFamily();
  }, [profile?.familyId]);

  if (loading || !user || !profile) {
    return <div className="flex items-center justify-center min-h-screen">Загрузка...</div>;
  }

  const copyCode = () => {
    if (family?.code) {
      navigator.clipboard.writeText(family.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <main className="min-h-screen p-4">
      <header className="flex items-center mb-8 pt-4">
        <Link href="/" className="p-2 -ml-2 rounded-full hover:bg-secondary transition-colors">
          <ChevronLeft size={24} />
        </Link>
        <h1 className="text-2xl font-bold ml-2">Настройки</h1>
      </header>

      <div className="space-y-6">
        <section className="space-y-3">
          <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider ml-2">Семья</h2>
          <div className="bg-card rounded-3xl border border-border p-6 shadow-sm">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-primary/10 rounded-2xl text-primary">
                <Users size={24} />
              </div>
              <div>
                <h3 className="font-bold text-lg">{family?.name || 'Загрузка...'}</h3>
                <p className="text-sm text-muted-foreground">Управление семейным доступом</p>
              </div>
            </div>

            <div className="bg-background/50 border border-border rounded-2xl p-4">
              <p className="text-xs text-muted-foreground uppercase font-bold mb-2">Код для вступления</p>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-mono font-bold tracking-widest">{family?.code || '------'}</span>
                <button 
                  onClick={copyCode}
                  className="p-2 bg-primary text-primary-foreground rounded-xl flex items-center gap-2 text-sm font-bold transition-all active:scale-95"
                >
                  {copied ? <Check size={18} /> : <Copy size={18} />}
                  {copied ? 'Скопировано' : 'Копировать'}
                </button>
              </div>
            </div>
            
            <p className="mt-4 text-xs text-muted-foreground text-center italic">
              Передайте этот код члену семьи, чтобы он мог присоединиться к вашему хабу.
            </p>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider ml-2">Приложение</h2>
          <div className="bg-card rounded-3xl border border-border overflow-hidden">
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <SettingsIcon size={20} className="text-muted-foreground" />
                <span className="font-medium">Версия приложения</span>
              </div>
              <span className="text-sm text-muted-foreground">MVP 0.2.0</span>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
