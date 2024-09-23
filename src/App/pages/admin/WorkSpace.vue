<script lang="ts" setup>
import MenuWork from '@/components/MenuWork.vue'
import DialogCreateSession from '@/components/DialogCreateSession.vue'
import NavigationWork from '@/components/NavigationWork.vue'
import { ref, computed } from 'vue'

import { useDisplay } from 'vuetify'

// Estado del drawer y variantes para mini/overlay
const drawer = ref(true)
const mini = ref(false)
const clipped = ref(true)

// Detectar si la pantalla es grande
const { smAndUp } = useDisplay()
const isLargeScreen = computed(() => smAndUp.value)

// Modelo para el campo de búsqueda
const search = ref('')

// Estado del diálogo
const dialogVisible = ref(false)

// Sesiones colaborando (contenido estático por ahora)
const sessions = ref([
  { id: 1, name: 'Sesión UI/UX', description: 'Proyecto UI/UX en progreso' },
  { id: 2, name: 'Backend Dev', description: 'Desarrollo del backend' },
  { id: 3, name: 'Mobile App', description: 'App móvil colaborativa' }
])

// Filtrar sesiones basado en búsqueda
const filteredSessions = computed(() =>
  sessions.value.filter((session) =>
    session.name.toLowerCase().includes(search.value.toLowerCase())
  )
)

// Redirigir a la sesión seleccionada
function redirigirASesion(sessionId: number) {
  console.log('Redirigiendo a sesión:', sessionId)
}
</script>

<template>
  <v-responsive class="border rounded" max-height="700">
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
          <NavigationWork />

          <!-- Search Bar debajo de NavigationWork -->
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
        </v-list>
      </v-navigation-drawer>

      <!-- App Bar con botón para crear nueva sesión -->
      <v-app-bar title="Proyectos" color="primary" :clipped-left="clipped">
        <v-btn
          class="flex justify-end"
          color="secondary"
          size="small"
          variant="flat"
          @click="dialogVisible = true"
        >
          Crear nueva Sesión
          <v-icon right>mdi-plus</v-icon>
        </v-btn>
        <MenuWork :user="{ name: 'John Doe', email: 'john.doe@example.com', avatar: 'JD' }" />
      </v-app-bar>

      <!-- Importar el DialogComponent -->
      <DialogCreateSession
        v-model:modelValue="dialogVisible"
        title="Crear nueva sesión"
        message="Formulario para crear una nueva sesión"
      />

      <!-- Main content -->
      <v-main>
        <v-container>
          <!-- Título centrado -->
          <h1
            class="text-center text-lg font-semibold mb-8"
            :style="{ color: $vuetify.theme.themes.myCustomTheme.primary }"
          >
            Sesiones Colaborando
          </h1>

          <!-- Lista de tarjetas (card list) de sesiones -->
          <v-row>
            <v-col v-for="session in filteredSessions" :key="session.id" cols="12" sm="6" md="4">
              <v-card
                class="hover:shadow-lg transition-shadow duration-300"
                @click="redirigirASesion(session.id)"
                color="background"
              >
                <v-card-title>
                  {{ session.name }}
                </v-card-title>
                <v-card-subtitle>
                  {{ session.description }}
                </v-card-subtitle>
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
