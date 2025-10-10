-- Descrição: Adiciona coluna data_e_hora às mensagens (medx_history) para exibição em timezone -03:00 no app
-- Data: 2025-10-10
-- Autor: Assistente GPT-5

alter table public.medx_history
  add column if not exists data_e_hora timestamptz not null default now();

comment on column public.medx_history.data_e_hora is 'Data/hora do evento (armazenado como timestamptz em UTC). Exibir no app com offset -03:00.';


