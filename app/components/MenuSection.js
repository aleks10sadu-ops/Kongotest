'use client';

import React, { useState, useMemo } from 'react';
import { Search, Filter, X } from 'lucide-react';
import { menuData, searchMenuItems } from '../data/menu';

export default function MenuSection({ onAddToCart }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showFilters, setShowFilters] = useState(false);

  // Фильтрация меню
  const filteredMenu = useMemo(() => {
    let categories = menuData.categories;
    
    // Поиск по тексту
    if (searchQuery.trim()) {
      categories = searchMenuItems(searchQuery, categories);
    }
    
    // Фильтр по категории
    if (selectedCategory !== 'all') {
      categories = categories.filter(cat => cat.id === selectedCategory);
    }
    
    return categories;
  }, [searchQuery, selectedCategory]);

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
  };

  return (
    <section id="menu" className="py-16 border-t border-white/10">
      <div className="container mx-auto px-4">
        <h2 className="text-center text-3xl md:text-4xl font-bold uppercase tracking-wider mb-12">
          Меню ресторана
        </h2>

        {/* Поиск и фильтры */}
        <div className="max-w-4xl mx-auto mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Поиск */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutral-400" />
              <input
                type="text"
                placeholder="Поиск по блюдам..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-black/40 border border-white/10 rounded-lg outline-none focus:border-amber-400 text-white placeholder-neutral-400"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-neutral-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Кнопка фильтров для мобильных */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="md:hidden px-4 py-3 bg-white/5 border border-white/10 rounded-lg flex items-center gap-2 hover:bg-white/10 transition"
            >
              <Filter className="w-4 h-4" />
              Фильтры
            </button>
          </div>

          {/* Фильтры категорий */}
          <div className={`mt-4 ${showFilters ? 'block' : 'hidden md:block'}`}>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`px-4 py-2 rounded-full text-sm transition ${
                  selectedCategory === 'all'
                    ? 'bg-amber-400 text-black'
                    : 'bg-white/5 text-white hover:bg-white/10'
                }`}
              >
                Все категории
              </button>
              {menuData.categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`px-4 py-2 rounded-full text-sm transition ${
                    selectedCategory === category.id
                      ? 'bg-amber-400 text-black'
                      : 'bg-white/5 text-white hover:bg-white/10'
                  }`}
                >
                  {category.name}
                </button>
              ))}
            </div>

            {/* Очистить фильтры */}
            {(searchQuery || selectedCategory !== 'all') && (
              <button
                onClick={clearFilters}
                className="mt-3 text-amber-400 hover:text-amber-300 text-sm flex items-center gap-1"
              >
                <X className="w-3 h-3" />
                Очистить фильтры
              </button>
            )}
          </div>
        </div>

        {/* Результаты поиска */}
        {searchQuery && (
          <div className="text-center mb-6">
            <p className="text-neutral-300">
              Найдено {filteredMenu.reduce((total, cat) => total + cat.items.length, 0)} блюд
              {selectedCategory !== 'all' && ` в категории "${menuData.categories.find(c => c.id === selectedCategory)?.name}"`}
            </p>
          </div>
        )}

        {/* Меню по категориям */}
        <div className="space-y-16">
          {filteredMenu.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-neutral-400 text-lg">Блюда не найдены</p>
              <p className="text-neutral-500 text-sm mt-2">Попробуйте изменить поисковый запрос или выберите другую категорию</p>
            </div>
          ) : (
            filteredMenu.map((category) => (
              <div key={category.id} className="scroll-mt-24">
                <h3 className="text-2xl md:text-3xl font-bold mb-8 text-center">
                  {category.name}
                </h3>
                
                {category.note && (
                  <p className="text-center text-neutral-400 text-sm mb-6">
                    {category.note}
                  </p>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {category.items.map((item) => (
                    <MenuItem
                      key={item.id}
                      item={item}
                      onAddToCart={onAddToCart}
                    />
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
}

// Компонент отдельного блюда
function MenuItem({ item, onAddToCart }) {
  const [quantity, setQuantity] = useState(0);

  // Проверяем, что item существует и имеет необходимые свойства
  if (!item || !item.id || !item.name) {
    return null;
  }

  const handleAdd = () => {
    const newQuantity = quantity + 1;
    setQuantity(newQuantity);
    onAddToCart({
      id: item.id,
      name: item.name,
      price: item.price || 0,
      weight: item.weight,
      description: item.description,
      qty: newQuantity
    });
  };

  const handleRemove = () => {
    if (quantity > 0) {
      const newQuantity = quantity - 1;
      setQuantity(newQuantity);
      onAddToCart({
        id: item.id,
        name: item.name,
        price: item.price || 0,
        weight: item.weight,
        description: item.description,
        qty: newQuantity
      });
    }
  };

  return (
    <div className="group overflow-hidden rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 transition-all duration-300">
      <div className="p-6">
        <div className="flex items-start justify-between gap-3 mb-3">
          <h4 className="text-lg font-semibold leading-tight">{item.name}</h4>
          <div className="text-right">
            <div className="text-lg font-bold text-amber-400">
              {item.price ? item.price.toLocaleString('ru-RU') : '0'} ₽
            </div>
            {item.weight && (
              <div className="text-xs text-neutral-400">{item.weight}</div>
            )}
          </div>
        </div>

        {item.description && (
          <p className="text-neutral-300 text-sm mb-4 leading-relaxed">
            {item.description}
          </p>
        )}

        {/* Варианты для блюд с вариантами (например, Цезарь) */}
        {item.variants && Array.isArray(item.variants) && item.variants.length > 0 && (
          <div className="mb-4">
            <div className="text-sm text-neutral-400 mb-2">Варианты:</div>
            <div className="space-y-2">
              {item.variants.map((variant, index) => (
                <div key={index} className="flex justify-between items-center text-sm">
                  <span className="text-neutral-300">{variant.name || 'Вариант'}</span>
                  <span className="text-amber-400 font-semibold">
                    {variant.price ? variant.price.toLocaleString('ru-RU') : '0'} ₽
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Кнопки управления количеством */}
        <div className="flex items-center justify-between">
          {quantity === 0 ? (
            <button
              onClick={handleAdd}
              className="px-4 py-2 rounded-full bg-amber-400 text-black font-semibold hover:bg-amber-300 transition"
            >
              Добавить
            </button>
          ) : (
            <div className="flex items-center gap-3">
              <button
                onClick={handleRemove}
                className="p-2 rounded-full border border-white/20 hover:border-white/60 transition"
                aria-label="Убавить"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                </svg>
              </button>
              <span className="w-8 text-center font-semibold">{quantity}</span>
              <button
                onClick={handleAdd}
                className="p-2 rounded-full bg-amber-400 text-black hover:bg-amber-300 transition"
                aria-label="Добавить"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
