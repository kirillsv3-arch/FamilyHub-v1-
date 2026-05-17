'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { doc, setDoc, updateDoc, collection, query, where, getDocs, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { customAlphabet } from 'nanoid';

const nanoid = customAlphabet('1234567890abcdefghijklmnopqrstuvwxyz', 10);

export default function FamilyPage() {
  const { user, profile, loading } = useAuth();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    } else if (profile?.familyId) {
      router.push('/');
    }
  }, [user, profile, loading, router]);

  const generateCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  const handleCreateFamily = async () => {
    if (!user) return;
    setIsProcessing(true);
    setError('');
    try {
      const familyCode = generateCode();
      const familyId = nanoid(10); // Using nanoid if possible or just random string
      
      const familyRef = doc(db, 'families', familyId);
      await setDoc(familyRef, {
        id: familyId,
        code: familyCode,
        creatorId: user.uid,
        createdAt: serverTimestamp(),
        name: `${profile?.name}'s Family`
      });

      await updateDoc(doc(db, 'users', user.uid), {
        familyId: familyId
      });

      router.push('/');
    } catch (err) {
      console.error(err);
      setError('Ошибка при создании семьи.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleJoinFamily = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !code) return;
    setIsProcessing(true);
    setError('');
    try {
      const q = query(collection(db, 'families'), where('code', '==', code.toUpperCase()));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        setError('Код не найден. Проверьте правильность ввода.');
        setIsProcessing(false);
        return;
      }

      const familyDoc = querySnapshot.docs[0];
      const familyId = familyDoc.id;

      await updateDoc(doc(db, 'users', user.uid), {
        familyId: familyId
      });

      router.push('/');
    } catch (err) {
      console.error(err);
      setError('Ошибка при вступлении в семью.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center min-h-screen">Загрузка...</div>;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="w-full max-w-md p-8 space-y-8 bg-card rounded-2xl border border-border shadow-xl">
        <h1 className="text-3xl font-bold text-center">Семья</h1>
        <p className="text-center text-muted-foreground font-medium">Для использования FamilyHub вы должны быть в семье</p>
        
        <div className="space-y-6">
          <div className="p-6 border border-border rounded-xl bg-background/50 space-y-4">
            <h2 className="text-xl font-bold">Вступить по коду</h2>
            <form onSubmit={handleJoinFamily} className="space-y-4">
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="ABCDEF"
                className="w-full p-3 rounded-xl bg-background border border-border focus:outline-none focus:ring-2 focus:ring-primary text-center text-2xl font-mono tracking-widest uppercase"
                maxLength={6}
                required
              />
              <button
                type="submit"
                disabled={isProcessing}
                className="w-full p-3 bg-secondary text-secondary-foreground rounded-xl font-bold hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                Вступить
              </button>
            </form>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border"></span>
            </div>
            <div className="relative flex justify-center text-sm uppercase">
              <span className="bg-card px-2 text-muted-foreground font-medium italic">ИЛИ</span>
            </div>
          </div>

          <div className="text-center">
            <button
              onClick={handleCreateFamily}
              disabled={isProcessing}
              className="w-full p-4 bg-primary text-primary-foreground rounded-xl font-bold text-lg hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              Создать новую семью
            </button>
          </div>
        </div>
        
        {error && <p className="text-destructive text-center text-sm font-medium">{error}</p>}
      </div>
    </div>
  );
}
