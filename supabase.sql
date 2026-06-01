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
  key text unique,
  value text,
  updated_at timestamp default now()
);

create table if not exists logs (
  id uuid primary key default uuid_generate_v4(),
  level text,
  message text,
  created_at timestamp default now()
);

create table if not exists posts (
  id uuid primary key default uuid_generate_v4(),
  titulo text,
  conteudo text,
  comentario_fixado text,
  imagem text,
  hash text unique,
  status text default 'pendente',
  approved boolean default false,
  published_at timestamp,
  scheduled_at timestamp,
  publish_method text default 'portal',
  user_tags text default '[]',
  subcategoria text,
  subcategoria_slug text,
  collaborators text default '[]',
  metrics jsonb default '{}',
  priority int default 0,
  retry_count int default 0,
  max_retries int default 3,
  error_msg text,
  ig_account_id uuid,
  updated_at timestamp,
  created_at timestamp default now()
);

create index if not exists posts_hash_idx on posts(hash);
create index if not exists posts_status_idx on posts(status);
create index if not exists posts_created_at_idx on posts(created_at desc);
create index if not exists posts_publish_method_idx on posts(publish_method);
create index if not exists posts_user_tags_idx on posts(user_tags);

create table if not exists colunistas (
  id uuid primary key default uuid_generate_v4(),
  nome text not null,
  email text unique not null,
  telefone text,
  foto_url text,
  bio text,
  especialidade text,
  slug text unique,
  senha_hash text not null,
  session_token text,
  ativo boolean default true,
  last_login timestamp,
  created_at timestamp default now()
);

create index if not exists colunistas_email_idx on colunistas(email);
create index if not exists colunistas_slug_idx on colunistas(slug);

create table if not exists alerts (
  id uuid primary key default uuid_generate_v4(),
  type text default 'info',
  message text,
  read boolean default false,
  created_at timestamp default now()
);

-- CONFIGURAÇÕES PADRÃO (rodar no Supabase SQL Editor após criar as tabelas):
-- insert into config (key, value) values ('AUTOMATION', 'on') on conflict (key) do nothing;
-- insert into config (key, value) values ('MAX_POSTS_DIA', '300') on conflict (key) do nothing;
-- insert into config (key, value) values ('POSTS_01_06', '20') on conflict (key) do nothing;
-- insert into config (key, value) values ('POSTS_06_10', '40') on conflict (key) do nothing;
-- insert into config (key, value) values ('POSTS_10_12', '40') on conflict (key) do nothing;
-- insert into config (key, value) values ('POSTS_12_17', '80') on conflict (key) do nothing;
-- insert into config (key, value) values ('POSTS_17_00', '120') on conflict (key) do nothing;
