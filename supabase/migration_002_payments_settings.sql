-- Prime Pork — migração incremental (rodar UMA VEZ, depois do schema.sql original)
-- Adiciona: status de pagamento nas vendas, tabela de configurações
-- (limite de estoque baixo), resíduo/perda de produção e previsibilidade
-- de estoque no dashboard.

-- ============================================================
-- Novas colunas em orders (status de pagamento)
-- ============================================================

alter table orders add column if not exists payment_status text not null default 'previsto';
alter table orders drop constraint if exists orders_payment_status_check;
alter table orders add constraint orders_payment_status_check check (payment_status in ('previsto', 'pago'));
alter table orders add column if not exists payment_due_date date;
alter table orders add column if not exists paid_at timestamptz;
alter table orders add column if not exists updated_at timestamptz not null default now();

create index if not exists orders_payment_status_idx on orders(payment_status);

alter table purchases add column if not exists updated_at timestamptz not null default now();

-- ============================================================
-- updated_at automático (função já existe, só faltam os triggers novos)
-- ============================================================

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

-- ============================================================
-- Tabela de configurações (limite de estoque baixo)
-- ============================================================

create table if not exists settings (
  id boolean primary key default true check (id),
  low_stock_threshold_kg numeric(10, 3) not null default 50,
  sales_velocity_window_days integer not null default 30,
  updated_at timestamptz not null default now()
);
insert into settings (id) values (true) on conflict (id) do nothing;

drop trigger if exists settings_set_updated_at on settings;
create trigger settings_set_updated_at
  before update on settings
  for each row
  execute function set_updated_at();

alter table settings enable row level security;

drop policy if exists "authenticated read/update" on settings;
create policy "authenticated read/update" on settings
  for select to authenticated using (true);
drop policy if exists "authenticated update settings" on settings;
create policy "authenticated update settings" on settings
  for update to authenticated using (true) with check (true);

grant select, update on settings to authenticated;

-- ============================================================
-- stock_summary: adiciona total de matéria-prima e perda de produção
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

-- ============================================================
-- get_dashboard_metrics: adiciona contas a receber/atrasadas,
-- previsibilidade de estoque (dias restantes) e alerta de estoque baixo
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

grant execute on function get_dashboard_metrics(date, date) to authenticated;

-- ============================================================
-- Marca os pedidos de demonstração já existentes como pagos, para não
-- distorcer o "a receber" com valores de teste (opcional, mas recomendado
-- se você já rodou o seed_demo.sql)
-- ============================================================

update orders set payment_status = 'pago', paid_at = now()
where notes like '[DEMO]%' and status = 'entregue';
