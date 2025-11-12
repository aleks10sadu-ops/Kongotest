'use client';

import React, { useState, useMemo } from 'react';
import { Search, Filter, X, ChevronDown } from 'lucide-react';
import { menuData, searchMenuItems } from '../data/menu';
import { menuTypes, getActiveMenuType, setActiveMenuType } from '../data/menuTypes';
import { getFoodImage } from '../data/foodImages';
import FoodDetailModal from './FoodDetailModal';
import { promotionsData } from '../data/promotionsData';
import { kidsMenuData } from '../data/kidsMenuData';
import { barMenuData } from '../data/barMenuData';
import { wineMenuData } from '../data/wineMenuData';
import BusinessLunchBuilder from './BusinessLunchBuilder';

export default function EnhancedMenuSection({ onAddToCart, cartItems = [] }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedMenuType, setSelectedMenuType] = useState('main');
  const [showFilters, setShowFilters] = useState(false);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [menuExpanded, setMenuExpanded] = useState(false);

  // Функция для получения данных меню по типу
  const getMenuDataByType = (menuType) => {
    switch (menuType) {
      case 'main':
        return menuData;
      case 'promotions':
        return promotionsData;
      case 'kids':
        return kidsMenuData;
      case 'bar':
        return barMenuData;
      case 'wine':
        return wineMenuData;
      default:
        return menuData;
    }
  };

  // Функция для поиска по меню (универсальная)
  const searchMenuItemsUniversal = (query, categories) => {
    if (!query.trim()) return categories;
    const lowerQuery = query.toLowerCase();
    return categories.map(category => ({
      ...category,
      items: category.items.filter(item =>
        item.name.toLowerCase().includes(lowerQuery) ||
        (item.description && item.description.toLowerCase().includes(lowerQuery)) ||
        (item.ingredients && item.ingredients.some(ing => ing.toLowerCase().includes(lowerQuery)))
      )
    })).filter(category => category.items.length > 0);
  };

  // Фильтрация меню
  const filteredMenu = useMemo(() => {
    const currentMenuData = getMenuDataByType(selectedMenuType);
    let categories = currentMenuData.categories || [];
    
    // Поиск по тексту
    if (searchQuery.trim()) {
      if (selectedMenuType === 'main') {
        categories = searchMenuItems(searchQuery, categories);
      } else {
        categories = searchMenuItemsUniversal(searchQuery, categories);
      }
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
    setSelectedCategory('all');
    setSearchQuery('');
  };

  // Получаем текущие данные меню для отображения категорий в фильтре
  const currentMenuDataForFilter = useMemo(() => {
    return getMenuDataByType(selectedMenuType);
  }, [selectedMenuType]);

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
    <section id="menu" className="py-8 sm:py-12 md:py-16 border-t border-white/10">
      <div className="container mx-auto px-4">
        <h2 className="text-center text-2xl sm:text-3xl md:text-4xl font-bold uppercase tracking-wider mb-6 md:mb-12">
          Меню ресторана
        </h2>

        {/* Выбор типа меню */}
        <div className="max-w-6xl mx-auto mb-6 sm:mb-8">
          <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
            {menuTypes.map((type) => (
              <button
                key={type.id}
                onClick={() => handleMenuTypeChange(type.id)}
                className={`px-4 py-3 rounded-full text-sm font-medium transition-all duration-200 hover:scale-105 active:scale-95 ${
                  selectedMenuType === type.id
                    ? 'bg-amber-400 text-black shadow-lg hover:shadow-xl'
                    : 'bg-white/5 text-white hover:bg-white/10 hover:border-amber-400/30 border border-white/10'
                }`}
              >
                {type.name}
              </button>
            ))}
          </div>
          
          {selectedMenuTypeData && (
            <div className="text-center text-neutral-400 text-sm mt-3">
              <p>{selectedMenuTypeData.description}</p>
              {selectedMenuType === 'promotions' && promotionsData.warning && (
                <p className="text-amber-400 mt-2 font-semibold">⚠️ {promotionsData.warning}</p>
              )}
            </div>
          )}
        </div>

        {/* Поиск и фильтры (скрыты для бизнес-ланча) */}
        {selectedMenuType !== 'business' && (
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
                className="w-full pl-10 pr-4 py-3 bg-black/40 border border-white/10 rounded-lg outline-none focus:border-amber-400 focus:scale-[1.02] transition-all duration-200 text-white placeholder-neutral-400"
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
                className="flex items-center gap-2 px-4 py-3 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 hover:border-amber-400/30 hover:scale-105 active:scale-95 transition-all duration-200 min-w-[200px]"
              >
                <Filter className="w-4 h-4" />
                <span className="flex-1 text-left">
                  {selectedCategory === 'all' ? 'Все категории' : currentMenuDataForFilter.categories?.find(c => c.id === selectedCategory)?.name}
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
                  {currentMenuDataForFilter.categories?.map((category) => (
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
        )}

        {/* Результаты поиска */}
        {selectedMenuType !== 'business' && searchQuery && (
          <div className="text-center mb-6">
            <p className="text-neutral-300">
              Найдено {filteredMenu.reduce((total, cat) => total + cat.items.length, 0)} блюд
              {selectedCategory !== 'all' && ` в категории "${currentMenuDataForFilter.categories?.find(c => c.id === selectedCategory)?.name}"`}
            </p>
          </div>
        )}

        {/* Меню по категориям или конструктор бизнес-ланча */}
        {selectedMenuType === 'business' ? (
          <BusinessLunchBuilder onAddToCart={onAddToCart} />
        ) : (
          <div className="space-y-16">
            {filteredMenu.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🍽️</div>
                <p className="text-neutral-400 text-lg mb-2">Блюда не найдены</p>
                <p className="text-neutral-500 text-sm">Попробуйте изменить поисковый запрос или выберите другую категорию</p>
              </div>
            ) : (() => {
              // Собираем все блюда из всех категорий
              const allItems = filteredMenu.flatMap(category => 
                category.items.map(item => ({ ...item, categoryName: category.name, categoryId: category.id }))
              );
              const displayedItems = menuExpanded ? allItems : allItems.slice(0, 6);
              const hasMore = allItems.length > 6;
              
              // Группируем по категориям для отображения
              const itemsByCategory = displayedItems.reduce((acc, item) => {
                if (!acc[item.categoryId]) {
                  acc[item.categoryId] = {
                    category: filteredMenu.find(c => c.id === item.categoryId),
                    items: []
                  };
                }
                acc[item.categoryId].items.push(item);
                return acc;
              }, {});
              
              return (
                <>
                  {Object.values(itemsByCategory).map(({ category, items: categoryItems }) => (
                    <div key={category.id} className="scroll-mt-24">
                      <div className="flex items-center justify-between mb-6 sm:mb-8">
                        <h3 className="text-xl sm:text-2xl md:text-3xl font-bold">
                          {category.name}
                        </h3>
                        <span className="text-xs sm:text-sm text-neutral-400 bg-white/5 px-2 sm:px-3 py-1 rounded-full">
                          {categoryItems.length} {menuExpanded ? `из ${category.items.length}` : ''} блюд
                        </span>
                      </div>
                      
                      {category.note && (
                        <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-amber-400/10 border border-amber-400/20 rounded-lg">
                          <p className="text-amber-300 text-xs sm:text-sm">
                            ℹ️ {category.note}
                          </p>
                        </div>
                      )}

                      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6">
                        {categoryItems.map((item) => (
                          <MenuItem
                            key={item.id}
                            item={item}
                            onAddToCart={onAddToCart}
                            onItemClick={handleItemClick}
                            cartItems={cartItems}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                  {!menuExpanded && hasMore && (
                    <div className="text-center mt-8">
                      <button
                        onClick={() => setMenuExpanded(true)}
                        className="px-6 py-3 rounded-full bg-amber-400 text-black font-semibold hover:bg-amber-300 hover:scale-105 active:scale-95 transition-all duration-200 shadow-lg hover:shadow-xl"
                      >
                        Показать все {allItems.length} блюд
                      </button>
                    </div>
                  )}
                  {menuExpanded && hasMore && (
                    <div className="text-center mt-8">
                      <button
                        onClick={() => setMenuExpanded(false)}
                        className="px-6 py-3 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 hover:border-amber-400/30 hover:scale-105 active:scale-95 transition-all duration-200"
                      >
                        Свернуть
                      </button>
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        )}
      </div>

      {/* Food Detail Modal */}
      {selectedItem && (
        <FoodDetailModal
          item={selectedItem}
          isOpen={isDetailModalOpen}
          onClose={handleCloseModal}
          onAddToCart={onAddToCart}
          cartItems={cartItems}
        />
      )}
    </section>
  );
}

// Компонент отдельного блюда
function MenuItem({ item, onAddToCart, onItemClick, cartItems = [] }) {
  // Получаем количество из корзины напрямую (без локального состояния)
  const cartItem = cartItems.find(ci => ci.id === item.id);
  const quantity = cartItem?.qty || 0;
  
  // Получаем количество вариантов из корзины
  const getVariantQuantity = (variantId) => {
    const cartVariant = cartItems.find(ci => ci.id === variantId);
    return cartVariant?.qty || 0;
  };

  // Проверяем, что item существует и имеет необходимые свойства
  if (!item || !item.id || !item.name) {
    return null;
  }

  const handleAdd = (variant = null) => {
    if (variant) {
      // Добавляем вариант
      const variantId = `${item.id}_${variant.name}`;
      // Получаем текущее количество из корзины
      const cartVariant = cartItems.find(ci => ci.id === variantId);
      const currentQty = cartVariant?.qty || 0;
      const newQuantity = currentQty + 1;
      
      onAddToCart({
        id: variantId,
        name: `${item.name} (${variant.name})`,
        price: variant.price || 0,
        weight: variant.weight || item.weight,
        description: item.description,
        img: getFoodImage(item.id),
        qty: newQuantity
      });
    } else {
      // Добавляем основное блюдо
      // Получаем текущее количество из корзины
      const cartItem = cartItems.find(ci => ci.id === item.id);
      const currentQty = cartItem?.qty || 0;
      const newQuantity = currentQty + 1;
      
      onAddToCart({
        id: item.id,
        name: item.name,
        price: item.price || 0,
        weight: item.weight,
        description: item.description,
        img: getFoodImage(item.id),
        qty: newQuantity
      });
    }
  };

  const handleRemove = (variant = null) => {
    if (variant) {
      // Убираем вариант
      const variantId = `${item.id}_${variant.name}`;
      const cartVariant = cartItems.find(ci => ci.id === variantId);
      const currentQty = cartVariant?.qty || 0;
      
      if (currentQty > 0) {
        const newQuantity = currentQty - 1;
        
        onAddToCart({
          id: variantId,
          name: `${item.name} (${variant.name})`,
          price: variant.price || 0,
          weight: variant.weight || item.weight,
          description: item.description,
          img: getFoodImage(item.id),
          qty: newQuantity // Если newQuantity = 0, корзина удалит элемент
        });
      }
    } else {
      // Убираем основное блюдо
      const cartItem = cartItems.find(ci => ci.id === item.id);
      const currentQty = cartItem?.qty || 0;
      
      if (currentQty > 0) {
        const newQuantity = currentQty - 1;
        
        onAddToCart({
          id: item.id,
          name: item.name,
          price: item.price || 0,
          weight: item.weight,
          description: item.description,
          img: getFoodImage(item.id),
          qty: newQuantity // Если newQuantity = 0, корзина удалит элемент
        });
      }
    }
  };

  // Grid view
  const handleCardClick = (e) => {
    // Проверяем, был ли клик на кнопку или элемент управления количеством
    const isButtonClick = e.target.closest('button') || 
                          e.target.closest('[role="button"]') ||
                          e.target.tagName === 'BUTTON';
    
    // Если клик был на кнопку, не открываем модальное окно
    if (isButtonClick) {
      return;
    }
    
    // Иначе открываем модальное окно
    if (onItemClick) {
      onItemClick(item);
    }
  };

  return (
    <div 
      onClick={handleCardClick}
      className="group overflow-hidden rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 hover:border-amber-400/30 transition-all duration-300 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] flex flex-col h-full cursor-pointer"
    >
      {/* Image */}
      <div className="relative aspect-square overflow-hidden">
        <img
          src={getFoodImage(item.id)}
          alt={item.name}
          className="w-full h-full object-cover transition-transform group-hover:scale-105"
        />
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
                const variantQuantity = getVariantQuantity(variantId);
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
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAdd(variant);
                          }}
                          className="px-3 py-1 text-xs rounded-full bg-amber-400 text-black font-semibold hover:bg-amber-300 hover:scale-105 active:scale-95 transition-all duration-200 whitespace-nowrap"
                        >
                          Добавить
                        </button>
                      ) : (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemove(variant);
                            }}
                            className="p-1 rounded-full border border-white/20 hover:border-white/60 hover:border-amber-400/50 hover:scale-110 active:scale-95 transition-all duration-200"
                            aria-label="Убавить"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                            </svg>
                          </button>
                          <span className="w-6 text-center text-sm font-semibold">{variantQuantity}</span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAdd(variant);
                            }}
                            className="p-1 rounded-full bg-amber-400 text-black hover:bg-amber-300 hover:scale-110 active:scale-95 transition-all duration-200"
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
                onClick={(e) => {
                  e.stopPropagation();
                  handleAdd();
                }}
                className="px-4 py-2 rounded-full bg-amber-400 text-black font-semibold hover:bg-amber-300 hover:scale-105 active:scale-95 transition-all duration-200 shadow-md hover:shadow-lg"
              >
                Добавить
              </button>
            ) : (
              <div className="flex items-center gap-3">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemove();
                  }}
                  className="p-2 rounded-full border border-white/20 hover:border-white/60 hover:border-amber-400/50 hover:scale-110 active:scale-95 transition-all duration-200"
                  aria-label="Убавить"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                  </svg>
                </button>
                <span className="w-8 text-center font-semibold">{quantity}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAdd();
                  }}
                  className="p-2 rounded-full bg-amber-400 text-black hover:bg-amber-300 hover:scale-110 active:scale-95 transition-all duration-200"
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
