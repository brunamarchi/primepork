function toISODate(date) {
  return date.toISOString().slice(0, 10)
}

export const PERIOD_PRESETS = [
  { key: 'hoje', label: 'Hoje' },
  { key: 'semana', label: 'Semana' },
  { key: 'mes', label: 'Mês' },
  { key: 'ano', label: 'Ano' },
  { key: 'personalizado', label: 'Personalizado' },
]

export function rangeForPreset(preset, custom) {
  const today = new Date()
  const todayISO = toISODate(today)

  if (preset === 'hoje') {
    return { from: todayISO, to: todayISO }
  }

  if (preset === 'semana') {
    const day = today.getDay() === 0 ? 7 : today.getDay() // ISO: segunda = 1
    const monday = new Date(today)
    monday.setDate(today.getDate() - (day - 1))
    return { from: toISODate(monday), to: todayISO }
  }

  if (preset === 'mes') {
    const first = new Date(today.getFullYear(), today.getMonth(), 1)
    return { from: toISODate(first), to: todayISO }
  }

  if (preset === 'ano') {
    const first = new Date(today.getFullYear(), 0, 1)
    return { from: toISODate(first), to: todayISO }
  }

  return custom ?? { from: todayISO, to: todayISO }
}
