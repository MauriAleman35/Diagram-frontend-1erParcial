import { createRouter, createWebHistory } from 'vue-router'
import LoginView from './App/pages/auth/LoginView.vue'
import SingUpView from './App/pages/auth/SingUpView.vue'
import WorkSpace from './App/pages/admin/WorkSpace.vue'

import SessionWork from './App/pages/admin/SessionWork.vue'
import { jwtDecode } from 'jwt-decode'
import { getByEmail } from '../lib/querys/worskpace/userQuery'
import SendInvitation from './App/pages/admin/sendInvitation.vue'
import InvitationsReceived from './App/pages/admin/invitationsReceived.vue'

const routes = [
  {
    path: '/',
    redirect: '/login'
  },
  {
    path: '/login',
    component: LoginView
  },
  {
    path: '/signup',
    component: SingUpView
  },
  {
    path: '/workspace/:userId',
    component: WorkSpace,
    meta: { requiresAuth: true },
    props: true
  },
  {
    path: '/workspace/:userId/enviar-invitacion', // Nueva ruta para enviar invitación
    component: SendInvitation,
    meta: { requiresAuth: true }
  },
  {
    path: '/workspace/:userId/invitations-received', // Nueva ruta para enviar invitación
    component: InvitationsReceived,
    meta: { requiresAuth: true }
  },
  {
    path: '/workspace/:userId/session/:sessionId',
    component: SessionWork,
    props: true, // Aseguramos que reciba los params como props
    meta: { requiresAuth: true }
  }
]
const router = createRouter({
  history: createWebHistory(),
  routes
})
router.beforeEach(async (to, from, next) => {
  const token = localStorage.getItem('token')

  // Verificar si la ruta requiere autenticación
  if (to.matched.some((record) => record.meta.requiresAuth)) {
    if (!token) {
      // Si no hay token, redirigir al login
      next('/login')
    } else {
      try {
        // Decodificar el token para extraer el email
        const decodedToken: any = jwtDecode(token)
        const email = decodedToken.sub // Asumiendo que el email está en el campo 'sub'

        if (email) {
          // Obtener el userId a través de getByEmail
          const userResponse = await getByEmail(email)
          const authenticatedUserId = userResponse.users.id // Asumimos que el userId viene aquí
          console.log(authenticatedUserId)
          // Verificar que el userId en la ruta coincide con el userId autenticado
          if (Number(to.params.userId) !== authenticatedUserId) {
            // Si el userId en la ruta no coincide, redirigir al login
            next('/login')
          } else {
            // Si coincide, permitir la navegación
            next()
          }
        } else {
          // Si no se puede obtener el email, redirigir al login
          next('/login')
        }
      } catch (error) {
        console.error('Error decodificando el token o obteniendo el userId:', error)
        next('/login') // Si hay algún error, redirigir al login
      }
    }
  } else {
    next() // Si la ruta no requiere autenticación, permitir la navegación
  }
})

export default router
