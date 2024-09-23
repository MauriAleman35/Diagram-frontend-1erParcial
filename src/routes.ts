import { createRouter, createWebHistory } from 'vue-router'
import LoginView from './App/pages/auth/LoginView.vue'
import SingUpView from './App/pages/auth/SingUpView.vue'
import WorkSpace from './App/pages/admin/WorkSpace.vue'

const routes = [
  {
    path: '/',
    redirect: '/login' // Redirige a la página de login si el usuario visita la raíz
  },
  {
    path: '/login',
    component: LoginView
  },
  {
    path: '/singup',
    component: SingUpView
  },
  {
    path: '/workspace',
    component: WorkSpace
  }
]
const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
