import axios from 'axios'

const baseURL = import.meta.env.VITE_API_BASE_URL

export const converToStringfy = (obj: any): string => {
  return JSON.stringify(obj)
}

const api = axios.create({
  baseURL,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json'
  },
  withCredentials: true
})

export default api
