import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabaseClient'
import { getClientRepurchaseStatus } from '../lib/clientStatus'

export function useClientPurchaseStats() {
  return useQuery({
    queryKey: ['clientPurchaseStats'],
    queryFn: async () => {
      const { data, error } = await supabase.from('client_purchase_stats').select('*')
      if (error) throw error
      return data
    },
  })
}

export function useClientPurchaseStat(clientId) {
  const { data, ...rest } = useClientPurchaseStats()
  return { data: data?.find((s) => s.client_id === clientId), ...rest }
}

/** Conta clientes por status de recompra (verde/amarelo/vermelho/neutro) — usado no Mapa e no Dashboard. */
export function useClientRiskSummary() {
  const { data: stats, ...rest } = useClientPurchaseStats()

  const counts = useMemo(() => {
    const result = { green: 0, yellow: 0, red: 0, neutral: 0 }
    for (const s of stats ?? []) {
      result[getClientRepurchaseStatus(s).status] += 1
    }
    return result
  }, [stats])

  return { data: counts, ...rest }
}
