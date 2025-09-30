<script lang="ts" setup>
import { useUsers } from '../../../../hooks/use-users'
import router from '@/routes'
import { ref } from 'vue'

// Vuetify Snackbar
const showSnackbar = ref(false)
const snackbarText = ref('')

// Función para crear el usuario
const { createUser } = useUsers()

const credentiales = ref({
  name: '',
  email: '',
  password: ''
})

const handleCrete = async () => {
  try {
    const resp = await createUser(credentiales.value)

    if (resp && resp.data) {
      // Mostrar alerta de éxito
      snackbarText.value = 'Cuenta creada exitosamente'
      showSnackbar.value = true

      // Redirigir al login después de un pequeño delay
      setTimeout(() => {
        router.push('/login')
      }, 2000) // Esperar 2 segundos antes de redirigir
    } else {
      console.error('Error al crear la cuenta: Incorrect code or password')
    }
  } catch (error) {
    console.error('Error en la creación de la cuenta:', error)
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-primary bg-opacity-40">
    <div class="bg-white flex flex-col justify-center items-center w-full max-w-md shadow-lg p-8">
      <h1 class="text-3xl font-bold text-[#0ee199] mb-2">Crear cuenta</h1>
      <form class="mt-6 w-full" @submit.prevent="handleCrete">
        <div>
          <label class="block text-gray-700">Nombre Completo</label>
          <input
            type="text"
            placeholder="Introduzca el nombre"
            v-model="credentiales.name"
            class="w-full px-4 py-3 rounded-lg bg-gray-200 mt-2 border focus:border-blue-500 focus:bg-white focus:outline-none"
            required
          />
        </div>
        <div>
          <label class="block text-gray-700">Correo Electrónico</label>
          <input
            type="email"
            v-model="credentiales.email"
            placeholder="Introduce tu correo electrónico"
            class="w-full px-4 py-3 rounded-lg bg-gray-200 mt-2 border focus:border-blue-500 focus:bg-white focus:outline-none"
            required
          />
        </div>
        <div class="mt-4">
          <label class="block text-gray-700">Contraseña</label>
          <input
            type="password"
            v-model="credentiales.password"
            placeholder="Introduce tu contraseña"
            minlength="6"
            class="w-full px-4 py-3 rounded-lg bg-gray-200 mt-2 border focus:border-blue-500 focus:bg-white focus:outline-none"
            required
          />
        </div>

        <button
          type="submit"
          class="w-full block bg-[#0ee199] hover:bg-indigo-400 focus:bg-indigo-400 text-white font-semibold rounded-lg px-4 py-3 mt-6"
        >
          Crear Cuenta
        </button>
      </form>

      <!-- Snackbar de Vuetify para mostrar la alerta -->
      <v-snackbar v-model="showSnackbar" top color="success" timeout="2000">
        {{ snackbarText }}
      </v-snackbar>

      <hr class="my-6 border-gray-300 w-full" />

      <button
        type="button"
        class="w-full block bg-white hover:bg-gray-100 focus:bg-gray-100 text-gray-900 font-semibold rounded-lg px-4 py-3 border border-gray-300"
      >
        <div class="flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" viewBox="0 0 48 48">
            <!-- Contenido del SVG -->
          </svg>
          <span class="ml-4"> Iniciar sesión con Google</span>
        </div>
      </button>
      <RouterLink to="/login">
        <p class="mt-8">
          ¿Ya tienes una cuenta?
          <a href="#" class="text-blue-500 hover:text-blue-700 font-semibold">Iniciar sesión</a>
        </p>
      </RouterLink>
    </div>
  </div>
</template>
