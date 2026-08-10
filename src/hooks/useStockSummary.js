import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabaseClient'

export function useStockSummary() {
  return useQuery({
    queryKey: ['stockSummary'],
    queryFn: async () => {
      const { data, error } = await supabase.from('stock_summary').select('*').single()
      if (error) throw error
      return data
    },
  })
}
