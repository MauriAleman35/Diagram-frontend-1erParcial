import api, { converToStringfy } from '../../api'
import type { LockPost, LockRelease } from '../interfaces/lock'

export const isEntityLocked = async (sessionId: number, entityKey: number, token: string) => {
  try {
    return await api.get(`/lock/isLocked`, {
      params: {
        diagramId: sessionId,
        entityKey: entityKey
      },
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
  } catch (error) {
    console.log(error)
  }
}

export const lockEntity = async (lock: LockPost, token: string) => {
  try {
    const obj = {
      diagramId: lock.diagramId,
      userId: lock.userId,
      entityKey: lock.entityKey
    }
    return await api.post('/lock/create', converToStringfy(obj), {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
  } catch (error) {
    console.log(error)
  }
}

export const releaseEntity = async (lock: LockRelease, token: string) => {
  try {
    const obj = {
      diagramId: lock.diagramId,
      userId: lock.userId,
      entityKey: lock.entityKey
    }
    return await api.post('/lock/release', converToStringfy(obj), {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
  } catch (error) {
    console.log(error)
  }
}
