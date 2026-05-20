-- Mantem 300 marcacoes aleatorias e remove o restante.
-- Execute no Supabase SQL Editor.

begin;

with keep_random_reports as (
  select id
  from public.reports
  order by random()
  limit 300
)
delete from public.reports reports
where not exists (
  select 1
  from keep_random_reports keep
  where keep.id = reports.id
);

commit;

-- Conferir total restante e distribuicao por categoria.
select count(*) as total_restante
from public.reports;

select category, count(*) as total
from public.reports
group by category
order by category;
