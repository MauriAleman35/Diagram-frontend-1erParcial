import { ref, onMounted, onUnmounted } from 'vue'

const useWebSocket = (sessionId) => {
  let socket = null
  const isConnected = ref(false)
  const diagramData = ref(null) // Diagrama actualizado en tiempo real

  const connectWebSocket = () => {
    // Crea la conexión con WebSocket
    socket = new WebSocket(`ws://localhost:3000/api/ws-diagram`)

    // Evento cuando el WebSocket se conecta correctamente
    socket.onopen = () => {
      console.log('Conectado al WebSocket')
      isConnected.value = true

      // Suscribirse a los mensajes del WebSocket
      socket.onmessage = (event) => {
        const message = JSON.parse(event.data)

        // Si el mensaje es una actualización del diagrama
        if (message.type === 'DIAGRAM_UPDATE') {
          console.log('Diagrama actualizado:', message.data)
          diagramData.value = message.data // Actualizamos el diagrama en tiempo real
        }
      }

      // Evento cuando se cierra la conexión del WebSocket
      socket.onclose = () => {
        console.log('Conexión cerrada con WebSocket')
        isConnected.value = false
      }

      // Evento cuando ocurre un error en el WebSocket
      socket.onerror = (error) => {
        console.error('Error en WebSocket:', error)
      }
    }
  }

  const disconnectWebSocket = () => {
    if (socket) {
      socket.close()
      console.log('Desconectado del WebSocket')
    }
  }

  // Función para enviar actualizaciones del diagrama a través del WebSocket
  const sendDiagramUpdate = (data) => {
    if (socket && isConnected.value) {
      const message = {
        type: 'DIAGRAM_UPDATE',
        data: data // Enviamos los datos actualizados del diagrama
      }
      socket.send(JSON.stringify(message))
      console.log('Diagrama enviado:', message)
    }
  }

  // Conectar al WebSocket cuando el componente se monta
  onMounted(() => {
    connectWebSocket()
  })

  // Desconectar del WebSocket cuando el componente se desmonta
  onUnmounted(() => {
    disconnectWebSocket()
  })

  return {
    isConnected,
    diagramData, // Este es el diagrama que se actualiza en tiempo real
    sendDiagramUpdate // Para enviar actualizaciones del diagrama
  }
}

export default useWebSocket
