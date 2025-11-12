'use client';

import React, { useState, useMemo } from 'react';
import { Plus, Minus, Check, AlertCircle } from 'lucide-react';
import { businessLunchData, getTodayMenu, getDishesByType } from '../data/businessLunchData';

export default function BusinessLunchBuilder({ onAddToCart }) {
  const [selectedSet, setSelectedSet] = useState(null);
  const [selectedDishes, setSelectedDishes] = useState({});
  const [selectedSide, setSelectedSide] = useState('');
  const [selectedDrink, setSelectedDrink] = useState('');
  const [quantity, setQuantity] = useState(1);

  const todayMenu = useMemo(() => getTodayMenu(), []);
  const salads = useMemo(() => getDishesByType(todayMenu, 'САЛАТ'), [todayMenu]);
  const firstCourses = useMemo(() => getDishesByType(todayMenu, 'ПЕРВОЕ'), [todayMenu]);
  const secondCourses = useMemo(() => getDishesByType(todayMenu, 'ВТОРОЕ'), [todayMenu]);

  const selectedSetData = useMemo(() => {
    return businessLunchData.business_lunch_sets.find(set => set.id === selectedSet);
  }, [selectedSet]);

  // Проверка, все ли необходимые блюда выбраны
  const isComplete = useMemo(() => {
    if (!selectedSetData) return false;
    
    const requiredCourses = selectedSetData.courses;
    const hasAllCourses = requiredCourses.every(course => {
      if (course === 'САЛАТ') return selectedDishes['САЛАТ'];
      if (course === 'ПЕРВОЕ') return selectedDishes['ПЕРВОЕ'];
      if (course === 'ВТОРОЕ') return selectedDishes['ВТОРОЕ'];
      return false;
    });

    return hasAllCourses && selectedSide && selectedDrink;
  }, [selectedSetData, selectedDishes, selectedSide, selectedDrink]);

  const handleSetSelect = (setId) => {
    setSelectedSet(setId);
    setSelectedDishes({});
    setSelectedSide('');
    setSelectedDrink('');
  };

  const handleDishSelect = (courseType, dish) => {
    setSelectedDishes(prev => ({
      ...prev,
      [courseType]: dish
    }));
  };

  const handleAddToCart = (e) => {
    // Предотвращаем всплытие события, чтобы не закрывать конструктор
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    if (!isComplete || !selectedSetData) return;

    const dishesList = [];
    const dishesIds = [];
    
    // Собираем список блюд и их ID для создания уникального идентификатора
    Object.keys(selectedDishes).sort().forEach(courseType => {
      const dish = selectedDishes[courseType];
      dishesList.push(dish.name);
      dishesIds.push(`${courseType}:${dish.name}`);
    });

    // Формируем название бизнес-ланча
    const businessLunchName = `${selectedSetData.name}: ${dishesList.join(', ')}, гарнир: ${selectedSide}, напиток: ${selectedDrink}`;
    
    // Формируем описание
    const description = `Бизнес-ланч:\n${dishesList.map(d => `• ${d}`).join('\n')}\nГарнир: ${selectedSide}\nНапиток: ${selectedDrink}`;

    // Создаем детерминированный ID на основе содержимого бизнес-ланча
    // Это позволит объединять одинаковые наборы в один элемент корзины
    const contentHash = `${selectedSet}_${dishesIds.join('|')}_${selectedSide}_${selectedDrink}`;
    // Создаем простой хеш из строки для использования в ID
    const hash = contentHash.split('').reduce((acc, char) => {
      const hash = ((acc << 5) - acc) + char.charCodeAt(0);
      return hash & hash;
    }, 0);
    const itemId = `business_lunch_${Math.abs(hash)}`;

    // Добавляем один элемент с указанным количеством
    // Логика корзины автоматически объединит элементы с одинаковым ID
    onAddToCart({
      id: itemId,
      name: businessLunchName,
      price: selectedSetData.price,
      weight: 'Бизнес-ланч',
      description: description,
      qty: quantity, // Добавляем указанное количество
      isBusinessLunch: true,
      setType: selectedSetData.name,
      dishes: selectedDishes,
      side: selectedSide,
      drink: selectedDrink
    });

    // НЕ сбрасываем опции конструктора, чтобы пользователь мог 
    // добавить несколько одинаковых наборов в корзину без повторного выбора
    // Все выбранные опции (блюда, гарнир, напиток, количество, набор) остаются без изменений
  };

  const currentDayName = useMemo(() => {
    const days = {
      monday: 'Понедельник',
      tuesday: 'Вторник',
      wednesday: 'Среда',
      thursday: 'Четверг',
      friday: 'Пятница',
      saturday: 'Суббота',
      sunday: 'Воскресенье'
    };
    const today = new Date().toLocaleDateString('ru-RU', { weekday: 'long' });
    return today.charAt(0).toUpperCase() + today.slice(1);
  }, []);

  return (
    <div className="max-w-6xl mx-auto">
      {/* Информация о бизнес-ланче */}
      <div className="mb-8 p-6 bg-white/5 border border-white/10 rounded-xl">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
          <div>
            <h3 className="text-2xl font-bold mb-2">Бизнес-ланч</h3>
            <p className="text-neutral-300">{businessLunchData.promotion.description}</p>
            <p className="text-amber-400 text-sm mt-1">⚠️ {businessLunchData.promotion.note}</p>
            <p className="text-neutral-400 text-sm mt-1">Период: {businessLunchData.promotion.period}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-neutral-400 mb-2">Условия доставки:</p>
            <p className="text-amber-400 font-semibold">{businessLunchData.delivery.minimum_order}</p>
            <p className="text-neutral-300 text-sm mt-1">{businessLunchData.delivery.free_delivery}</p>
          </div>
        </div>
      </div>

      {/* Меню на сегодня */}
      <div className="mb-8 p-4 bg-amber-400/10 border border-amber-400/20 rounded-lg">
        <p className="text-amber-300 font-semibold">
          Меню на сегодня ({currentDayName})
        </p>
      </div>

      {/* Выбор сета */}
      <div className="mb-8">
        <h3 className="text-xl font-bold mb-4">Выберите набор:</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {businessLunchData.business_lunch_sets.map((set) => (
            <button
              key={set.id}
              onClick={() => handleSetSelect(set.id)}
              className={`p-4 rounded-xl border-2 transition-all ${
                selectedSet === set.id
                  ? 'border-amber-400 bg-amber-400/10'
                  : 'border-white/10 bg-white/5 hover:border-white/20'
              }`}
            >
              <div className="text-lg font-bold mb-2">{set.name}</div>
              <div className="text-amber-400 text-xl font-bold mb-2">{set.price} {set.currency}</div>
              <div className="text-sm text-neutral-400">
                {set.courses.join(' + ')}
              </div>
            </button>
          ))}
        </div>
      </div>

      {selectedSetData && (
        <div className="space-y-6">
          {/* Выбор блюд по курсам */}
          {selectedSetData.courses.map((course) => {
            let dishes = [];
            let courseLabel = '';
            
            if (course === 'САЛАТ') {
              dishes = salads;
              courseLabel = 'Салаты';
            } else if (course === 'ПЕРВОЕ') {
              dishes = firstCourses;
              courseLabel = 'Первые блюда';
            } else if (course === 'ВТОРОЕ') {
              dishes = secondCourses;
              courseLabel = 'Вторые блюда';
            }

            return (
              <div key={course} className="p-6 bg-white/5 border border-white/10 rounded-xl">
                <h4 className="text-lg font-bold mb-4">{courseLabel}</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {dishes.map((dish, index) => (
                    <button
                      key={index}
                      onClick={() => handleDishSelect(course, dish)}
                      className={`p-4 rounded-lg border-2 text-left transition-all ${
                        selectedDishes[course]?.name === dish.name
                          ? 'border-amber-400 bg-amber-400/10'
                          : 'border-white/10 bg-white/5 hover:border-white/20'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <div className="font-semibold mb-1">{dish.name}</div>
                          <div className="text-sm text-neutral-400">{dish.ingredients}</div>
                        </div>
                        {selectedDishes[course]?.name === dish.name && (
                          <Check className="w-5 h-5 text-amber-400 flex-shrink-0" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}

          {/* Выбор гарнира */}
          <div className="p-6 bg-white/5 border border-white/10 rounded-xl">
            <h4 className="text-lg font-bold mb-4">{businessLunchData.sides.description}</h4>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {businessLunchData.sides.options.map((side) => (
                <button
                  key={side}
                  onClick={() => setSelectedSide(side)}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    selectedSide === side
                      ? 'border-amber-400 bg-amber-400/10'
                      : 'border-white/10 bg-white/5 hover:border-white/20'
                  }`}
                >
                  {side}
                </button>
              ))}
            </div>
          </div>

          {/* Выбор напитка */}
          <div className="p-6 bg-white/5 border border-white/10 rounded-xl">
            <h4 className="text-lg font-bold mb-4">{businessLunchData.drinks.description}</h4>
            <div className="grid grid-cols-3 gap-3">
              {businessLunchData.drinks.options.map((drink) => (
                <button
                  key={drink}
                  onClick={() => setSelectedDrink(drink)}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    selectedDrink === drink
                      ? 'border-amber-400 bg-amber-400/10'
                      : 'border-white/10 bg-white/5 hover:border-white/20'
                  }`}
                >
                  {drink}
                </button>
              ))}
            </div>
          </div>

          {/* Количество и кнопка добавления */}
          <div className="p-6 bg-white/5 border border-white/10 rounded-xl">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <span className="text-lg font-semibold">Количество:</span>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="p-2 rounded-full border border-white/20 hover:border-white/60 transition"
                    disabled={quantity <= 1}
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-12 text-center font-semibold text-lg">{quantity}</span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="p-2 rounded-full border border-white/20 hover:border-white/60 transition"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="text-sm text-neutral-400">Итого:</div>
                  <div className="text-2xl font-bold text-amber-400">
                    {selectedSetData.price * quantity} {selectedSetData.currency}
                  </div>
                </div>
                <button
                  onClick={handleAddToCart}
                  disabled={!isComplete}
                  className={`px-6 py-3 rounded-full font-semibold transition ${
                    isComplete
                      ? 'bg-amber-400 text-black hover:bg-amber-300'
                      : 'bg-white/10 text-white/50 cursor-not-allowed'
                  }`}
                >
                  {isComplete ? 'Добавить в корзину' : 'Выберите все позиции'}
                </button>
              </div>
            </div>

            {!isComplete && (
              <div className="mt-4 p-3 bg-amber-400/10 border border-amber-400/20 rounded-lg flex items-center gap-2 text-amber-300">
                <AlertCircle className="w-5 h-5" />
                <span className="text-sm">Пожалуйста, выберите все необходимые позиции для завершения заказа</span>
              </div>
            )}
          </div>
        </div>
      )}

      {!selectedSetData && (
        <div className="text-center py-12 text-neutral-400">
          <p>Выберите набор бизнес-ланча, чтобы начать</p>
        </div>
      )}
    </div>
  );
}

