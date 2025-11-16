'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { createSupabaseBrowserClient } from '../../lib/supabase/client';
import ContentManager from '../components/ContentManager';

// Вспомогательная функция для проверки валидности URL для Next.js Image
const isValidImageUrl = (url) => {
  if (!url || typeof url !== 'string') return false;
  // Должен быть абсолютный URL (http:// или https://) или относительный путь, начинающийся с /
  return url.startsWith('http://') || url.startsWith('https://') || url.startsWith('/');
};

export default function BlogPage() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminLoading, setAdminLoading] = useState(true);
  const [showContentManager, setShowContentManager] = useState(false);

  useEffect(() => {
    loadPosts();
    checkAdmin();

    // Realtime синхронизация
    const supabase = createSupabaseBrowserClient();
    if (!supabase) return;

    const channel = supabase
      .channel('content-posts-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'content_posts',
          filter: `category=eq.blog`,
        },
        () => {
          loadPosts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const checkAdmin = async () => {
    try {
      const supabase = createSupabaseBrowserClient();
      if (!supabase) {
        setAdminLoading(false);
        return;
      }
      const { data: { user } } = await supabase.auth.getUser();
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
        .eq('category', 'blog')
        .eq('is_published', true)
        .order('published_at', { ascending: false })
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

  return (
    <div className="bg-neutral-950 text-white min-h-screen">
      <div className="container mx-auto px-4 py-20">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <Link href="/" className="inline-block text-amber-400 hover:text-amber-300 transition-colors">
              ← Вернуться на главную
            </Link>
            {!adminLoading && isAdmin && (
              <button
                onClick={() => setShowContentManager(true)}
                className="px-4 py-2 rounded-full bg-amber-400 text-black font-semibold hover:bg-amber-300 transition"
              >
                Управление блогом
              </button>
            )}
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold mb-12">Новостной блог</h1>
          
          {loading ? (
            <div className="text-center py-12 text-neutral-400">Загрузка...</div>
          ) : posts.length === 0 ? (
            <div className="text-center py-12 text-neutral-400">
              <p>Новости будут добавлены позже</p>
            </div>
          ) : (
            <div className="space-y-8">
              {posts.map((post) => (
                <article key={post.id} className="rounded-2xl overflow-hidden border border-white/10 bg-white/5">
                  {post.image_url && isValidImageUrl(post.image_url) && (
                    <div className="relative w-full h-64 md:h-96">
                      <Image
                        src={post.image_url}
                        alt={post.title}
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}
                  <div className="p-6 md:p-8">
                    <h2 className="text-2xl md:text-3xl font-bold mb-4">{post.title}</h2>
                    {post.excerpt && (
                      <p className="text-lg text-neutral-300 mb-4">{post.excerpt}</p>
                    )}
                    <div 
                      className="prose prose-invert max-w-none text-neutral-200"
                      dangerouslySetInnerHTML={{ __html: post.content }}
                    />
                    {post.published_at && (
                      <p className="text-sm text-neutral-500 mt-4">
                        {new Date(post.published_at).toLocaleDateString('ru-RU', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>

      {showContentManager && (
        <ContentManager
          category="blog"
          isOpen={showContentManager}
          onClose={() => {
            setShowContentManager(false);
            loadPosts();
          }}
        />
      )}
    </div>
  );
}
