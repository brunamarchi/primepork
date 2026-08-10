import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabaseClient'

export function useDashboardMetrics(from, to) {
  return useQuery({
    queryKey: ['dashboardMetrics', from, to],
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc('get_dashboard_metrics', { p_date_from: from, p_date_to: to })
        .single()
      if (error) throw error
      return data
    },
    enabled: !!from && !!to,
  })
}
