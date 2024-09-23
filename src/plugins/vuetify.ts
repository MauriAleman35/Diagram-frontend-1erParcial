import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import 'vuetify/styles' // Import Vuetify styles

// Paleta de colores personalizada
const myCustomTheme = {
  dark: false, // Indica si el tema será claro u oscuro
  colors: {
    primary: '#0ee199', // Color primario
    secondary: '#678458', // Color secundario
    background: '#e2ebdd', // Color de fondo
    surface: '#FFFFFF', // Color de la superficie
    info: '#0ee199', // Otros colores de ayuda
    success: '#0ee199',
    warning: '#FFA500',
    error: '#FF5252'
  }
}

export default createVuetify({
  components,
  directives,
  theme: {
    defaultTheme: 'myCustomTheme',
    themes: {
      myCustomTheme
    }
  }
})
