import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { isEntityLocked, lockEntity, releaseEntity } from '../lib/querys/worskpace/lockQuery'
import type { LockPost, LockRelease } from '@/lib/querys/interfaces/lock'
export function useLock(token: string) {
  const queryClient = useQueryClient()

  // Definimos el QueryKey para evitar duplicados y mejorar el cache
  const QueryKey = 'Lock'

  // Query para verificar si una entidad está bloqueada
  const isLockedQuery = (sessionId: number, entityKey: number) =>
    useQuery({
      queryKey: [QueryKey, sessionId, entityKey], // Usamos QueryKey con sessionId y entityKey
      queryFn: () => isEntityLocked(sessionId, entityKey, token)
    })

  // Mutación para bloquear una entidad
  const lockEntityMutation = useMutation({
    mutationFn: (lock: LockPost) => lockEntity(lock, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QueryKey] }) // Invalidar la query para refrescar el estado de bloqueo
    },
    onError: (error) => {
      console.log('Error al bloquear la entidad:', error)
    }
  })

  // Mutación para liberar una entidad
  const releaseEntityMutation = useMutation({
    mutationFn: (lock: LockRelease) => releaseEntity(lock, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QueryKey] }) // Invalidar la query para refrescar el estado de bloqueo
    },
    onError: (error) => {
      console.log('Error al liberar la entidad:', error)
    }
  })

  return {
    isLockedQuery,
    lockEntity: lockEntityMutation.mutateAsync,
    releaseEntity: releaseEntityMutation.mutateAsync
  }
}
