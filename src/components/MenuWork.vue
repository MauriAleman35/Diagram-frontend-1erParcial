<script lang="ts" setup>
import { ref, defineProps, computed } from 'vue'
import { Icons } from './Icons.vue' // Importamos el objeto de íconos
import { logout } from '../../lib/querys/auth/authQuery'

// Definir los props para recibir el 'user'
const props = defineProps<{
  user: {
    name: string
    email: string
    avatar?: string // Hacer el avatar opcional
  }
}>()

// Asignar un avatar predeterminado si no se proporciona
const avatar = computed(() => {
  return props.user?.avatar || props.user?.name?.charAt(0) || 'U' // Usar 'U' como valor predeterminado
})

// Estado para mostrar u ocultar el menú del avatar
const avatarMenu = ref(false)

// Definir los ítems con sus títulos y logos correspondientes
const items = ref([
  { title: 'Configuraciones', logo: 'settings' },
  { title: 'Desconectar', logo: 'logout' }
])

// Función para manejar el clic en el botón
function handleClick(item: { title: string }) {
  console.log(`Hiciste clic en: ${item.title}`)
  if (item.title == 'Desconectar') {
    logout()
  }
  // Aquí puedes agregar más lógica si es necesario (por ejemplo, redirigir)
}
</script>

<template>
  <v-menu v-model="avatarMenu" offset-y>
    <!-- Activador del menú (imagen de perfil predeterminada) -->
    <template v-slot:activator="{ props: activatorProps }">
      <v-avatar v-bind="activatorProps" size="48" color="secondary" class="cursor-pointer">
        <span>{{ avatar }}</span>
      </v-avatar>
    </template>

    <!-- Contenido del menú que aparece al hacer clic en la imagen de perfil -->
    <v-card class="pa-4" elevation="2">
      <v-card-text class="text-center" v-if="user">
        <!-- Nombre del usuario -->
        <div class="font-weight-bold">{{ user.name }}</div>
        <!-- Correo electrónico del usuario -->
        <div class="text-muted">{{ user.email }}</div>
      </v-card-text>

      <v-card-text v-else>
        <!-- Mensaje alternativo si no hay datos de usuario -->
        <div class="text-center">No se encontró la información del usuario</div>
      </v-card-text>

      <!-- Separador -->
      <v-divider class="my-2"></v-divider>

      <!-- Lista de botones (Configuraciones, Desconectar) -->
      <v-list>
        <v-list-item v-for="(item, i) in items" :key="i">
          <v-btn
            variant="text"
            class="d-flex align-center justify-start w-100"
            @click="handleClick(item)"
          >
            <!-- Renderizar íconos dinámicamente usando el nombre de `item.logo` -->
            <component :is="Icons[item.logo]" class="mr-2" />
            <!-- Mostrar el título al lado del ícono -->
            <v-list-item-title>{{ item.title }}</v-list-item-title>
          </v-btn>
        </v-list-item>
      </v-list>
    </v-card>
  </v-menu>
</template>
