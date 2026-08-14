import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabaseClient'

export function useStockLedger() {
  return useQuery({
    queryKey: ['stockLedger'],
    queryFn: async () => {
      const { data, error } = await supabase.from('stock_ledger').select('*').order('ledger_date', { ascending: false })
      if (error) throw error
      return data
    },
  })
}
