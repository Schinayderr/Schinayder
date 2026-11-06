-- Execute uma vez no SQL Editor do Supabase.
-- Os tokens chegam aqui criptografados pelo servidor da Vercel.
create table if not exists public.schinayder_mercadolivre_tokens (
  store_key text primary key check (store_key = 'primary'),
  seller_id text not null,
  access_token_encrypted text not null,
  refresh_token_encrypted text not null,
  expires_at timestamptz not null,
  scope text not null default '',
  updated_at timestamptz not null default now()
);

alter table public.schinayder_mercadolivre_tokens enable row level security;
-- Não crie políticas para anon/authenticated nesta tabela.
-- A service_role é usada somente no servidor e ignora RLS.
-- Nunca exponha SUPABASE_SERVICE_ROLE_KEY no navegador ou em variáveis VITE_*.
