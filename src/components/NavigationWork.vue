<template>
  <v-menu offset-y class="#0ee199">
    <template v-slot:activator="{ props }">
      <!-- Botón activador -->
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

      <!-- Título de las sesiones -->
      <v-divider></v-divider>
      <v-list-item-title class="pl-4 pt-2 text-xs font-semibold">
        Sesiones como Anfitrión
      </v-list-item-title>

      <!-- Si no hay sesiones, mostrar mensaje -->
      <template v-if="sessions.length === 0">
        <v-list-item>
          <v-list-item-content>
            <v-list-item-title class="text-gray-500">
              No hay sesiones creadas...
            </v-list-item-title>
          </v-list-item-content>
        </v-list-item>
      </template>

      <!-- Lista de sesiones creadas por el usuario -->
      <template v-else>
        <v-list-item v-for="session in sessions" :key="session.id">
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

<script lang="ts" setup>
import { ref } from 'vue'
import { Icons } from './Icons.vue'

// Definir el workspace por defecto
const selectedWorkspace = ref({
  name: 'Marco de Trabajo',
  logo: 'https://via.placeholder.com/24x24.png?text=TP'
})

// Lista estática de sesiones creadas por el usuario (inicialmente vacía para ejemplo)
const sessions = ref([
  {
    id: 1,
    name: 'UI/UX SW1',
    logo: 'https://via.placeholder.com/24x24.png?text=UU'
  },
  {
    id: 1,
    name: 'UI/UX SW1',
    logo: 'https://via.placeholder.com/24x24.png?text=UU'
  }
]) // Si está vacío, se mostrará el mensaje "No hay sesiones creadas..."

// Función para crear nueva sesión
function createNewSession() {
  console.log('Crear nuevo equipo')
}
</script>

<style scoped>
/* Ajustes responsivos utilizando Tailwind y Vuetify */
.v-list-item-avatar {
  margin-right: 8px;
}

.v-list-item-title {
  font-size: 14px;
}

/* Estilo para el título de las sesiones */
.text-xs {
  font-size: 0.75rem;
}
.font-semibold {
  font-weight: 600;
}
.text-gray-500 {
  color: #6b7280;
}

/* Adaptabilidad del menú en pantallas pequeñas */
@media (max-width: 600px) {
  .v-btn {
    justify-content: flex-start;
    font-size: 12px;
  }

  .v-avatar {
    display: none; /* Ocultar avatar en pantallas muy pequeñas */
  }
}
</style>
