import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import {
  getDiagramBySession,
  createDiagram,
  updateDiagram
} from '../lib/querys/worskpace/diagramQuery'
import type { DiagramPost, DiagramUpdate } from '../lib/querys/interfaces/diagram'

export function useDiagrams(token: string) {
  const queryClient = useQueryClient()
  const QueryKey = 'Diagrams'

  // Obtener diagrama por ID de sesión
  const getDiagramBySessionQuery = (sessionId: number) =>
    useQuery({
      queryKey: [QueryKey, 'session', sessionId],
      queryFn: () => getDiagramBySession(sessionId, token),
      staleTime: 1000 * 60 * 5 // 5 minutos de caché
    })

  // Crear un nuevo diagrama
  const createDiagramMutation = useMutation({
    mutationFn: (diagram: DiagramPost) => createDiagram(diagram, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QueryKey] })
    },
    onError: (error) => {
      console.log('Error creando el diagrama:', error)
    }
  })

  // Actualizar un diagrama existente
  const updateDiagramMutation = useMutation({
    mutationFn: (updatedDiagram: DiagramUpdate) => {
      if (!updatedDiagram.sessionId) {
        throw new Error('El objeto DiagramUpdate no contiene sessionId')
      }
      return updateDiagram(updatedDiagram, token)
    },
    onSuccess: (data, updatedDiagram) => {
      queryClient.invalidateQueries({
        queryKey: [QueryKey, 'session', updatedDiagram.sessionId]
      })
    },
    onError: (error) => {
      console.log('Error actualizando el diagrama:', error)
    }
  })

  return {
    getDiagramBySessionQuery,
    createDiagramMutation,
    updateDiagramMutation
  }
}
