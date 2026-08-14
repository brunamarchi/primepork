-- Prime Pork — migração 003: campos da planilha real + import fiel dos dados
-- Gerado automaticamente a partir de 'PEDIDOS PORK PRIME.xlsx' (openpyxl), sem transcrição manual.
-- Rode este arquivo INTEIRO uma única vez no SQL Editor do Supabase, depois de schema.sql e migration_002.

-- ============================================================
-- 1. Novas colunas em clients
-- ============================================================
alter table clients add column if not exists contact_name text;
alter table clients add column if not exists payment_term text;
alter table clients add column if not exists current_price numeric(10,2);
-- a planilha real tem um cliente (BOTECO MERCADÃO LTDA) sem telefone cadastrado
alter table clients alter column phone drop not null;

-- ============================================================
-- 1.5. Garante que as colunas de pagamento (migration_002) existem —
--      idempotente, roda mesmo que migration_002 nunca tenha sido aplicada.
-- ============================================================
alter table orders add column if not exists payment_status text not null default 'previsto';
alter table orders drop constraint if exists orders_payment_status_check;
alter table orders add constraint orders_payment_status_check check (payment_status in ('previsto', 'pago'));
alter table orders add column if not exists payment_due_date date;
alter table orders add column if not exists paid_at timestamptz;
alter table orders add column if not exists updated_at timestamptz not null default now();
create index if not exists orders_payment_status_idx on orders(payment_status);

create table if not exists settings (
  id boolean primary key default true check (id),
  low_stock_threshold_kg numeric(10, 3) not null default 50,
  sales_velocity_window_days integer not null default 30,
  updated_at timestamptz not null default now()
);
insert into settings (id) values (true) on conflict (id) do nothing;
alter table settings enable row level security;
drop policy if exists "authenticated read/update" on settings;
create policy "authenticated read/update" on settings
  for select to authenticated using (true);
drop policy if exists "authenticated update settings" on settings;
create policy "authenticated update settings" on settings
  for update to authenticated using (true) with check (true);
grant select, update on settings to authenticated;

drop trigger if exists orders_set_updated_at on orders;
create trigger orders_set_updated_at
  before update on orders
  for each row
  execute function set_updated_at();

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
-- 2. Novas colunas em orders + quantity deixa de ser obrigatória
--    (a planilha real controla vendas só por peso/kg, nunca por unidade)
-- ============================================================
alter table orders alter column quantity drop not null;
alter table orders drop constraint if exists orders_quantity_check;
alter table orders add constraint orders_quantity_check check (quantity is null or quantity > 0);
alter table orders add column if not exists order_number integer;
alter table orders add column if not exists nf_number text;
alter table orders add column if not exists payment_term text;
alter table orders add column if not exists payment_method text;
alter table orders add column if not exists freight text;
alter table orders add column if not exists product_description text;
alter table orders add column if not exists unit_price numeric(10,2);

-- ============================================================
-- 3. Tabela nova: stock_ledger (cópia fiel da aba 'Estoque' da planilha)
-- ============================================================
create table if not exists stock_ledger (
  id uuid primary key default gen_random_uuid(),
  ledger_date date not null,
  opening_balance_kg numeric(10,3),
  incoming_kg numeric(10,3),
  outgoing_kg numeric(10,3),
  closing_balance_kg numeric(10,3),
  created_by uuid default auth.uid(),
  created_at timestamptz not null default now()
);
alter table stock_ledger enable row level security;
drop policy if exists "authenticated full access" on stock_ledger;
create policy "authenticated full access" on stock_ledger
  for all to authenticated using (true) with check (true);
grant select, insert, update, delete on stock_ledger to authenticated;

-- ============================================================
-- 4. Tabela nova: daily_production (aba 'Produção diária' da planilha)
-- ============================================================
create table if not exists daily_production (
  id uuid primary key default gen_random_uuid(),
  production_date date not null,
  panceta_congelada_kg numeric(10,3),
  panceta_descongelada_kg numeric(10,3),
  panceta_temperada_kg numeric(10,3),
  rolo_assado_kg numeric(10,3),
  rolo_congelado_kg numeric(10,3),
  rolo_fatiado_kg numeric(10,3),
  notes text,
  created_by uuid default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
drop trigger if exists daily_production_set_updated_at on daily_production;
create trigger daily_production_set_updated_at
  before update on daily_production
  for each row
  execute function set_updated_at();
alter table daily_production enable row level security;
drop policy if exists "authenticated full access" on daily_production;
create policy "authenticated full access" on daily_production
  for all to authenticated using (true) with check (true);
grant select, insert, update, delete on daily_production to authenticated;

-- ============================================================
-- 5. Zera a base atual (conforme solicitado)
-- ============================================================
truncate table orders, purchases, clients restart identity cascade;

-- ============================================================
-- 6. Import fiel: clientes (18 da aba CLIENTES + 4 identificados só pelo nome nas vendas)
-- ============================================================
insert into clients (full_name, document, phone, address_street, address_neighborhood, address_zip, contact_name, payment_term, current_price) values
  ('SÃO PAULO GRIL BAR LTDA.', 'CNPJ: 55.762.424/0001-85', '11-99948.0912', 'Rua Iguaçu, n. 30', 'Santa Maria - Santo André / SP', '09071-190', 'GUILHERME COMPRAS', '7 DD', 54.0),
  ('ESTAÇÃO PRAÇA GASTROBAR', '63.103.461/0001-00', '11-99918-1621', 'Avenida Kennedy, 286', 'São Bernardo do Campo / SP', '09726-253', 'ALEXANDRE', '14 DD', 56.0),
  ('PRAÇA FIGUEIRA GASTROBAR', '55.819.229/0001-44', '11-99918-1621', 'Rua das Figueiras, 1149', 'Santo André / SP', '09080-370', 'ALEXANDRE', '14 DD', 56.0),
  ('B.T.Q PAULISTA BAR E ESTAURANTE LTDA.', '65.091.445/0001-70', '11-99918-1621', 'Avenida Moema, 02', 'Moema / SP', '04077-020', 'ALEXANDRE', '14 DD', 56.0),
  ('EMPORIO DOM FAMA LTDA', '64.068.677/0001-44', '11-96668-6514', 'Rua Cantareira, 390 - setor Rua 22 Box 22', 'Centro / SP', '01024-000', 'JULIO', 'A VISTA ou 7 DD', 54.0),
  ('BOTECO MERCADÃO LTDA', '60.546.768/0001-97', NULL, 'Rua Cantareira, 306 - Box l-15', 'Centro / SP', '01024-900', 'FABIO', '14 DD', 52.0),
  ('JATOBAH RESTAURANTE BAR E ESPETARIA LTDA', '57.506.683/0001-70', '11-94730.4911', 'Rua Juventus, 102', 'Mooca / SP', '03124-020', 'Anderson', '7 DD', 56.0),
  ('FABIANA MARIA MOREIRA SANTAS COSTA', '28.198.395/0001-06', '11-97576-4671', 'Rua Piaui, 44', 'Vila Rosalia - Guarulhos / SP', '07072-210', 'Fabiana', '7 DD', 56.0),
  ('AGORA BAR E ESPETOS', '29.110.399/0001-45', '11-99969-6129', 'Rua Costa Aguiar, 1999', 'Ipiranga / SP', '04204-002', 'Eliana', '7 DD', 56.0),
  ('BORDELI SNOKER', '37.630.664/0001-44', '11-96226-7421', 'Av. Kennedy,328', 'Jardim do Mar - São Bernardo do Campo / SP', '09726-251', 'Wallace Bordeli', 'a vista', 55.0),
  ('C & G BAR E RESTAURANTE - Boteco Nancy Mooca', '51.247.439/0001-54', '11-94923-6991', 'Rua Madre de Deus, 349', 'Mooca / SP', '03119-000', 'André', '15 DD', 56.0),
  ('ANDRÉ DO ESPETO', NULL, '54-99980-1605', 'Rua General Lecor, 114', 'Ipiranga / SP', '04213-020', 'André', 'A VISTA', 56.0),
  ('HADAR BAR E RESTAURANTE LTDA', '59.770.667/0001-16', '11-97597-9621', 'Rua Guaraciaba, 607', 'Chacara Califórnia - SP', '03410-000', 'Odair', 'A VISTA', 56.0),
  ('EDSON CARLOS DOS REIS', '451.414.025-53', '11-99594-1191', 'PASTELARIA DO IPIRANGA', 'IPIRANGA', NULL, 'EDSON', 'A VISTA', 54.0),
  ('RESTAURANTE E BAR HUNICO', '53.481.383/0001-23', '11-95216.6455', 'Rua da Cantareira 306, Rua E box 15 - Mercadão', 'Centro', '01024-000', 'FELIPE ou CAMILA', '7 DD', 56.0),
  ('GIGA GASTROBAR', NULL, '11-94518.0503', 'Rua Comendador Taylor, 1133', 'Ipiranga', '04218-000', 'Walkys', 'A vista', 56.0),
  ('BOTECO CLAUDIÃO LTDA', '65.944.107/0001-33', '11-98412.5480', 'Rua Cantareira, 390 -Letra L - Box 7', 'Centro / SP', '01024-000', 'Claudio', '7 dd', 56.0),
  ('DIVINA PARADA BAR E RESTAURANTE', '61.270.247/0001-12', '11-94959.5166', 'Rua Vergueiro, 709', 'Liberdade', '015040-001', 'Daniel', 'a vista', 54.0),
  ('Alemão Lounge Bar', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
  ('Choperia Spimbar', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
  ('Daniel', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
  ('Roberto Leandrini', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

-- ============================================================
-- 7. Import fiel: pedidos (56 — 42 de julho + 14 de agosto)
--    status='entregue' porque são registros da aba de VENDAS (venda já realizada);
--    payment_status fica no padrão 'previsto' — a planilha não confirma pagamento
--    recebido, então o app calcula 'Atrasado' sozinho a partir do vencimento.
-- ============================================================
insert into orders (client_id, order_date, weight_kg, total_price, status, delivered_at, payment_status, payment_due_date, order_number, payment_term, freight) values
  ((select id from clients where full_name = 'BOTECO MERCADÃO LTDA'), '2026-06-29', 53.8, 2797.6, 'entregue', ('2026-06-29')::timestamptz, 'previsto', '2026-07-13', 1, '14 dd', NULL),
  ((select id from clients where full_name = 'FABIANA MARIA MOREIRA SANTAS COSTA'), '2026-06-29', 10.32, 577.92, 'entregue', ('2026-06-29')::timestamptz, 'previsto', '2026-07-06', 2, '7 dd', '30.9'),
  ((select id from clients where full_name = 'AGORA BAR E ESPETOS'), '2026-06-30', 10.54, 590.24, 'entregue', ('2026-06-30')::timestamptz, 'previsto', '2026-07-07', 4, '7 dd', NULL),
  ((select id from clients where full_name = 'B.T.Q PAULISTA BAR E ESTAURANTE LTDA.'), '2026-07-01', 18.53, 1037.68, 'entregue', ('2026-07-01')::timestamptz, 'previsto', '2026-07-14', 5, '14 dd', NULL),
  ((select id from clients where full_name = 'PRAÇA FIGUEIRA GASTROBAR'), '2026-07-01', 24.55, 1374.8, 'entregue', ('2026-07-01')::timestamptz, 'previsto', '2026-07-14', 6, '14 dd', NULL),
  ((select id from clients where full_name = 'ESTAÇÃO PRAÇA GASTROBAR'), '2026-07-01', 61.95, 3469.2, 'entregue', ('2026-07-01')::timestamptz, 'previsto', '2027-07-14', 7, '14 dd', NULL),
  ((select id from clients where full_name = 'JATOBAH RESTAURANTE BAR E ESPETARIA LTDA'), '2026-07-01', 21.4, 1198.4, 'entregue', ('2026-07-01')::timestamptz, 'previsto', '2026-07-07', 8, '7 dd', NULL),
  ((select id from clients where full_name = 'EDSON CARLOS DOS REIS'), '2026-07-03', 8.465, 474.04, 'entregue', ('2026-07-03')::timestamptz, 'previsto', '2026-07-04', 9, 'a vista', NULL),
  ((select id from clients where full_name = 'BOTECO MERCADÃO LTDA'), '2026-07-03', 49.8, 2589.6, 'entregue', ('2026-07-03')::timestamptz, 'previsto', '2026-07-17', 10, '14 dd', NULL),
  ((select id from clients where full_name = 'FABIANA MARIA MOREIRA SANTAS COSTA'), '2026-07-06', 10.2, 571.2, 'entregue', ('2026-07-06')::timestamptz, 'previsto', '2026-07-13', 11, '7 dd', 'Retirou'),
  ((select id from clients where full_name = 'Choperia Spimbar'), '2026-07-07', 10.3, 576.8, 'entregue', ('2026-07-07')::timestamptz, 'previsto', '2026-07-08', 12, 'a vista', NULL),
  ((select id from clients where full_name = 'BOTECO CLAUDIÃO LTDA'), '2026-07-08', 30.62, 1714.72, 'entregue', ('2026-07-08')::timestamptz, 'previsto', '2026-07-15', 13, '7 dd', NULL),
  ((select id from clients where full_name = 'BOTECO MERCADÃO LTDA'), '2026-07-08', 67.9, 3395.0, 'entregue', ('2026-07-08')::timestamptz, 'previsto', '2027-07-22', 14, '14 dd', NULL),
  ((select id from clients where full_name = 'PRAÇA FIGUEIRA GASTROBAR'), '2026-07-08', 24.6, 1377.6, 'entregue', ('2026-07-08')::timestamptz, 'previsto', '2027-07-22', 15, '14 dd', NULL),
  ((select id from clients where full_name = 'Roberto Leandrini'), '2026-07-08', 7.8, 421.2, 'entregue', ('2026-07-08')::timestamptz, 'previsto', '2026-07-13', 16, '5 dd', NULL),
  ((select id from clients where full_name = 'B.T.Q PAULISTA BAR E ESTAURANTE LTDA.'), '2026-07-08', 33.15, 1892.8, 'entregue', ('2026-07-08')::timestamptz, 'previsto', '2027-07-22', 17, '14 dd', NULL),
  ((select id from clients where full_name = 'BOTECO MERCADÃO LTDA'), '2019-07-13', 57.17, 2858.5, 'entregue', ('2019-07-13')::timestamptz, 'previsto', '2027-07-27', 19, '14 dd', NULL),
  ((select id from clients where full_name = 'EDSON CARLOS DOS REIS'), '2026-07-13', 8.23, 427.53, 'entregue', ('2026-07-13')::timestamptz, 'previsto', '2026-07-13', 20, 'a vista', 'Retirou'),
  ((select id from clients where full_name = 'ESTAÇÃO PRAÇA GASTROBAR'), '2026-07-14', 61.77, 3459.12, 'entregue', ('2026-07-14')::timestamptz, 'previsto', '2026-07-28', 21, '14 dd', NULL),
  ((select id from clients where full_name = 'PRAÇA FIGUEIRA GASTROBAR'), '2026-07-14', 18.86, 1056.26, 'entregue', ('2026-07-14')::timestamptz, 'previsto', '2026-07-28', 22, '14 dd', NULL),
  ((select id from clients where full_name = 'B.T.Q PAULISTA BAR E ESTAURANTE LTDA.'), '2026-07-14', 37.35, 2091.6, 'entregue', ('2026-07-14')::timestamptz, 'previsto', '2026-07-28', 23, '14 dd', NULL),
  ((select id from clients where full_name = 'FABIANA MARIA MOREIRA SANTAS COSTA'), '2026-07-14', 15.935, 892.36, 'entregue', ('2026-07-14')::timestamptz, 'previsto', '2026-07-21', 24, '7 dd', '61'),
  ((select id from clients where full_name = 'BOTECO MERCADÃO LTDA'), '2026-07-14', 119.89, 5420.5, 'entregue', ('2026-07-14')::timestamptz, 'previsto', '2026-07-28', 25, '14 dd', NULL),
  ((select id from clients where full_name = 'ANDRÉ DO ESPETO'), '2026-07-15', 10.42, 583.52, 'entregue', ('2026-07-15')::timestamptz, 'previsto', '2026-07-15', 26, 'a vista', NULL),
  ((select id from clients where full_name = 'BOTECO MERCADÃO LTDA'), '2026-07-16', 13.3, 665.0, 'entregue', ('2026-07-16')::timestamptz, 'previsto', '2026-07-30', 27, '14 dd', NULL),
  ((select id from clients where full_name = 'RESTAURANTE E BAR HUNICO'), '2026-07-20', 11.39, 637.84, 'entregue', ('2026-07-20')::timestamptz, 'previsto', '2026-07-27', 28, '7 dd', NULL),
  ((select id from clients where full_name = 'Daniel'), '2026-07-20', 9.6, 518.4, 'entregue', ('2026-07-20')::timestamptz, 'previsto', '2026-07-20', 29, 'a vista', '10'),
  ((select id from clients where full_name = 'ESTAÇÃO PRAÇA GASTROBAR'), '2026-07-21', 62.53, 3501.68, 'entregue', ('2026-07-21')::timestamptz, 'previsto', '2026-08-04', 30, '14 dd', NULL),
  ((select id from clients where full_name = 'B.T.Q PAULISTA BAR E ESTAURANTE LTDA.'), '2026-07-21', 37.42, 2095.52, 'entregue', ('2026-07-21')::timestamptz, 'previsto', '2026-08-04', 31, '14 dd', NULL),
  ((select id from clients where full_name = 'JATOBAH RESTAURANTE BAR E ESPETARIA LTDA'), '2026-07-21', 20.35, 1139.6, 'entregue', ('2026-07-21')::timestamptz, 'previsto', '2026-07-28', 32, '7 dd', NULL),
  ((select id from clients where full_name = 'GIGA GASTROBAR'), '2026-07-21', 10.4, 593.4, 'entregue', ('2026-07-21')::timestamptz, 'previsto', '2026-07-21', 33, 'a vista', '11'),
  ((select id from clients where full_name = 'BOTECO MERCADÃO LTDA'), '2026-07-23', 106.99, 5095.9, 'entregue', ('2026-07-23')::timestamptz, 'previsto', '2026-08-06', 34, '14 dd', NULL),
  ((select id from clients where full_name = 'Alemão Lounge Bar'), '2026-07-24', 8.38, 469.28, 'entregue', ('2026-07-24')::timestamptz, 'previsto', '2026-07-27', 35, 'a vista', '10'),
  ((select id from clients where full_name = 'EDSON CARLOS DOS REIS'), '2026-07-28', 8.37, 451.98, 'entregue', ('2026-07-28')::timestamptz, 'previsto', '2026-07-28', 36, 'a vista', 'Retirou'),
  ((select id from clients where full_name = 'BOTECO CLAUDIÃO LTDA'), '2026-07-28', 31.14, 1743.84, 'entregue', ('2026-07-28')::timestamptz, 'previsto', '2026-08-04', 37, '7 dd', NULL),
  ((select id from clients where full_name = 'HADAR BAR E RESTAURANTE LTDA'), '2026-07-28', 15.524, 869.34, 'entregue', ('2026-07-28')::timestamptz, 'previsto', '2026-08-05', 38, '7 dd', '30'),
  ((select id from clients where full_name = 'ESTAÇÃO PRAÇA GASTROBAR'), '2026-07-28', 62.065, 3475.64, 'entregue', ('2026-07-28')::timestamptz, 'previsto', '2026-08-11', 39, '14 dd', NULL),
  ((select id from clients where full_name = 'B.T.Q PAULISTA BAR E ESTAURANTE LTDA.'), '2026-07-28', 38.16, 2136.96, 'entregue', ('2026-07-28')::timestamptz, 'previsto', '2026-08-11', 40, '14 dd', NULL),
  ((select id from clients where full_name = 'PRAÇA FIGUEIRA GASTROBAR'), '2026-07-28', 25.1, 1405.6, 'entregue', ('2026-07-28')::timestamptz, 'previsto', '2026-08-11', 41, '14 dd', NULL),
  ((select id from clients where full_name = 'BOTECO MERCADÃO LTDA'), '2026-07-29', 86.11, 3026.0, 'entregue', ('2026-07-29')::timestamptz, 'previsto', '2026-08-12', 42, '14 dd', NULL),
  ((select id from clients where full_name = 'SÃO PAULO GRIL BAR LTDA.'), '2026-07-30', 150.43, 8123.22, 'entregue', ('2026-07-30')::timestamptz, 'previsto', '2026-08-06', 43, '7 dd', NULL),
  ((select id from clients where full_name = 'FABIANA MARIA MOREIRA SANTAS COSTA'), '2026-07-31', 10.4, 582.4, 'entregue', ('2026-07-31')::timestamptz, 'previsto', '2026-07-31', 44, 'a vista', '30'),
  ((select id from clients where full_name = 'DIVINA PARADA BAR E RESTAURANTE'), '2026-08-03', 9.275, 500.85, 'entregue', ('2026-08-03')::timestamptz, 'previsto', '2026-08-03', 45, 'a vista', '10'),
  ((select id from clients where full_name = 'ESTAÇÃO PRAÇA GASTROBAR'), '2026-08-04', 71.06, 3979.36, 'entregue', ('2026-08-04')::timestamptz, 'previsto', '2026-08-18', 46, '14 dd', NULL),
  ((select id from clients where full_name = 'BORDELI SNOKER'), '2026-08-05', 30.51, 1678.05, 'entregue', ('2026-08-05')::timestamptz, 'previsto', '2026-07-07', 47, 'a vista', '50'),
  ((select id from clients where full_name = 'BOTECO MERCADÃO LTDA'), '2026-08-06', 51.4, 2570.0, 'entregue', ('2026-08-06')::timestamptz, 'previsto', '2026-08-20', 48, '14 dd', NULL),
  ((select id from clients where full_name = 'EMPORIO DOM FAMA LTDA'), '2026-08-06', 101.575, 5688.2, 'entregue', ('2026-08-06')::timestamptz, 'previsto', '2026-08-13', 49, '7 dd', NULL),
  ((select id from clients where full_name = 'EDSON CARLOS DOS REIS'), '2026-08-06', 5.27, 284.58, 'entregue', ('2026-08-06')::timestamptz, 'previsto', '2027-07-14', 50, 'a vista', 'Retirou'),
  ((select id from clients where full_name = 'SÃO PAULO GRIL BAR LTDA.'), '2026-08-06', 152.6, 8240.4, 'entregue', ('2026-08-06')::timestamptz, 'previsto', '2026-08-13', 50, '7 dd', NULL),
  ((select id from clients where full_name = 'ANDRÉ DO ESPETO'), '2026-08-06', 10.305, 577.08, 'entregue', ('2026-08-06')::timestamptz, 'previsto', '2026-08-06', 51, 'a vista', '10'),
  ((select id from clients where full_name = 'FABIANA MARIA MOREIRA SANTAS COSTA'), '2026-08-06', 10.65, 596.4, 'entregue', ('2026-08-06')::timestamptz, 'previsto', '2026-08-06', 52, 'a vista', '35'),
  ((select id from clients where full_name = 'BOTECO MERCADÃO LTDA'), '2026-08-07', 20.37, 814.8, 'entregue', ('2026-08-07')::timestamptz, 'previsto', '2026-08-21', 53, '14 dd', NULL),
  ((select id from clients where full_name = 'RESTAURANTE E BAR HUNICO'), '2026-08-07', 18.8, 1052.8, 'entregue', ('2026-08-07')::timestamptz, 'previsto', '2026-08-16', 54, '7 dd', NULL),
  ((select id from clients where full_name = 'B.T.Q PAULISTA BAR E ESTAURANTE LTDA.'), '2026-08-11', 26.0, 1456.0, 'entregue', ('2026-08-11')::timestamptz, 'previsto', '2026-08-25', 55, '14 dd', NULL),
  ((select id from clients where full_name = 'PRAÇA FIGUEIRA GASTROBAR'), '2026-08-11', 13.0, 728.0, 'entregue', ('2026-08-11')::timestamptz, 'previsto', '2026-08-25', 56, '14 dd', NULL),
  ((select id from clients where full_name = 'AGORA BAR E ESPETOS'), '2026-08-12', 10.125, 567.0, 'entregue', ('2026-08-12')::timestamptz, 'previsto', '2026-08-19', 57, '7 dd', '10');

-- ============================================================
-- 8. Import fiel: livro-razão de estoque (aba 'Estoque', 8 linhas com data)
-- ============================================================
insert into stock_ledger (ledger_date, opening_balance_kg, incoming_kg, outgoing_kg, closing_balance_kg) values
  ('2026-08-03', 586.56, 253.5, 9.275, 830.785),
  ('2026-08-04', 830.785, NULL, 71.06, 759.725),
  ('2026-08-05', 759.725, NULL, 30.51, 729.215),
  ('2026-08-06', 729.215, 158.7, 331.8, 556.115),
  ('2026-08-07', 556.115, 180.2, 39.17, 697.145),
  ('2026-08-10', 697.145, NULL, NULL, 697.145),
  ('2026-08-11', 697.145, NULL, 39.0, 658.145),
  ('2026-08-12', 658.145, NULL, 10.125, 648.02);

-- ============================================================
-- 9. Import fiel: produção diária (aba 'Produção diária', 6 datas)
-- ============================================================
insert into daily_production (production_date, panceta_congelada_kg, panceta_descongelada_kg, panceta_temperada_kg, rolo_assado_kg, rolo_congelado_kg, rolo_fatiado_kg) values
  ('2026-07-29', 114.4, 110.2, 108.7, 84.5, 83.5, 83.2),
  ('2026-07-30', 112.6, 109.8, 107.3, 85.6, 84.3, 82.9),
  ('2026-08-03', 120.8, 117.6, 116.9, 92.3, 87.6, 87.4),
  ('2026-08-06', 197.0, 189.9, 188.3, 164.9, 159.3, 158.7),
  ('2026-08-07', 210.8, 209.1, 207.6, 190.2, 184.6, 180.2),
  ('2026-08-10', 113.4, 110.5, 109.9, 94.8, 92.3, 91.5);

grant execute on function get_dashboard_metrics(date, date) to authenticated;
