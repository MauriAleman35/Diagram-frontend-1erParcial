import axios from 'axios'
const baseURL = 'http://localhost:3000/api'

export const converToStringfy = (obj: any): string => {
  return JSON.stringify(obj)
}

const api = axios.create({
  baseURL,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json'
  }
})

export default api