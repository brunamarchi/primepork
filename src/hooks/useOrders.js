import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabaseClient'

export function useOrders(statusFilter = 'todos') {
  return useQuery({
    queryKey: ['orders', statusFilter],
    queryFn: async () => {
      let query = supabase
        .from('orders')
        .select('*, client:clients(id, full_name, phone)')
        .order('order_date', { ascending: false })
        .order('created_at', { ascending: false })
      if (statusFilter !== 'todos') {
        query = query.eq('status', statusFilter)
      }
      const { data, error } = await query
      if (error) throw error
      return data
    },
  })
}

export function useOrder(id) {
  return useQuery({
    queryKey: ['orders', 'detail', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('*, client:clients(id, full_name, phone)')
        .eq('id', id)
        .single()
      if (error) throw error
      return data
    },
    enabled: !!id,
  })
}

function invalidateAll(queryClient) {
  queryClient.invalidateQueries({ queryKey: ['orders'] })
  queryClient.invalidateQueries({ queryKey: ['stockSummary'] })
  queryClient.invalidateQueries({ queryKey: ['dashboardMetrics'] })
  queryClient.invalidateQueries({ queryKey: ['clientPurchaseStats'] })
}

export function useCreateOrder() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (fields) => {
      const { data, error } = await supabase.from('orders').insert([fields]).select().single()
      if (error) throw error
      return data
    },
    onSuccess: () => invalidateAll(queryClient),
  })
}

export function useUpdateOrder() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, fields }) => {
      const { data, error } = await supabase.from('orders').update(fields).eq('id', id).select().single()
      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      invalidateAll(queryClient)
      queryClient.setQueryData(['orders', 'detail', data.id], data)
    },
  })
}

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, status }) => {
      const patch = { status, delivered_at: status === 'entregue' ? new Date().toISOString() : null }
      const { data, error } = await supabase.from('orders').update(patch).eq('id', id).select().single()
      if (error) throw error
      return data
    },
    onSuccess: () => invalidateAll(queryClient),
  })
}
