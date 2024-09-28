<script lang="ts" setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useUserSession } from '../../../../hooks/use-user-session'

// Sacamos el token del User para las APIS
const token = localStorage.getItem('token') || ''
const route = useRoute() // Obtenemos la ruta actual
const userId = Number(route.params.userId) // Obtener el ID del usuario desde los params

// Importamos las funciones para obtener sesiones y crear invitaciones
const { getSessionsAsHostQuery, createInvitationMutation } = useUserSession(token)

// Variables reactivas para manejar los datos
const hostSessions = ref([]) // Lista de sesiones donde el usuario es host
const selectedSession = ref('') // Sesión seleccionada del select
const email = ref('') // Correo del invitado
const isLoading = ref(false)
const isError = ref(false)
const errorMessage = ref('')
const showAlert = ref(false) // Variable para controlar el alert de Vuetify

// Función para enviar la invitación
async function enviarInvitacion() {
  if (!selectedSession.value || !email.value) {
    errorMessage.value = 'Debes seleccionar una sesión e ingresar un correo válido.'
    return
  }

  try {
    await createInvitationMutation.mutateAsync({
      idhost: userId, // El anfitrión es el usuario actual
      idSession: selectedSession.value,
      email: email.value
    })

    // Mostrar alerta de éxito
    showAlert.value = true
    errorMessage.value = ''

    // Limpiar los campos
    email.value = ''
    selectedSession.value = ''

    // Ocultar la alerta después de 3 segundos
    setTimeout(() => {
      showAlert.value = false
    }, 3000)

    console.log('Invitación enviada exitosamente')
  } catch (error) {
    console.error('Error al enviar la invitación:', error)
    errorMessage.value = 'Error al enviar la invitación'
  }
}

// Usar onMounted para cargar las sesiones cuando el componente esté montado
onMounted(async () => {
  isLoading.value = true
  try {
    const { data } = getSessionsAsHostQuery(userId)
    if (data.value) {
      hostSessions.value = data.value.map((session) => ({
        id: session.id,
        name: session.name // Asegurarse de que la propiedad 'name' existe en los datos
      }))
      console.log(hostSessions.value)
    }
  } catch (error) {
    isError.value = true
    errorMessage.value = 'Error al cargar las sesiones'
  } finally {
    isLoading.value = false
  }
})
</script>

<template>
  <div class="invite-form">
    <h2>Enviar Invitación</h2>

    <!-- Select para las sesiones como host -->
    <div class="form-group">
      <label for="session-select">Selecciona la sesión</label>
      <select v-model="selectedSession" id="session-select" class="form-control">
        <option value="" disabled>-- Selecciona una sesión --</option>
        <option v-for="session in hostSessions" :key="session.id" :value="session.id">
          {{ session.name }}
        </option>
      </select>
      <span v-if="isError" class="error-message">{{ errorMessage }}</span>
    </div>

    <!-- Input para el correo del invitado -->
    <div class="form-group mt-4">
      <label for="email-input">Correo electrónico del invitado</label>
      <input
        type="email"
        v-model="email"
        id="email-input"
        class="form-control"
        placeholder="Correo electrónico del invitado"
      />
    </div>

    <!-- Botón para enviar la invitación -->
    <button @click="enviarInvitacion" class="submit-button mt-4">Enviar Invitación</button>

    <!-- Mensaje de error -->
    <span v-if="errorMessage" class="error-message mt-4">{{ errorMessage }}</span>

    <!-- Alerta de éxito de Vuetify -->
    <v-alert v-if="showAlert" type="success" class="mt-4">
      ¡Invitación enviada exitosamente!
    </v-alert>
  </div>
</template>

<style scoped>
/* Estilos para el formulario */
.invite-form {
  max-width: 400px;
  margin: auto;
  padding: 20px;
  background-color: #f8f8f8;
  border-radius: 10px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.form-group {
  margin-bottom: 20px;
}

.form-control {
  width: 100%;
  padding: 10px;
  margin-top: 8px;
  font-size: 16px;
  border: 1px solid #ccc;
  border-radius: 5px;
}

.submit-button {
  background-color: #0ee199;
  border: none;
  color: white;
  padding: 10px 15px;
  border-radius: 5px;
  cursor: pointer;
  font-size: 16px;
  width: 100%;
}

.submit-button:hover {
  background-color: #0cc588;
}

.error-message {
  color: red;
  font-size: 14px;
}
</style>
