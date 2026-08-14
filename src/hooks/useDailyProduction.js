import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabaseClient'

export function useDailyProductionList() {
  return useQuery({
    queryKey: ['dailyProduction'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('daily_production')
        .select('*')
        .order('production_date', { ascending: false })
      if (error) throw error
      return data
    },
  })
}

export function useDailyProductionEntry(id) {
  return useQuery({
    queryKey: ['dailyProduction', 'detail', id],
    queryFn: async () => {
      const { data, error } = await supabase.from('daily_production').select('*').eq('id', id).single()
      if (error) throw error
      return data
    },
    enabled: !!id,
  })
}

export function useCreateDailyProduction() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (fields) => {
      const { data, error } = await supabase.from('daily_production').insert([fields]).select().single()
      if (error) throw error
      return data
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['dailyProduction'] }),
  })
}

export function useUpdateDailyProduction() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, fields }) => {
      const { data, error } = await supabase.from('daily_production').update(fields).eq('id', id).select().single()
      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['dailyProduction'] })
      queryClient.setQueryData(['dailyProduction', 'detail', data.id], data)
    },
  })
}
