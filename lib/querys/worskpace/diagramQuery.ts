import api, { converToStringfy } from '../../api'
import type { DiagramPost, DiagramUpdate } from '../interfaces/diagram'

export const getDiagramBySession = async (sessionId: number, token: string) => {
  try {
    return await api.get(`/diagrams/session/${sessionId}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
  } catch (error) {
    console.log(error)
  }
}

export const createDiagram = async (diagram: DiagramPost, token: string) => {
  try {
    const obj = {
      sessionId: diagram.sessionId,
      data: diagram.data
    }
    return await api.post('/diagrams/create', converToStringfy(obj), {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
  } catch (error) {
    console.log(error)
  }
}

export const updateDiagram = async (diagram: DiagramUpdate, token: string) => {
  try {
    const obj = {
      data: diagram.data
    }
    return await api.put(`/diagrams/update/${diagram.sessionId}`, converToStringfy(obj), {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
  } catch (error) {
    console.log(error)
  }
}
