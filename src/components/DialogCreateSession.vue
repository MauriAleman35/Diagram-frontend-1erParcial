<template>
  <v-dialog v-model="internalDialog" max-width="500" persistent>
    <v-card class="rounded-lg shadow-lg">
      <!-- Botón de retroceso en la parte superior izquierda -->
      <div class="flex mt-2 justify-start">
        <v-btn icon @click="closeDialog">
          <Icons.chevronLeft />
        </v-btn>
      </div>

      <!-- Centralizar el título y desplazarlo hacia abajo -->
      <v-card-title class="justify-center text-center mt-4">
        <span class="text-3xl font-semibold">Crear nueva sesión</span>
      </v-card-title>

      <v-divider></v-divider>

      <v-card-text>
        <!-- Ajustar el estilo de los textos -->
        <div class="mt-4 text-center">
          <div class="font-semibold text-xl pb-4">Introduzca el nombre de su Sesión</div>
          <p class="text-base text-gray-600">
            Pasará a ser host del marco de trabajo y puede añadir colaboradores.
          </p>
        </div>
      </v-card-text>

      <v-divider></v-divider>

      <!-- Input más visible con color verde -->
      <div class="flex flex-col items-center py-4">
        <input
          type="text"
          id="sessionName"
          name="sessionName"
          v-model="sessionData.name"
          required
          class="bg-green-200 border-2 border-green-400 rounded-full py-2 px-4 text-sm leading-6 text-gray-900 placeholder-gray-500 w-64 h-12"
          placeholder="Nombre de la sesión"
        />

        <input
          type="text"
          id="sessionDescription"
          name="sessionDescription"
          required
          v-model="sessionData.description"
          class="bg-green-200 border-2 border-green-400 rounded-full py-2 px-4 text-sm leading-6 text-gray-900 placeholder-gray-500 w-64 h-12"
          placeholder="Descripción de la sesión"
        />
      </div>

      <v-card-actions class="pa-4 justify-end">
        <v-btn
          class="text-none text-white bg-[#0ee199]"
          min-width="92"
          rounded
          @click="handleCreateSession"
        >
          Crear Sesión
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts" setup>
import { ref, watch, defineProps, defineEmits } from 'vue'
import { Icons } from '../App/utils/Icons'
import { useSession } from '../../hooks/use-session'
import { useRoute } from 'vue-router'
import type { sessionPost } from '@/lib/querys/interfaces'
import router from '@/routes'
const token = localStorage.getItem('token')
const route = useRoute()
const userId = Number(route.params.userId)
const { createSession } = useSession(token as string)

const sessionData = ref<sessionPost>({
  name: '',
  description: '',
  idHost: userId
})

// Definir props para recibir datos del componente padre
const props = defineProps({
  title: {
    type: String,
    default: 'Título del Diálogo'
  },
  message: {
    type: String,
    default: 'Contenido del diálogo'
  },
  modelValue: {
    type: Boolean,
    default: false
  }
})

// Emitir eventos hacia el componente padre
const emit = defineEmits(['update:modelValue'])

// Estado interno del diálogo
const internalDialog = ref(props.modelValue)

// Sincronizar el estado del diálogo con modelValue
watch(
  () => props.modelValue,
  (newVal) => {
    internalDialog.value = newVal
  }
)

// Función para crear la sesión y emitir eventos
const handleCreateSession = async () => {
  try {
    const resp = await createSession(sessionData.value)
    if (resp) {
      emit('update:modelValue', false) // Cerrar el diálogo
      await router.push(`/workspace/${userId}`)
      sessionData.value = { name: '', description: '', idHost: userId } // Limpiar el formulario
    }
  } catch (error) {
    console.log(`Error al crear la sesión`, error)
  }
}

// Emitir el evento cuando se cierra el diálogo
function closeDialog() {
  internalDialog.value = false
  emit('update:modelValue', false) // Emitir evento para cerrar el diálogo en el componente padre
}
</script>
