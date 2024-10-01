export interface DiagramUpdate {
  sessionId: number
  data: object // Nuevos datos para actualizar el diagrama
}
export interface DiagramPost {
  sessionId: number
  data: object // JSON que contiene los diagramas
}
