<script lang="ts" setup>
import router from '@/routes'
import { Login } from '../../../../lib/querys/auth/authQuery'
import { ref } from 'vue'
import { RouterLink } from 'vue-router'
import { getByEmail } from '../../../../lib/querys/worskpace/userQuery'

const credentiales = ref({
  email: '',
  password: ''
})

const handleLogin = async () => {
  try {
    console.log(credentiales.value)
    const resp = await Login(credentiales.value)
    console.log(resp.data)
    const user = await getByEmail(resp.data.userDetails.username)
    if (resp && resp.data.token) {
      await router.push(`/workspace/${user.users.id}`)
      console.log('hola')
    } else {
      console.error('Login failed: Incorrect code or password')
      // Aquí podrías mostrar un mensaje al usuario en lugar de solo loguear el error
    }
  } catch (error) {
    console.error('Login failed:', error)
  }
}
</script>

<template>
  <div class="w-full h-screen flex">
    <img
      src="https://images.unsplash.com/photo-1540569876033-6e5d046a1d77?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=1050&q=80"
      alt="background"
      class="object-cover object-center h-screen w-7/12"
    />
    <div class="bg-white flex flex-col justify-center items-center w-5/12 shadow-lg">
      <h1 class="text-3xl font-bold text-[#0ee199] mb-2">LOGIN</h1>
      <div class="w-1/2 text-center">
        <form class="mt-6" action="#" method="POST" @submit.prevent="handleLogin">
          <div>
            <label class="block text-gray-700">Email Address</label>
            <input
              type="email"
              v-model="credentiales.email"
              placeholder="Enter Email Address"
              class="w-full px-4 py-3 rounded-lg bg-gray-200 mt-2 border focus:border-blue-500 focus:bg-white focus:outline-none"
              autofocus
              required
            />
          </div>

          <div class="mt-4">
            <label class="block text-gray-700">Password</label>
            <input
              type="password"
              v-model="credentiales.password"
              placeholder="Enter Password"
              minlength="6"
              class="w-full px-4 py-3 rounded-lg bg-gray-200 mt-2 border focus:border-blue-500 focus:bg-white focus:outline-none"
              required
            />
          </div>

          <div class="text-right mt-2">
            <a
              href="#"
              class="text-sm font-semibold text-gray-700 hover:text-blue-700 focus:text-blue-700"
              >Forgot Password?</a
            >
          </div>

          <button
            type="submit"
            onchange="HandleLogin"
            class="w-full block bg-[#0ee199] hover:bg-indigo-400 focus:bg-indigo-400 text-white font-semibold rounded-lg px-4 py-3 mt-6"
          >
            Log In
          </button>
        </form>

        <hr class="my-6 border-gray-300 w-full" />
        <RouterLink to="/signup">
          <p class="mt-8">
            Need an account?
            <button class="text-[#678458] hover:text-blue-700 font-semibold">
              Create an account
            </button>
          </p>
        </RouterLink>
      </div>
    </div>
  </div>
</template>
