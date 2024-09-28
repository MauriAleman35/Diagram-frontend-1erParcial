export interface sessionPost {
  name: string
  description: string
  idHost: number
}
export interface SessionsI {
  id: number
  name: string
  description: string
  createdAt: Date
  userSessions: any[]
  diagrams: any[]
}
