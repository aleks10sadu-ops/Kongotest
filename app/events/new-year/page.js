'use client';

import React from 'react';
import Link from 'next/link';

export default function NewYearEventPage() {
  return (
    <div className="bg-neutral-950 text-white min-h-screen">
      <div className="container mx-auto px-4 py-20">
        <div className="max-w-6xl mx-auto">
          <Link href="/" className="inline-block mb-8 text-amber-400 hover:text-amber-300 transition-colors">
            ← Вернуться на главную
          </Link>
          
          <div className="mt-8">
            <h1 className="text-4xl md:text-5xl font-bold mb-8">Новогодняя ночь</h1>
            
            <div className="rounded-2xl overflow-hidden border border-white/10 mb-8">
              <img
                src="/kongo_ng.png"
                alt="Новогодняя ночь в ресторане Кучер и Конга"
                className="w-full h-auto object-cover"
              />
            </div>
            
            <div className="prose prose-invert max-w-none">
              <p className="text-lg text-neutral-300 leading-relaxed">
                Присоединяйтесь к нам на незабываемую новогоднюю ночь! Мы подготовили специальную программу, 
                изысканное меню и праздничную атмосферу для вас и ваших близких.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

