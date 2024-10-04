<script lang="ts" setup>
import MenuWork from '@/components/MenuWork.vue'
import DialogCreateSession from '@/components/DialogCreateSession.vue'
import NavigationWork from '@/components/NavigationWork.vue'
import { Icons } from '@/components/Icons.vue'
import { ref, computed, watchEffect } from 'vue'
import { useDisplay } from 'vuetify'
import { useUsers } from '../../../../hooks/use-users'
import { useRoute } from 'vue-router'
import { useUserSession } from '../../../../hooks/use-user-session'
import router from '@/routes'

// Sacamos el token del User para las APIS
const token = localStorage.getItem('token') || ''
const { getById } = useUsers()
const { getSessionsAsCollaboratorQuery, getSessionsAsHostQuery } = useUserSession(token)

const route = useRoute() // Obtenemos la ruta actual
const search = ref('') // Modelo para la búsqueda

const UserPerfil = ref(null)
const SessionsNashi = ref<any[] | undefined>(undefined)
const HostinSessions = ref<any[] | undefined>(undefined)

// Obtener el id del usuario desde los params
const userId = Number(route.params.userId)

// Estado del drawer y variantes para mini/overlay
const drawer = ref(true)
const mini = ref(false)
const clipped = ref(true)

// Detectar si la pantalla es grande
const { smAndUp } = useDisplay()
const isLargeScreen = computed(() => smAndUp.value)

// Estado del diálogo
const dialogVisible = ref(false)

// Filtrar sesiones colaborando basado en la búsqueda
const filteredSessions = computed(() => {
  if (SessionsNashi.value) {
    return SessionsNashi.value.filter((session: any) =>
      session.name.toLowerCase().includes(search.value.toLowerCase())
    )
  }
  return []
})

// Redirigir a la sesión seleccionada
function redirigirASesion(sessionId: number) {
  router.push({
    path: `/workspace/${route.params.userId}/session/${sessionId}`
  })
}

// Usar `getById` para obtener los datos del usuario
const { data: userData, isLoading, isError, error } = getById(userId)
const { data: collaboratorSessions } = getSessionsAsCollaboratorQuery(userId)
const { data: hostSessions } = getSessionsAsHostQuery(userId)

// Monitorear cambios en los datos del usuario y sesiones
watchEffect(() => {
  SessionsNashi.value = collaboratorSessions?.value || null
  HostinSessions.value = hostSessions?.value || null
  if (!isLoading.value && userData.value) {
    UserPerfil.value = userData.value
    console.log('Perfil del usuario:', UserPerfil.value)
  } else if (isError.value) {
    console.error('Error obteniendo el perfil del usuario:', error.value)
  }
})

// Función para abrir el diálogo de creación de sesión
function abrirDialogoCreacion() {
  dialogVisible.value = true
}

// Función para enviar invitación
function sendInvitacion() {
  router.push(`/workspace/${userId}/enviar-invitacion`)
}
function invitationsReceived() {
  router.push(`/workspace/${userId}/invitations-received`)
}
</script>

<template>
  <v-responsive class="border rounded" max-height="1000">
    <v-app>
      <!-- Drawer con NavigationWork, usando propiedades para hacerlo responsivo -->
      <v-navigation-drawer
        v-model="drawer"
        app
        color="success"
        v-model:mini-variant="mini"
        :clipped="clipped"
        :temporary="!isLargeScreen"
      >
        <v-list>
          <v-list-item title="ESPACIO DE TRABAJO" class="text-center"></v-list-item>
          <NavigationWork :hostSessions="HostinSessions" />
          <!-- Pasar las sesiones donde el usuario es host -->

          <!-- Campo de búsqueda debajo del espacio de trabajo -->
          <v-list-item>
            <v-text-field
              v-model="search"
              label="Buscar sesión"
              prepend-inner-icon="mdi-magnify"
              clearable
              class="mt-4"
              color="secondary"
            />
          </v-list-item>

          <!-- Botones debajo del marco de trabajo -->
          <v-divider></v-divider>
          <v-list-item class="justify-center mt-2">
            <v-btn color="secondary" block @click="sendInvitacion"> Enviar invitación </v-btn>
          </v-list-item>
          <v-list-item class="justify-center">
            <v-btn color="secondary" block @click="invitationsReceived">
              Invitaciones Recibidas
            </v-btn>
          </v-list-item>
        </v-list>
      </v-navigation-drawer>

      <!-- App Bar con botón para crear nueva sesión -->
      <v-app-bar title="Proyectos" color="primary" :clipped-left="clipped">
        <v-btn
          class="ml-auto mr-4"
          color="secondary"
          size="small"
          variant="flat"
          @click="abrirDialogoCreacion"
        >
          Crear nueva Sesión
          <Icons.add />
        </v-btn>
        <MenuWork :user="userData" />
      </v-app-bar>

      <DialogCreateSession
        v-model:modelValue="dialogVisible"
        title="Crear nueva sesión"
        message="Formulario para crear una nueva sesión"
        @close="dialogVisible = false"
      />

      <!-- Main content -->
      <v-main>
        <v-container>
          <!-- Título centrado -->
          <h1 class="text-center text-lg font-semibold mb-8">Sesiones Colaborando</h1>

          <!-- Lista de tarjetas (card list) de sesiones colaborando -->
          <v-row>
            <v-col v-for="session in filteredSessions" :key="session.id" cols="12" sm="6" md="4">
              <v-card
                class="hover:shadow-lg transition-shadow duration-300"
                @click="redirigirASesion(session.id)"
                color="background"
              >
                <v-card-title>{{ session.name }}</v-card-title>
                <v-card-subtitle>{{ session.description }}</v-card-subtitle>
                <v-card-actions>
                  <v-btn color="primary" @click="redirigirASesion(session.id)">
                    Entrar
                    <v-icon right>mdi-arrow-right</v-icon>
                  </v-btn>
                </v-card-actions>
              </v-card>
            </v-col>
          </v-row>
        </v-container>
      </v-main>
    </v-app>
  </v-responsive>
</template>
