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
    console.error(error)
    throw error // Lanza el error para que Vue Query lo capture
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
export const exportDiagram = async (sessionId: number, token: string) => {
  try {
    // Realiza la solicitud GET para obtener el archivo ZIP
    const response = await api.get(`/diagrams/export/${sessionId}`, {
      headers: {
        Authorization: `Bearer ${token}`
      },
      responseType: 'blob' // Asegura que la respuesta sea tratada como un archivo binario
    })

    // Crear una URL para el archivo blob
    const url = window.URL.createObjectURL(new Blob([response.data]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', 'diagram_entities.zip') // Nombre del archivo

    // Añadir el enlace temporal al DOM
    document.body.appendChild(link)

    // Simula un clic en el enlace para iniciar la descarga
    link.click()

    // Elimina el enlace solo si todavía está en el DOM
    if (link.parentNode) {
      link.parentNode.removeChild(link)
    }

    // Liberar la URL del blob
    window.URL.revokeObjectURL(url)

    return response // Opcional, devolver la respuesta si se necesita
  } catch (error) {
    console.error('Error al exportar el diagrama:', error)
    throw error
  }
}
