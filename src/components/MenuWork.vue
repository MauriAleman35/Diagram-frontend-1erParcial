<script lang="ts" setup>
import { ref, defineProps, computed } from 'vue'
import { Icons } from '../App/utils/Icons' // Importamos el objeto de íconos como `any`
import { logout } from '../../lib/querys/auth/authQuery'

// Definir los props para recibir el 'user'
const props = defineProps<{
  user: {
    name: string
    email: string
    avatar?: any // Hacer el avatar opcional
  }
}>()

// Asignar un avatar predeterminado si no se proporciona
const avatar = computed(() => {
  return props.user?.avatar || props.user?.name?.charAt(0) || 'U' // Usar 'U' como valor predeterminado
})

// Estado para mostrar u ocultar el menú del avatar
const avatarMenu = ref(false)

// Definir los ítems con sus títulos y logos correspondientes
const items = ref<any>([
  { title: 'Configuraciones', logo: 'settings' },
  { title: 'Desconectar', logo: 'logout' }
])

// Función para manejar el clic en el botón
function handleClick(item: { title: string }) {
  console.log(`Hiciste clic en: ${item.title}`)
  if (item.title === 'Desconectar') {
    logout()
  }
}
</script>

<template>
  <v-menu v-model="avatarMenu" offset-y>
    <template v-slot:activator="{ props: activatorProps }">
      <v-avatar v-bind="activatorProps" size="48" color="secondary" class="cursor-pointer">
        <span>{{ avatar.value }}</span>
      </v-avatar>
    </template>

    <v-card class="pa-4" elevation="2">
      <v-card-text class="text-center" v-if="props.user">
        <div class="font-weight-bold">{{ props.user.name }}</div>
        <div class="text-muted">{{ props.user.email }}</div>
      </v-card-text>

      <v-card-text v-else>
        <div class="text-center">No se encontró la información del usuario</div>
      </v-card-text>

      <v-divider class="my-2"></v-divider>

      <v-list>
        <v-list-item v-for="(item, i) in items" :key="i">
          <v-btn
            variant="text"
            class="d-flex align-center justify-start w-100"
            @click="handleClick(item)"
          >
            <component :is="(Icons as any)[item.logo]" class="mr-2" />
            <v-list-item-title>{{ item.title }}</v-list-item-title>
          </v-btn>
        </v-list-item>
      </v-list>
    </v-card>
  </v-menu>
</template>
