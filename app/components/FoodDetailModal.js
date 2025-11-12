'use client';

import React from 'react';
import { X, Plus, Minus, Star, Clock, Scale } from 'lucide-react';
import { getFoodImage } from '../data/foodImages';

export default function FoodDetailModal({ item, isOpen, onClose, onAddToCart, cartItems = [] }) {
  if (!isOpen || !item) return null;

  // Получаем количество из корзины напрямую
  const cartItem = cartItems.find(ci => ci.id === item.id);
  const quantity = cartItem?.qty || 0;
  
  // Получаем количество вариантов из корзины
  const getVariantQuantity = (variantId) => {
    const cartVariant = cartItems.find(ci => ci.id === variantId);
    return cartVariant?.qty || 0;
  };

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-neutral-950 rounded-2xl border border-white/10 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <h2 className="text-2xl font-bold">{item.name}</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/10 transition"
            aria-label="Закрыть"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
            {/* Image */}
            <div className="space-y-4">
              <div className="aspect-square rounded-xl overflow-hidden">
                <img
                  src={getFoodImage(item.id)}
                  alt={item.name}
                  className="w-full h-full object-cover"
                />
              </div>
              
              {/* Price and Weight */}
              <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="text-2xl font-bold text-amber-400">
                    {item.price ? item.price.toLocaleString('ru-RU') : '0'} ₽
                  </div>
                  {item.weight && (
                    <div className="flex items-center gap-1 text-neutral-400">
                      <Scale className="w-4 h-4" />
                      <span>{item.weight}</span>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1 text-amber-400">
                  <Star className="w-4 h-4 fill-current" />
                  <span className="text-sm font-medium">Рекомендуем</span>
                </div>
              </div>
            </div>

            {/* Details */}
            <div className="space-y-6">
              {/* Description */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Описание</h3>
                <p className="text-neutral-300 leading-relaxed">
                  {item.description || 'Описание блюда будет добавлено в ближайшее время.'}
                </p>
              </div>

              {/* Variants */}
              {item.variants && Array.isArray(item.variants) && item.variants.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-3">Варианты</h3>
                  <div className="space-y-3">
                    {item.variants.map((variant, index) => {
                      const variantId = `${item.id}_${variant.name}`;
                      const variantQuantity = getVariantQuantity(variantId);
                      return (
                        <div key={index} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                          <div className="flex-1">
                            <div className="font-medium text-white">{variant.name}</div>
                            <div className="text-sm text-neutral-400">{variant.weight || item.weight}</div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-amber-400 font-semibold">
                              {variant.price ? variant.price.toLocaleString('ru-RU') : '0'} ₽
                            </span>
                            {variantQuantity === 0 ? (
                              <button
                                onClick={() => handleAdd(variant)}
                                className="px-4 py-2 text-sm rounded-full bg-amber-400 text-black font-semibold hover:bg-amber-300 transition"
                              >
                                Добавить
                              </button>
                            ) : (
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => handleRemove(variant)}
                                  className="p-2 rounded-full border border-white/20 hover:border-white/60 transition"
                                  aria-label="Убавить"
                                >
                                  <Minus className="w-4 h-4" />
                                </button>
                                <span className="w-8 text-center font-semibold">{variantQuantity}</span>
                                <button
                                  onClick={() => handleAdd(variant)}
                                  disabled={variantQuantity >= 99}
                                  className="p-2 rounded-full bg-amber-400 text-black hover:bg-amber-300 transition disabled:opacity-50 disabled:cursor-not-allowed"
                                  aria-label="Добавить"
                                >
                                  <Plus className="w-4 h-4" />
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

              {/* Add to Cart - only for items without variants */}
              {(!item.variants || !Array.isArray(item.variants) || item.variants.length === 0) && (
                <div className="pt-4 border-t border-white/10">
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-semibold">Добавить в корзину</span>
                    {quantity === 0 ? (
                      <button
                        onClick={() => handleAdd()}
                        className="px-6 py-3 rounded-full bg-amber-400 text-black font-semibold hover:bg-amber-300 transition"
                      >
                        Добавить
                      </button>
                    ) : (
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => handleRemove()}
                          className="p-3 rounded-full border border-white/20 hover:border-white/60 transition"
                          aria-label="Убавить"
                        >
                          <Minus className="w-5 h-5" />
                        </button>
                        <span className="w-12 text-center text-xl font-semibold">{quantity}</span>
                        <button
                          onClick={() => handleAdd()}
                          disabled={quantity >= 99}
                          className="p-3 rounded-full bg-amber-400 text-black hover:bg-amber-300 transition disabled:opacity-50 disabled:cursor-not-allowed"
                          aria-label="Добавить"
                        >
                          <Plus className="w-5 h-5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Additional Info */}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/10">
                <div className="flex items-center gap-2 text-sm text-neutral-400">
                  <Clock className="w-4 h-4" />
                  <span>Время приготовления: 15-25 мин</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-neutral-400">
                  <Star className="w-4 h-4" />
                  <span>Популярное блюдо</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
