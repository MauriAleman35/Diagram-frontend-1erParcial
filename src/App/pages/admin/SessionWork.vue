<template>
  <div class="main-container">
    <!-- Panel de control a la izquierda -->
    <div class="sidebar">
      <button @click="addEntity" class="btn-sidebar">Añadir Entidad</button>
      <button @click="exportDiagram" class="btn-sidebar">Exportar a JSON</button>
      <button @click="deleteSelected" class="btn-sidebar btn-danger">Eliminar Selección</button>
      <h3 v-if="isConnected">Conectado al WebSocket</h3>
      <button @click="updateDiagram" class="btn-sidebar btn-primary">Guardar Diagrama</button>
      <!-- Botón para editar entidad si se ha seleccionado alguna -->
      <button v-if="selectedEntity" @click="openEditDialog" class="btn-sidebar">
        Editar Entidad
      </button>

      <button @click="exportDiagramAsBackend" class="btn-sidebar">Exportar Backend</button>
      <button @click="goBack" class="btn-sidebar">Volver Atrás</button>
    </div>

    <!-- Área del diagrama en el centro -->
    <div class="diagram-container">
      <div id="diagramDiv" ref="diagramDiv" class="diagram"></div>
    </div>

    <!-- Panel de relaciones a la derecha -->
    <div class="relations-panel">
      <h3>Relaciones</h3>
      <button @click="selectRelationship('OneToMany')" class="btn-relation">1 a Muchos</button>
      <button @click="selectRelationship('OneToOne')" class="btn-relation">1 a 1</button>
      <button @click="selectRelationship('ManyToMany')" class="btn-relation">
        Muchos a Muchos
      </button>
      <button @click="selectRelationship('Generalizacion')" class="btn-relation">
        Generalización
      </button>
      <button @click="selectRelationship('Agregacion')" class="btn-relation">Agregación</button>
      <button @click="selectRelationship('Composicion')" class="btn-relation">Composición</button>
      <button @click="selectRelationship('Recursividad')" class="btn-relation">Recursividad</button>
    </div>

    <!-- Modal para editar entidad -->
    <div v-if="showModal" class="modal">
      <div class="modal-content">
        <h3>Editar Entidad</h3>
        <input v-model="entityName" placeholder="Nombre de la entidad" class="input-text" />

        <h4>Atributos</h4>
        <input v-model="newAttribute.name" placeholder="Nombre del Atributo" class="input-text" />
        <select v-model="newAttribute.type" class="input-select">
          <option value="int">int</option>
          <option value="varchar">varchar</option>
          <option value="datetime">datetime</option>
          <option value="boolean">boolean</option>
          <option value="char">char</option>
        </select>

        <!-- Botones para Primary y Foreign Key -->
        <button
          @click="togglePrimaryKey"
          :class="['btn-pk', newAttribute.primaryKey ? 'btn-pk-active' : '']"
        >
          {{ newAttribute.primaryKey ? 'Primary Key [PK]' : 'Marcar como Primary Key' }}
        </button>
        <button
          @click="toggleForeignKey"
          :class="['btn-fk', newAttribute.foreignKey ? 'btn-fk-active' : '']"
        >
          {{ newAttribute.foreignKey ? 'Foreign Key [FK]' : 'Marcar como Foreign Key' }}
        </button>

        <button @click="addAttribute" class="btn-primary">Agregar Atributo</button>

        <!-- Mostrar atributos -->
        <ul>
          <li v-for="(attr, index) in attributes" :key="index">
            {{ attr.name }} ({{ attr.type }})
            <span v-if="attr.primaryKey">[PK]</span>
            <span v-if="attr.foreignKey">[FK]</span>
            <button @click="removeAttribute(index)" class="btn-secondary">Eliminar</button>
          </li>
        </ul>

        <!-- Métodos -->
        <h4>Métodos</h4>
        <input v-model="newMethod.name" placeholder="Nombre del Método" class="input-text" />
        <select v-model="newMethod.type" class="input-select">
          <option value="void">void</option>
          <option value="boolean">boolean</option>
          <option value="int">int</option>
          <option value="String">String</option>
        </select>
        <select v-model="newMethod.visibility" class="input-select">
          <option value="public">public</option>
          <option value="private">private</option>
          <option value="protected">protected</option>
        </select>

        <button @click="addMethod" class="btn-primary">Agregar Método</button>

        <!-- Mostrar métodos -->
        <ul>
          <li v-for="(method, index) in methods" :key="index">
            {{ method.visibility }} {{ method.name }}(): {{ method.type }}
            <button @click="removeMethod(index)" class="btn-secondary">Eliminar</button>
          </li>
        </ul>

        <button @click="saveEntity" class="btn-primary">Guardar</button>
        <button @click="closeModal" class="btn-secondary">Cerrar</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import go from 'gojs'
import { useDiagrams } from '../../../../hooks/use-diagram'
import { exportDiagram } from '../../../../lib/querys/worskpace/diagramQuery'
import { useRoute } from 'vue-router'
import '../../utils/sessionWork.css'
import { watchEffect } from 'vue'
import SockJS from 'sockjs-client'
import * as Stomp from '@stomp/stompjs'
const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api'
// Variables y estados
const selectedEntity = ref(null)
let currentDiagramPosition = ref(null) // Variable para guardar la posición
let currentDiagramScale = ref(1)
let hasChanges = ref(false) // Variable para detectar si ha habido cambios en el diagrama
let intervalId = null
const diagramDiv = ref(null)
let diagram = null
let diagramData = ref(null)
const newMethod = ref({ name: '', type: 'void', visibility: 'public' })
const methods = ref([])
let selectedNode = null
let selectedLink = ref(null)
const showModal = ref(false)
const entityName = ref('') // Nombre de la entidad en edición
const newAttribute = ref({ name: '', type: 'int', primaryKey: false }) // Nuevo atributo por agregar
const attributes = ref([]) // Lista de atributos de la entidad actual
const route = useRoute()
let selectedRelationship = ref(null) // Para almacenar la relación seleccionada
const token = localStorage.getItem('token') || ''
let selectedEntities = ref([]) // Para almacenar las entidades seleccionadas
let idCounter = 1 // Contador para generar IDs positivos
let linkCounter = 1 // Contador para generar keys positivos para los enlaces
const diagramExists = ref(false) // Saber si el diagrama ya existe en la base de datos
const sessionId = Number(route.params.sessionId)
const userId = Number(route.params.userId) // ID de la sesión actual (puedes obtenerlo dinámicamente)
// Pasamos la función para manejar actualizaciones de diagrama
// WebSocket setup
let stompClient = null
function connectToWebSocket() {
  const socket = new SockJS(
    `https://ytterbic-kassie-mauricioaleman-98ee6074.koyeb.app/api/ws-diagram`
  )
  stompClient = Stomp.Stomp.over(socket)

  stompClient.connect(
    {},
    () => {
      console.log('Conectado al WebSocket')
      // Suscribirse al canal de la sesión actual
      stompClient.subscribe(`/topic/diagrams/${sessionId}`, (message) => {
        const updatedData = JSON.parse(message.body)
        // Si el mensaje proviene del mismo usuario que lo envió, no hacer nada
        if (isProcessing) {
          console.log('Ignorando el mensaje del WebSocket ya que estamos procesando localmente.')
          isProcessing = false // Restablecer la bandera después de ignorar
          return
        }
        if (updatedData && diagram) {
          switch (updatedData.eventType) {
            case 'nodePosition': {
              diagram.model.startTransaction('updateNodePosition')
              const existingNode = diagram.model.findNodeDataForKey(updatedData.nodeData.key)
              if (existingNode) {
                diagram.model.setDataProperty(existingNode, 'loc', updatedData.nodeData.loc)
              }
              diagram.model.commitTransaction('updateNodePosition')
              console.log('Posición del nodo actualizada:', updatedData)
              break
            }
            case 'newNode': {
              diagram.model.startTransaction('addNode')
              console.log('hola')
              // Verificar si el nodo ya existe antes de agregarlo
              const existingNode = diagram.model.findNodeDataForKey(updatedData.nodeData.key)
              if (!existingNode) {
                diagram.model.addNodeData(updatedData.nodeData)
              } else {
                console.warn('El nodo ya existe en el diagrama:', updatedData.nodeData.key)
              }

              diagram.model.commitTransaction('addNode')
              console.log('Nueva entidad agregada:', updatedData)
              break
            }

            case 'newLink': {
              diagram.model.startTransaction('addLink')
              diagram.model.addLinkData(updatedData.linkData)
              diagram.model.commitTransaction('addLink')
              console.log('Nueva relación agregada:', updatedData)
              break
            }
            case 'updateNode': {
              const existingNode = diagram.model.findNodeDataForKey(updatedData.nodeData.key)
              if (existingNode) {
                diagram.model.startTransaction('updateNode')
                diagram.model.setDataProperty(existingNode, 'name', updatedData.nodeData.name)
                diagram.model.setDataProperty(
                  existingNode,
                  'attributes',
                  updatedData.nodeData.attributes
                )
                diagram.model.setDataProperty(existingNode, 'methods', updatedData.nodeData.methods)
                diagram.model.setDataProperty(existingNode, 'loc', updatedData.nodeData.loc)
                diagram.model.commitTransaction('updateNode')

                console.log('Entidad actualizada desde WebSocket:', updatedData)
              } else {
                console.warn('No se encontró el nodo para actualizar:', updatedData.nodeData.key)
              }
              break
            }
            case 'deleteNode': {
              console.log('Procesando eliminación de nodo:', updatedData.linkData)
              const existingNode = diagram.model.findNodeDataForKey(updatedData.linkData.key)
              if (existingNode) {
                diagram.model.startTransaction('deleteNode')
                diagram.model.removeNodeData(existingNode) // Eliminar el nodo del modelo
                diagram.model.commitTransaction('deleteNode')
                console.log('Nodo eliminado en GoJS:', existingNode)
              } else {
                console.warn('No se encontró el nodo para eliminar:', updatedData.nodeData.key)
              }
              break
            }
            default:
              console.error('Tipo de evento desconocido:', updatedData.eventType)
              break
          }
        }
      })
    },
    (error) => {
      console.error('Error al conectar al WebSocket:', error)
    }
  )
}
const exportDiagramAsBackend = async () => {
  try {
    await exportDiagram(sessionId, token)
    console.log('Archivo ZIP exportado y descargado con éxito.')
  } catch (error) {
    console.error('Error al exportar el backend como ZIP:', error)
  }
}
const sendDiagramUpdate = (eventType, data) => {
  if (stompClient && stompClient.connected) {
    const updatePayload = {
      eventType, // Puede ser "nodePosition", "newNode" o "newLink"
      ...data
    }
    stompClient.send(`/app/updateDiagram/${sessionId}`, {}, JSON.stringify(updatePayload))
  }
}
const openEditDialog = () => {
  if (selectedEntity.value) {
    entityName.value = selectedEntity.value.data.name
    attributes.value = selectedEntity.value.data.attributes || []
    methods.value = selectedEntity.value.data.methods || []
    showModal.value = true // Mostrar el modal
  }
}
// Función para manejar las actualizaciones de diagrama desde el WebSocket
function onDiagramUpdate(updatedDiagram) {
  if (updatedDiagram) {
    diagram.model = go.Model.fromJson(updatedDiagram)
    console.log('Diagrama actualizado desde WebSocket:', updatedDiagram)
  }
}
// Hook para consumir los datos del diagrama
const { getDiagramBySessionQuery, createDiagramMutation, updateDiagramMutation } =
  useDiagrams(token)

// Función para cargar el diagrama desde la base de datos
const loadDiagram = async () => {
  try {
    const response = await getDiagramBySessionQuery(sessionId).refetch() // Intentar obtener el diagrama
    if (response.data && response.data.data) {
      let diagramJson = response.data.data.data
      if (diagramJson && diagramJson.data) {
        diagramJson = diagramJson.data // Accede a la propiedad interior si existe
      }
      if (currentDiagramPosition.value) {
        diagram.position = currentDiagramPosition.value
      }
      if (currentDiagramScale.value) {
        diagram.scale = currentDiagramScale.value
      }
      diagram.model = go.Model.fromJson(diagramJson)
      diagramExists.value = true // El diagrama ya existe
    } else {
      console.error('No se encontró ningún diagrama guardado.')
    }
  } catch (error) {
    console.error('Error al cargar el diagrama:', error)
    diagramExists.value = false // No existe diagrama en la base de datos
  }
}
function goBack() {
  // Usa el historial del navegador para ir atrás
  window.history.back()
}
const initDiagram = () => {
  const $ = go.GraphObject.make

  diagram = $(go.Diagram, diagramDiv.value, {
    'undoManager.isEnabled': true,
    model: $(go.GraphLinksModel, { linkKeyProperty: 'key' })
  })

  // Listener para detectar cambios en el diagrama y enviar las actualizaciones
  diagram.model.addChangedListener((e) => {
    if (e.isTransactionFinished) {
      currentDiagramPosition.value = diagram.position
      currentDiagramScale.value = diagram.scale
      hasChanges.value = true

      // Enviar la actualización del diagrama en tiempo real a través del WebSocket
      const updatedDiagram = diagram.model.toJson()
      sendDiagramUpdate(JSON.parse(updatedDiagram))
      console.log('holaaaa')
    }
  })
  diagram.addDiagramListener('SelectionMoved', (e) => {
    e.subject.each((part) => {
      if (part instanceof go.Node) {
        const updatedNode = {
          key: part.data.key,
          loc: `${part.location.x} ${part.location.y}`
        }
        sendDiagramUpdate('nodePosition', { nodeData: updatedNode })
      }
    })
  })

  // Configurar la plantilla del nodo y sus atributos
  diagram.nodeTemplate = $(
    go.Node,
    'Auto',
    {
      selectionChanged: onNodeSelected,
      locationSpot: go.Spot.Center
    },
    new go.Binding('location', 'loc', go.Point.parse).makeTwoWay(go.Point.stringify),
    $(go.Shape, 'RoundedRectangle', { fill: 'lightblue', stroke: null }),
    $(
      go.Panel,
      'Vertical',
      $(
        go.TextBlock,
        { margin: 8, font: 'bold 14px sans-serif', stroke: '#333' },
        new go.Binding('text', 'name')
      ),
      $(go.Panel, 'Vertical', new go.Binding('itemArray', 'attributes'), {
        itemTemplate: $(
          go.Panel,
          'Horizontal',
          $(
            go.TextBlock,
            { margin: 4, font: '12px sans-serif', stroke: '#333' },
            new go.Binding('text', '', (attr) => {
              let pkText = attr.primaryKey ? ' [PK]' : ''
              let fkText = attr.foreignKey ? ' [FK]' : ''
              return `${attr.name} (${attr.type})${pkText}${fkText}`
            })
          )
        )
      }),
      $(go.Panel, 'Vertical', new go.Binding('itemArray', 'methods'), {
        itemTemplate: $(
          go.Panel,
          'Horizontal',
          $(
            go.TextBlock,
            { margin: 4, font: '12px sans-serif', stroke: '#333' },
            new go.Binding(
              'text',
              '',
              (method) => `${method.visibility} ${method.name}(): ${method.type}`
            )
          )
        )
      })
    ),
    makePort('T', go.Spot.Top, true),
    makePort('L', go.Spot.Left, true),
    makePort('R', go.Spot.Right, true),
    makePort('B', go.Spot.Bottom, true)
  )

  function makePort(name, spot, output) {
    return $(go.Shape, 'Circle', {
      fill: 'transparent',
      stroke: null,
      desiredSize: new go.Size(8, 8),
      portId: name,
      fromSpot: spot,
      toSpot: spot,
      fromLinkable: output, // Esto debería ser true o false
      toLinkable: !output, // Esto debería ser true o false
      cursor: 'pointer'
    })
  }
  diagram.linkTemplate = $(
    go.Link,
    {
      routing: go.Link.AvoidsNodes,
      curve: go.Link.JumpOver,
      corner: 5,
      relinkableFrom: true,
      relinkableTo: true,
      selectionChanged: onLinkSelected
    },
    // Forma de la línea
    $(
      go.Shape,
      { isPanelMain: true, strokeWidth: 2 },
      new go.Binding('strokeDashArray', 'relationship', getDashArray)
    ),
    // Flecha en el extremo "to"
    $(
      go.Shape,
      new go.Binding('toArrow', 'relationship', getArrowType),
      { stroke: 'black', fill: 'black' } // Configuración de estilo para las flechas
    ),
    // Diamante en el extremo "from" (vacío o sólido para agregación/composición)
    $(
      go.Shape,
      new go.Binding('fromArrow', 'relationship', getFromArrow),
      new go.Binding('fill', 'relationship', getFromArrowFill), // Controla si el diamante está lleno o vacío
      { stroke: 'black' } // El borde del diamante será siempre negro
    ),
    // Texto sobre la línea
    $(
      go.TextBlock,
      { segmentOffset: new go.Point(0, -10), editable: true },
      new go.Binding('text', 'relationshipText').makeTwoWay()
    )
  )

  // Listener para manejar las relaciones
  diagram.addDiagramListener('ObjectSingleClicked', (e) => {
    const part = e.subject.part
    if (part instanceof go.Node) {
      selectedEntities.value.push(part)
      if (selectedEntities.value.length === 2) {
        createRelationship() // Llamar a la función para crear la relación cuando hay dos nodos seleccionados
        selectedEntities.value = [] // Limpiar la selección después de crear la relación
      }
    }
  })
}

// Añadir nueva entidad (nodo) al diagrama
const addEntity = async () => {
  diagram.startTransaction('Add Entity')
  const newNode = { name: 'Nueva Entidad', attributes: [], key: idCounter++ }
  diagram.model.addNodeData(newNode)
  diagram.commitTransaction('Add Entity')

  // Enviar la nueva entidad vía WebSocket como un evento de "newNode"
  sendDiagramUpdate('newNode', { nodeData: newNode })

  if (!diagramExists.value) {
    const json = diagram.model.toJson()
    const jsonoficial = JSON.parse(json)
    jsonoficial.class = 'go.GraphLinksModel'

    try {
      await createDiagramMutation.mutateAsync({ sessionId: sessionId, data: jsonoficial })
      diagramExists.value = true
      alert('Diagrama creado con éxito.')
    } catch (error) {
      console.error('Error al crear el diagrama:', error)
    }
  } else {
    updateDiagram() // Actualizar el diagrama completo si ya existe
  }
}

function getFromArrow(relationship) {
  switch (relationship) {
    case 'Agregacion':
      return 'Diamond' // Diamante vacío para agregación
    case 'Composicion':
      return 'Diamond' // Diamante sólido para composición
    default:
      return '' // Sin símbolo para otras relaciones
  }
}

// Función para actualizar el diagrama existente
const updateDiagram = async () => {
  const json = diagram.model.toJson()
  const jsonoficial = JSON.parse(json)
  jsonoficial.class = 'go.GraphLinksModel'

  try {
    await updateDiagramMutation.mutateAsync({ sessionId: sessionId, data: jsonoficial })
    hasChanges.value = false
    console.log('Diagrama actualizado.')
    currentDiagramPosition.value = diagram.position
    currentDiagramScale.value = diagram.scale
  } catch (error) {
    console.error('Error al actualizar el diagrama:', error)
  }
}

// Guardar los cambios en la entidad
const saveEntity = () => {
  if (!selectedNode) {
    console.error('No hay ninguna entidad seleccionada para guardar.')
    return
  }

  // Establecer la bandera de procesamiento a true para evitar duplicaciones
  isProcessing = true

  // Iniciar una transacción para actualizar la entidad
  diagram.startTransaction('Update Entity')

  // Actualizar el nombre, atributos y métodos de la entidad seleccionada
  diagram.model.setDataProperty(selectedNode.data, 'name', entityName.value)
  diagram.model.setDataProperty(selectedNode.data, 'attributes', [...attributes.value])
  diagram.model.setDataProperty(selectedNode.data, 'methods', [...methods.value])

  diagram.commitTransaction('Update Entity')

  // Enviar los cambios de la entidad vía WebSocket
  const updatedEntity = {
    key: selectedNode.data.key,
    name: entityName.value,
    attributes: [...attributes.value],
    methods: [...methods.value],
    loc: selectedNode.data.loc // Incluir la posición actual
  }

  sendDiagramUpdate('updateNode', { nodeData: updatedEntity })

  console.log('Entidad actualizada y enviada vía WebSocket:', updatedEntity)

  closeModal() // Cerrar el modal después de guardar la entidad
}

const addMethod = () => {
  if (newMethod.value.name && newMethod.value.type && newMethod.value.visibility) {
    methods.value.push({ ...newMethod.value })
    newMethod.value = { name: '', type: 'void', visibility: 'public' } // Reiniciar los valores
  }
}

// Eliminar método
const removeMethod = (index) => {
  methods.value.splice(index, 1)
}
// Cerrar el modal
const closeModal = () => {
  showModal.value = false
  selectedNode = null
}

// Alternar la opción de Primary Key
const togglePrimaryKey = () => {
  newAttribute.value.primaryKey = !newAttribute.value.primaryKey
}
const toggleForeignKey = () => {
  newAttribute.value.foreignKey = !newAttribute.value.foreignKey
}
// Añadir un nuevo atributo
const addAttribute = () => {
  if (newAttribute.value.name && newAttribute.value.type) {
    attributes.value.push({ ...newAttribute.value })
    // Reiniciar el estado del atributo para el siguiente ingreso
    newAttribute.value.name = ''
    newAttribute.value.type = 'int'
    newAttribute.value.primaryKey = false
    newAttribute.value.foreignKey = false
  }
}
// Eliminar un atributo
const removeAttribute = (index) => {
  attributes.value.splice(index, 1) // Elimina el atributo del array
  updateNodeAttributes() // Actualiza el nodo en el diagrama
}

const updateNodeAttributes = () => {
  if (selectedNode) {
    diagram.startTransaction('Update Attributes')
    diagram.model.setDataProperty(selectedNode.data, 'attributes', [...attributes.value])
    diagram.commitTransaction('Update Attributes')
  }
}

// Función para eliminar la selección (nodo o relación)
const deleteSelected = () => {
  if (selectedLink.value) {
    diagram.commandHandler.deleteSelection()
    diagram.commitTransaction('Delete Node')

    diagram.commandHandler.deleteSelection()
    selectedLink.value = null // Limpiar la selección
  } else if (selectedEntity.value) {
    // Primero, obtener el nodo que se va a eliminar
    const nodeToDelete = selectedEntity.value.data

    // Eliminar el nodo del diagrama
    diagram.startTransaction('Delete Node')

    // Enviar el evento de eliminación de nodo a través del WebSocket
    sendDiagramUpdate('deleteNode', { nodeData: nodeToDelete })

    console.log('Nodo eliminado y enviado vía WebSocket:', nodeToDelete)
    selectedEntity.value = null // Limpiar la selección
  }
}

// Funciones relacionadas con las relaciones
function getArrowType(relationship) {
  switch (relationship) {
    case 'Generalizacion':
      return 'OpenTriangle' // Triángulo vacío para generalización
    case 'OneToOne':
    case 'OneToMany':
    case 'ManyToMany':
      return '' // Sin flecha para asociaciones
    case 'Agregacion':
    case 'Composicion':
      return '' // Sin flecha para agregación/composición, solo diamante en "from"
    default:
      return '' // Sin flecha para otros casos
  }
}
function getFromArrowFill(relationship) {
  switch (relationship) {
    case 'Composicion':
      return 'black' // Diamante sólido para composición
    case 'Agregacion':
      return 'white' // Diamante vacío para agregación
    default:
      return null // No aplica para otros casos
  }
}
function getDashArray(relationship) {
  if (relationship === 'Dependencia') {
    return [4, 2] // Línea punteada para dependencia
  }
  return null // Línea sólida por defecto
}

const selectRelationship = (type) => {
  selectedRelationship.value = type
  selectedEntities.value = []
  alert(`Has seleccionado: ${type}. Ahora selecciona dos entidades para relacionarlas.`)
}

let isProcessing = false // Nueva bandera global para evitar procesamiento duplicado

const createRelationship = () => {
  if (isProcessing) {
    return // Si ya estamos procesando una relación, no hacemos nada
  }

  if (selectedEntities.value.length === 2) {
    const fromNode = selectedEntities.value[0].data
    const toNode = selectedEntities.value[1].data

    // Verificar si la relación ya existe antes de agregarla
    const existingLink = diagram.model.linkDataArray.find(
      (link) =>
        (link.from === fromNode.key && link.to === toNode.key) ||
        (link.from === toNode.key && link.to === fromNode.key)
    )

    if (existingLink) {
      console.warn('Relación ya existe entre los nodos seleccionados.')
      return // Evitar la duplicación de la relación
    }

    diagram.startTransaction('Add Relationship')

    let relationshipText = ''

    switch (selectedRelationship.value) {
      case 'OneToMany':
        relationshipText = '1:*'
        break
      case 'OneToOne':
        relationshipText = '1:1'
        break
      case 'ManyToMany':
        relationshipText = '*:*'
        // Crear la clase intermedia
        {
          const intermediateNode = {
            key: idCounter++, // Incrementar el contador
            name: 'Tienda_Moiso',
            attributes: [
              { name: 'tiendaId', type: 'int', foreignKey: true },
              { name: 'moisoId', type: 'int', foreignKey: true }
            ],
            methods: []
          }

          diagram.model.addNodeData(intermediateNode) // Añadir el nodo intermedio
        }
        break
      default:
        relationshipText = ''
        break
    }

    const newLink = {
      from: fromNode.key,
      to: toNode.key,
      relationship: selectedRelationship.value,
      relationshipText: relationshipText,
      key: linkCounter++
    }

    diagram.model.addLinkData(newLink) // Añadir la nueva relación al diagrama
    diagram.commitTransaction('Add Relationship')

    // Establecer la bandera de procesamiento a true
    isProcessing = true

    // Enviar solo los datos de la nueva relación vía WebSocket
    sendDiagramUpdate('newLink', { linkData: newLink })

    console.log('Relación creada y enviada:', newLink)
  }
}

// Cuando se selecciona un nodo, abrir el modal de edición
// Cuando se selecciona un nodo, abrir el modal de edición
const onNodeSelected = (node) => {
  if (node.isSelected) {
    selectedNode = node
    selectedEntity.value = node
  } else {
    selectedNode = null
    selectedEntity.value = null
  }
}

// Eliminar relación seleccionada
const onLinkSelected = (link) => {
  if (link.isSelected) {
    selectedLink.value = link
  } else {
    selectedLink.value = null
  }
}

// Inicializar el diagrama al montar el componente
onMounted(() => {
  initDiagram() // Inicializa el diagrama en el frontend
  loadDiagram() // Cargar el diagrama desde la base de datos
  connectToWebSocket() // Conectar al WebSocket

  watchEffect(() => {
    if (diagramData.value) {
      // Si hay actualizaciones del diagrama, cargarlas en el modelo de GoJS
      diagram.model = go.Model.fromJson(diagramData.value)
    }
  })
})

// Limpiar la conexión al desmontar el componente
onBeforeUnmount(() => {
  if (stompClient && stompClient.connected) {
    stompClient.disconnect(() => {
      console.log('Desconectado del WebSocket')
    })
  }
})

// Limpiar el intervalo cuando se desmonte el componente
onBeforeUnmount(() => {
  clearInterval(intervalId)
})

//exclusion pesimista
</script>
