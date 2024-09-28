<script lang="ts" setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useUserSession } from '../../../../hooks/use-user-session'
import { getInvitationPendient } from '../../../../lib/querys/worskpace/userSessionQuery'

// Sacamos el token del User para las APIS
const token = localStorage.getItem('token') || ''
const route = useRoute() // Obtenemos la ruta actual
const userId = Number(route.params.userId) // Obtener el ID del usuario desde los params

// Importamos las funciones para obtener invitaciones y aceptar
const { getInvitationPendientQuery, acceptInvitationMutation } = useUserSession(token)

// Variables reactivas
const showPending = ref(true) // Estado para controlar qué lista mostrar
const pendingInvitations = ref([]) // Lista de invitaciones pendientes
const acceptedInvitations = ref([]) // Lista de invitaciones aceptadas
const errorMessage = ref('')
const isLoading = ref(false)
const isError = ref(false)

// Función para aceptar una invitación
async function aceptarInvitacion(invitation) {
  try {
    console.log(invitation)
    await acceptInvitationMutation.mutateAsync({
      idSession: invitation.session.id, // Corregido para enviar el ID de la sesión
      idCollaborator: userId // El colaborador es el usuario actual
    })

    // Mover la invitación a la lista de aceptadas y eliminarla de la lista de pendientes
    acceptedInvitations.value.push(invitation)
    pendingInvitations.value = pendingInvitations.value.filter(
      (inv) => inv.session.id !== invitation.session.id
    )
    errorMessage.value = ''
  } catch (error) {
    console.error('Error al aceptar la invitación:', error)
    errorMessage.value = 'Error al aceptar la invitación'
  }
}

// Función para cargar las invitaciones pendientes
async function cargarInvitacionesPendientes() {
  isLoading.value = true
  try {
    const data = await getInvitationPendient(userId, token)
    console.log(data)
    if (data) {
      pendingInvitations.value = data // Asignar las invitaciones pendientes
    }
  } catch (error) {
    isError.value = true
    errorMessage.value = 'Error al cargar las invitaciones pendientes'
  } finally {
    isLoading.value = false
  }
}

// Usar onMounted para cargar las invitaciones pendientes cuando el componente esté montado
onMounted(async () => {
  await cargarInvitacionesPendientes()
})
</script>

<template>
  <v-container>
    <h2 class="text-center mb-4 title">Gestión de Invitaciones</h2>

    <!-- Botones toggle para seleccionar entre pendientes y aceptadas -->
    <div class="toggle-container">
      <v-btn-toggle v-model="showPending" mandatory>
        <v-btn value="true" class="toggle-button">Pendientes</v-btn>
        <v-btn value="false" class="toggle-button">Aceptadas</v-btn>
      </v-btn-toggle>
    </div>

    <!-- Mostrar invitaciones pendientes -->
    <v-row v-if="showPending && pendingInvitations.length > 0" class="invitation-grid mt-4">
      <v-col
        v-for="invitation in pendingInvitations"
        :key="invitation.session.id"
        cols="12"
        sm="6"
        md="4"
      >
        <v-card class="invitation-card">
          <v-card-title>{{ invitation.user.name }}</v-card-title>
          <v-card-subtitle> Sesión: {{ invitation.session.name }} </v-card-subtitle>
          <v-card-actions>
            <v-btn color="success" @click="aceptarInvitacion(invitation)" class="accept-btn">
              Aceptar
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>

    <!-- No hay invitaciones pendientes -->
    <v-alert
      v-if="showPending && pendingInvitations.length === 0 && !isLoading"
      type="info"
      class="mt-4"
    >
      No tienes invitaciones pendientes.
    </v-alert>

    <!-- Mostrar indicador de carga mientras se cargan las invitaciones -->
    <v-progress-circular
      v-if="isLoading"
      indeterminate
      color="primary"
      class="loading mt-4"
    ></v-progress-circular>

    <!-- Mostrar invitaciones aceptadas -->
    <v-row v-if="!showPending && acceptedInvitations.length > 0" class="invitation-grid mt-4">
      <v-col
        v-for="invitation in acceptedInvitations"
        :key="invitation.session.id"
        cols="12"
        sm="6"
        md="4"
      >
        <v-card class="accepted-invitation-card">
          <v-card-title>{{ invitation.user.name }}</v-card-title>
          <v-card-subtitle> Sesión: {{ invitation.session.name }} </v-card-subtitle>
        </v-card>
      </v-col>
    </v-row>

    <!-- No hay invitaciones aceptadas -->
    <v-alert v-if="!showPending && acceptedInvitations.length === 0" type="info" class="mt-4">
      No tienes invitaciones aceptadas.
    </v-alert>

    <!-- Mensaje de error -->
    <v-alert v-if="isError" type="error" class="mt-4">{{ errorMessage }}</v-alert>
  </v-container>
</template>

<style scoped>
/* Estilos generales */
.title {
  color: #0ee199;
  font-weight: bold;
}

.toggle-container {
  display: flex;
  justify-content: center;
  margin-bottom: 20px;
}

.toggle-button {
  color: white;
  background-color: #0ee199;
  border-radius: 5px;
  margin: 0 5px;
}

.toggle-button:hover {
  background-color: #0cc588;
}

.invitation-card,
.accepted-invitation-card {
  padding: 20px;
  background-color: #f8f8f8;
  border-radius: 10px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.accept-btn {
  background-color: #0ee199;
  color: white;
}

.accept-btn:hover {
  background-color: #0cc588;
}

.loading {
  margin: auto;
  display: block;
}
</style>
