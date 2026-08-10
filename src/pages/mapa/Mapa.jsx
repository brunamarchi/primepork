import { useMemo } from 'react'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { Link } from 'react-router-dom'
import AppShell from '../../components/layout/AppShell'
import Spinner from '../../components/ui/Spinner'
import ErrorBanner from '../../components/ui/ErrorBanner'
import { useClients } from '../../hooks/useClients'
import { useClientPurchaseStats } from '../../hooks/useClientPurchaseStats'
import { getClientRepurchaseStatus, STATUS_COLORS } from '../../lib/clientStatus'
import { whatsappLink } from '../../lib/whatsapp'

const BRAZIL_CENTER = [-14.235, -51.9253]

function pinIcon(color) {
  return L.divIcon({
    className: '',
    html: `<span style="display:block;width:18px;height:18px;border-radius:50%;background:${color};border:2px solid white;box-shadow:0 1px 3px rgba(0,0,0,0.4)"></span>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
    popupAnchor: [0, -9],
  })
}

function formatDate(iso) {
  if (!iso) return '—'
  return new Date(iso + 'T00:00:00').toLocaleDateString('pt-BR')
}

export default function Mapa() {
  const { data: clients, isLoading: loadingClients, error } = useClients()
  const { data: stats } = useClientPurchaseStats()

  const located = useMemo(() => clients?.filter((c) => c.geocode_status === 'success' && c.lat != null) ?? [], [clients])
  const unlocated = (clients?.length ?? 0) - located.length
  const statsByClient = useMemo(() => Object.fromEntries((stats ?? []).map((s) => [s.client_id, s])), [stats])

  return (
    <AppShell title="Mapa de clientes">
      <ErrorBanner message={error?.message} />
      {loadingClients && <Spinner />}

      {!loadingClients && (
        <>
          <div className="mb-3 flex flex-wrap gap-3 text-xs text-muted">
            <Legend color={STATUS_COLORS.neutral} label="Sem histórico" />
            <Legend color={STATUS_COLORS.green} label="No prazo" />
            <Legend color={STATUS_COLORS.yellow} label="Recompra próxima" />
            <Legend color={STATUS_COLORS.red} label="Atrasado" />
          </div>

          {unlocated > 0 && (
            <p className="mb-3 text-xs text-muted">
              {unlocated} cliente{unlocated === 1 ? '' : 's'} sem localização —{' '}
              <Link to="/clientes" className="text-primary underline">
                ver clientes
              </Link>
            </p>
          )}

          <div className="overflow-hidden rounded-card border border-hairline" style={{ height: '65vh' }}>
            <MapContainer center={BRAZIL_CENTER} zoom={4} style={{ height: '100%', width: '100%' }}>
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {located.map((client) => {
                const clientStats = statsByClient[client.id]
                const { status, daysUntilPredicted } = getClientRepurchaseStatus(clientStats)
                return (
                  <Marker key={client.id} position={[client.lat, client.lng]} icon={pinIcon(STATUS_COLORS[status])}>
                    <Popup>
                      <div className="text-sm">
                        <p className="font-semibold">{client.full_name}</p>
                        <p className="text-xs text-gray-600">{client.phone}</p>
                        {clientStats?.order_count > 0 ? (
                          <div className="mt-1 text-xs">
                            <p>Última compra: {formatDate(clientStats.last_order_date)}</p>
                            <p>Quantidade: {clientStats.last_order_weight_kg} kg</p>
                            {clientStats.avg_interval_days != null ? (
                              <p>
                                Intervalo médio: {Math.round(clientStats.avg_interval_days)} dias
                                {daysUntilPredicted != null &&
                                  (daysUntilPredicted >= 0
                                    ? ` · próxima em ~${daysUntilPredicted}d`
                                    : ` · atrasado ${Math.abs(daysUntilPredicted)}d`)}
                              </p>
                            ) : (
                              <p>Sem dados suficientes para prever recompra.</p>
                            )}
                          </div>
                        ) : (
                          <p className="mt-1 text-xs">Nenhuma compra registrada.</p>
                        )}
                        <div className="mt-2 flex items-center gap-3">
                          <Link to={`/clientes/${client.id}`} className="text-xs text-blue-600 underline">
                            Ver cliente
                          </Link>
                          {whatsappLink(client.phone) && (
                            <a
                              href={whatsappLink(client.phone)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 rounded-full bg-[#25D366] px-2 py-1 text-xs font-medium text-white"
                            >
                              Falar no WhatsApp
                            </a>
                          )}
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                )
              })}
            </MapContainer>
          </div>
        </>
      )}
    </AppShell>
  )
}

function Legend({ color, label }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: color }} />
      {label}
    </span>
  )
}
