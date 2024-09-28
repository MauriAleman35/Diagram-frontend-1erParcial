import api, { converToStringfy } from '../../api'
import type { PostUser } from '../interfaces'

export const getByIdUser = async (id: number) => {
  try {
    const resp = await api.get(`/user/${id}`)

    return resp.data
  } catch (error) {
    console.log(error)
  }
}
export const getByEmail = async (email: string) => {
  try {
    const resp = await api.get(`/user/byEmail?email=${email}`)
    return resp.data.data
  } catch (error) {
    console.log(error)
  }
}
export const postUser = async (user: PostUser) => {
  try {
    const obj = {
      name: user.name,
      email: user.email,
      password: user.password
    }
    const resp = api.post('/user/addUser', converToStringfy(obj))
    return resp
  } catch (error) {
    console.log(error)
  }
}
