import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabaseClient'
import { geocodeAddress, hasAddress, addressChanged } from '../lib/geocode'

export function useClients(search = '') {
  return useQuery({
    queryKey: ['clients', search],
    queryFn: async () => {
      let query = supabase.from('clients').select('*').order('full_name', { ascending: true })
      if (search) {
        query = query.or(`full_name.ilike.%${search}%,phone.ilike.%${search}%`)
      }
      const { data, error } = await query
      if (error) throw error
      return data
    },
  })
}

export function useClient(id) {
  return useQuery({
    queryKey: ['clients', 'detail', id],
    queryFn: async () => {
      const { data, error } = await supabase.from('clients').select('*').eq('id', id).single()
      if (error) throw error
      return data
    },
    enabled: !!id,
  })
}

async function geocodeAndBuildPatch(fields) {
  if (!hasAddress(fields)) {
    return { geocode_status: 'pending', lat: null, lng: null, geocoded_at: null }
  }
  const result = await geocodeAddress(fields)
  if (result) {
    return {
      lat: result.lat,
      lng: result.lng,
      geocode_status: 'success',
      geocoded_at: new Date().toISOString(),
    }
  }
  return { geocode_status: 'failed', lat: null, lng: null, geocoded_at: null }
}

export function useCreateClient() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (fields) => {
      const geoPatch = await geocodeAndBuildPatch(fields)
      const { data, error } = await supabase
        .from('clients')
        .insert([{ ...fields, ...geoPatch }])
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] })
      queryClient.invalidateQueries({ queryKey: ['clientPurchaseStats'] })
    },
  })
}

export function useUpdateClient() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, fields, previous }) => {
      const geoPatch = addressChanged(previous, fields)
        ? await geocodeAndBuildPatch(fields)
        : {}
      const { data, error } = await supabase
        .from('clients')
        .update({ ...fields, ...geoPatch })
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['clients'] })
      queryClient.invalidateQueries({ queryKey: ['clientPurchaseStats'] })
      queryClient.setQueryData(['clients', 'detail', data.id], data)
    },
  })
}

export function useRetryGeocode() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (client) => {
      const geoPatch = await geocodeAndBuildPatch(client)
      const { data, error } = await supabase
        .from('clients')
        .update(geoPatch)
        .eq('id', client.id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['clients'] })
      queryClient.invalidateQueries({ queryKey: ['clientPurchaseStats'] })
      queryClient.setQueryData(['clients', 'detail', data.id], data)
    },
  })
}
