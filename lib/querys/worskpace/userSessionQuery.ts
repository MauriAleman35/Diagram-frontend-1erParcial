import api, { converToStringfy } from '../../api'
import type { acceptInvitation } from '../interfaces/userSession'

export const createInvitation = async (invitation: any, token: string) => {
  try {
    const obj = {
      idhost: invitation.idhost,
      idSession: invitation.idSession,
      email: invitation.email
    }
    const resp = await api.post('/user-session/invite', converToStringfy(obj), {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
    return resp.data
  } catch (error) {
    console.log(error)
  }
}

export const PostacceptInvitation = async (Invitation: acceptInvitation, token: string) => {
  try {
    const obj = {
      idSession: Invitation.idSession,
      idCollaborator: Invitation.idCollaborator
    }
    const resp = await api.post('/user-session/accept', converToStringfy(obj), {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
    return resp.data
  } catch (error) {
    console.log(error)
  }
}
export const getCollaboratorSession = async (id: number, token: string) => {
  try {
    const resp = await api.get(`/user-session/collaborators/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
    return resp.data
  } catch (error) {
    console.log(error)
  }
}
export const getSessionsAsHost = async (id: number, token: string) => {
  try {
    const resp = await api.get(`/user-session/${id}/host-sessions`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
    return resp.data
  } catch (error) {
    console.log(error)
  }
}
export const getSessionsAsCollaborator = async (id: number, token: string) => {
  try {
    const resp = await api.get(`/user-session/${id}/collaborator-sessions`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
    return resp.data
  } catch (error) {
    console.log(error)
  }
}
export const getInvitationPendient = async (id: number, token: string) => {
  try {
    const resp = await api.get(`/user-session/${id}/pending-invitations`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
    console.log(resp.data)
    return resp.data
  } catch (error) {
    console.log(error)
  }
}
