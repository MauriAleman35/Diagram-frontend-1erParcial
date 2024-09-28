import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { getByIdUser, postUser } from '../lib/querys/worskpace/userQuery'
import type { PostUser } from '../lib/querys/interfaces/user'

export function useUsers() {
  const QueryClient = useQueryClient()
  const QueryKey = 'Users'

  const useUserById = (id: number) => {
    return useQuery({
      queryKey: [QueryKey, id], // Pasar el `id` en el queryKey
      queryFn: () => getByIdUser(id), // Pasar el `id` a la función de consulta
      staleTime: 1000 * 60 * 5 // Mantener en caché por 5 minutos
    })
  }
  const createUserMutation = useMutation({
    mutationFn: async (user: PostUser) => postUser(user),
    onSuccess: () => {
      // Invalidamos la query para refrescar los grupos después de crear uno nuevo
      QueryClient.invalidateQueries({ queryKey: [QueryKey] })
    },
    onError: (error) => {
      console.log('Error creando el User:', error)
      // Puedes manejar el error, mostrar notificaciones, etc.
    }
  })

  return {
    getById: useUserById,
    createUser: createUserMutation.mutateAsync
  }
}
