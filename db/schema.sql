CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS posts (
  id uuid primary key default uuid_generate_v4(),
  titulo text,
  conteudo text,
  comentario_fixado text,
  imagem text,
  hash text unique,
  status text default 'pendente',
  approved boolean default false,
  publish_method text default 'portal',
  user_tags text,
  subcategoria text,
  subcategoria_slug text,
  created_at timestamp with time zone default now(),
  published_at timestamp with time zone,
  metrics jsonb default '{}',
  priority integer default 0,
  retry_count integer default 0,
  max_retries integer default 3
);

CREATE TABLE IF NOT EXISTS config (
  key text primary key,
  value text
);

INSERT INTO config (key, value) VALUES
  ('AUTOMATION', 'on'),
  ('MAX_POSTS_DIA', '300')
ON CONFLICT (key) DO NOTHING;

CREATE TABLE IF NOT EXISTS colunistas (
  id uuid primary key default uuid_generate_v4(),
  nome text,
  email text unique,
  senha_hash text,
  ativo boolean default true,
  session_token text,
  last_login timestamp,
  created_at timestamp default now()
);

CREATE TABLE IF NOT EXISTS image_bank (
  id uuid primary key default uuid_generate_v4(),
  url text unique,
  titulo text,
  post_id uuid,
  created_at timestamp default now()
);

CREATE TABLE IF NOT EXISTS rss_sources (
  id uuid primary key default uuid_generate_v4(),
  name text,
  url text unique,
  categoria text,
  active boolean default true,
  created_at timestamp default now()
);

CREATE INDEX IF NOT EXISTS posts_status_idx ON posts(status);
CREATE INDEX IF NOT EXISTS posts_published_at_idx ON posts(published_at DESC);
CREATE INDEX IF NOT EXISTS posts_hash_idx ON posts(hash);
CREATE INDEX IF NOT EXISTS posts_created_at_idx ON posts(created_at DESC);

SELECT 'Schema criado com sucesso' AS resultado;
