export interface LockPost {
  diagramId: number
  userId: number
  entityKey: number // Clave de la entidad que deseas bloquear
}

export interface LockRelease {
  diagramId: number
  userId: number
  entityKey: number
}
