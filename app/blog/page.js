'use client';

import React from 'react';

export default function BlogPage() {
  return (
    <div className="bg-neutral-950 text-white min-h-screen">
      <div className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto text-center">
          <a href="/" className="inline-block mb-8 text-amber-400 hover:text-amber-300">
            ← Вернуться на главную
          </a>
          
          <h1 className="text-4xl font-bold mb-8">Новостной блог</h1>
          
          <div className="mt-10 text-neutral-400">
            <p>Новости будут добавлены позже</p>
          </div>
        </div>
      </div>
    </div>
  );
}
