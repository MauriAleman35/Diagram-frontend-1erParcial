import api, { converToStringfy } from '../../api'
import type { sessionPost } from '../interfaces/session'

export const createSession = async (session: sessionPost, token: string) => {
  try {
    const obj = {
      name: session.name,
      description: session.description,
      idHost: session.idHost
    }
    return await api.post('/session/create', converToStringfy(obj), {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
  } catch (error) {
    console.log(error)
  }
}
