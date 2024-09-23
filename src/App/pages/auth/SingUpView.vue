<script lang="ts" setup></script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-primary bg-opacity-40">
    <div class="bg-white flex flex-col justify-center items-center w-full max-w-md shadow-lg p-8">
      <h1 class="text-3xl font-bold text-orange-500 mb-2">Create account</h1>
      <form class="mt-6 w-full" action="#" method="POST">
        <div>
          <label class="block text-gray-700">Email Address</label>
          <input
            type="text"
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
          class="w-full block bg-indigo-500 hover:bg-indigo-400 focus:bg-indigo-400 text-white font-semibold rounded-lg px-4 py-3 mt-6"
        >
          Log In
        </button>
      </form>

      <hr class="my-6 border-gray-300 w-full" />

      <button
        type="button"
        class="w-full block bg-white hover:bg-gray-100 focus:bg-gray-100 text-gray-900 font-semibold rounded-lg px-4 py-3 border border-gray-300"
      >
        <div class="flex items-center justify-center">
          <!-- Contenido del SVG -->
          <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" viewBox="0 0 48 48">
            <!-- Contenido del SVG -->
          </svg>
          <span class="ml-4"> Log in with Google</span>
        </div>
      </button>

      <p class="mt-8">
        Need an account?
        <a href="#" class="text-blue-500 hover:text-blue-700 font-semibold">Create an account</a>
      </p>
    </div>
  </div>
</template>
