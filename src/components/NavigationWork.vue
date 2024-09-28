<script lang="ts" setup>
import { ref, defineProps, type PropType } from 'vue'
import { Icons } from './Icons.vue'
import router from '@/routes'
import { useRoute } from 'vue-router'
import type { SessionsI } from '@/lib/querys/interfaces'

// Props para recibir las sesiones donde el usuario es anfitrión
const props = defineProps({
  hostSessions: {
    type: Array as PropType<SessionsI[]>,
    default: () => []
  }
})
const route = useRoute()
// Definir el workspace por defecto
const selectedWorkspace = ref({
  name: 'Marco de Trabajo',
  logo: 'https://via.placeholder.com/24x24.png?text=TP'
})

// Función para redirigir a la sesión seleccionada
function redirigirASesion(sessionId: number) {
  // Redirigir a la sesión seleccionada
  router.push({
    path: `/workspace/${route.params.userId}/session/${sessionId}`
  })
}
</script>

<template>
  <v-menu offset-y>
    <template v-slot:activator="{ props }">
      <v-btn v-bind="props" class="d-flex align-center" color="secondary">
        <v-avatar size="24" class="mr-2">
          <v-img :src="selectedWorkspace.logo" />
        </v-avatar>
        <span>{{ selectedWorkspace.name }}</span>
        <Icons.arrow />
      </v-btn>
    </template>

    <!-- Opciones dentro del menú -->
    <v-list>
      <!-- Workspace seleccionado por defecto -->
      <v-list-item>
        <v-list-item-avatar>
          <v-avatar size="24">
            <v-img :src="selectedWorkspace.logo" />
          </v-avatar>
        </v-list-item-avatar>
        <v-list-item-content>
          <v-list-item-title>{{ selectedWorkspace.name }}</v-list-item-title>
        </v-list-item-content>
      </v-list-item>

      <!-- Título de las sesiones como anfitrión -->
      <v-divider></v-divider>
      <v-list-item-title class="pl-4 pt-2 text-xs font-semibold">
        Sesiones como Anfitrión
      </v-list-item-title>

      <!-- Si no hay sesiones, mostrar mensaje -->
      <template v-if="hostSessions.length === 0">
        <v-list-item>
          <v-list-item-content>
            <v-list-item-title class="text-gray-500">No hay sesiones creadas...</v-list-item-title>
          </v-list-item-content>
        </v-list-item>
      </template>

      <!-- Lista de sesiones como anfitrión -->
      <template v-else>
        <v-list-item
          v-for="session in hostSessions"
          :key="session.id"
          @click="redirigirASesion(session.id)"
        >
          <v-list-item-avatar>
            <v-avatar size="24">
              <v-img :src="session.logo" />
            </v-avatar>
          </v-list-item-avatar>
          <v-list-item-content>
            <v-list-item-title>{{ session.name }}</v-list-item-title>
          </v-list-item-content>
        </v-list-item>
      </template>
    </v-list>
  </v-menu>
</template>

<style scoped>
/* Estilos adicionales */
</style>
