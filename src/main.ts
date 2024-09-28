import { createApp } from 'vue'
import App from './App.vue'
import vuetify from './plugins/vuetify'
import router from './routes'
import { VueQueryPlugin } from '@tanstack/vue-query'
import '../index.css'

const app = createApp(App)
app.use(VueQueryPlugin)
app.use(router)
app.use(vuetify)
app.mount('#app')
