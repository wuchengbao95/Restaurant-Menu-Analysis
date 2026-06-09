-- 餐厅表（多租户核心）
create table restaurants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  contact_name text not null,
  contact_phone text,
  created_at timestamptz default now()
);

-- 用户档案（绑定 Supabase Auth）
create table user_profiles (
  id uuid primary key references auth.users on delete cascade,
  restaurant_id uuid references restaurants on delete cascade,
  role text not null default 'staff' check (role in ('owner', 'staff')),
  name text not null,
  created_at timestamptz default now()
);

-- 菜单菜品
create table menu_items (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid references restaurants on delete cascade not null,
  name text not null,
  category text not null default '未分类',
  is_active boolean default true,
  created_at timestamptz default now()
);

-- 剩菜记录
create table leftover_records (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid references restaurants on delete cascade not null,
  menu_item_id uuid references menu_items on delete cascade not null,
  record_date date not null default current_date,
  meal_period text not null check (meal_period in ('lunch', 'dinner')),
  table_size integer not null default 2,
  leftover_ratio text not null check (leftover_ratio in ('none', 'little', 'half', 'most', 'all')),
  reason_tags text[] default '{}',
  notes text default '',
  recorded_by uuid references auth.users,
  created_at timestamptz default now()
);

-- AI 分析报告
create table analysis_reports (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid references restaurants on delete cascade not null,
  period_start date not null,
  period_end date not null,
  content text not null,
  created_at timestamptz default now()
);

-- 员工邀请码（店主生成，7天有效）
create table restaurant_invites (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid references restaurants on delete cascade not null,
  code text unique not null,
  expires_at timestamptz not null,
  created_at timestamptz default now()
);

-- Row Level Security（每家餐厅只能看自己的数据）
alter table restaurants enable row level security;
alter table user_profiles enable row level security;
alter table menu_items enable row level security;
alter table leftover_records enable row level security;
alter table analysis_reports enable row level security;

-- 辅助函数：用 security definer 绕过 RLS 递归问题
-- 各策略里若直接用子查询 SELECT from user_profiles，会触发自身策略造成无限递归
create or replace function get_my_restaurant_id()
returns uuid language sql security definer stable as $$
  select restaurant_id from user_profiles where id = auth.uid() limit 1;
$$;

-- 策略：用户只能访问自己餐厅的数据

-- restaurants: 注册时还没有 user_profiles 行，INSERT 单独放行
create policy "认证用户可创建餐厅" on restaurants
  for insert with check (auth.uid() is not null);

create policy "用户只能查看自己的餐厅" on restaurants
  for select using (id = get_my_restaurant_id());

create policy "用户只能修改自己的餐厅" on restaurants
  for update using (id = get_my_restaurant_id());

-- user_profiles: 注册时允许用户创建自己的档案
create policy "用户可创建自己的档案" on user_profiles
  for insert with check (id = auth.uid());

create policy "用户只能查看自己的档案" on user_profiles
  for select using (
    id = auth.uid() or restaurant_id = get_my_restaurant_id()
  );

create policy "用户只能修改自己的档案" on user_profiles
  for update using (id = auth.uid());

create policy "用户只能访问自己餐厅的菜品" on menu_items
  for all using (restaurant_id = get_my_restaurant_id());

create policy "用户只能访问自己餐厅的记录" on leftover_records
  for all using (restaurant_id = get_my_restaurant_id());

create policy "用户只能访问自己餐厅的报告" on analysis_reports
  for all using (restaurant_id = get_my_restaurant_id());
