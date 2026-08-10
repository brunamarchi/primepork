const MS_PER_DAY = 24 * 60 * 60 * 1000

export const STATUS_COLORS = {
  neutral: '#8a7b6f',
  green: '#3a7d44',
  yellow: '#d9a441',
  red: '#c0392b',
}

/**
 * Deriva o status de recompra de um cliente a partir de client_purchase_stats.
 * Retorna { status, predictedDate, daysUntilPredicted } — status é uma das
 * chaves de STATUS_COLORS.
 */
export function getClientRepurchaseStatus(stats, today = new Date()) {
  if (!stats || stats.order_count < 2 || stats.avg_interval_days == null) {
    return { status: 'neutral', predictedDate: null, daysUntilPredicted: null }
  }

  const lastOrder = new Date(stats.last_order_date + 'T00:00:00')
  const predictedDate = new Date(lastOrder.getTime() + stats.avg_interval_days * MS_PER_DAY)

  const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const daysUntilPredicted = Math.round((predictedDate.getTime() - todayMidnight.getTime()) / MS_PER_DAY)

  let status
  if (daysUntilPredicted < 0) status = 'red'
  else if (daysUntilPredicted <= 10) status = 'yellow'
  else status = 'green'

  return { status, predictedDate, daysUntilPredicted }
}
