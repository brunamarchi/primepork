import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabaseClient'

export function usePurchases() {
  return useQuery({
    queryKey: ['purchases'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('purchases')
        .select('*')
        .order('purchase_date', { ascending: false })
        .order('created_at', { ascending: false })
      if (error) throw error
      return data
    },
  })
}

export function usePurchase(id) {
  return useQuery({
    queryKey: ['purchases', 'detail', id],
    queryFn: async () => {
      const { data, error } = await supabase.from('purchases').select('*').eq('id', id).single()
      if (error) throw error
      return data
    },
    enabled: !!id,
  })
}

export function useCreatePurchase() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (fields) => {
      const { data, error } = await supabase.from('purchases').insert([fields]).select().single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchases'] })
      queryClient.invalidateQueries({ queryKey: ['stockSummary'] })
      queryClient.invalidateQueries({ queryKey: ['dashboardMetrics'] })
    },
  })
}

export function useUpdatePurchase() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, fields }) => {
      const { data, error } = await supabase.from('purchases').update(fields).eq('id', id).select().single()
      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['purchases'] })
      queryClient.invalidateQueries({ queryKey: ['stockSummary'] })
      queryClient.invalidateQueries({ queryKey: ['dashboardMetrics'] })
      queryClient.setQueryData(['purchases', 'detail', data.id], data)
    },
  })
}
