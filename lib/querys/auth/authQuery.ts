import router from '@/routes'
import api from '../../api'
import type { AuthI } from '../interfaces/auth'

export const Login = async (auth: AuthI) => {
  try {
    const resp = await api.post('/auth/login', auth)
    const token = resp.data.data.token
    console.log(token, 'token recibido')
    if (token !== null) {
      localStorage.setItem('token', token)
      console.log(localStorage.getItem('token'), 'token guardado')
    }
    return resp.data
  } catch (error) {
    console.log(error)
  }
}

export const logout = () => {
  localStorage.removeItem('token')
  router.push('/')
}
