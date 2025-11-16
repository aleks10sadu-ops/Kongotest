'use client';

import React, { useState, useEffect } from 'react';
import { X, Plus, Edit2, Save, Trash2, Eye, EyeOff } from 'lucide-react';
import { createSupabaseBrowserClient } from '../../lib/supabase/client';

export default function ContentManager({ category, isOpen, onClose }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingPost, setEditingPost] = useState(null);
  const [newPost, setNewPost] = useState({
    title: '',
    slug: '',
    content: '',
    excerpt: '',
    image_url: '',
    is_published: true,
  });

  const categoryNames = {
    vacancies: 'Вакансии',
    events: 'События',
    blog: 'Новостной блог',
    halls: 'Залы',
  };

  useEffect(() => {
    if (isOpen) {
      loadPosts();
    }
  }, [isOpen, category]);

  const loadPosts = async () => {
    setLoading(true);
    try {
      const supabase = createSupabaseBrowserClient();
      if (!supabase) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('content_posts')
        .select('*')
        .eq('category', category)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading posts:', error);
        setPosts([]);
      } else {
        setPosts(data || []);
      }
    } catch (err) {
      console.error('Error:', err);
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  const generateSlug = (title) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const handleSave = async (post) => {
    try {
      const supabase = createSupabaseBrowserClient();
      if (!supabase) return;

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert('Необходимо войти в систему');
        return;
      }

      if (!post.title.trim() || !post.content.trim()) {
        alert('Заголовок и содержание обязательны');
        return;
      }

      const slug = post.slug || generateSlug(post.title);

      if (post.id) {
        // Обновление
        const { error } = await supabase
          .from('content_posts')
          .update({
            title: post.title,
            slug: slug,
            content: post.content,
            excerpt: post.excerpt || null,
            image_url: post.image_url || null,
            is_published: post.is_published,
            updated_at: new Date().toISOString(),
          })
          .eq('id', post.id);

        if (error) {
          alert('Ошибка сохранения: ' + error.message);
          return;
        }
      } else {
        // Создание
        const { error } = await supabase
          .from('content_posts')
          .insert({
            category: category,
            title: post.title,
            slug: slug,
            content: post.content,
            excerpt: post.excerpt || null,
            image_url: post.image_url || null,
            is_published: post.is_published,
            published_at: post.is_published ? new Date().toISOString() : null,
            created_by: user.id,
          });

        if (error) {
          alert('Ошибка создания: ' + error.message);
          return;
        }
      }

      setEditingPost(null);
      setNewPost({
        title: '',
        slug: '',
        content: '',
        excerpt: '',
        image_url: '',
        is_published: true,
      });
      loadPosts();
    } catch (err) {
      alert('Ошибка: ' + String(err?.message || err));
    }
  };

  const handleDelete = async (postId) => {
    if (!window.confirm('Удалить эту запись?')) return;
    try {
      const supabase = createSupabaseBrowserClient();
      if (!supabase) return;

      const { error } = await supabase
        .from('content_posts')
        .delete()
        .eq('id', postId);

      if (error) {
        alert('Ошибка удаления: ' + error.message);
        return;
      }

      loadPosts();
    } catch (err) {
      alert('Ошибка: ' + String(err?.message || err));
    }
  };

  const handleTogglePublish = async (post) => {
    try {
      const supabase = createSupabaseBrowserClient();
      if (!supabase) return;

      const { error } = await supabase
        .from('content_posts')
        .update({
          is_published: !post.is_published,
          published_at: !post.is_published ? new Date().toISOString() : post.published_at,
        })
        .eq('id', post.id);

      if (error) {
        alert('Ошибка: ' + error.message);
        return;
      }

      loadPosts();
    } catch (err) {
      alert('Ошибка: ' + String(err?.message || err));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="bg-neutral-900 border border-white/10 rounded-xl max-w-6xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-neutral-900 border-b border-white/10 p-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold">Управление: {categoryNames[category]}</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {loading ? (
            <div className="text-center py-12 text-neutral-400">Загрузка...</div>
          ) : (
            <>
              {/* Форма добавления/редактирования */}
              {(editingPost || (!editingPost && newPost.title)) && (
                <div className="p-4 bg-white/5 border border-white/10 rounded-lg">
                  <h3 className="text-lg font-bold mb-3">
                    {editingPost ? 'Редактировать запись' : 'Добавить новую запись'}
                  </h3>
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={editingPost?.title || newPost.title}
                      onChange={(e) => {
                        if (editingPost) {
                          setEditingPost({ ...editingPost, title: e.target.value });
                        } else {
                          setNewPost({ ...newPost, title: e.target.value });
                        }
                      }}
                      placeholder="Заголовок"
                      className="w-full bg-black/40 border border-white/20 rounded px-3 py-2 text-sm outline-none focus:border-amber-400"
                    />
                    <input
                      type="text"
                      value={editingPost?.slug || newPost.slug || generateSlug(editingPost?.title || newPost.title)}
                      onChange={(e) => {
                        if (editingPost) {
                          setEditingPost({ ...editingPost, slug: e.target.value });
                        } else {
                          setNewPost({ ...newPost, slug: e.target.value });
                        }
                      }}
                      placeholder="Slug (URL)"
                      className="w-full bg-black/40 border border-white/20 rounded px-3 py-2 text-sm outline-none focus:border-amber-400"
                    />
                    <input
                      type="text"
                      value={editingPost?.excerpt || newPost.excerpt}
                      onChange={(e) => {
                        if (editingPost) {
                          setEditingPost({ ...editingPost, excerpt: e.target.value });
                        } else {
                          setNewPost({ ...newPost, excerpt: e.target.value });
                        }
                      }}
                      placeholder="Краткое описание (необязательно)"
                      className="w-full bg-black/40 border border-white/20 rounded px-3 py-2 text-sm outline-none focus:border-amber-400"
                    />
                    <input
                      type="text"
                      value={editingPost?.image_url || newPost.image_url}
                      onChange={(e) => {
                        if (editingPost) {
                          setEditingPost({ ...editingPost, image_url: e.target.value });
                        } else {
                          setNewPost({ ...newPost, image_url: e.target.value });
                        }
                      }}
                      placeholder="URL изображения (необязательно)"
                      className="w-full bg-black/40 border border-white/20 rounded px-3 py-2 text-sm outline-none focus:border-amber-400"
                    />
                    <textarea
                      value={editingPost?.content || newPost.content}
                      onChange={(e) => {
                        if (editingPost) {
                          setEditingPost({ ...editingPost, content: e.target.value });
                        } else {
                          setNewPost({ ...newPost, content: e.target.value });
                        }
                      }}
                      placeholder="Содержание (HTML поддерживается)"
                      rows={10}
                      className="w-full bg-black/40 border border-white/20 rounded px-3 py-2 text-sm outline-none focus:border-amber-400 font-mono"
                    />
                    <div className="flex items-center gap-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={editingPost?.is_published ?? newPost.is_published}
                          onChange={(e) => {
                            if (editingPost) {
                              setEditingPost({ ...editingPost, is_published: e.target.checked });
                            } else {
                              setNewPost({ ...newPost, is_published: e.target.checked });
                            }
                          }}
                          className="rounded"
                        />
                        <span className="text-sm">Опубликовано</span>
                      </label>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            handleSave(editingPost || newPost);
                          }}
                          className="px-4 py-2 rounded bg-amber-400 text-black font-semibold hover:bg-amber-300 text-sm"
                        >
                          <Save className="w-4 h-4 inline mr-1" />
                          Сохранить
                        </button>
                        <button
                          onClick={() => {
                            setEditingPost(null);
                            setNewPost({
                              title: '',
                              slug: '',
                              content: '',
                              excerpt: '',
                              image_url: '',
                              is_published: true,
                            });
                          }}
                          className="px-4 py-2 rounded bg-white/10 text-white text-sm"
                        >
                          Отмена
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Кнопка добавления новой записи */}
              {!editingPost && !newPost.title && (
                <button
                  onClick={() => setNewPost({ ...newPost, title: ' ' })}
                  className="w-full px-4 py-3 rounded-lg bg-green-500 text-white font-semibold hover:bg-green-600 transition"
                >
                  <Plus className="w-4 h-4 inline mr-2" />
                  Добавить новую запись
                </button>
              )}

              {/* Список записей */}
              <div className="space-y-3">
                {posts.length === 0 ? (
                  <div className="text-center py-12 text-neutral-400">
                    Записей пока нет
                  </div>
                ) : (
                  posts.map((post) => (
                    <div key={post.id} className="p-4 bg-black/40 border border-white/10 rounded-lg">
                      {editingPost?.id === post.id ? null : (
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="font-semibold">{post.title}</h4>
                              {!post.is_published && (
                                <span className="px-2 py-0.5 rounded bg-neutral-700 text-xs text-neutral-300">
                                  Черновик
                                </span>
                              )}
                            </div>
                            {post.excerpt && (
                              <p className="text-sm text-neutral-400 mb-2">{post.excerpt}</p>
                            )}
                            <p className="text-xs text-neutral-500">
                              Slug: {post.slug} | Создано: {new Date(post.created_at).toLocaleDateString('ru-RU')}
                            </p>
                          </div>
                          <div className="flex gap-2 ml-4">
                            <button
                              onClick={() => handleTogglePublish(post)}
                              className="p-1.5 rounded hover:bg-white/10 text-amber-400"
                              title={post.is_published ? 'Снять с публикации' : 'Опубликовать'}
                            >
                              {post.is_published ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                            </button>
                            <button
                              onClick={() => setEditingPost(post)}
                              className="p-1.5 rounded hover:bg-white/10 text-amber-400"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(post.id)}
                              className="p-1.5 rounded hover:bg-red-500/20 text-red-400"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

