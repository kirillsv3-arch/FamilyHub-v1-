'use client';

import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';

export default function PlaceholderPage({ title }: { title: string }) {
  return (
    <main className="min-h-screen p-4">
      <header className="flex items-center mb-8 pt-4">
        <Link href="/" className="p-2 -ml-2 rounded-full hover:bg-secondary transition-colors">
          <ChevronLeft size={24} />
        </Link>
        <h1 className="text-2xl font-bold ml-2">{title}</h1>
      </header>

      <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-4">
        <div className="text-6xl italic opacity-20 font-bold">Скоро</div>
        <p className="text-muted-foreground max-w-xs">
          Этот раздел находится в разработке и будет доступен в ближайших обновлениях.
        </p>
      </div>
    </main>
  );
}
