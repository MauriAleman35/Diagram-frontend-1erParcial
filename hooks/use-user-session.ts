import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import {
  getCollaboratorSession,
  getSessionsAsHost,
  getSessionsAsCollaborator,
  getInvitationPendient,
  createInvitation,
  PostacceptInvitation
} from '../lib/querys/worskpace/userSessionQuery'
import type { acceptInvitation, postInvitation } from '../lib/querys/interfaces/userSession'

export function useUserSession(token: string) {
  const queryClient = useQueryClient()
  const QueryKey = 'UserSession'

  const getCollaboratorSessionQuery = (id: number) => {
    return useQuery({
      queryKey: [QueryKey, 'collaborator', id], // Clave única para identificar la query
      queryFn: () => getCollaboratorSession(id, token), // Pasar el token
      staleTime: 1000 * 60 * 5 // Opcional: Mantener en caché por 5 minutos
    })
  }

  const getSessionsAsHostQuery = (id: number) => {
    return useQuery({
      queryKey: [QueryKey, 'host', id], // Clave única
      queryFn: () => getSessionsAsHost(id, token), // Pasar el token
      staleTime: 1000 * 60 * 5 // Opcional
    })
  }

  const getSessionsAsCollaboratorQuery = (id: number) => {
    return useQuery({
      queryKey: [QueryKey, 'collaboratorSessions', id], // Clave única
      queryFn: () => getSessionsAsCollaborator(id, token), // Pasar el token
      staleTime: 1000 * 60 * 5 // Opcional
    })
  }

  const getInvitationPendientQuery = (id: number) => {
    return useQuery({
      queryKey: [QueryKey], // Clave única
      queryFn: () => getInvitationPendient(id, token),
      // Pasar el token
      staleTime: 1000 * 60 * 5 // Opcional
    })
  }

  const createInvitationMutation = useMutation({
    mutationFn: async (invitation: postInvitation) => createInvitation(invitation, token),
    onSuccess: () => {
      // Invalidamos la cache para refrescar después de crear una nueva invitación
      queryClient.invalidateQueries({ queryKey: [QueryKey] })
    },
    onError: (error) => {
      console.log('Error creando la invitación:', error)
    }
  })

  const acceptInvitationMutation = useMutation({
    mutationFn: async (invitation: acceptInvitation) => PostacceptInvitation(invitation, token),
    onSuccess: () => {
      // Invalidamos la cache para refrescar después de aceptar la invitación
      queryClient.invalidateQueries({ queryKey: [QueryKey] })
    },
    onError: (error) => {
      console.log('Error aceptando la invitación:', error)
    }
  })

  return {
    getCollaboratorSessionQuery,
    getSessionsAsHostQuery,
    getSessionsAsCollaboratorQuery,
    getInvitationPendientQuery,
    createInvitationMutation,
    acceptInvitationMutation
  }
}
