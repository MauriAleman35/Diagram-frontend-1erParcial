<script setup>
import { ref, onMounted, onBeforeUnmount, watch, watchEffect } from 'vue'
import go from 'gojs'
import { useRoute, useRouter } from 'vue-router'
import * as SockJS from 'sockjs-client'
import * as Stomp from '@stomp/stompjs'

import '../../utils/sessionWork.css'
import { useDiagrams } from '../../../../hooks/use-diagram'
import { exportDiagram } from '../../../../lib/querys/worskpace/diagramQuery'

/* ========= Relaciones (UI) ========= */
const isCreatingRelation = ref(false)
const relationMode = ref('')
const selectedRelationship = ref(null)

/* ========= CONFIG ========= */
const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api'
const route = useRoute()
const router = useRouter()
const sessionId = Number(route.params.sessionId)
const userId = Number(route.params.userId)
const token = localStorage.getItem('token') || ''
const clientId =
  crypto && crypto.randomUUID ? crypto.randomUUID() : `c_${Date.now()}_${Math.random()}`

/* ========= ESTADO ========= */
const diagramDiv = ref(null)
let diagram = null

const selectedEntity = ref(null)
let selectedNode = null
const selectedLink = ref(null)

const showModal = ref(false)
const entityName = ref('')

const newAttribute = ref({ name: '', type: 'int', primaryKey: false, foreignKey: false })
const attributes = ref([])
const newMethod = ref({ name: '', type: 'void', visibility: 'public' })
const methods = ref([])

let idCounter = 1
let linkCounter = 1
const diagramExists = ref(false)
let currentDiagramPosition = ref(null)
let currentDiagramScale = ref(1)
let hasChanges = ref(false)

/* ========= UX ========= */
const resizeMode = ref(false)

/* ========= WEBSOCKET ========= */
let stompClient = null
let isProcessing = false

function connectToWebSocket() {
  const wsEndpoint = `${baseURL}/ws-diagram`
  const socket = new SockJS.default(wsEndpoint)
  stompClient = Stomp.Stomp.over(socket)
  stompClient.connect(
    {},
    () => {
      stompClient.subscribe(`/topic/diagrams/${sessionId}`, (message) => {
        const updated = JSON.parse(message.body)
        if (!updated) return
        if (updated.clientId && updated.clientId === clientId) return
        if (isProcessing) {
          isProcessing = false
          return
        }
        handleWebSocketUpdate(updated)
      })
    },
    (err) => console.error('Error WS:', err)
  )
}

function sendDiagramUpdate(eventType, data) {
  if (!stompClient || !stompClient.connected) return
  const payload = { clientId, eventType, ...data }
  stompClient.send(`/app/updateDiagram/${sessionId}`, {}, JSON.stringify(payload))
}

/* ========= CARGA/GUARDADO ========= */
const { getDiagramBySessionQuery, createDiagramMutation, updateDiagramMutation } =
  useDiagrams(token)

// ——— helpers: multiplicidad visible solo en 1–1 y 1–* ———
function showMultLabel(data) {
  return data && (data.relationship === 'OneToOne' || data.relationship === 'OneToMany')
}

// Normaliza SOLO cuando toca: 1–1 y 1–*; el resto SIN etiquetas
function ensureLinkMultiplicities(l) {
  if (!l) return
  // migración desde relationshipText (si existiera) SOLO para O2O / O2M
  if ((!l.fromMult || !l.toMult) && l.relationshipText && l.relationshipText.includes(':')) {
    const [a, b] = l.relationshipText.split(':')
    if (l.relationship === 'OneToOne' || l.relationship === 'OneToMany') {
      l.fromMult = l.fromMult || a || '1'
      l.toMult = l.toMult || b || (l.relationship === 'OneToMany' ? '*' : '1')
    }
  }
  if (l.relationship === 'OneToOne') {
    l.fromMult = l.fromMult || '1'
    l.toMult = l.toMult || '1'
  } else if (l.relationship === 'OneToMany') {
    l.fromMult = l.fromMult || '1'
    l.toMult = l.toMult || '*'
  } else {
    // otros tipos: sin multiplicidad (oculta)
    delete l.fromMult
    delete l.toMult
  }
  if (typeof l.styleScale === 'undefined') l.styleScale = 1.6
}

async function loadDiagram() {
  try {
    const response = await getDiagramBySessionQuery(sessionId).refetch()
    if (response.data && response.data.data) {
      let diagramJson = response.data.data.data
      if (diagramJson && diagramJson.data) diagramJson = diagramJson.data

      diagram.model = go.Model.fromJson(diagramJson)
      // normaliza TODOS los links
      diagram.model.linkDataArray.forEach((l) => ensureLinkMultiplicities(l))

      diagramExists.value = true

      if (currentDiagramPosition.value) diagram.position = currentDiagramPosition.value
      if (currentDiagramScale.value) diagram.scale = currentDiagramScale.value

      const nodeKeys = diagram.model.nodeDataArray
        .map((n) => n.key)
        .filter((k) => typeof k === 'number')
      const linkKeys = diagram.model.linkDataArray
        .map((l) => l.key)
        .filter((k) => typeof k === 'number')
      idCounter = nodeKeys.length ? Math.max(...nodeKeys) + 1 : idCounter
      linkCounter = linkKeys.length ? Math.max(...linkKeys) + 1 : linkCounter
    } else {
      console.warn('No hay diagrama guardado aún.')
    }
  } catch (err) {
    console.error('Error al cargar diagrama:', err)
    diagramExists.value = false
  }
}

async function persistDiagram() {
  const json = diagram.model.toJson()
  const data = JSON.parse(json)
  data.class = 'go.GraphLinksModel'
  try {
    if (!diagramExists.value) {
      await createDiagramMutation.mutateAsync({ sessionId, data })
      diagramExists.value = true
    } else {
      await updateDiagramMutation.mutateAsync({ sessionId, data })
    }
    hasChanges.value = false
    currentDiagramPosition.value = diagram.position
    currentDiagramScale.value = diagram.scale
  } catch (err) {
    console.error('Error al persistir diagrama:', err)
  }
}

async function exportDiagramAsBackend() {
  try {
    await exportDiagram(sessionId, token)
    console.log('ZIP exportado.')
  } catch (error) {
    console.error('Error al exportar:', error)
  }
}

/* ========= INICIALIZACIÓN GOJS ========= */
function initDiagram() {
  const $ = go.GraphObject.make

  // Estilo “más grande/prolijo”
  const FONT_BASE = '13px sans-serif'
  const FONT_HEADER = 'bold 16px sans-serif'
  const NODE_MIN_W = 240
  const NODE_MIN_H = 120
  const LINK_STROKE = 3
  const LABEL_FONT = 'bold 13px sans-serif'
  const LABEL_BG = 'white'
  const ARROW_SCALE = 1.6

  diagram = $(go.Diagram, diagramDiv.value, {
    'undoManager.isEnabled': true,
    model: $(go.GraphLinksModel, { linkKeyProperty: 'key' }),
    'linkingTool.archetypeLinkData': {
      relationship: 'OneToOne', // se sobrescribe según selección
      fromMult: '1',
      toMult: '1',
      styleScale: 1.6,
      key: undefined
    }
  })

  diagram.model.addChangedListener((e) => {
    if (!e.isTransactionFinished) return
    currentDiagramPosition.value = diagram.position
    currentDiagramScale.value = diagram.scale
    hasChanges.value = true
    isProcessing = true
    sendDiagramUpdate('fullDiagram', { data: JSON.parse(diagram.model.toJson()) })
  })

  diagram.addDiagramListener('PartResized', (e) => {
    const part = e.subject.part
    if (!(part instanceof go.Node)) return
    diagram.startTransaction('UserSized')
    diagram.model.setDataProperty(part.data, 'userSized', true)
    diagram.commitTransaction('UserSized')
    sendDiagramUpdate('updateNode', { nodeData: { ...part.data } })
  })

  diagram.addDiagramListener('SelectionMoved', (e) => {
    e.subject.each((part) => {
      if (part instanceof go.Node) {
        const updatedNode = { key: part.data.key, loc: `${part.location.x} ${part.location.y}` }
        sendDiagramUpdate('nodePosition', { nodeData: updatedNode })
      }
    })
  })

  diagram.addDiagramListener('LinkDrawn', (e) => {
    const link = e.subject
    if (!link) return

    const type = relationMode.value || link.data.relationship || 'OneToOne'
    if (type === 'ManyToMany') {
      handleManyToManyRelation(link.data)
      if (isCreatingRelation.value) deactivateRelationMode()
      return
    }

    const patched = setupLinkByRelationType(link.data, type)
    if (patched) {
      ensureLinkMultiplicities(patched)
      diagram.startTransaction('Patch Link Type')
      Object.entries(patched).forEach(([k, v]) => {
        if (k !== 'key') diagram.model.setDataProperty(link.data, k, v)
      })
      diagram.commitTransaction('Patch Link Type')
      sendDiagramUpdate('newLink', { linkData: link.data })
    }
    if (isCreatingRelation.value) deactivateRelationMode()

    link.isSelected = true
  })

  function showPorts(node, show) {
    if (!node || !node.ports) return
    node.ports.each((p) => (p.visible = !!show))
  }

  // ===== Node =====
  diagram.nodeTemplate = $(
    go.Node,
    'Auto',
    {
      selectionChanged: (node) => {
        onNodeSelected(node)
        const show = node.isSelected || isCreatingRelation.value
        showPorts(node, show)
      },
      locationSpot: go.Spot.Center,
      resizable: resizeMode.value,
      resizeObjectName: 'SHAPE',
      mouseEnter: (e, node) => {
        if (isCreatingRelation.value) showPorts(node, true)
      },
      mouseLeave: (e, node) => {
        const keep = node.isSelected || isCreatingRelation.value
        showPorts(node, keep)
      }
    },
    new go.Binding('location', 'loc', go.Point.parse).makeTwoWay(go.Point.stringify),

    $(go.Shape, 'RoundedRectangle', {
      name: 'SHAPE',
      fill: 'lightblue',
      stroke: 'black',
      strokeWidth: 2,
      minSize: new go.Size(NODE_MIN_W, NODE_MIN_H)
    }),
    new go.Binding('desiredSize', 'size', (s) => {
      if (!s) return undefined
      const [w, h] = (s || `${NODE_MIN_W} ${NODE_MIN_H}`).split(' ').map(Number)
      return new go.Size(w, h)
    }).makeTwoWay((sz) => (sz ? `${Math.round(sz.width)} ${Math.round(sz.height)}` : undefined)),

    $(
      go.Panel,
      'Vertical',
      { margin: 12, defaultAlignment: go.Spot.Left },

      $(
        go.TextBlock,
        {
          margin: new go.Margin(4, 4, 8, 4),
          font: FONT_HEADER,
          stroke: '#333',
          textAlign: 'center',
          wrap: go.TextBlock.WrapFit
        },
        new go.Binding('text', 'name')
      ),

      $(go.Shape, 'LineH', {
        stroke: 'black',
        strokeWidth: 1,
        height: 1,
        stretch: go.GraphObject.Horizontal,
        margin: new go.Margin(0, 4, 4, 4)
      }),

      $(
        go.Panel,
        'Vertical',
        { stretch: go.GraphObject.Horizontal, defaultAlignment: go.Spot.Left },
        new go.Binding('itemArray', 'attributes'),
        {
          itemTemplate: $(
            go.Panel,
            'Horizontal',
            { margin: new go.Margin(1, 4, 1, 8), stretch: go.GraphObject.Horizontal },
            $(
              go.TextBlock,
              {
                font: FONT_BASE,
                stroke: '#333',
                textAlign: 'left',
                wrap: go.TextBlock.WrapFit
              },
              new go.Binding('text', '', (attr) => {
                const pk = attr.primaryKey ? ' [PK]' : ''
                const fk = attr.foreignKey ? ' [FK]' : ''
                return `${attr.name}: ${attr.type}${pk}${fk}`
              })
            )
          )
        }
      ),

      $(
        go.Shape,
        'LineH',
        {
          stroke: 'black',
          strokeWidth: 1,
          height: 1,
          stretch: go.GraphObject.Horizontal,
          margin: new go.Margin(4, 4, 4, 4)
        },
        new go.Binding('visible', 'methods', (m) => Array.isArray(m) && m.length > 0)
      ),

      $(
        go.Panel,
        'Vertical',
        { stretch: go.GraphObject.Horizontal, defaultAlignment: go.Spot.Left },
        new go.Binding('itemArray', 'methods'),
        {
          itemTemplate: $(
            go.Panel,
            'Horizontal',
            { margin: new go.Margin(1, 4, 1, 8), stretch: go.GraphObject.Horizontal },
            $(
              go.TextBlock,
              {
                font: FONT_BASE,
                stroke: '#333',
                textAlign: 'left',
                wrap: go.TextBlock.WrapFit
              },
              new go.Binding('text', '', (m) => `${m.visibility} ${m.name}(): ${m.type}`)
            )
          )
        }
      )
    ),

    makePort('T', go.Spot.Top),
    makePort('L', go.Spot.Left),
    makePort('R', go.Spot.Right),
    makePort('B', go.Spot.Bottom)
  )

  // ===== Link (sin texto central) =====
  diagram.linkTemplate = $(
    go.Link,
    {
      routing: go.Link.AvoidsNodes,
      curve: go.Link.JumpOver,
      corner: 8,
      relinkableFrom: true,
      relinkableTo: true,
      selectionChanged: onLinkSelected,
      selectable: true,
      deletable: true
    },

    $(
      go.Shape,
      { isPanelMain: true, strokeWidth: LINK_STROKE },
      new go.Binding('strokeDashArray', 'relationship', getDashArray)
    ),

    $(
      go.Shape,
      new go.Binding('toArrow', 'relationship', getArrowType),
      {
        stroke: 'black',
        fill: 'black'
      },
      new go.Binding('scale', 'styleScale', (s) => s || ARROW_SCALE)
    ),

    $(
      go.Shape,
      new go.Binding('fromArrow', 'relationship', getFromArrow),
      new go.Binding('fill', 'relationship', getFromArrowFill),
      { stroke: 'black' },
      new go.Binding('scale', 'styleScale', (s) => s || ARROW_SCALE)
    ),

    // multiplicidad "from"
    $(
      go.TextBlock,
      {
        segmentIndex: 0,
        segmentOffset: new go.Point(0, -20),
        font: LABEL_FONT,
        background: LABEL_BG,
        margin: 2,
        stroke: '#111'
      },
      new go.Binding('visible', '', (d) => showMultLabel(d)),
      new go.Binding('text', 'fromMult', (t) => t || '1')
    ),

    // multiplicidad "to"
    $(
      go.TextBlock,
      {
        segmentIndex: -1,
        segmentOffset: new go.Point(0, -20),
        font: LABEL_FONT,
        background: LABEL_BG,
        margin: 2,
        stroke: '#111'
      },
      new go.Binding('visible', '', (d) => showMultLabel(d)),
      new go.Binding('text', 'toMult', (t) => t || '1')
    )
  )

  // Adorno de selección: iconos para editar multiplicidad (solo si aplica)
  diagram.linkTemplate.selectionAdornmentTemplate = $(
    go.Adornment,
    'Link',
    $(go.Shape, { isPanelMain: true, stroke: '#4CAF50', strokeWidth: 2 }),

    makeIconButton(
      0,
      new go.Point(0, -36),
      '⟳',
      (e, obj) => cycleMultiplicity(obj.part.adornedPart, 'from'),
      (d) => showMultLabel(d)
    ),
    makeIconButton(
      null,
      new go.Point(0, -36),
      '⇄',
      (e, obj) => flipMultiplicity(obj.part.adornedPart),
      (d) => showMultLabel(d)
    ),
    makeIconButton(
      -1,
      new go.Point(0, -36),
      '⟳',
      (e, obj) => cycleMultiplicity(obj.part.adornedPart, 'to'),
      (d) => showMultLabel(d)
    )
  )

  function makeIconButton(segmentIndex, offset, text, handler, visibleFn) {
    const cfg = { cursor: 'pointer', click: handler }
    if (segmentIndex === null) cfg.segmentFraction = 0.5
    else cfg.segmentIndex = segmentIndex
    cfg.segmentOffset = offset
    return $(
      go.Panel,
      'Auto',
      cfg,
      $(
        go.Shape,
        'Circle',
        { fill: 'white', stroke: '#4CAF50', strokeWidth: 1 },
        new go.Binding('visible', '', visibleFn)
      ),
      $(
        go.TextBlock,
        text,
        { margin: 4, font: 'bold 11px sans-serif', stroke: '#4CAF50' },
        new go.Binding('visible', '', visibleFn)
      )
    )
  }

  const MULTS = ['1', '0..1', '1..*', '0..*', '*']
  function nextMult(m) {
    const i = MULTS.indexOf(m || '1')
    return MULTS[(i + 1) % MULTS.length]
  }
  function cycleMultiplicity(linkPart, side) {
    if (!(linkPart instanceof go.Link)) return
    const ld = linkPart.data
    if (!showMultLabel(ld)) return
    const key = side === 'from' ? 'fromMult' : 'toMult'
    const newVal = nextMult(ld[key])
    diagram.startTransaction('Cycle Mult')
    diagram.model.setDataProperty(ld, key, newVal)
    diagram.commitTransaction('Cycle Mult')
    sendDiagramUpdate('updateLink', { linkData: { key: ld.key, [key]: newVal } })
  }
  function flipMultiplicity(linkPart) {
    if (!(linkPart instanceof go.Link)) return
    const ld = linkPart.data
    if (!showMultLabel(ld)) return
    diagram.startTransaction('Flip Mult')
    const a = ld.fromMult
    const b = ld.toMult
    diagram.model.setDataProperty(ld, 'fromMult', b || '1')
    diagram.model.setDataProperty(ld, 'toMult', a || '1')
    diagram.commitTransaction('Flip Mult')
    sendDiagramUpdate('updateLink', {
      linkData: { key: ld.key, fromMult: ld.fromMult, toMult: ld.toMult }
    })
  }

  // Apariencia según relación
  function getArrowType(rel) {
    return rel === 'Generalizacion' ? 'OpenTriangle' : ''
  }
  function getFromArrow(rel) {
    return rel === 'Agregacion' || rel === 'Composicion' ? 'Diamond' : ''
  }
  function getFromArrowFill(rel) {
    if (rel === 'Composicion') return 'black'
    if (rel === 'Agregacion') return 'white'
    return null
  }
  function getDashArray(rel) {
    return rel === 'Dependencia' ? [4, 2] : null
  }

  function makePort(name, spot) {
    return $(go.Shape, 'Circle', {
      fill: '#007bff',
      stroke: 'white',
      strokeWidth: 2,
      desiredSize: new go.Size(10, 10),
      portId: name,
      fromSpot: spot,
      toSpot: spot,
      fromLinkable: true,
      toLinkable: true,
      cursor: 'pointer',
      alignment: spot,
      visible: false
    })
  }

  // Defaults por tipo (sin relationshipText)
  function setupLinkByRelationType(linkData, relationType) {
    const updated = { ...linkData }
    switch (relationType) {
      case 'OneToOne':
        updated.relationship = 'OneToOne'
        updated.fromMult = '1'
        updated.toMult = '1'
        break
      case 'OneToMany':
        updated.relationship = 'OneToMany'
        updated.fromMult = '1'
        updated.toMult = '*'
        break
      case 'ManyToMany':
        handleManyToManyRelation(linkData)
        return null
      case 'Generalizacion':
      case 'Agregacion':
      case 'Composicion':
      case 'Recursividad':
      case 'Dependencia':
        updated.relationship = relationType
        // sin multiplicidades por defecto
        delete updated.fromMult
        delete updated.toMult
        break
      default:
        updated.relationship = 'OneToOne'
        updated.fromMult = '1'
        updated.toMult = '1'
    }
    updated.styleScale = updated.styleScale || 1.6
    updated.key = updated.key ?? linkCounter++
    return updated
  }

  // M:N: asteriscos en la tabla intermedia y “1” en las externas
  function handleManyToManyRelation(linkData) {
    diagram.startTransaction('ManyToMany')
    diagram.model.removeLinkData(linkData)

    const a = diagram.findNodeForKey(linkData.from)
    const b = diagram.findNodeForKey(linkData.to)
    if (!a || !b) {
      diagram.commitTransaction('ManyToMany')
      return
    }

    const midX = (a.location.x + b.location.x) / 2
    const midY = (a.location.y + b.location.y) / 2

    const interNode = {
      key: idCounter++,
      name: `${a.data.name}_${b.data.name}`,
      attributes: [],
      methods: [],
      loc: `${midX} ${midY}`,
      userSized: false
    }
    diagram.model.addNodeData(interNode)

    // IMPORTANTE: ambos enlaces apuntan HACIA la intermedia (to = interNode)
    // así los '*' quedan en la tabla intermedia y los '1' junto a las externas
    const l1 = {
      from: a.data.key,
      to: interNode.key,
      relationship: 'OneToMany',
      fromMult: '1',
      toMult: '*',
      styleScale: 1.6,
      key: linkCounter++
    }
    const l2 = {
      from: b.data.key,
      to: interNode.key,
      relationship: 'OneToMany',
      fromMult: '1',
      toMult: '*',
      styleScale: 1.6,
      key: linkCounter++
    }

    diagram.model.addLinkData(l1)
    diagram.model.addLinkData(l2)
    diagram.commitTransaction('ManyToMany')

    sendDiagramUpdate('newNode', { nodeData: interNode })
    sendDiagramUpdate('newLink', { linkData: l1 })
    sendDiagramUpdate('newLink', { linkData: l2 })
  }
}

/* ========= Acciones UI ========= */
function addEntity() {
  diagram.startTransaction('Add Entity')
  const newNode = {
    key: idCounter++,
    name: 'Nueva Entidad',
    attributes: [],
    methods: [],
    loc: '0 0',
    userSized: false
  }
  diagram.model.addNodeData(newNode)
  diagram.commitTransaction('Add Entity')

  sendDiagramUpdate('newNode', { nodeData: newNode })

  if (!diagramExists.value) {
    const json = diagram.model.toJson()
    const payload = JSON.parse(json)
    payload.class = 'go.GraphLinksModel'
    createDiagramMutation
      .mutateAsync({ sessionId, data: payload })
      .then(() => {
        diagramExists.value = true
        alert('Diagrama creado con éxito.')
      })
      .catch((e) => console.error('Error al crear diagrama:', e))
  } else {
    persistDiagram()
  }
}

function deleteSelected() {
  diagram.commandHandler.deleteSelection()
}

function openEditDialog() {
  if (!selectedEntity.value) return
  entityName.value = selectedEntity.value.data.name
  attributes.value = Array.isArray(selectedEntity.value.data.attributes)
    ? [...selectedEntity.value.data.attributes]
    : []
  methods.value = Array.isArray(selectedEntity.value.data.methods)
    ? [...selectedEntity.value.data.methods]
    : []
  showModal.value = true
}

function closeModal() {
  showModal.value = false
  selectedNode = null
}

function addAttribute() {
  if (newAttribute.value.name && newAttribute.value.type) {
    attributes.value.push({ ...newAttribute.value })
    newAttribute.value = { name: '', type: 'int', primaryKey: false, foreignKey: false }
  }
}
function removeAttribute(index) {
  attributes.value.splice(index, 1)
}
function togglePrimaryKey() {
  newAttribute.value.primaryKey = !newAttribute.value.primaryKey
}
function toggleForeignKey() {
  newAttribute.value.foreignKey = !newAttribute.value.foreignKey
}

function addMethod() {
  if (newMethod.value.name) {
    methods.value.push({ ...newMethod.value })
    newMethod.value = { name: '', type: 'void', visibility: 'public' }
  }
}
function removeMethod(index) {
  methods.value.splice(index, 1)
}

function saveEntity() {
  if (!selectedNode) return
  isProcessing = true

  diagram.startTransaction('Update Entity')
  if (!selectedNode.data.userSized) {
    diagram.model.setDataProperty(selectedNode.data, 'size', undefined)
  }
  diagram.model.setDataProperty(selectedNode.data, 'name', entityName.value)
  diagram.model.setDataProperty(selectedNode.data, 'attributes', [...attributes.value])
  diagram.model.setDataProperty(selectedNode.data, 'methods', [...methods.value])
  diagram.commitTransaction('Update Entity')

  const updatedEntity = { ...selectedNode.data }
  sendDiagramUpdate('updateNode', { nodeData: updatedEntity })
  closeModal()
}

/* ========= Tamaño ========= */
function increaseSize() {
  if (!selectedEntity.value) return
  const n = selectedEntity.value
  const shape = n.findObject('SHAPE')
  const cur = shape && shape.desiredSize ? shape.desiredSize : new go.Size(240, 120)
  const next = new go.Size(cur.width + 20, cur.height + 20)
  diagram.startTransaction('Increase Size')
  diagram.model.setDataProperty(
    n.data,
    'size',
    `${Math.round(next.width)} ${Math.round(next.height)}`
  )
  diagram.model.setDataProperty(n.data, 'userSized', true)
  diagram.commitTransaction('Increase Size')
}

function decreaseSize() {
  if (!selectedEntity.value) return
  const n = selectedEntity.value
  const shape = n.findObject('SHAPE')
  const cur = shape && shape.desiredSize ? shape.desiredSize : new go.Size(240, 120)
  const w = Math.max(240, cur.width - 20)
  const h = Math.max(120, cur.height - 20)
  const next = new go.Size(w, h)
  diagram.startTransaction('Decrease Size')
  diagram.model.setDataProperty(
    n.data,
    'size',
    `${Math.round(next.width)} ${Math.round(next.height)}`
  )
  diagram.model.setDataProperty(n.data, 'userSized', true)
  diagram.commitTransaction('Decrease Size')
}

function resetSize() {
  if (!selectedEntity.value) return
  const n = selectedEntity.value
  diagram.startTransaction('Auto Size')
  diagram.model.setDataProperty(n.data, 'size', undefined)
  diagram.model.setDataProperty(n.data, 'userSized', false)
  diagram.commitTransaction('Auto Size')
}

/* ========= Redimensionar (global) ========= */
function toggleResizeMode() {
  resizeMode.value = !resizeMode.value
  if (!diagram) return
  diagram.startTransaction('Toggle Resizable')
  diagram.nodes.each((node) => (node.resizable = resizeMode.value))
  diagram.commitTransaction('Toggle Resizable')
}

/* ========= Navegación / Guardar ========= */
function goBack() {
  if (window.history.length > 1) router.back()
  else router.push({ name: 'home' })
}
function updateDiagram() {
  persistDiagram()
}

/* ========= RELATION UI ========= */
function selectRelationship(type) {
  relationMode.value = type
  isCreatingRelation.value = true
  selectedRelationship.value = type

  const archetype = setupLinkArchetype(type)
  if (archetype && diagram?.toolManager?.linkingTool) {
    diagram.toolManager.linkingTool.archetypeLinkData = archetype
  }
  if (diagram?.div) diagram.div.style.cursor = 'crosshair'
}
function setupLinkArchetype(type) {
  const base = { key: undefined, styleScale: 1.6 }
  const map = {
    OneToOne: { relationship: 'OneToOne', fromMult: '1', toMult: '1' },
    OneToMany: { relationship: 'OneToMany', fromMult: '1', toMult: '*' },
    ManyToMany: { relationship: 'ManyToMany' },
    Generalizacion: { relationship: 'Generalizacion' },
    Agregacion: { relationship: 'Agregacion' },
    Composicion: { relationship: 'Composicion' },
    Recursividad: { relationship: 'Recursividad' },
    Dependencia: { relationship: 'Dependencia' }
  }
  return { ...base, ...(map[type] || map.OneToOne) }
}

function deactivateRelationMode() {
  isCreatingRelation.value = false
  relationMode.value = ''
  selectedRelationship.value = null
  if (diagram?.div) diagram.div.style.cursor = 'default'
  if (diagram) {
    diagram.nodes.each((node) => {
      const keep = node.isSelected
      node.ports.each((p) => (p.visible = keep))
    })
  }
}

/* ========= WS: APLICACIÓN DE UPDATES ========= */
function handleWebSocketUpdate(updated) {
  switch (updated.eventType) {
    case 'fullDiagram': {
      if (!updated.data) return
      const pos = diagram.position
      const scale = diagram.scale
      diagram.model = go.Model.fromJson(updated.data)
      diagram.model.linkDataArray.forEach((l) => ensureLinkMultiplicities(l))
      diagram.position = pos
      diagram.scale = scale
      break
    }
    case 'nodePosition': {
      diagram.model.startTransaction('WS nodePosition')
      const n = diagram.model.findNodeDataForKey(updated.nodeData?.key)
      if (n) diagram.model.setDataProperty(n, 'loc', updated.nodeData.loc)
      diagram.model.commitTransaction('WS nodePosition')
      break
    }
    case 'newNode': {
      diagram.model.startTransaction('WS newNode')
      const exists = diagram.model.findNodeDataForKey(updated.nodeData?.key)
      if (!exists && updated.nodeData) diagram.model.addNodeData(updated.nodeData)
      diagram.model.commitTransaction('WS newNode')
      break
    }
    case 'newLink': {
      diagram.model.startTransaction('WS newLink')
      const exists = diagram.model.findLinkDataForKey?.(updated.linkData?.key)
      if (!exists && updated.linkData) {
        ensureLinkMultiplicities(updated.linkData)
        diagram.model.addLinkData(updated.linkData)
      }
      diagram.model.commitTransaction('WS newLink')
      break
    }
    case 'updateLink': {
      const l = diagram.model.findLinkDataForKey?.(updated.linkData?.key)
      if (l) {
        diagram.model.startTransaction('WS updateLink')
        const d = updated.linkData
        ;['relationship', 'fromMult', 'toMult', 'styleScale'].forEach((k) => {
          if (typeof d[k] !== 'undefined') diagram.model.setDataProperty(l, k, d[k])
        })
        diagram.model.commitTransaction('WS updateLink')
      }
      break
    }
    case 'updateNode': {
      const n = diagram.model.findNodeDataForKey(updated.nodeData?.key)
      if (n) {
        diagram.model.startTransaction('WS updateNode')
        const d = updated.nodeData
        if (typeof d.name !== 'undefined') diagram.model.setDataProperty(n, 'name', d.name)
        if (typeof d.attributes !== 'undefined')
          diagram.model.setDataProperty(n, 'attributes', d.attributes)
        if (typeof d.methods !== 'undefined') diagram.model.setDataProperty(n, 'methods', d.methods)
        if (typeof d.loc !== 'undefined') diagram.model.setDataProperty(n, 'loc', d.loc)
        if (typeof d.size !== 'undefined') diagram.model.setDataProperty(n, 'size', d.size)
        if (typeof d.userSized !== 'undefined')
          diagram.model.setDataProperty(n, 'userSized', d.userSized)
        diagram.model.commitTransaction('WS updateNode')
      }
      break
    }
    case 'deleteNode': {
      const n = diagram.model.findNodeDataForKey(updated.nodeData?.key)
      if (n) {
        diagram.model.startTransaction('WS deleteNode')
        diagram.model.removeNodeData(n)
        diagram.model.commitTransaction('WS deleteNode')
      }
      break
    }
    case 'deleteLink': {
      const link = diagram.model.linkDataArray.find(
        (l) =>
          l.key === updated.linkData?.key ||
          (l.from === updated.linkData?.from && l.to === updated.linkData?.to)
      )
      if (link) {
        diagram.model.startTransaction('WS deleteLink')
        diagram.model.removeLinkData(link)
        diagram.model.commitTransaction('WS deleteLink')
      }
      break
    }
    default:
      break
  }
}

/* ========= SELECCIÓN ========= */
function onNodeSelected(node) {
  if (node.isSelected) {
    selectedNode = node
    selectedEntity.value = node
    const shape = node.findObject('SHAPE')
    if (shape) {
      shape.stroke = '#4CAF50'
      shape.strokeWidth = 2
    }
  } else {
    selectedNode = null
    selectedEntity.value = null
    const shape = node.findObject('SHAPE')
    if (shape) {
      shape.stroke = 'black'
      shape.strokeWidth = 2
    }
  }
}
function onLinkSelected(link) {
  selectedLink.value = link.isSelected ? link : null
}

/* ========= CICLO DE VIDA ========= */
onMounted(() => {
  initDiagram()
  loadDiagram()
  connectToWebSocket()

  watch(isCreatingRelation, (on) => {
    if (!diagram) return
    diagram.nodes.each((node) => {
      const show = on || node.isSelected
      node.ports.each((p) => (p.visible = show))
    })
  })

  watchEffect(() => {})
})

onBeforeUnmount(() => {
  if (stompClient && stompClient.connected) {
    stompClient.disconnect(() => console.log('WS desconectado'))
  }
})
</script>

<template>
  <div class="main-container">
    <!-- Panel de control a la izquierda -->
    <div class="sidebar">
      <h3 class="sidebar-title">Controles</h3>

      <!-- Controles básicos -->
      <button @click="addEntity" class="btn-sidebar btn-primary">
        <span class="btn-icon"></span>
        Añadir Entidad
      </button>

      <button
        @click="deleteSelected"
        class="btn-sidebar btn-danger"
        :disabled="!selectedEntity && !selectedLink"
      >
        <span class="btn-icon"></span>
        Eliminar Selección
      </button>

      <button @click="updateDiagram" class="btn-sidebar btn-success">
        <span class="btn-icon"></span>
        Guardar Diagrama
      </button>

      <!-- Controles de entidad seleccionada -->
      <div v-if="selectedEntity" class="entity-controls">
        <h4 class="control-section-title">Entidad: {{ selectedEntity.data.name }}</h4>

        <button @click="openEditDialog" class="btn-sidebar btn-edit">
          <span class="btn-icon"></span>
          Editar Entidad
        </button>
      </div>

      <!-- Controles generales -->
      <div class="general-controls">
        <button
          @click="toggleResizeMode"
          :class="['btn-sidebar', 'btn-mode', { 'btn-active': resizeMode }]"
        >
          <span class="btn-icon"></span>
          {{ resizeMode ? 'Desactivar Redimensionar' : 'Modo Redimensionar' }}
        </button>

        <button @click="exportDiagramAsBackend" class="btn-sidebar btn-export">
          <span class="btn-icon"></span>
          Exportar Backend
        </button>

        <button @click="goBack" class="btn-sidebar btn-back">
          <span class="btn-icon"></span>
          Volver Atrás
        </button>

        <button
          @click="deactivateRelationMode"
          class="btn-sidebar btn-secondary"
          :disabled="!isCreatingRelation"
        >
          <span class="btn-icon"></span>
          Desactivar Relación
        </button>
      </div>
    </div>

    <!-- Área del diagrama en el centro -->
    <div class="diagram-container">
      <!-- Indicadores de estado -->
      <div class="status-indicators">
        <div v-if="relationMode" class="relation-indicator">
          <span class="indicator-icon"></span>
          Modo activo: <strong>{{ relationMode }}</strong> - Arrastra desde un puerto a otro
        </div>

        <div v-if="resizeMode" class="resize-indicator">
          <span class="indicator-icon"></span>
          Modo redimensionar activo - Haz clic y arrastra en una entidad
        </div>

        <div v-if="selectedEntity" class="selection-indicator">
          <span class="indicator-icon"></span>
          Entidad seleccionada: <strong>{{ selectedEntity.data.name }}</strong>
        </div>
      </div>

      <!-- Área del diagrama -->
      <div id="diagramDiv" ref="diagramDiv" class="diagram"></div>
    </div>

    <!-- Panel de relaciones a la derecha -->
    <div class="relations-panel">
      <h3 class="panel-title">Relaciones</h3>

      <div class="relations-grid">
        <button
          @click="selectRelationship('OneToOne')"
          :class="['btn-relation', { active: relationMode === 'OneToOne' }]"
        >
          <span class="relation-icon"></span>
          <span class="relation-text">1 a 1</span>
        </button>

        <button
          @click="selectRelationship('OneToMany')"
          :class="['btn-relation', { active: relationMode === 'OneToMany' }]"
        >
          <span class="relation-icon"></span>
          <span class="relation-text">1 a Muchos</span>
        </button>

        <button
          @click="selectRelationship('ManyToMany')"
          :class="['btn-relation', { active: relationMode === 'ManyToMany' }]"
        >
          <span class="relation-icon"></span>
          <span class="relation-text">Muchos a Muchos</span>
        </button>

        <button
          @click="selectRelationship('Generalizacion')"
          :class="['btn-relation', { active: relationMode === 'Generalizacion' }]"
        >
          <span class="relation-icon"></span>
          <span class="relation-text">Generalización</span>
        </button>

        <button
          @click="selectRelationship('Agregacion')"
          :class="['btn-relation', { active: relationMode === 'Agregacion' }]"
        >
          <span class="relation-icon">◇</span>
          <span class="relation-text">Agregación</span>
        </button>

        <button
          @click="selectRelationship('Composicion')"
          :class="['btn-relation', { active: relationMode === 'Composicion' }]"
        >
          <span class="relation-icon"></span>
          <span class="relation-text">Composición</span>
        </button>

        <button
          @click="selectRelationship('Recursividad')"
          :class="['btn-relation', { active: relationMode === 'Recursividad' }]"
        >
          <span class="relation-icon"></span>
          <span class="relation-text">Recursividad</span>
        </button>
      </div>

      <!-- Estado de relaciones -->
      <div v-if="isCreatingRelation" class="relation-status">
        <div class="status-active">
          <span class="status-icon"></span>
          Modo <strong>{{ selectedRelationship }}</strong> activo
        </div>
      </div>
    </div>

    <!-- Modal para editar entidad -->
    <div v-if="showModal" class="modal-overlay" @click="closeModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3 class="modal-title">
            <span class="modal-icon"></span>
            Editar Entidad
          </h3>
          <button @click="closeModal" class="btn-close">×</button>
        </div>

        <div class="modal-body">
          <!-- Nombre de la entidad -->
          <div class="form-section">
            <label class="form-label">Nombre de la Entidad</label>
            <input
              v-model="entityName"
              placeholder="Ingrese el nombre"
              class="input-text input-entity-name"
              @keyup.enter="saveEntity"
            />
          </div>

          <!-- Sección de Atributos -->
          <div class="form-section">
            <h4 class="section-title">
              <span class="section-icon"></span>
              Atributos
            </h4>

            <div class="attribute-form">
              <div class="form-row">
                <input
                  v-model="newAttribute.name"
                  placeholder="Nombre del Atributo"
                  class="input-text"
                />
                <select v-model="newAttribute.type" class="input-select">
                  <option value="int">int</option>
                  <option value="varchar">varchar</option>
                  <option value="datetime">datetime</option>
                  <option value="boolean">boolean</option>
                  <option value="char">char</option>
                  <option value="decimal">decimal</option>
                  <option value="text">text</option>
                </select>
              </div>

              <div class="checkbox-row">
                <button
                  @click="togglePrimaryKey"
                  :class="['btn-checkbox', { 'btn-checkbox-active': newAttribute.primaryKey }]"
                >
                  <span class="checkbox-icon"></span>
                  {{ newAttribute.primaryKey ? 'Primary Key [PK]' : 'Marcar como PK' }}
                </button>

                <button
                  @click="toggleForeignKey"
                  :class="['btn-checkbox', { 'btn-checkbox-active': newAttribute.foreignKey }]"
                >
                  <span class="checkbox-icon"></span>
                  {{ newAttribute.foreignKey ? 'Foreign Key [FK]' : 'Marcar como FK' }}
                </button>
              </div>

              <button
                @click="addAttribute"
                class="btn-add"
                :disabled="!newAttribute.name || !newAttribute.type"
              >
                <span class="btn-icon"></span>
                Agregar Atributo
              </button>
            </div>

            <!-- Lista de atributos existentes -->
            <div v-if="attributes.length > 0" class="items-list">
              <h5 class="list-title">
                <span class="list-icon"></span>
                Atributos existentes ({{ attributes.length }})
              </h5>
              <div class="items-container">
                <div
                  v-for="(attr, index) in attributes"
                  :key="index"
                  class="item-card attribute-card"
                >
                  <div class="item-info">
                    <span class="item-name">{{ attr.name }}</span>
                    <span class="item-type">{{ attr.type }}</span>
                    <div class="item-badges">
                      <span v-if="attr.primaryKey" class="badge badge-pk">PK</span>
                      <span v-if="attr.foreignKey" class="badge badge-fk">FK</span>
                    </div>
                  </div>
                  <button
                    @click="removeAttribute(index)"
                    class="btn-remove"
                    title="Eliminar atributo"
                  >
                    <span class="remove-icon"></span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Sección de Métodos -->
          <div class="form-section">
            <h4 class="section-title">
              <span class="section-icon"></span>
              Métodos
            </h4>

            <div class="method-form">
              <div class="form-row">
                <input
                  v-model="newMethod.name"
                  placeholder="Nombre del Método"
                  class="input-text"
                />
                <select v-model="newMethod.type" class="input-select">
                  <option value="void">void</option>
                  <option value="boolean">boolean</option>
                  <option value="int">int</option>
                  <option value="String">String</option>
                  <option value="double">double</option>
                  <option value="Object">Object</option>
                </select>
                <select v-model="newMethod.visibility" class="input-select">
                  <option value="public">public</option>
                  <option value="private">private</option>
                  <option value="protected">protected</option>
                </select>
              </div>

              <button @click="addMethod" class="btn-add" :disabled="!newMethod.name">
                <span class="btn-icon"></span>
                Agregar Método
              </button>
            </div>

            <!-- Lista de métodos existentes -->
            <div v-if="methods.length > 0" class="items-list">
              <h5 class="list-title">
                <span class="list-icon"></span>
                Métodos existentes ({{ methods.length }})
              </h5>
              <div class="items-container">
                <div v-for="(method, index) in methods" :key="index" class="item-card method-card">
                  <div class="item-info">
                    <span class="visibility-badge">{{ method.visibility }}</span>
                    <span class="item-name">{{ method.name }}()</span>
                    <span class="item-type">{{ method.type }}</span>
                  </div>
                  <button @click="removeMethod(index)" class="btn-remove" title="Eliminar método">
                    <span class="remove-icon"></span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Acciones del modal -->
        <div class="modal-footer">
          <button @click="saveEntity" class="btn-modal btn-save">
            <span class="btn-icon"></span>
            Guardar Cambios
          </button>
          <button @click="closeModal" class="btn-modal btn-cancel">
            <span class="btn-icon"></span>
            Cancelar
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
