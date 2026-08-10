/**
 * Deriva o status de pagamento exibido ("pago" | "previsto" | "atrasado") a
 * partir de payment_status + payment_due_date — "atrasado" nunca é
 * persistido, só calculado no momento da leitura contra a data de hoje.
 */
export function getDisplayPaymentStatus(order, today = new Date()) {
  if (order.payment_status === 'pago') return 'pago'
  if (order.payment_due_date) {
    const due = new Date(order.payment_due_date + 'T00:00:00')
    const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    if (due < todayMidnight) return 'atrasado'
  }
  return 'previsto'
}

export const PAYMENT_STATUS_LABELS = {
  pago: 'Pago',
  previsto: 'Previsto',
  atrasado: 'Atrasado',
}

export const PAYMENT_STATUS_CLASSES = {
  pago: 'bg-success/15 text-success',
  previsto: 'bg-hairline text-muted',
  atrasado: 'bg-danger/15 text-danger',
}
