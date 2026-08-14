const ADDRESS_FIELDS = ['address_street', 'address_neighborhood', 'address_zip']

const MIN_INTERVAL_MS = 1100
let lastRequestAt = 0

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function throttle() {
  const wait = MIN_INTERVAL_MS - (Date.now() - lastRequestAt)
  if (wait > 0) await sleep(wait)
  lastRequestAt = Date.now()
}

export function hasAddress(fields) {
  return ADDRESS_FIELDS.some((key) => (fields[key] ?? '').toString().trim().length > 0)
}

export function addressChanged(previous, next) {
  if (!previous) return true
  return ADDRESS_FIELDS.some((key) => (previous[key] ?? '') !== (next[key] ?? ''))
}

function buildQuery(fields) {
  const parts = [fields.address_street, fields.address_neighborhood, fields.address_zip, 'Brasil'].filter(Boolean)
  return parts.join(', ')
}

/**
 * Geocodifica um endereço via Nominatim (OpenStreetMap).
 * Retorna { lat, lng } em caso de sucesso, ou null em caso de falha/sem resultado.
 */
export async function geocodeAddress(fields) {
  const q = buildQuery(fields)
  if (!q) return null

  await throttle()

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 8000)

  try {
    const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&countrycodes=br&q=${encodeURIComponent(q)}`
    const res = await fetch(url, { signal: controller.signal })
    if (!res.ok) return null
    const results = await res.json()
    if (!results.length) return null
    return { lat: parseFloat(results[0].lat), lng: parseFloat(results[0].lon) }
  } catch {
    return null
  } finally {
    clearTimeout(timeout)
  }
}
