import { useMemo } from 'react'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts'
import Card from '../ui/Card'
import { getDisplayPaymentStatus } from '../../lib/paymentStatus'

const COLORS = {
  primary: '#16274d',
  accent: '#ff6a3d',
  success: '#2f9e58',
  warning: '#d9a441',
  danger: '#e04545',
  muted: '#8890a4',
}

const STAGE_LINES = [
  { key: 'panceta_congelada_kg', label: 'Panceta congelada', color: '#8890a4' },
  { key: 'panceta_descongelada_kg', label: 'Panceta descongelada', color: '#d9a441' },
  { key: 'panceta_temperada_kg', label: 'Panceta temperada', color: '#ff6a3d' },
  { key: 'rolo_assado_kg', label: 'Rolo assado', color: '#16274d' },
  { key: 'rolo_congelado_kg', label: 'Rolo congelado', color: '#2f9e58' },
  { key: 'rolo_fatiado_kg', label: 'Rolo fatiado', color: '#e04545' },
]

function formatMoney(value) {
  return Number(value ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function formatDateShort(iso) {
  const d = new Date(iso + 'T00:00:00')
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
}

function EmptyChart({ message }) {
  return <p className="flex h-[220px] items-center justify-center text-center text-sm text-muted">{message}</p>
}

export default function DashboardCharts({ periodOrders, allOrders, ledger, production }) {
  const revenueByDay = useMemo(() => {
    const map = new Map()
    for (const o of periodOrders ?? []) {
      map.set(o.order_date, (map.get(o.order_date) ?? 0) + Number(o.total_price))
    }
    return [...map.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, total]) => ({ date, label: formatDateShort(date), total }))
  }, [periodOrders])

  const topClients = useMemo(() => {
    const map = new Map()
    for (const o of periodOrders ?? []) {
      const name = o.client?.full_name ?? 'Cliente removido'
      map.set(name, (map.get(name) ?? 0) + Number(o.total_price))
    }
    return [...map.entries()]
      .sort(([, a], [, b]) => b - a)
      .slice(0, 8)
      .map(([name, total]) => ({ name: name.length > 22 ? name.slice(0, 22) + '…' : name, total }))
      .reverse()
  }, [periodOrders])

  const stockTrend = useMemo(
    () =>
      [...(ledger ?? [])]
        .sort((a, b) => a.ledger_date.localeCompare(b.ledger_date))
        .map((row) => ({ date: row.ledger_date, label: formatDateShort(row.ledger_date), saldo: Number(row.closing_balance_kg) })),
    [ledger],
  )

  const paymentBreakdown = useMemo(() => {
    let pago = 0,
      previsto = 0,
      atrasado = 0
    for (const o of allOrders ?? []) {
      const status = getDisplayPaymentStatus(o)
      const value = Number(o.total_price)
      if (status === 'pago') pago += value
      else if (status === 'atrasado') atrasado += value
      else previsto += value
    }
    return [
      { name: 'Pago', value: pago, color: COLORS.success },
      { name: 'Previsto', value: previsto, color: COLORS.muted },
      { name: 'Atrasado', value: atrasado, color: COLORS.danger },
    ].filter((d) => d.value > 0)
  }, [allOrders])

  const productionTrend = useMemo(
    () =>
      [...(production ?? [])]
        .sort((a, b) => a.production_date.localeCompare(b.production_date))
        .map((row) => ({
          date: row.production_date,
          label: formatDateShort(row.production_date),
          ...Object.fromEntries(STAGE_LINES.map(({ key }) => [key, row[key] != null ? Number(row[key]) : null])),
        })),
    [production],
  )

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm font-semibold text-ink">Gráficos</p>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <p className="mb-3 text-sm font-semibold text-ink">Receita por dia (período selecionado)</p>
          {revenueByDay.length === 0 ? (
            <EmptyChart message="Sem vendas no período selecionado." />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={revenueByDay} margin={{ left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e9ebf2" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: COLORS.muted }} axisLine={{ stroke: '#e9ebf2' }} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: COLORS.muted }} axisLine={false} tickLine={false} width={40} />
                <Tooltip formatter={(v) => formatMoney(v)} labelFormatter={(l) => l} contentStyle={{ borderRadius: 12, fontSize: 12 }} />
                <Bar dataKey="total" name="Receita" fill={COLORS.primary} radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>

        <Card>
          <p className="mb-3 text-sm font-semibold text-ink">Top clientes por receita (período selecionado)</p>
          {topClients.length === 0 ? (
            <EmptyChart message="Sem vendas no período selecionado." />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={topClients} layout="vertical" margin={{ left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e9ebf2" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: COLORS.muted }} axisLine={false} tickLine={false} />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fontSize: 11, fill: COLORS.muted }}
                  axisLine={false}
                  tickLine={false}
                  width={110}
                />
                <Tooltip formatter={(v) => formatMoney(v)} contentStyle={{ borderRadius: 12, fontSize: 12 }} />
                <Bar dataKey="total" name="Receita" fill={COLORS.accent} radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>

        <Card>
          <p className="mb-3 text-sm font-semibold text-ink">Saldo de estoque (livro-razão da planilha)</p>
          {stockTrend.length === 0 ? (
            <EmptyChart message="Sem histórico de estoque importado." />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={stockTrend} margin={{ left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e9ebf2" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: COLORS.muted }} axisLine={{ stroke: '#e9ebf2' }} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: COLORS.muted }} axisLine={false} tickLine={false} width={40} />
                <Tooltip formatter={(v) => `${Number(v).toFixed(1)} kg`} contentStyle={{ borderRadius: 12, fontSize: 12 }} />
                <Line type="monotone" dataKey="saldo" name="Saldo (kg)" stroke={COLORS.primary} strokeWidth={2.5} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </Card>

        <Card>
          <p className="mb-3 text-sm font-semibold text-ink">Status de pagamento (todos os pedidos)</p>
          {paymentBreakdown.length === 0 ? (
            <EmptyChart message="Sem pedidos registrados." />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={paymentBreakdown} dataKey="value" nameKey="name" innerRadius={55} outerRadius={80} paddingAngle={2}>
                  {paymentBreakdown.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => formatMoney(v)} contentStyle={{ borderRadius: 12, fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </Card>

        <Card className="lg:col-span-2">
          <p className="mb-3 text-sm font-semibold text-ink">Produção diária por etapa</p>
          {productionTrend.length === 0 ? (
            <EmptyChart message="Sem produção lançada." />
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={productionTrend} margin={{ left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e9ebf2" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: COLORS.muted }} axisLine={{ stroke: '#e9ebf2' }} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: COLORS.muted }} axisLine={false} tickLine={false} width={40} />
                <Tooltip formatter={(v) => `${Number(v).toFixed(1)} kg`} contentStyle={{ borderRadius: 12, fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                {STAGE_LINES.map(({ key, label, color }) => (
                  <Line key={key} type="monotone" dataKey={key} name={label} stroke={color} strokeWidth={2} dot={{ r: 2.5 }} connectNulls />
                ))}
              </LineChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>
    </div>
  )
}
