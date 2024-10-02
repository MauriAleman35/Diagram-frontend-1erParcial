import { useMutation, useQueryClient } from '@tanstack/vue-query'
import type { sessionPost } from '../lib/querys/interfaces/session'
import { createSession } from '../lib/querys/worskpace/sessionQuery'

export function useSession(token: string) {
  const queryClient = useQueryClient()
  const QueryKey = 'Session'

  const createSessionMutation = useMutation({
    mutationFn: async (session: sessionPost) => createSession(session, token),
    onSuccess: () => {
      // Invalidamos la query para refrescar los grupos después de crear uno nuevo
      queryClient.invalidateQueries({ queryKey: ['hostSessions'] })
    },
    onError: (error) => {
      console.log('Error la session:', error)
      // Puedes manejar el error, mostrar notificaciones, etc.
    }
  })
  return {
    createSession: createSessionMutation.mutateAsync
  }
}
