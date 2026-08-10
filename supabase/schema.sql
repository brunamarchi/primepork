-- Prime Pork — schema do banco (Supabase / Postgres)
-- Rode este arquivo inteiro uma vez no SQL Editor do seu projeto Supabase.

create extension if not exists pgcrypto;

-- ============================================================
-- Tabelas
-- ============================================================

create table if not exists clients (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  phone text not null,
  document text,
  email text,
  address_zip text,
  address_street text,
  address_number text,
  address_neighborhood text,
  address_city text,
  address_state text,
  address_complement text,
  lat double precision,
  lng double precision,
  geocode_status text not null default 'pending' check (geocode_status in ('pending', 'success', 'failed')),
  geocoded_at timestamptz,
  notes text,
  created_by uuid default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists purchases (
  id uuid primary key default gen_random_uuid(),
  purchase_date date not null default current_date,
  raw_weight_kg numeric(10, 3) not null check (raw_weight_kg > 0),
  yield_quantity numeric(10, 2) not null check (yield_quantity > 0),
  yield_weight_kg numeric(10, 3) not null check (yield_weight_kg > 0),
  notes text,
  created_by uuid default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients(id) on delete restrict,
  order_date date not null default current_date,
  quantity numeric(10, 2) not null check (quantity > 0),
  weight_kg numeric(10, 3) not null check (weight_kg > 0),
  total_price numeric(10, 2) not null check (total_price >= 0),
  status text not null default 'pendente' check (status in ('pendente', 'entregue')),
  delivered_at timestamptz,
  payment_status text not null default 'previsto' check (payment_status in ('previsto', 'pago')),
  payment_due_date date,
  paid_at timestamptz,
  notes text,
  created_by uuid default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists orders_client_id_idx on orders(client_id);
create index if not exists orders_status_idx on orders(status);
create index if not exists orders_order_date_idx on orders(order_date);
create index if not exists orders_payment_status_idx on orders(payment_status);

-- Configurações do app (linha única — "singleton")
create table if not exists settings (
  id boolean primary key default true check (id),
  low_stock_threshold_kg numeric(10, 3) not null default 50,
  sales_velocity_window_days integer not null default 30,
  updated_at timestamptz not null default now()
);
insert into settings (id) values (true) on conflict (id) do nothing;

-- ============================================================
-- updated_at automático
-- ============================================================

create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists clients_set_updated_at on clients;
create trigger clients_set_updated_at
  before update on clients
  for each row
  execute function set_updated_at();

drop trigger if exists purchases_set_updated_at on purchases;
create trigger purchases_set_updated_at
  before update on purchases
  for each row
  execute function set_updated_at();

drop trigger if exists orders_set_updated_at on orders;
create trigger orders_set_updated_at
  before update on orders
  for each row
  execute function set_updated_at();

drop trigger if exists settings_set_updated_at on settings;
create trigger settings_set_updated_at
  before update on settings
  for each row
  execute function set_updated_at();

-- ============================================================
-- Views
-- ============================================================

create or replace view stock_summary as
select
  coalesce(sum(p.yield_quantity), 0) as total_produced_quantity,
  coalesce(sum(p.yield_weight_kg), 0) as total_produced_weight_kg,
  coalesce((select sum(o.quantity) from orders o where o.status = 'entregue'), 0) as total_delivered_quantity,
  coalesce((select sum(o.weight_kg) from orders o where o.status = 'entregue'), 0) as total_delivered_weight_kg,
  coalesce(sum(p.yield_quantity), 0)
    - coalesce((select sum(o.quantity) from orders o where o.status = 'entregue'), 0) as stock_quantity,
  coalesce(sum(p.yield_weight_kg), 0)
    - coalesce((select sum(o.weight_kg) from orders o where o.status = 'entregue'), 0) as stock_weight_kg,
  case when sum(p.raw_weight_kg) > 0
    then sum(p.yield_weight_kg) / sum(p.raw_weight_kg)
    else null end as avg_yield_ratio,
  coalesce(sum(p.raw_weight_kg), 0) as total_raw_weight_kg,
  coalesce(sum(p.raw_weight_kg), 0) - coalesce(sum(p.yield_weight_kg), 0) as total_loss_kg
from purchases p;

create or replace view client_purchase_stats as
select
  c.id as client_id,
  count(o.id) as order_count,
  max(o.order_date) as last_order_date,
  min(o.order_date) as first_order_date,
  case when count(o.id) >= 2
    then (max(o.order_date) - min(o.order_date))::numeric / (count(o.id) - 1)
    else null
  end as avg_interval_days,
  last_o.weight_kg as last_order_weight_kg,
  last_o.total_price as last_order_total_price
from clients c
left join orders o on o.client_id = c.id
left join lateral (
  select o2.weight_kg, o2.total_price
  from orders o2
  where o2.client_id = c.id
  order by o2.order_date desc, o2.created_at desc
  limit 1
) last_o on true
group by c.id, last_o.weight_kg, last_o.total_price;

-- ============================================================
-- RPC: métricas do dashboard
-- ============================================================

drop function if exists get_dashboard_metrics(date, date);

create function get_dashboard_metrics(p_date_from date, p_date_to date)
returns table (
  stock_quantity numeric,
  stock_weight_kg numeric,
  total_loss_kg numeric,
  pending_orders_count bigint,
  pending_demand_kg numeric,
  shortfall_kg numeric,
  raw_material_needed_kg numeric,
  avg_yield_ratio numeric,
  orders_count_period bigint,
  revenue_period numeric,
  receivable_total numeric,
  receivable_count bigint,
  overdue_total numeric,
  overdue_count bigint,
  avg_daily_sales_kg numeric,
  days_of_stock_remaining numeric,
  low_stock_threshold_kg numeric,
  is_low_stock boolean
)
language sql
stable
as $$
  with s as (select * from stock_summary),
  pend as (
    select count(*) as cnt, coalesce(sum(weight_kg), 0) as kg
    from orders where status = 'pendente'
  ),
  period as (
    select count(*) as cnt, coalesce(sum(total_price), 0) as revenue
    from orders where order_date between p_date_from and p_date_to
  ),
  receivable as (
    select
      count(*) filter (where payment_status = 'previsto') as cnt,
      coalesce(sum(total_price) filter (where payment_status = 'previsto'), 0) as amt,
      count(*) filter (where payment_status = 'previsto' and payment_due_date < current_date) as overdue_cnt,
      coalesce(sum(total_price) filter (where payment_status = 'previsto' and payment_due_date < current_date), 0) as overdue_amt
    from orders
  ),
  cfg as (select low_stock_threshold_kg, sales_velocity_window_days from settings limit 1),
  velocity as (
    select coalesce(sum(o.weight_kg), 0) / greatest((select sales_velocity_window_days from cfg), 1) as daily_kg
    from orders o
    where o.status = 'entregue'
      and o.order_date >= current_date - (select sales_velocity_window_days from cfg)
  )
  select
    s.stock_quantity,
    s.stock_weight_kg,
    s.total_loss_kg,
    pend.cnt,
    pend.kg,
    greatest(pend.kg - s.stock_weight_kg, 0) as shortfall_kg,
    case when s.avg_yield_ratio > 0
      then greatest(pend.kg - s.stock_weight_kg, 0) / s.avg_yield_ratio
      else null end as raw_material_needed_kg,
    s.avg_yield_ratio,
    period.cnt,
    period.revenue,
    receivable.amt,
    receivable.cnt,
    receivable.overdue_amt,
    receivable.overdue_cnt,
    velocity.daily_kg,
    case when velocity.daily_kg > 0 then s.stock_weight_kg / velocity.daily_kg else null end,
    (select low_stock_threshold_kg from cfg),
    s.stock_weight_kg < (select low_stock_threshold_kg from cfg)
  from s, pend, period, receivable, velocity;
$$;

-- ============================================================
-- Row Level Security
-- ============================================================

alter table clients enable row level security;
alter table purchases enable row level security;
alter table orders enable row level security;
alter table settings enable row level security;

drop policy if exists "authenticated full access" on clients;
create policy "authenticated full access" on clients
  for all to authenticated using (true) with check (true);

drop policy if exists "authenticated full access" on purchases;
create policy "authenticated full access" on purchases
  for all to authenticated using (true) with check (true);

drop policy if exists "authenticated full access" on orders;
create policy "authenticated full access" on orders
  for all to authenticated using (true) with check (true);

drop policy if exists "authenticated read/update" on settings;
create policy "authenticated read/update" on settings
  for select to authenticated using (true);
create policy "authenticated update settings" on settings
  for update to authenticated using (true) with check (true);

-- Nenhuma política é criada para o papel "anon" — por padrão, o RLS nega
-- qualquer acesso não autenticado às tabelas (e, por herança, às views).

-- ============================================================
-- Privilégios de tabela (necessários além do RLS — sem isso o
-- Postgres nega o acesso antes mesmo de avaliar as políticas)
-- ============================================================

grant usage on schema public to authenticated;
grant select, insert, update, delete on clients, purchases, orders to authenticated;
grant select, update on settings to authenticated;
grant select on stock_summary, client_purchase_stats to authenticated;
grant execute on function get_dashboard_metrics(date, date) to authenticated;
