<template>
  <div class="main-container">
    <!-- Panel de control a la izquierda -->
    <div class="sidebar">
      <button @click="addEntity" class="btn-sidebar">Añadir Entidad</button>
      <button @click="exportDiagram" class="btn-sidebar">Exportar a JSON</button>
      <button @click="deleteSelected" class="btn-sidebar btn-danger" :disabled="!selectedLink">
        Eliminar Selección
      </button>

      <!-- Nuevo botón -->
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

        <button
          @click="togglePrimaryKey"
          :class="['btn-pk', newAttribute.primaryKey ? 'btn-pk-active' : '']"
        >
          {{ newAttribute.primaryKey ? 'Primary Key [PK]' : 'Marcar como Primary Key' }}
        </button>

        <button @click="addAttribute" class="btn-primary">Agregar Atributo</button>

        <ul>
          <li v-for="(attr, index) in attributes" :key="index">
            {{ attr.name }} ({{ attr.type }}) <span v-if="attr.primaryKey">[PK]</span>
            <button @click="removeAttribute(index)" class="btn-secondary">Eliminar</button>
          </li>
        </ul>

        <button @click="saveEntity" class="btn-primary">Guardar</button>
        <button @click="closeModal" class="btn-secondary">Cerrar</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import go from 'gojs'
import '../../utils/sessionWork.css'

// Variables y estados
const diagramDiv = ref(null)
let diagram = null
let selectedNode = null
let selectedLink = ref(null)
const showModal = ref(false)
const entityName = ref('')
const newAttribute = ref({ name: '', type: 'int', primaryKey: false })
const attributes = ref([])
let selectedRelationship = ref(null) // Para almacenar la relación seleccionada

let selectedEntities = ref([]) // Para almacenar las entidades seleccionadas
let idCounter = 1 // Contador para generar IDs positivos
let linkCounter = 1 // Contador para generar keys positivos para los enlaces

// Inicializa el diagrama
const initDiagram = () => {
  const $ = go.GraphObject.make

  diagram = $(go.Diagram, diagramDiv.value, {
    'undoManager.isEnabled': true,
    model: $(go.GraphLinksModel, { linkKeyProperty: 'key' })
  })

  // Plantilla de nodo con nombre de entidad y atributos en vertical
  diagram.nodeTemplate = $(
    go.Node,
    'Auto',
    { selectionChanged: onNodeSelected, locationSpot: go.Spot.Center },
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
            new go.Binding(
              'text',
              '',
              (attr) => `${attr.name} (${attr.type}) ${attr.primaryKey ? '[PK]' : ''}`
            )
          )
        )
      })
    )
  )

  // Plantilla de enlace con etiquetas y flechas según relación seleccionada
  diagram.linkTemplate = $(
    go.Link,
    { relinkableFrom: true, relinkableTo: true, selectionChanged: onLinkSelected },
    $(go.Shape, new go.Binding('strokeDashArray', 'relationship', getDashArray)), // Línea continua o discontinua
    $(
      go.Shape,
      new go.Binding('toArrow', 'relationship', getArrowType),
      new go.Binding('fill', 'relationship', (rel) => (rel === 'Composicion' ? 'black' : null)), // Relleno negro solo para la composición
      new go.Binding('stroke', 'relationship', (rel) =>
        rel === 'Composicion' ? 'black' : 'black'
      ), // Mantén el borde del diamante para ambas relaciones
      { scale: 2 } // Ajusta el tamaño de las flechas y los diamantes
    ),
    $(go.TextBlock, new go.Binding('text', 'relationshipText'), {
      segmentOffset: new go.Point(20, -10) // Posición del texto de la relación, como 1:*, etc.
    })
  )
  // Escucha clics en las entidades para seleccionar para la relación
  diagram.addDiagramListener('ObjectSingleClicked', (e) => {
    const part = e.subject.part
    if (part instanceof go.Node) {
      selectedEntities.value.push(part)
      if (selectedEntities.value.length === 2) {
        createRelationship()
      }
    }
  })
}

// Función para eliminar la selección (nodo o relación)
const deleteSelected = () => {
  if (selectedLink.value) {
    diagram.commandHandler.deleteSelection()
    selectedLink.value = null // Limpiar la selección
  }
}

// Función para obtener el tipo de flecha
const getArrowType = (relationship) => {
  switch (relationship) {
    case 'Generalizacion':
      return 'OpenTriangle' // Flecha abierta para la generalización
    case 'Agregacion':
      return 'Diamond' // Diamante sin relleno
    case 'Composicion':
      return 'Diamond' // Diamante con relleno negro
    case 'Recursividad':
      return '' // Sin flecha, solo línea
    default:
      return '' // Asociación normal, sin flecha
  }
}

// Función para obtener el tipo de línea (continua o discontinua)
const getDashArray = (relationship) => {
  if (relationship === 'Recursividad') {
    return [4, 2]
  }
  return null
}

// Seleccionar tipo de relación
const selectRelationship = (type) => {
  selectedRelationship.value = type
  selectedEntities.value = []
  alert(`Has seleccionado: ${type}. Ahora selecciona dos entidades para relacionarlas.`)
}

// Crear relación entre dos entidades seleccionadas
const createRelationship = () => {
  if (selectedEntities.value.length === 2) {
    diagram.startTransaction('Add Relationship')

    const fromNode = selectedEntities.value[0].data
    const toNode = selectedEntities.value[1].data

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
        break
      case 'Generalizacion':
      case 'Agregacion':
      case 'Composicion':
      case 'Recursividad':
        relationshipText = ''
        break
    }

    diagram.model.addLinkData({
      from: fromNode.key,
      to: toNode.key,
      relationship: selectedRelationship.value,
      relationshipText: relationshipText, // Asigna la multiplicidad al enlace
      key: linkCounter++ // Asigna un key positivo único
    })

    diagram.commitTransaction('Add Relationship')

    selectedEntities.value = []
  }
}

// Cuando se selecciona un nodo, abrir el modal de edición
const onNodeSelected = (node) => {
  if (node.isSelected) {
    selectedNode = node
    entityName.value = node.data.name
    attributes.value = node.data.attributes || []
    showModal.value = true
  }
}

// Añadir nueva entidad (nodo) al diagrama con IDs positivos
const addEntity = () => {
  diagram.startTransaction('Add Entity')
  diagram.model.addNodeData({ name: 'Nueva Entidad', attributes: [], key: idCounter++ })
  diagram.commitTransaction('Add Entity')
}

const exportDiagram = () => {
  const json = diagram.model.toJson()
  console.log('Exported JSON: ', json)
  alert('Diagrama exportado a JSON. Revisa la consola.')
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

// Añadir un nuevo atributo
const addAttribute = () => {
  if (newAttribute.value.name && newAttribute.value.type) {
    attributes.value.push({ ...newAttribute.value })
    newAttribute.value.name = ''
    newAttribute.value.type = 'int'
    newAttribute.value.primaryKey = false
  }
}

// Eliminar un atributo
const removeAttribute = (index) => {
  attributes.value.splice(index, 1)
}

// Guardar los cambios en la entidad
const saveEntity = () => {
  if (selectedNode) {
    diagram.startTransaction('Update Entity')
    diagram.model.setDataProperty(selectedNode.data, 'name', entityName.value)
    diagram.model.setDataProperty(selectedNode.data, 'attributes', [...attributes.value])
    diagram.commitTransaction('Update Entity')
    closeModal()
  }
}

// Eliminar relación seleccionada
const onLinkSelected = (link) => {
  if (link.isSelected) {
    selectedLink.value = link // Almacena el enlace seleccionado
  } else {
    selectedLink.value = null // Si se deselecciona, limpiamos la variable
  }
}
// Inicializar el diagrama al montar el componente
onMounted(() => {
  initDiagram()
})
</script>
