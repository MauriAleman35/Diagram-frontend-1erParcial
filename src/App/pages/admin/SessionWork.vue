<script lang="ts" setup>
import { useRoute } from 'vue-router'

const route = useRoute()
const userId = route.params.userId
const sessionId = route.params.sessionId

console.log(`User ID: ${userId}, Session ID: ${sessionId}`)
</script>

<template>
  <div>
    <h1>Detalles de la sesión: {{ sessionId }}</h1>
    <!-- Mostrar los detalles de la sesión aquí -->
  </div>
</template>
