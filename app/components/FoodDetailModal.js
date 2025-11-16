'use client';

import React, { useState, useEffect } from 'react';
import { X, Plus, Minus, Star, Clock, Scale, Edit2, Save, Trash2 } from 'lucide-react';
import { getFoodImage } from '../data/foodImages';
import { createSupabaseBrowserClient } from '../../lib/supabase/client';
import MenuTypesAndCategoriesManager from './MenuTypesAndCategoriesManager';

export default function FoodDetailModal({ item, isOpen, onClose, onAddToCart, cartItems = [], isAdmin = false, categories = [], onUpdate, onDelete }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(item?.name || '');
  const [editDescription, setEditDescription] = useState(item?.description || '');
  const [editPrice, setEditPrice] = useState(item?.price || 0);
  const [editWeight, setEditWeight] = useState(item?.weight || '');
  const [editImageUrl, setEditImageUrl] = useState(item?.image_url || item?.image || '');
  const [editCategoryId, setEditCategoryId] = useState(item?.category_id || item?.categoryId || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [deleted, setDeleted] = useState(false);

  useEffect(() => {
    if (item) {
      setEditName(item.name || '');
      setEditDescription(item.description || '');
      setEditPrice(item.price || 0);
      setEditWeight(item.weight || '');
      setEditImageUrl(item.image_url || item.image || '');
      setEditCategoryId(item.category_id || item.categoryId || '');
      // Если это новое блюдо, сразу открываем режим редактирования
      setIsEditing(item.id === 'new');
      setError('');
    }
  }, [item, isAdmin]);

  // Если это управление типами меню и категориями
  if (item?.id === 'manage-menu-types' && item?.type === 'menu-types') {
    return <MenuTypesAndCategoriesManager isOpen={isOpen} onClose={onClose} />;
  }

  if (!isOpen || !item || deleted) return null;

  // Получаем количество из корзины напрямую
  const cartItem = cartItems.find(ci => ci.id === item.id);
  const quantity = cartItem?.qty || 0;
  
  // Получаем количество вариантов из корзины
  const getVariantQuantity = (variantId) => {
    const cartVariant = cartItems.find(ci => ci.id === variantId);
    return cartVariant?.qty || 0;
  };

  // Функция для проверки валидности UUID
  const isValidUUID = (str) => {
    if (!str || typeof str !== 'string') return false;
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(str);
  };

  const handleSave = async () => {
    if (!item.id) return;
    setSaving(true);
    setError('');
    try {
      const supabase = createSupabaseBrowserClient();
      if (!supabase) {
        setError('Supabase не настроен');
        setSaving(false);
        return;
      }

      // Проверка валидности данных
      if (!editName.trim()) {
        setError('Название блюда обязательно');
        setSaving(false);
        return;
      }
      if (editPrice <= 0) {
        setError('Цена должна быть больше 0');
        setSaving(false);
        return;
      }
      if (!editCategoryId) {
        setError('Необходимо выбрать категорию');
        setSaving(false);
        return;
      }
      
      // Валидация UUID для category_id
      if (!isValidUUID(editCategoryId)) {
        setError('Неверный формат категории. Пожалуйста, выберите категорию из списка.');
        setSaving(false);
        return;
      }

      // Если это новое блюдо (id === 'new')
      if (item.id === 'new') {
        const { data: newDish, error: insertError } = await supabase
          .from('dishes')
          .insert({
            name: editName,
            description: editDescription,
            price: editPrice,
            weight: editWeight,
            image_url: editImageUrl,
            category_id: editCategoryId,
            is_active: true,
          })
          .select()
          .single();

        if (insertError) {
          setError(insertError.message);
          setSaving(false);
          return;
        }

        setIsEditing(false);
        if (onUpdate) {
          onUpdate(newDish);
        }
        // Перезагружаем страницу для обновления данных
        window.location.reload();
        return;
      }

      // Обновление существующего блюда
      // Валидация UUID для category_id (если указан)
      const categoryIdToUpdate = editCategoryId && isValidUUID(editCategoryId) ? editCategoryId : null;
      
      const { error: updateError } = await supabase
        .from('dishes')
        .update({
          name: editName,
          description: editDescription,
          price: editPrice,
          weight: editWeight,
          image_url: editImageUrl,
          category_id: categoryIdToUpdate,
        })
        .eq('id', item.id);

      if (updateError) {
        setError(updateError.message);
        setSaving(false);
        return;
      }

      setIsEditing(false);
      if (onUpdate) {
        onUpdate({
          ...item,
          name: editName,
          description: editDescription,
          price: editPrice,
          weight: editWeight,
          image_url: editImageUrl,
          category_id: editCategoryId,
        });
      }
      // Перезагружаем страницу для обновления данных
      window.location.reload();
    } catch (err) {
      setError(String(err?.message || err));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!item.id || !window.confirm('Удалить это блюдо?')) return;
    try {
      const supabase = createSupabaseBrowserClient();
      if (!supabase) return;

      const { error: deleteError } = await supabase
        .from('dishes')
        .delete()
        .eq('id', item.id);

      if (deleteError) {
        setError(deleteError.message);
        return;
      }

      setDeleted(true);
      if (onDelete) {
        onDelete(item.id);
      }
      setTimeout(() => {
        onClose();
        window.location.reload();
      }, 500);
    } catch (err) {
      setError(String(err?.message || err));
    }
  };

  const handleAdd = (variant = null) => {
    if (variant) {
      const variantId = `${item.id}_${variant.name}`;
      const cartVariant = cartItems.find(ci => ci.id === variantId);
      const currentQty = cartVariant?.qty || 0;
      
      if (currentQty >= 99) return;
      
      const newQuantity = currentQty + 1;
      
      onAddToCart({
        id: variantId,
        name: `${item.name} (${variant.name})`,
        price: variant.price || 0,
        weight: variant.weight || item.weight,
        description: item.description,
        img: editImageUrl || getFoodImage(item.id),
        qty: newQuantity
      });
    } else {
      const cartItem = cartItems.find(ci => ci.id === item.id);
      const currentQty = cartItem?.qty || 0;
      
      if (currentQty >= 99) return;
      
      const newQuantity = currentQty + 1;
      
      onAddToCart({
        id: item.id,
        name: item.name,
        price: item.price || 0,
        weight: item.weight,
        description: item.description,
        img: editImageUrl || getFoodImage(item.id),
        qty: newQuantity
      });
    }
  };

  const handleRemove = (variant = null) => {
    if (variant) {
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
          img: editImageUrl || getFoodImage(item.id),
          qty: newQuantity
        });
      }
    } else {
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
          img: editImageUrl || getFoodImage(item.id),
          qty: newQuantity
        });
      }
    }
  };

  const displayImage = editImageUrl || getFoodImage(item.id);
  const displayName = isEditing ? editName : item.name;
  const displayDescription = isEditing ? editDescription : (item.description || 'Описание блюда будет добавлено в ближайшее время.');
  const displayPrice = isEditing ? editPrice : (item.price || 0);
  const displayWeight = isEditing ? editWeight : item.weight;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
        onClick={onClose}
      />
      
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-neutral-950 rounded-2xl border border-white/10 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div className="flex items-center gap-3 flex-1">
            {isEditing ? (
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="flex-1 bg-black/40 border border-white/20 rounded-lg px-3 py-2 text-2xl font-bold outline-none focus:border-amber-400"
                placeholder="Название блюда"
              />
            ) : (
              <h2 className="text-2xl font-bold">{item.name}</h2>
            )}
            {isAdmin && !isEditing && item.id !== 'new' && (
              <button
                onClick={() => setIsEditing(true)}
                className="p-2 rounded-full hover:bg-white/10 transition text-amber-400"
                aria-label="Редактировать"
              >
                <Edit2 className="w-5 h-5" />
              </button>
            )}
            {isAdmin && item.id === 'new' && (
              <span className="text-xs text-amber-400 bg-amber-400/10 px-2 py-1 rounded">Новое блюдо</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {isAdmin && isEditing && (
              <>
                <button
                  onClick={handleSave}
                  disabled={saving || !editName.trim()}
                  className="p-2 rounded-full bg-amber-400 text-black hover:bg-amber-300 transition disabled:opacity-50"
                  aria-label="Сохранить"
                >
                  <Save className="w-5 h-5" />
                </button>
                {item.id !== 'new' && (
                  <button
                    onClick={handleDelete}
                    className="p-2 rounded-full bg-red-500/20 text-red-300 hover:bg-red-500/30 transition"
                    aria-label="Удалить"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                )}
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setError('');
                    // Восстанавливаем значения
                    setEditName(item.name || '');
                    setEditDescription(item.description || '');
                    setEditPrice(item.price || 0);
                    setEditWeight(item.weight || '');
                    setEditImageUrl(item.image_url || item.image || '');
                    setEditCategoryId(item.category_id || item.categoryId || '');
                  }}
                  className="p-2 rounded-full hover:bg-white/10 transition"
                  aria-label="Отмена"
                >
                  <X className="w-5 h-5" />
                </button>
              </>
            )}
            {!isEditing && (
              <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-white/10 transition"
                aria-label="Закрыть"
              >
                <X className="w-6 h-6" />
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-140px)]">
          {error && (
            <div className="mx-6 mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
            {/* Image */}
            <div className="space-y-4">
              <div className="aspect-square rounded-xl overflow-hidden bg-white/5">
                <img
                  src={displayImage}
                  alt={displayName}
                  className="w-full h-full object-cover"
                />
              </div>
              {isEditing && (
                <div className="space-y-2">
                  <label className="block text-sm text-neutral-300">URL изображения</label>
                  <input
                    type="text"
                    value={editImageUrl}
                    onChange={(e) => setEditImageUrl(e.target.value)}
                    placeholder="https://... или /local-image.webp"
                    className="w-full bg-black/40 border border-white/20 rounded-lg px-3 py-2 outline-none focus:border-amber-400 text-sm"
                  />
                </div>
              )}
              
              {/* Price and Weight */}
              <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                <div className="flex items-center gap-4">
                  {isEditing ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={0}
                        step="0.01"
                        value={editPrice}
                        onChange={(e) => setEditPrice(Number(e.target.value || 0))}
                        className="w-32 bg-black/40 border border-white/20 rounded-lg px-3 py-2 text-2xl font-bold text-amber-400 outline-none focus:border-amber-400"
                      />
                      <span className="text-2xl font-bold text-amber-400">₽</span>
                    </div>
                  ) : (
                    <div className="text-2xl font-bold text-amber-400">
                      {displayPrice.toLocaleString('ru-RU')} ₽
                    </div>
                  )}
                  {isEditing ? (
                    <input
                      type="text"
                      value={editWeight}
                      onChange={(e) => setEditWeight(e.target.value)}
                      placeholder="Вес"
                      className="w-24 bg-black/40 border border-white/20 rounded-lg px-2 py-1 text-neutral-400 outline-none focus:border-amber-400 text-sm"
                    />
                  ) : (
                    displayWeight && (
                      <div className="flex items-center gap-1 text-neutral-400">
                        <Scale className="w-4 h-4" />
                        <span>{displayWeight}</span>
                      </div>
                    )
                  )}
                </div>
                {!isEditing && (
                  <div className="flex items-center gap-1 text-amber-400">
                    <Star className="w-4 h-4 fill-current" />
                    <span className="text-sm font-medium">Рекомендуем</span>
                  </div>
                )}
              </div>
            </div>

            {/* Details */}
            <div className="space-y-6">
              {/* Description */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Описание</h3>
                {isEditing ? (
                  <textarea
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    rows={4}
                    className="w-full bg-black/40 border border-white/20 rounded-lg px-3 py-2 text-neutral-300 leading-relaxed outline-none focus:border-amber-400 resize-none"
                    placeholder="Описание блюда"
                  />
                ) : (
                  <p className="text-neutral-300 leading-relaxed">
                    {displayDescription}
                  </p>
                )}
              </div>

              {/* Category (only in edit mode) */}
              {isEditing && categories.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-3">Категория</h3>
                  <select
                    value={editCategoryId}
                    onChange={(e) => setEditCategoryId(e.target.value)}
                    className="w-full bg-black/40 border border-white/20 rounded-lg px-3 py-2 text-neutral-300 outline-none focus:border-amber-400"
                  >
                    <option value="">Без категории</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Variants */}
              {item.variants && Array.isArray(item.variants) && item.variants.length > 0 && !isEditing && item.id !== 'new' && (
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

              {/* Add to Cart - only for items without variants and not in edit mode, and not new items */}
              {(!item.variants || !Array.isArray(item.variants) || item.variants.length === 0) && !isEditing && item.id !== 'new' && (
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
              {!isEditing && (
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
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
