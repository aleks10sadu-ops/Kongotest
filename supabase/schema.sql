-- Logical schema for Supabase (run via SQL editor / migrations in Supabase project)

-- 1. Menu types (main, promotions, kids, bar, wine, business, etc.)
create table if not exists public.menu_types (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text,
  is_business_lunch boolean default false,
  is_bar boolean default false,
  is_wine boolean default false,
  is_kids boolean default false,
  is_promo boolean default false,
  created_at timestamptz default now()
);

-- 2. Categories
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  menu_type_id uuid not null references public.menu_types(id) on delete cascade,
  name text not null,
  sort_order int default 0,
  note text,
  created_at timestamptz default now()
);

-- 3. Dishes
create table if not exists public.dishes (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.categories(id) on delete cascade,
  name text not null,
  description text,
  price numeric(10, 2) not null,
  weight text,
  image_url text,
  is_active boolean default true,
  is_kids boolean default false,
  is_promo boolean default false,
  is_wine boolean default false,
  created_at timestamptz default now()
);

-- 4. Dish variants (e.g. Цезарь с курицей/креветками)
create table if not exists public.dish_variants (
  id uuid primary key default gen_random_uuid(),
  dish_id uuid not null references public.dishes(id) on delete cascade,
  name text not null,
  price numeric(10, 2) not null,
  weight text,
  created_at timestamptz default now()
);

-- 5. CMS pages
create table if not exists public.pages (
  slug text primary key,
  title text not null,
  content jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- 11. Content posts/articles (for Vacancies, Events, Blog)
create table if not exists public.content_posts (
  id uuid primary key default gen_random_uuid(),
  category text not null, -- 'vacancies', 'events', 'blog'
  title text not null,
  slug text not null,
  content text not null, -- HTML или markdown контент
  excerpt text, -- Краткое описание
  image_url text, -- URL изображения
  is_published boolean default true,
  published_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  created_by uuid references auth.users(id),
  unique(category, slug)
);

create index if not exists idx_content_posts_category on public.content_posts(category);
create index if not exists idx_content_posts_slug on public.content_posts(slug);
create index if not exists idx_content_posts_published on public.content_posts(is_published, published_at);

-- 6. Admins (linked to Supabase Auth users)
create table if not exists public.admins (
  id uuid primary key, -- auth.users.id
  email text not null unique,
  role text not null default 'editor', -- editor | superadmin
  created_at timestamptz default now()
);

-- RLS policies
alter table public.menu_types enable row level security;
alter table public.categories enable row level security;
alter table public.dishes enable row level security;
alter table public.dish_variants enable row level security;
alter table public.pages enable row level security;
alter table public.admins enable row level security;
alter table public.content_posts enable row level security;

-- Everyone can read menu and pages
drop policy if exists "Public read menu_types" on public.menu_types;
create policy "Public read menu_types" on public.menu_types
  for select using (true);

drop policy if exists "Public read categories" on public.categories;
create policy "Public read categories" on public.categories
  for select using (true);

drop policy if exists "Public read dishes" on public.dishes;
create policy "Public read dishes" on public.dishes
  for select using (is_active = true);

drop policy if exists "Public read dish_variants" on public.dish_variants;
create policy "Public read dish_variants" on public.dish_variants
  for select using (true);

drop policy if exists "Public read pages" on public.pages;
create policy "Public read pages" on public.pages
  for select using (true);

drop policy if exists "Public read content_posts" on public.content_posts;
create policy "Public read content_posts" on public.content_posts
  for select using (is_published = true);

-- Admin checks: user must exist in admins table
drop policy if exists "Admins manage menu_types" on public.menu_types;
create policy "Admins manage menu_types" on public.menu_types
  for all
  using (
    exists (
      select 1 from public.admins a
      where a.id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.admins a
      where a.id = auth.uid()
    )
  );

drop policy if exists "Admins manage categories" on public.categories;
create policy "Admins manage categories" on public.categories
  for all
  using (
    exists (
      select 1 from public.admins a
      where a.id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.admins a
      where a.id = auth.uid()
    )
  );

drop policy if exists "Admins manage dishes" on public.dishes;
create policy "Admins manage dishes" on public.dishes
  for all
  using (
    exists (
      select 1 from public.admins a
      where a.id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.admins a
      where a.id = auth.uid()
    )
  );

drop policy if exists "Admins manage dish_variants" on public.dish_variants;
create policy "Admins manage dish_variants" on public.dish_variants
  for all
  using (
    exists (
      select 1 from public.admins a
      where a.id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.admins a
      where a.id = auth.uid()
    )
  );

drop policy if exists "Admins manage pages" on public.pages;
create policy "Admins manage pages" on public.pages
  for all
  using (
    exists (
      select 1 from public.admins a
      where a.id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.admins a
      where a.id = auth.uid()
    )
  );

drop policy if exists "Admins read themselves" on public.admins;
create policy "Admins read themselves" on public.admins
  for select using (id = auth.uid());

drop policy if exists "Admins manage content_posts" on public.content_posts;
create policy "Admins manage content_posts" on public.content_posts
  for all
  using (
    exists (
      select 1 from public.admins a
      where a.id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.admins a
      where a.id = auth.uid()
    )
  );

-- 7. Business lunch sets
create table if not exists public.business_lunch_sets (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  price numeric(10, 2) not null,
  currency text default '₽',
  courses text[] not null, -- Array of course types: ['САЛАТ', 'ПЕРВОЕ', 'ВТОРОЕ']
  sort_order int default 0,
  is_active boolean default true,
  created_at timestamptz default now()
);

-- 8. Business lunch dishes by day
create table if not exists public.business_lunch_dishes (
  id uuid primary key default gen_random_uuid(),
  day_of_week text not null, -- 'monday', 'tuesday', etc.
  category text,
  name text not null,
  ingredients text,
  course_type text not null, -- 'САЛАТ', 'ПЕРВОЕ', 'ВТОРОЕ'
  sort_order int default 0,
  created_at timestamptz default now()
);

-- 9. Business lunch sides and drinks
create table if not exists public.business_lunch_options (
  id uuid primary key default gen_random_uuid(),
  option_type text not null, -- 'sides' or 'drinks'
  name text not null,
  sort_order int default 0,
  is_active boolean default true,
  created_at timestamptz default now()
);

-- 10. Business lunch promotion info
create table if not exists public.business_lunch_promotion (
  id uuid primary key default gen_random_uuid(),
  description text,
  note text,
  period text,
  updated_at timestamptz default now()
);

-- RLS for business lunch tables
alter table public.business_lunch_sets enable row level security;
alter table public.business_lunch_dishes enable row level security;
alter table public.business_lunch_options enable row level security;
alter table public.business_lunch_promotion enable row level security;

-- Public read policies
drop policy if exists "Public read business_lunch_sets" on public.business_lunch_sets;
create policy "Public read business_lunch_sets" on public.business_lunch_sets
  for select using (is_active = true);

drop policy if exists "Public read business_lunch_dishes" on public.business_lunch_dishes;
create policy "Public read business_lunch_dishes" on public.business_lunch_dishes
  for select using (true);

drop policy if exists "Public read business_lunch_options" on public.business_lunch_options;
create policy "Public read business_lunch_options" on public.business_lunch_options
  for select using (is_active = true);

drop policy if exists "Public read business_lunch_promotion" on public.business_lunch_promotion;
create policy "Public read business_lunch_promotion" on public.business_lunch_promotion
  for select using (true);

-- Admin manage policies
drop policy if exists "Admins manage business_lunch_sets" on public.business_lunch_sets;
create policy "Admins manage business_lunch_sets" on public.business_lunch_sets
  for all
  using (
    exists (
      select 1 from public.admins a
      where a.id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.admins a
      where a.id = auth.uid()
    )
  );

drop policy if exists "Admins manage business_lunch_dishes" on public.business_lunch_dishes;
create policy "Admins manage business_lunch_dishes" on public.business_lunch_dishes
  for all
  using (
    exists (
      select 1 from public.admins a
      where a.id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.admins a
      where a.id = auth.uid()
    )
  );

drop policy if exists "Admins manage business_lunch_options" on public.business_lunch_options;
create policy "Admins manage business_lunch_options" on public.business_lunch_options
  for all
  using (
    exists (
      select 1 from public.admins a
      where a.id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.admins a
      where a.id = auth.uid()
    )
  );

drop policy if exists "Admins manage business_lunch_promotion" on public.business_lunch_promotion;
create policy "Admins manage business_lunch_promotion" on public.business_lunch_promotion
  for all
  using (
    exists (
      select 1 from public.admins a
      where a.id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.admins a
      where a.id = auth.uid()
    )
  );

-- Enable Realtime for tables (safe to run multiple times)
-- Check if table is already in publication before adding
DO $$
BEGIN
  -- Add dishes if not already in publication
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'dishes'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE dishes;
  END IF;

  -- Add categories if not already in publication
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'categories'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE categories;
  END IF;

  -- Add menu_types if not already in publication
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'menu_types'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE menu_types;
  END IF;

  -- Add business_lunch_sets if not already in publication
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'business_lunch_sets'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE business_lunch_sets;
  END IF;

  -- Add business_lunch_dishes if not already in publication
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'business_lunch_dishes'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE business_lunch_dishes;
  END IF;

  -- Add business_lunch_options if not already in publication
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'business_lunch_options'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE business_lunch_options;
  END IF;

  -- Add business_lunch_promotion if not already in publication
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'business_lunch_promotion'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE business_lunch_promotion;
  END IF;

  -- Add content_posts if not already in publication
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'content_posts'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE content_posts;
  END IF;
END $$;

