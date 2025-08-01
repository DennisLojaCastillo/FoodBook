<script>
  import { auth } from '../stores/auth.js';
  import UserMenu from './UserMenu.svelte';
  
  $: isLoggedIn = $auth.isLoggedIn;
  $: user = $auth.user;
</script>

<header class="bg-white shadow-sm">
  <nav class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8" aria-label="Top">
    <div class="flex w-full items-center justify-between border-b border-gray-200 py-6 lg:border-none">
      <div class="flex items-center">
        <a href={isLoggedIn ? '/#/recipes' : '/#/'}>
          <span class="sr-only">FoodBook</span>
          <div class="flex items-center">
            <span class="text-2xl">🍳</span>
            <span class="ml-2 text-xl font-bold text-gray-900">FoodBook</span>
          </div>
        </a>
      </div>
      
      <div class="ml-10 space-x-4">
        {#if isLoggedIn}
          <!-- Logged in navigation -->
          <a href="/#/dashboard" class="text-gray-500 hover:text-gray-900 px-3 py-2 text-sm font-medium">
            Dashboard
          </a>
          <a href="/#/recipes" class="text-gray-500 hover:text-gray-900 px-3 py-2 text-sm font-medium">
            Recipes
          </a>
          <a href="/#/create-recipe" class="text-gray-500 hover:text-gray-900 px-3 py-2 text-sm font-medium">
            Create Recipe
          </a>
          
          <!-- User Menu -->
          <UserMenu {user} />
          
        {:else}
          <!-- Not logged in navigation -->
          <a href="/#/" class="text-gray-500 hover:text-gray-900 px-3 py-2 text-sm font-medium">
            Home
          </a>
          <a href="/#/login" class="text-gray-500 hover:text-gray-900 px-3 py-2 text-sm font-medium">
            Sign In
          </a>
          <a href="/#/signup" class="text-white bg-blue-600 hover:bg-blue-700 px-3 py-2 rounded-md text-sm font-medium">
            Sign Up
          </a>
        {/if}
      </div>
    </div>
  </nav>
</header> 