'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Search, Filter, X, ChevronDown, Plus } from 'lucide-react';
import { menuData as staticMenuData, searchMenuItems } from '../data/menu';
import { menuTypes, getActiveMenuType, setActiveMenuType } from '../data/menuTypes';
import { getFoodImage } from '../data/foodImages';
import FoodDetailModal from './FoodDetailModal';
import { promotionsData as staticPromotionsData } from '../data/promotionsData';
import { kidsMenuData as staticKidsMenuData } from '../data/kidsMenuData';
import { barMenuData as staticBarMenuData } from '../data/barMenuData';
import { wineMenuData as staticWineMenuData } from '../data/wineMenuData';
import BusinessLunchBuilder from './BusinessLunchBuilder';
import { createSupabaseBrowserClient } from '../../lib/supabase/client';

/**
 * props.ssrMenuDataByType приходит с SSR-страниц (например, /menu) и
 * содержит данные из Supabase. Если пропсы не переданы, компонент
 * использует локальные статические JS-данные, как раньше.
 */
export default function EnhancedMenuSection({
  onAddToCart,
  cartItems = [],
  ssrMenuDataByType,
  // Включать ли админ-режим редактирования (например, на /menu)
  enableAdminEditing = false,
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedMenuType, setSelectedMenuType] = useState('main');
  const [showFilters, setShowFilters] = useState(false);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [menuExpanded, setMenuExpanded] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminLoading, setAdminLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [clientMenuData, setClientMenuData] = useState(null);
  const [clientMenuLoading, setClientMenuLoading] = useState(false);
  const [supabaseMenuTypes, setSupabaseMenuTypes] = useState([]); // Типы меню из Supabase
  const [allCategories, setAllCategories] = useState([]); // Все категории для выбора при добавлении блюда
  const [allMenuDataByType, setAllMenuDataByType] = useState({}); // Все данные меню по типам для глобального поиска

  // Проверка, является ли текущий пользователь админом (по таблице admins)
  useEffect(() => {
    if (!enableAdminEditing) {
      setIsAdmin(false);
      setAdminLoading(false);
      return;
    }

    const run = async () => {
      try {
        const supabase = createSupabaseBrowserClient();
        if (!supabase) {
          setIsAdmin(false);
          setAdminLoading(false);
          return;
        }
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          setIsAdmin(false);
          setAdminLoading(false);
          return;
        }
        const { data: adminRecord } = await supabase
          .from('admins')
          .select('role')
          .eq('id', user.id)
          .maybeSingle();
        setIsAdmin(!!adminRecord);
      } catch {
        setIsAdmin(false);
      } finally {
        setAdminLoading(false);
      }
    };

    run();
  }, [enableAdminEditing]);

  // Сохраняем ssrMenuDataByType для глобального поиска
  useEffect(() => {
    if (ssrMenuDataByType) {
      setAllMenuDataByType(ssrMenuDataByType);
    }
  }, [ssrMenuDataByType]);

  // Realtime синхронизация для автоматического обновления данных
  useEffect(() => {
    // Работает только если используются данные из Supabase (либо с сервера, либо загружены на клиенте)
    if (!ssrMenuDataByType && !clientMenuData) return;

    const supabase = createSupabaseBrowserClient();
    if (!supabase) return;

    // Подписка на изменения в таблице dishes
    const dishesChannel = supabase
      .channel('dishes-changes')
      .on(
        'postgres_changes',
        {
          event: '*', // INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'dishes',
        },
        () => {
          // При любом изменении перезагружаем страницу для получения актуальных данных
          // В production можно было бы обновлять только конкретные элементы
          window.location.reload();
        }
      )
      .subscribe();

    // Подписка на изменения в таблице categories
    const categoriesChannel = supabase
      .channel('categories-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'categories',
        },
        () => {
          window.location.reload();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(dishesChannel);
      supabase.removeChannel(categoriesChannel);
    };
  }, [ssrMenuDataByType, clientMenuData]);

  // Загрузка типов меню из Supabase
  useEffect(() => {
    const loadMenuTypes = async () => {
      try {
        const supabase = createSupabaseBrowserClient();
        if (!supabase) return;

        const { data: menuTypesData, error } = await supabase
          .from('menu_types')
          .select('*')
          .order('created_at', { ascending: true });

        if (!error && menuTypesData) {
          setSupabaseMenuTypes(menuTypesData);
        }
      } catch (err) {
        console.error('Error loading menu types:', err);
      }
    };

    loadMenuTypes();

    // Realtime синхронизация для типов меню
    const supabase = createSupabaseBrowserClient();
    if (!supabase) return;

    const menuTypesChannel = supabase
      .channel('menu-types-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'menu_types',
        },
        () => {
          loadMenuTypes();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(menuTypesChannel);
    };
  }, []);

  // Загрузка всех категорий для выбора при добавлении блюда
  useEffect(() => {
    const loadAllCategories = async () => {
      try {
        const supabase = createSupabaseBrowserClient();
        if (!supabase) return;

        const { data: categoriesData, error } = await supabase
          .from('categories')
          .select('id, name, menu_type_id')
          .order('name', { ascending: true });

        if (!error && categoriesData) {
          setAllCategories(categoriesData);
        }
      } catch (err) {
        console.error('Error loading all categories:', err);
      }
    };

    loadAllCategories();

    // Realtime синхронизация для категорий
    const supabase = createSupabaseBrowserClient();
    if (!supabase) return;

    const categoriesChannel = supabase
      .channel('all-categories-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'categories',
        },
        () => {
          loadAllCategories();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(categoriesChannel);
    };
  }, []);

  // Загрузка данных из Supabase на клиенте, если ssrMenuDataByType не передан
  useEffect(() => {
    if (ssrMenuDataByType) return; // Если данные уже есть с сервера, не загружаем

    const loadMenuData = async () => {
      setClientMenuLoading(true);
      try {
        const supabase = createSupabaseBrowserClient();
        if (!supabase) {
          setClientMenuLoading(false);
          return;
        }

        // Загружаем все типы меню из Supabase, а не только определенные slug'и
        const { data: allMenuTypes } = await supabase
          .from('menu_types')
          .select('id, slug')
          .neq('slug', 'business') // Исключаем бизнес-ланч, он обрабатывается отдельно
          .neq('slug', 'banquet'); // Исключаем банкет

        if (!allMenuTypes || allMenuTypes.length === 0) {
          setClientMenuLoading(false);
          return;
        }

        const menuTypesToLoad = allMenuTypes.map(mt => mt.slug);
        const loadedData = {};

        for (const menuTypeSlug of menuTypesToLoad) {
          try {
            // Находим menu_type по slug
            const menuType = allMenuTypes.find(mt => mt.slug === menuTypeSlug);
            if (!menuType) continue;

            // Загружаем категории
            const { data: categories } = await supabase
              .from('categories')
              .select('id, name, sort_order, note')
              .eq('menu_type_id', menuType.id)
              .order('sort_order', { ascending: true });

            if (!categories?.length) continue;

            // Загружаем блюда
            const categoryIds = categories.map((c) => c.id);
            const { data: dishes } = await supabase
              .from('dishes')
              .select('id, category_id, name, description, price, weight, image_url, is_active')
              .in('category_id', categoryIds)
              .eq('is_active', true);

            if (!dishes?.length) continue;

            // Загружаем варианты
            const dishIds = dishes.map((d) => d.id);
            const { data: variants } = await supabase
              .from('dish_variants')
              .select('id, dish_id, name, price, weight')
              .in('dish_id', dishIds);

            const variantsByDish = {};
            (variants || []).forEach((v) => {
              if (!variantsByDish[v.dish_id]) variantsByDish[v.dish_id] = [];
              variantsByDish[v.dish_id].push({
                id: v.id,
                name: v.name,
                price: Number(v.price),
                weight: v.weight || null,
              });
            });

            const itemsByCategory = {};
            dishes.forEach((d) => {
              if (!itemsByCategory[d.category_id]) itemsByCategory[d.category_id] = [];
              itemsByCategory[d.category_id].push({
                id: d.id,
                name: d.name,
                description: d.description || '',
                price: Number(d.price),
                weight: d.weight || null,
                image: d.image_url || undefined,
                variants: variantsByDish[d.id] || [],
              });
            });

            loadedData[menuTypeSlug] = {
              categories: categories.map((c) => ({
                id: c.id,
                name: c.name,
                note: c.note || undefined,
                items: (itemsByCategory[c.id] || []).map((item) => ({
                  ...item,
                  image: item.image || null,
                })),
              })),
            };
          } catch (err) {
            console.error(`Error loading menu type ${menuTypeSlug}:`, err);
          }
        }

        setClientMenuData(loadedData);
        setAllMenuDataByType(loadedData); // Сохраняем все данные для глобального поиска
      } catch (err) {
        console.error('Error loading menu data:', err);
      } finally {
        setClientMenuLoading(false);
      }
    };

    loadMenuData();
  }, [ssrMenuDataByType, supabaseMenuTypes]); // Перезагружаем данные при изменении типов меню

  // Используем типы меню из Supabase, если они загружены, иначе статические
  const availableMenuTypes = supabaseMenuTypes.length > 0 
    ? supabaseMenuTypes.map(mt => ({ id: mt.slug, name: mt.name, description: mt.description }))
    : menuTypes;

  // Функция для поиска блюд во всех типах меню
  const searchAllMenuTypes = useMemo(() => {
    if (!searchQuery.trim()) return [];
    
    const query = searchQuery.toLowerCase();
    const results = [];
    
    // Получаем все доступные данные меню (приоритет: allMenuDataByType > ssrMenuDataByType > clientMenuData)
    const allData = allMenuDataByType && Object.keys(allMenuDataByType).length > 0
      ? allMenuDataByType
      : ssrMenuDataByType || clientMenuData || {};
    
    // Если данных нет, используем статические
    const dataToSearch = Object.keys(allData).length > 0 
      ? allData 
      : {
          main: staticMenuData,
          promotions: staticPromotionsData,
          kids: staticKidsMenuData,
          bar: staticBarMenuData,
          wine: staticWineMenuData,
        };
    
    // Ищем во всех типах меню
    Object.entries(dataToSearch).forEach(([menuTypeSlug, menuData]) => {
      if (!menuData || !menuData.categories) return;
      
      const menuTypeName = availableMenuTypes.find(mt => mt.id === menuTypeSlug)?.name || menuTypeSlug;
      
      menuData.categories.forEach(category => {
        category.items.forEach(item => {
          const matches = 
            item.name?.toLowerCase().includes(query) ||
            item.description?.toLowerCase().includes(query) ||
            (item.ingredients && item.ingredients.some(ing => ing.toLowerCase().includes(query)));
          
          if (matches) {
            results.push({
              ...item,
              _searchMeta: {
                menuTypeSlug,
                menuTypeName,
                categoryName: category.name,
                categoryId: category.id,
                isFromOtherMenuType: menuTypeSlug !== selectedMenuType,
              }
            });
          }
        });
      });
    });
    
    return results;
  }, [searchQuery, allMenuDataByType, ssrMenuDataByType, clientMenuData, selectedMenuType, availableMenuTypes]);

  // Функция для получения данных меню по типу
  const getMenuDataByType = (menuType) => {
    // 1) Если пришли данные с сервера (Supabase) — используем их
    if (ssrMenuDataByType && ssrMenuDataByType[menuType]) {
      return ssrMenuDataByType[menuType];
    }

    // 2) Если загружены данные на клиенте — используем их
    if (clientMenuData && clientMenuData[menuType]) {
      return clientMenuData[menuType];
    }

    // 3) Иначе используем локальные статики как fallback
    switch (menuType) {
      case 'main':
        return staticMenuData;
      case 'promotions':
        return staticPromotionsData;
      case 'kids':
        return staticKidsMenuData;
      case 'bar':
        return staticBarMenuData;
      case 'wine':
        return staticWineMenuData;
      default:
        return staticMenuData;
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
      // Сначала ищем в текущем типе меню
      if (selectedMenuType === 'main') {
        categories = searchMenuItems(searchQuery, categories);
      } else {
        categories = searchMenuItemsUniversal(searchQuery, categories);
      }
      
      // Если есть результаты глобального поиска, добавляем блюда из других типов меню
      if (searchAllMenuTypes.length > 0) {
        // Группируем результаты глобального поиска по категориям
        const otherMenuTypeItems = searchAllMenuTypes.filter(item => 
          item._searchMeta?.isFromOtherMenuType
        );
        
        if (otherMenuTypeItems.length > 0) {
          // Группируем блюда из других типов меню по их категориям
          const groupedByCategory = {};
          otherMenuTypeItems.forEach(item => {
            const categoryKey = `${item._searchMeta.menuTypeSlug}_${item._searchMeta.categoryId}`;
            if (!groupedByCategory[categoryKey]) {
              groupedByCategory[categoryKey] = {
                id: categoryKey,
                name: item._searchMeta.categoryName,
                items: [],
                _isSearchResult: true,
              };
            }
            groupedByCategory[categoryKey].items.push(item);
          });
          
          // Добавляем категории с блюдами из других типов меню в начало списка
          categories = [...Object.values(groupedByCategory), ...categories];
        }
      }
    }
    
    // Фильтр по категории (не применяем к результатам поиска из других типов меню)
    if (selectedCategory !== 'all') {
      categories = categories.filter(cat => 
        cat.id === selectedCategory || cat._isSearchResult
      );
    }
    
    return categories;
  }, [searchQuery, selectedCategory, selectedMenuType, searchAllMenuTypes]);

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

  // Получаем все названия блюд для автодополнения
  const allDishNames = useMemo(() => {
    const currentMenuData = getMenuDataByType(selectedMenuType);
    const categories = currentMenuData.categories || [];
    const names = [];
    categories.forEach(category => {
      category.items.forEach(item => {
        if (item.name && !names.includes(item.name)) {
          names.push(item.name);
        }
      });
    });
    return names.sort();
  }, [selectedMenuType]);

  // Получаем предложения для автодополнения
  const suggestions = useMemo(() => {
    if (searchQuery.length < 2) return [];
    const query = searchQuery.toLowerCase();
    return allDishNames
      .filter(name => name.toLowerCase().startsWith(query))
      .slice(0, 10); // Ограничиваем до 10 предложений
  }, [searchQuery, allDishNames]);

  const handleItemClick = (item) => {
    setSelectedItem(item);
    setIsDetailModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsDetailModalOpen(false);
    setSelectedItem(null);
  };
  
  const selectedMenuTypeData = availableMenuTypes.find(type => type.id === selectedMenuType) || 
    menuTypes.find(type => type.id === selectedMenuType);

  return (
    <section id="menu" className="py-8 sm:py-12 md:py-16 border-t border-white/10">
      <div className="container mx-auto px-4">
        <div className="flex flex-col items-center gap-3 mb-6 md:mb-8">
          <h2 className="text-center text-2xl sm:text-3xl md:text-4xl font-bold uppercase tracking-wider">
            Меню ресторана
          </h2>
          {enableAdminEditing && !adminLoading && isAdmin && (
            <div className="flex items-center gap-2 flex-wrap justify-center">
              <button
                type="button"
                onClick={() => setEditMode((v) => !v)}
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-medium transition-all ${
                  editMode
                    ? 'bg-amber-400 text-black border-amber-400'
                    : 'bg-white/5 text-neutral-200 border-white/20 hover:bg-white/10'
                }`}
              >
                <span>Режим редактирования меню</span>
                <span
                  className={`w-2 h-2 rounded-full ${
                    editMode ? 'bg-green-700' : 'bg-neutral-500'
                  }`}
                />
              </button>
              <button
                type="button"
                onClick={() => {
                  // Открываем модальное окно для добавления блюда
                  setSelectedItem({
                    id: 'new',
                    name: '',
                    description: '',
                    price: 0,
                    weight: '',
                    image_url: '',
                    category_id: allCategories.length > 0 ? allCategories[0]?.id : (currentMenuDataForFilter.categories?.[0]?.id || ''),
                  });
                  setIsDetailModalOpen(true);
                }}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500 text-white border border-green-500 hover:bg-green-600 text-xs font-medium transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Добавить блюдо</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  // Открываем модальное окно для управления типами меню и категориями
                  setSelectedItem({ id: 'manage-menu-types', type: 'menu-types' });
                  setIsDetailModalOpen(true);
                }}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500 text-white border border-blue-500 hover:bg-blue-600 text-xs font-medium transition-all"
              >
                <span>Управление типами меню и категориями</span>
              </button>
            </div>
          )}
        </div>

        {/* Выбор типа меню */}
        <div className="max-w-6xl mx-auto mb-6 sm:mb-8">
          <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
            {availableMenuTypes.map((type) => (
              <button
                key={type.id}
                onClick={() => type.id !== 'banquet' && handleMenuTypeChange(type.id)}
                disabled={type.id === 'banquet'}
                className={`px-4 py-3 rounded-full text-sm font-medium transition-all duration-200 ${
                  type.id === 'banquet'
                    ? 'bg-white/5 text-white/30 border border-white/10 cursor-not-allowed opacity-50'
                    : selectedMenuType === type.id
                    ? 'bg-amber-400 text-black shadow-lg hover:shadow-xl hover:scale-105 active:scale-95'
                    : 'bg-white/5 text-white hover:bg-white/10 hover:border-amber-400/30 border border-white/10 hover:scale-105 active:scale-95'
                }`}
              >
                {type.name}
              </button>
            ))}
          </div>
          
          {selectedMenuTypeData && (
            <div className="text-center text-neutral-400 text-sm mt-3">
              <p>{selectedMenuTypeData.description}</p>
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
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowSuggestions(e.target.value.length >= 2);
                }}
                onFocus={() => {
                  if (searchQuery.length >= 2) {
                    setShowSuggestions(true);
                  }
                }}
                onBlur={() => {
                  // Небольшая задержка, чтобы клик по предложению успел сработать
                  setTimeout(() => setShowSuggestions(false), 200);
                }}
                className="w-full pl-10 pr-4 py-3 bg-black/40 border border-white/10 rounded-lg outline-none transition-all duration-200 text-white placeholder-neutral-400"
              />
              {searchQuery && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setShowSuggestions(false);
                  }}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-neutral-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              
              {/* Автодополнение */}
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-neutral-900 border border-white/10 rounded-lg shadow-xl z-50 max-h-60 overflow-y-auto">
                  {suggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        setSearchQuery(suggestion);
                        setShowSuggestions(false);
                      }}
                      className="w-full text-left px-4 py-3 hover:bg-white/5 transition text-white"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
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
          <BusinessLunchBuilder 
            onAddToCart={onAddToCart}
            isAdmin={enableAdminEditing && isAdmin}
            enableAdminEditing={enableAdminEditing}
          />
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

                      <div className="grid grid-cols-2 sm:grid-cols-2 xl:grid-cols-4 gap-2 sm:gap-3 lg:gap-6">
                        {categoryItems.map((item) => (
                          <MenuItem
                            key={item.id}
                            item={item}
                            onAddToCart={onAddToCart}
                            onItemClick={handleItemClick}
                            cartItems={cartItems}
                            isAdmin={enableAdminEditing && isAdmin}
                            editMode={editMode}
                            allCategories={currentMenuDataForFilter.categories || []}
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
          isAdmin={enableAdminEditing && isAdmin}
          categories={allCategories.length > 0 ? allCategories : (currentMenuDataForFilter.categories || [])}
          onUpdate={() => {
            // Перезагружаем страницу для обновления данных
            window.location.reload();
          }}
          onDelete={() => {
            // Перезагружаем страницу для обновления данных
            window.location.reload();
          }}
        />
      )}
    </section>
  );
}

// Компонент отдельного блюда
function MenuItem({
  item,
  onAddToCart,
  onItemClick,
  cartItems = [],
  isAdmin = false,
  editMode = false,
  allCategories = [],
}) {
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
      
      // Проверяем максимальное количество (99)
      if (currentQty >= 99) {
        return; // Не добавляем, если уже достигнут максимум
      }
      
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
      
      // Проверяем максимальное количество (99)
      if (currentQty >= 99) {
        return; // Не добавляем, если уже достигнут максимум
      }
      
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

  // Admin local state (inline редактирование)
  const [adminName, setAdminName] = React.useState(item.name);
  const [adminPrice, setAdminPrice] = React.useState(item.price || 0);
  const [adminWeight, setAdminWeight] = React.useState(item.weight || '');
  const [adminImageUrl, setAdminImageUrl] = React.useState(item.image || '');
  const [adminCategoryId, setAdminCategoryId] = React.useState(item.categoryId || '');
  const [adminSaving, setAdminSaving] = React.useState(false);
  const [adminError, setAdminError] = React.useState('');
  const [deleted, setDeleted] = React.useState(false);

  const canEdit = isAdmin && editMode && !!item.id;

  const handleAdminSave = async (e) => {
    e.stopPropagation();
    try {
      setAdminSaving(true);
      setAdminError('');
      const supabase = createSupabaseBrowserClient();
      if (!supabase) {
        setAdminError('Supabase не настроен');
        setAdminSaving(false);
        return;
      }
      const { error } = await supabase
        .from('dishes')
        .update({
          name: adminName,
          price: adminPrice,
          weight: adminWeight,
          image_url: adminImageUrl,
          category_id: adminCategoryId || null,
        })
        .eq('id', item.id);
      if (error) {
        setAdminError(error.message);
      }
    } catch (err) {
      setAdminError(String(err?.message || err));
    } finally {
      setAdminSaving(false);
    }
  };

  const handleAdminDelete = async (e) => {
    e.stopPropagation();
    if (!window.confirm('Удалить это блюдо?')) return;
    try {
      const supabase = createSupabaseBrowserClient();
      if (!supabase) return;
      await supabase.from('dishes').delete().eq('id', item.id);
      setDeleted(true);
    } catch {
      // игнорируем, можно добавить ошибку
    }
  };

  if (deleted) return null;

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
      className="group overflow-hidden rounded-lg sm:rounded-xl lg:rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 hover:border-amber-400/30 transition-all duration-300 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] flex flex-col h-full cursor-pointer"
    >
      {/* Image */}
      <div className="relative aspect-square overflow-hidden">
        <img
          src={getFoodImage(item.id)}
          alt={item.name}
          className="w-full h-full object-cover transition-transform group-hover:scale-105"
        />
      </div>
      
      <div className="p-2 sm:p-3 lg:p-6 flex flex-col flex-grow">
        <div className="flex items-start justify-between gap-1.5 sm:gap-2 lg:gap-3 mb-1.5 sm:mb-2 lg:mb-3">
          {canEdit ? (
            <>
              <div className="flex-1 space-y-1">
                <input
                  value={adminName}
                  onChange={(e) => setAdminName(e.target.value)}
                  className="w-full bg-black/40 border border-white/20 rounded px-1.5 py-1 text-[10px] sm:text-xs lg:text-sm outline-none focus:border-amber-400"
                />
                <div className="flex items-center gap-2 text-[10px] sm:text-xs lg:text-sm">
                  <input
                    type="number"
                    min={0}
                    value={adminPrice}
                    onChange={(e) => setAdminPrice(Number(e.target.value || 0))}
                    className="w-20 bg-black/40 border border-white/20 rounded px-1.5 py-1 outline-none focus:border-amber-400"
                  />
                  <span className="text-neutral-300">₽</span>
                  <input
                    value={adminWeight}
                    onChange={(e) => setAdminWeight(e.target.value)}
                    placeholder="Вес"
                    className="flex-1 bg-black/40 border border-white/20 rounded px-1.5 py-1 outline-none focus:border-amber-400 text-[10px] sm:text-xs"
                  />
                </div>
              </div>
            </>
          ) : (
            <>
              <h4 className="text-xs sm:text-sm lg:text-lg font-semibold leading-tight flex-1">{item.name}</h4>
              <div className="text-right flex-shrink-0">
                <div className="text-xs sm:text-sm lg:text-lg font-bold text-amber-400 whitespace-nowrap">
                  {item.price ? item.price.toLocaleString('ru-RU') : '0'} ₽
                </div>
                {item.weight && (
                  <div className="text-[9px] sm:text-[10px] lg:text-xs text-neutral-400">{item.weight}</div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Description with fixed height */}
        <div className="flex-grow mb-1.5 sm:mb-2 lg:mb-4">
          {item.description && !canEdit && (
            <p className="text-neutral-300 text-[10px] sm:text-xs lg:text-sm leading-relaxed line-clamp-2 h-8 sm:h-10 lg:h-16 overflow-hidden">
              {item.description}
            </p>
          )}
        </div>

        {/* Варианты для блюд с вариантами (например, Цезарь) */}
        {item.variants && Array.isArray(item.variants) && item.variants.length > 0 && (
          <div className="mb-2 sm:mb-3 lg:mb-4">
            <div className="text-[10px] sm:text-xs lg:text-sm text-neutral-400 mb-1.5 sm:mb-2 lg:mb-3">Выберите вариант:</div>
            <div className="space-y-1 sm:space-y-2 max-h-24 sm:max-h-28 lg:max-h-32 overflow-y-auto">
              {item.variants.map((variant, index) => {
                const variantId = `${item.id}_${variant.name}`;
                const variantQuantity = getVariantQuantity(variantId);
                return (
                  <div key={index} className="flex justify-between items-center p-1.5 sm:p-2 bg-white/5 rounded-lg">
                    <div className="flex-1 min-w-0">
                      <div className="text-[10px] sm:text-xs lg:text-sm font-medium text-white truncate">{variant.name || 'Вариант'}</div>
                      <div className="text-[9px] sm:text-[10px] lg:text-xs text-neutral-400">{variant.weight || item.weight}</div>
                    </div>
                    <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                      <span className="text-[10px] sm:text-xs lg:text-sm text-amber-400 font-semibold">
                        {variant.price ? variant.price.toLocaleString('ru-RU') : '0'} ₽
                      </span>
                      {variantQuantity === 0 ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAdd(variant);
                          }}
                          className="px-2 sm:px-3 py-0.5 sm:py-1 text-[9px] sm:text-xs rounded-full bg-amber-400 text-black font-semibold hover:bg-amber-300 hover:scale-105 active:scale-95 transition-all duration-200 whitespace-nowrap"
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
                            className="p-1 rounded-full border border-white/20 hover:border-amber-400/50 hover:scale-110 active:scale-95 transition-all duration-200"
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
                            disabled={variantQuantity >= 99}
                            className="p-1 rounded-full bg-amber-400 text-black hover:bg-amber-300 hover:scale-110 active:scale-95 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
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

        {/* Кнопки управления количеством - только для блюд без вариантов, когда не в режиме админа */}
        {(!item.variants || !Array.isArray(item.variants) || item.variants.length === 0) && !canEdit && (
          <div className="mt-auto">
            <div className="flex items-center justify-between">
            {quantity === 0 ? (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleAdd();
                }}
                className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm rounded-full bg-amber-400 text-black font-semibold hover:bg-amber-300 hover:scale-105 active:scale-95 transition-all duration-200 shadow-md hover:shadow-lg"
              >
                Добавить
              </button>
            ) : (
              <div className="flex items-center gap-2 sm:gap-3">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemove();
                  }}
                  className="p-1.5 sm:p-2 rounded-full border border-white/20 hover:border-amber-400/50 hover:scale-110 active:scale-95 transition-all duration-200"
                  aria-label="Убавить"
                >
                  <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                  </svg>
                </button>
                <span className="w-6 sm:w-8 text-center text-sm sm:text-base font-semibold">{quantity}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAdd();
                  }}
                  disabled={quantity >= 99}
                  className="p-1.5 sm:p-2 rounded-full bg-amber-400 text-black hover:bg-amber-300 hover:scale-110 active:scale-95 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                  aria-label="Добавить"
                >
                  <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </button>
              </div>
            )}
            </div>
          </div>
        )}

        {/* Admin inline controls */}
        {canEdit && (
          <div className="mt-2 border-t border-white/10 pt-2 space-y-2">
            <div className="text-[10px] text-neutral-400">
              ID блюда: {item.id.slice(0, 8)}…
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-neutral-400">URL изображения</label>
              <input
                value={adminImageUrl}
                onChange={(e) => setAdminImageUrl(e.target.value)}
                placeholder="https://... или /local-image.webp"
                className="w-full bg-black/40 border border-white/20 rounded px-1.5 py-1 text-[10px] outline-none focus:border-amber-400"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-neutral-400">Категория</label>
              <select
                value={adminCategoryId}
                onChange={(e) => setAdminCategoryId(e.target.value)}
                className="bg-black/40 border border-white/20 rounded px-1.5 py-1 text-[10px] outline-none focus:border-amber-400"
              >
                <option value="">Без категории</option>
                {allCategories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            {adminError && (
              <div className="text-[10px] text-red-400 bg-red-500/10 border border-red-500/30 rounded px-1.5 py-1">
                {adminError}
              </div>
            )}
            <div className="flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={handleAdminSave}
                disabled={adminSaving}
                className="flex-1 px-2 py-1 rounded-full bg-amber-400 text-black text-[11px] font-semibold hover:bg-amber-300 disabled:opacity-60"
              >
                {adminSaving ? 'Сохранение...' : 'Сохранить'}
              </button>
              <button
                type="button"
                onClick={handleAdminDelete}
                className="px-2 py-1 rounded-full bg-red-500/20 text-red-300 text-[11px] hover:bg-red-500/30"
              >
                Удалить
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
