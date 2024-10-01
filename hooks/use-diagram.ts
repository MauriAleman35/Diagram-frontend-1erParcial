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
  const getDiagramBySessionQuery = (sessionId: number) => {
    return useQuery({
      queryKey: [QueryKey, 'session', sessionId], // Clave única para identificar la query
      queryFn: () => getDiagramBySession(sessionId, token), // Pasar el token
      staleTime: 1000 * 60 * 5 // Opcional: Mantener en caché por 5 minutos
    })
  }

  // Crear un nuevo diagrama
  const createDiagramMutation = useMutation({
    mutationFn: async (diagram: DiagramPost) => createDiagram(diagram, token),
    onSuccess: () => {
      // Invalidar la cache para refrescar datos después de la creación
      queryClient.invalidateQueries({ queryKey: [QueryKey] })
    },
    onError: (error) => {
      console.log('Error creando el diagrama:', error)
    }
  })

  // Actualizar un diagrama existente
  const updateDiagramMutation = useMutation({
    mutationFn: async (updatedDiagram: DiagramUpdate) => {
      // Aquí debes asegurarte de que `updatedDiagram` tenga `sessionId`
      if (!updatedDiagram.sessionId) {
        throw new Error('El objeto DiagramUpdate no contiene sessionId')
      }
      return updateDiagram(updatedDiagram, token)
    },
    onSuccess: (data, updatedDiagram) => {
      // Usa el sessionId de `updatedDiagram` para invalidar la query correcta
      queryClient.invalidateQueries({ queryKey: [QueryKey, 'session', updatedDiagram.sessionId] })
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
