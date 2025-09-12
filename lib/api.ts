import axios from 'axios'

const baseURL = import.meta.env.VITE_API_BASE_URL
console.log('Base URL:', baseURL) // Verifica que la variable de entorno se esté leyendo correctamente
export const converToStringfy = (obj: any): string => {
  return JSON.stringify(obj)
}

const api = axios.create({
  baseURL,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json'
  },
  withCredentials: false
})

export default api
