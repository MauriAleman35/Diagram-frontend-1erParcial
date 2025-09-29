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
/** Intenta extraer el filename del header Content-Disposition */
function parseFilenameFromDisposition(disposition: string | null): string | null {
  if (!disposition) return null
  // ejemplos:
  // attachment; filename="diagram_session_123_20250101_120000.xmi"
  // attachment; filename*=UTF-8''diagram_session_123_20250101_120000.xmi
  const m1 = /filename\*=(?:UTF-8''|)([^;]+)/i.exec(disposition)
  if (m1 && m1[1]) return decodeURIComponent(m1[1].replace(/"/g, '').trim())
  const m2 = /filename=(.*?)(?:;|$)/i.exec(disposition)
  if (m2 && m2[1]) return m2[1].replace(/"/g, '').trim()
  return null
}

/**
 * Descarga el XMI (EA) del diagrama de una sesión.
 * GET /diagrams/export-xmi/{sessionId}
 */
export async function exportDiagramXmi(sessionId: number, token: string): Promise<void> {
  const url = `/diagrams/export-xmi/${sessionId}`

  const res = await api.get<Blob>(url, {
    headers: {
      Authorization: `Bearer ${token}`
    },
    responseType: 'blob'
  })

  // intenta usar el nombre que manda el backend
  // (OJO: necesitas exponer el header en el backend: Access-Control-Expose-Headers: Content-Disposition)
  const cd = (res.headers as any)['content-disposition'] ?? null
  const filename = parseFilenameFromDisposition(cd) ?? `diagram_session_${sessionId}.xmi`

  // fuerza extensión .xmi por si el servidor no envía content-type correcto
  const blob =
    res.data instanceof Blob ? res.data : new Blob([res.data], { type: 'application/xml' })
  const href = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = href
  a.download = filename.endsWith('.xmi') ? filename : `${filename}.xmi`
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(href)
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
    const response = await api.get(`/diagrams/export/${sessionId}`, {
      // Cambiar la URL
      headers: {
        Authorization: `Bearer ${token}`
      },
      responseType: 'blob'
    })

    const url = window.URL.createObjectURL(new Blob([response.data]))
    const link = document.createElement('a')
    link.href = url

    // Generar nombre dinámico con timestamp
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-')
    link.setAttribute('download', `jhipster_backend_session_${sessionId}_${timestamp}.zip`)

    document.body.appendChild(link)
    link.click()

    if (link.parentNode) {
      link.parentNode.removeChild(link)
    }

    window.URL.revokeObjectURL(url)
    return response
  } catch (error) {
    console.error('Error al exportar el diagrama:', error)
    throw error
  }
}
export const exportFrontendZip = async (sessionId: number, token: string): Promise<void> => {
  try {
    const res = await api.get(`/frontend/export/${sessionId}`, {
      headers: { Authorization: `Bearer ${token}` },
      responseType: 'blob'
    })

    const cd = (res.headers as any)['content-disposition'] ?? null
    const filename = parseFilenameFromDisposition(cd) ?? `frontend_session_${sessionId}.zip`

    const blob = res.data as Blob
    const href = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = href
    a.download = filename.endsWith('.zip') ? filename : `${filename}.zip`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(href)
  } catch (err: any) {
    // ⬇️ muestra el texto JSON del backend aunque sea blob
    if (err?.response?.data instanceof Blob) {
      const text = await err.response.data.text().catch(() => '')
      console.error('Export frontend 500 ->', text || err)
      try {
        const parsed = JSON.parse(text)
        alert(parsed.message || text)
      } catch {
        alert(text || 'Error al exportar frontend')
      }
    } else {
      console.error('Export frontend error:', err)
      alert('Error al exportar frontend')
    }
    throw err
  }
}
