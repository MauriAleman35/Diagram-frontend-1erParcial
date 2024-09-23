<template>
  <v-dialog v-model="internalDialog" max-width="500" persistent>
    <v-card>
      <v-card-title class="justify-center">
        {{ title }}
        <v-spacer></v-spacer>
        <v-btn icon @click="closeDialog">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-card-title>

      <v-divider></v-divider>

      <v-card-text>
        <div class="py-12 text-center">
          <v-icon class="mb-6" color="success" icon="mdi-check-circle-outline" size="128"></v-icon>

          <div class="text-h4 font-weight-bold">{{ message }}</div>
        </div>
      </v-card-text>

      <v-divider></v-divider>

      <v-card-actions class="pa-4 justify-end">
        <v-btn
          class="text-none"
          color="medium-emphasis"
          min-width="92"
          variant="outlined"
          rounded
          @click="closeDialog"
        >
          Cerrar
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts" setup>
import { ref, watch, defineProps, defineEmits } from 'vue'

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

// Emitir el evento cuando se cierra el diálogo
function closeDialog() {
  internalDialog.value = false
  emit('update:modelValue', false) // Emitir evento para cerrar el diálogo en el componente padre
}
</script>
