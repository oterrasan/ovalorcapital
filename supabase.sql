-- TABLES
create table if not exists ig_accounts (
  id uuid primary key default uuid_generate_v4(),
  username text,
  ig_user_id text,
  token text,
  active boolean default true,
  posts_today int default 0,
  created_at timestamp default now()
);

create table if not exists rss_sources (
  id uuid primary key default uuid_generate_v4(),
  name text,
  url text,
  active boolean default true,
  last_fetched timestamp,
  created_at timestamp default now()
);

create table if not exists config (
  id uuid primary key default uuid_generate_v4(),
  key text,
  value text,
  updated_at timestamp default now()
);

create table if not exists logs (
  id uuid primary key default uuid_generate_v4(),
  level text,
  message text,
  created_at timestamp default now()
);
