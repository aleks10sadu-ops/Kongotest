'use client';

import React, { useState, useMemo } from 'react';
import { Search, Filter, X, ChevronDown, Grid, List, Eye } from 'lucide-react';
import { menuData, searchMenuItems } from '../data/menu';
import { menuTypes, getActiveMenuType, setActiveMenuType } from '../data/menuTypes';
import { getFoodImage } from '../data/foodImages';
import FoodDetailModal from './FoodDetailModal';

export default function EnhancedMenuSection({ onAddToCart }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedMenuType, setSelectedMenuType] = useState('main');
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Фильтрация меню
  const filteredMenu = useMemo(() => {
    // Если выбран не основной тип меню, показываем пустое состояние
    if (selectedMenuType !== 'main') {
      return [];
    }
    
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
  }, [searchQuery, selectedCategory, selectedMenuType]);

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
  };

  const handleMenuTypeChange = (typeId) => {
    setSelectedMenuType(typeId);
    setActiveMenuType(typeId);
    // Здесь можно добавить логику загрузки данных для разных типов меню
  };

  const handleItemClick = (item) => {
    setSelectedItem(item);
    setIsDetailModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsDetailModalOpen(false);
    setSelectedItem(null);
  };

  const selectedMenuTypeData = menuTypes.find(type => type.id === selectedMenuType);

  return (
    <section id="menu" className="py-16 border-t border-white/10">
      <div className="container mx-auto px-4">
        <h2 className="text-center text-3xl md:text-4xl font-bold uppercase tracking-wider mb-12">
          Меню ресторана
        </h2>

        {/* Выбор типа меню */}
        <div className="max-w-6xl mx-auto mb-8">
          <div className="flex flex-wrap justify-center gap-3">
            {menuTypes.map((type) => (
              <button
                key={type.id}
                onClick={() => handleMenuTypeChange(type.id)}
                className={`px-4 py-3 rounded-full text-sm font-medium transition-all duration-200 ${
                  selectedMenuType === type.id
                    ? 'bg-amber-400 text-black shadow-lg'
                    : 'bg-white/5 text-white hover:bg-white/10 border border-white/10'
                }`}
              >
                {type.name}
              </button>
            ))}
          </div>
          
          {selectedMenuTypeData && (
            <p className="text-center text-neutral-400 text-sm mt-3">
              {selectedMenuTypeData.description}
            </p>
          )}
        </div>

        {/* Поиск и фильтры */}
        <div className="max-w-6xl mx-auto mb-8">
          <div className="flex flex-col lg:flex-row gap-4">
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

            {/* Фильтр по категориям */}
            <div className="relative">
              <button
                onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                className="flex items-center gap-2 px-4 py-3 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition min-w-[200px]"
              >
                <Filter className="w-4 h-4" />
                <span className="flex-1 text-left">
                  {selectedCategory === 'all' ? 'Все категории' : menuData.categories.find(c => c.id === selectedCategory)?.name}
                </span>
                <ChevronDown className={`w-4 h-4 transition-transform ${showCategoryDropdown ? 'rotate-180' : ''}`} />
              </button>

              {showCategoryDropdown && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-neutral-900 border border-white/10 rounded-lg shadow-xl z-50 max-h-60 overflow-y-auto">
                  <button
                    onClick={() => {
                      setSelectedCategory('all');
                      setShowCategoryDropdown(false);
                    }}
                    className={`w-full text-left px-4 py-3 hover:bg-white/5 transition ${
                      selectedCategory === 'all' ? 'bg-amber-400/20 text-amber-400' : 'text-white'
                    }`}
                  >
                    Все категории
                  </button>
                  {menuData.categories.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => {
                        setSelectedCategory(category.id);
                        setShowCategoryDropdown(false);
                      }}
                      className={`w-full text-left px-4 py-3 hover:bg-white/5 transition ${
                        selectedCategory === category.id ? 'bg-amber-400/20 text-amber-400' : 'text-white'
                      }`}
                    >
                      {category.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Переключатель вида */}
            <div className="flex bg-white/5 border border-white/10 rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded transition ${
                  viewMode === 'grid' ? 'bg-amber-400 text-black' : 'text-white hover:bg-white/5'
                }`}
                title="Сетка"
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded transition ${
                  viewMode === 'list' ? 'bg-amber-400 text-black' : 'text-white hover:bg-white/5'
                }`}
                title="Список"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Очистить фильтры */}
          {(searchQuery || selectedCategory !== 'all') && (
            <div className="mt-4 text-center">
              <button
                onClick={clearFilters}
                className="inline-flex items-center gap-2 text-amber-400 hover:text-amber-300 text-sm transition"
              >
                <X className="w-3 h-3" />
                Очистить фильтры
              </button>
            </div>
          )}
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
              <div className="text-6xl mb-4">🍽️</div>
              <p className="text-neutral-400 text-lg mb-2">Блюда не найдены</p>
              <p className="text-neutral-500 text-sm">Попробуйте изменить поисковый запрос или выберите другую категорию</p>
            </div>
          ) : (
            filteredMenu.map((category) => (
              <div key={category.id} className="scroll-mt-24">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-2xl md:text-3xl font-bold">
                    {category.name}
                  </h3>
                  <span className="text-sm text-neutral-400 bg-white/5 px-3 py-1 rounded-full">
                    {category.items.length} блюд
                  </span>
                </div>
                
                {category.note && (
                  <div className="mb-6 p-4 bg-amber-400/10 border border-amber-400/20 rounded-lg">
                    <p className="text-amber-300 text-sm">
                      ℹ️ {category.note}
                    </p>
                  </div>
                )}

                <div className={`grid gap-6 ${
                  viewMode === 'grid' 
                    ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' 
                    : 'grid-cols-1'
                }`}>
                  {category.items.map((item) => (
                    <MenuItem
                      key={item.id}
                      item={item}
                      onAddToCart={onAddToCart}
                      onItemClick={handleItemClick}
                      viewMode={viewMode}
                    />
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Food Detail Modal */}
      {selectedItem && (
        <FoodDetailModal
          item={selectedItem}
          isOpen={isDetailModalOpen}
          onClose={handleCloseModal}
          onAddToCart={onAddToCart}
        />
      )}
    </section>
  );
}

// Компонент отдельного блюда
function MenuItem({ item, onAddToCart, viewMode = 'grid', onItemClick }) {
  const [quantity, setQuantity] = useState(0);
  const [selectedVariants, setSelectedVariants] = useState({});

  // Проверяем, что item существует и имеет необходимые свойства
  if (!item || !item.id || !item.name) {
    return null;
  }

  const handleAdd = (variant = null) => {
    if (variant) {
      // Добавляем вариант
      const variantId = `${item.id}_${variant.name}`;
      const newQuantity = (selectedVariants[variantId] || 0) + 1;
      setSelectedVariants(prev => ({
        ...prev,
        [variantId]: newQuantity
      }));
      
      onAddToCart({
        id: variantId,
        name: `${item.name} (${variant.name})`,
        price: variant.price || 0,
        weight: variant.weight || item.weight,
        description: item.description,
        qty: newQuantity
      });
    } else {
      // Добавляем основное блюдо
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
    }
  };

  const handleRemove = (variant = null) => {
    if (variant) {
      // Убираем вариант
      const variantId = `${item.id}_${variant.name}`;
      const currentQuantity = selectedVariants[variantId] || 0;
      if (currentQuantity > 0) {
        const newQuantity = currentQuantity - 1;
        if (newQuantity === 0) {
          setSelectedVariants(prev => {
            const newVariants = { ...prev };
            delete newVariants[variantId];
            return newVariants;
          });
        } else {
          setSelectedVariants(prev => ({
            ...prev,
            [variantId]: newQuantity
          }));
        }
        
        onAddToCart({
          id: variantId,
          name: `${item.name} (${variant.name})`,
          price: variant.price || 0,
          weight: variant.weight || item.weight,
          description: item.description,
          qty: newQuantity
        });
      }
    } else {
      // Убираем основное блюдо
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
    }
  };

  if (viewMode === 'list') {
    return (
      <div className="group flex items-center gap-4 p-4 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-all duration-300">
        {/* Image */}
        <div className="relative w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden">
          <img
            src={getFoodImage(item.id)}
            alt={item.name}
            className="w-full h-full object-cover"
          />
        </div>
        
        <div className="flex-1">
          <div className="flex items-start justify-between gap-3 mb-2">
            <h4 className="text-lg font-semibold leading-tight flex-1">{item.name}</h4>
            <div className="text-right flex-shrink-0">
              <div className="text-lg font-bold text-amber-400 whitespace-nowrap">
                {item.price ? item.price.toLocaleString('ru-RU') : '0'} ₽
              </div>
              {item.weight && (
                <div className="text-xs text-neutral-400">{item.weight}</div>
              )}
            </div>
          </div>

          {item.description && (
            <p className="text-neutral-300 text-sm leading-relaxed line-clamp-2">
              {item.description}
            </p>
          )}

          {item.variants && Array.isArray(item.variants) && item.variants.length > 0 && (
            <div className="mt-2">
              <div className="text-xs text-neutral-400 mb-1">Варианты:</div>
              <div className="flex flex-wrap gap-2">
                {item.variants.map((variant, index) => (
                  <span key={index} className="text-xs bg-white/10 px-2 py-1 rounded">
                    {variant.name} - {variant.price ? variant.price.toLocaleString('ru-RU') : '0'} ₽
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onItemClick && onItemClick(item)}
            className="p-2 rounded-full border border-white/20 hover:border-white/60 transition"
            aria-label="Подробнее"
          >
            <Eye className="w-4 h-4" />
          </button>
          {quantity === 0 ? (
            <button
              onClick={handleAdd}
              className="px-4 py-2 rounded-full bg-amber-400 text-black font-semibold hover:bg-amber-300 transition"
            >
              Добавить
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={handleRemove}
                className="p-2 rounded-full border border-white/20 hover:border-white/60 transition"
                aria-label="Убавить"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                </svg>
              </button>
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => {
                  const newQty = parseInt(e.target.value) || 1;
                  if (newQty > 0) {
                    setQuantity(newQty);
                    onAddToCart({
                      id: item.id,
                      name: item.name,
                      price: item.price || 0,
                      weight: item.weight,
                      description: item.description,
                      qty: newQty
                    });
                  }
                }}
                className="w-12 text-center bg-black/40 border border-white/10 rounded-lg px-2 py-1 outline-none focus:border-amber-400 text-sm font-semibold"
              />
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
    );
  }

  // Grid view (по умолчанию)
  return (
    <div className="group overflow-hidden rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 transition-all duration-300 hover:shadow-lg flex flex-col h-full">
      {/* Image */}
      <div className="relative aspect-square overflow-hidden">
        <img
          src={getFoodImage(item.id)}
          alt={item.name}
          className="w-full h-full object-cover transition-transform group-hover:scale-105"
        />
        <button
          onClick={() => onItemClick && onItemClick(item)}
          className="absolute top-3 right-3 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition opacity-0 group-hover:opacity-100"
          aria-label="Подробнее"
        >
          <Eye className="w-4 h-4" />
        </button>
      </div>
      
      <div className="p-6 flex flex-col flex-grow">
        <div className="flex items-start justify-between gap-3 mb-3">
          <h4 className="text-lg font-semibold leading-tight flex-1">{item.name}</h4>
          <div className="text-right flex-shrink-0">
            <div className="text-lg font-bold text-amber-400 whitespace-nowrap">
              {item.price ? item.price.toLocaleString('ru-RU') : '0'} ₽
            </div>
            {item.weight && (
              <div className="text-xs text-neutral-400">{item.weight}</div>
            )}
          </div>
        </div>

        {/* Description with fixed height */}
        <div className="flex-grow mb-4">
          {item.description && (
            <p className="text-neutral-300 text-sm leading-relaxed line-clamp-3 h-16 overflow-hidden">
              {item.description}
            </p>
          )}
        </div>

        {/* Варианты для блюд с вариантами (например, Цезарь) */}
        {item.variants && Array.isArray(item.variants) && item.variants.length > 0 && (
          <div className="mb-4">
            <div className="text-sm text-neutral-400 mb-3">Выберите вариант:</div>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {item.variants.map((variant, index) => {
                const variantId = `${item.id}_${variant.name}`;
                const variantQuantity = selectedVariants[variantId] || 0;
                return (
                  <div key={index} className="flex justify-between items-center p-2 bg-white/5 rounded-lg">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-white truncate">{variant.name || 'Вариант'}</div>
                      <div className="text-xs text-neutral-400">{variant.weight || item.weight}</div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-sm text-amber-400 font-semibold">
                        {variant.price ? variant.price.toLocaleString('ru-RU') : '0'} ₽
                      </span>
                      {variantQuantity === 0 ? (
                        <button
                          onClick={() => handleAdd(variant)}
                          className="px-3 py-1 text-xs rounded-full bg-amber-400 text-black font-semibold hover:bg-amber-300 transition whitespace-nowrap"
                        >
                          Добавить
                        </button>
                      ) : (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleRemove(variant)}
                            className="p-1 rounded-full border border-white/20 hover:border-white/60 transition"
                            aria-label="Убавить"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                            </svg>
                          </button>
                          <span className="w-6 text-center text-sm font-semibold">{variantQuantity}</span>
                          <button
                            onClick={() => handleAdd(variant)}
                            className="p-1 rounded-full bg-amber-400 text-black hover:bg-amber-300 transition"
                            aria-label="Добавить"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Кнопки управления количеством - только для блюд без вариантов */}
        {(!item.variants || !Array.isArray(item.variants) || item.variants.length === 0) && (
          <div className="mt-auto">
            <div className="flex items-center justify-between">
            {quantity === 0 ? (
              <button
                onClick={() => handleAdd()}
                className="px-4 py-2 rounded-full bg-amber-400 text-black font-semibold hover:bg-amber-300 transition"
              >
                Добавить
              </button>
            ) : (
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleRemove()}
                  className="p-2 rounded-full border border-white/20 hover:border-white/60 transition"
                  aria-label="Убавить"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                  </svg>
                </button>
                <span className="w-8 text-center font-semibold">{quantity}</span>
                <button
                  onClick={() => handleAdd()}
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
        )}
      </div>
    </div>
  );
}
