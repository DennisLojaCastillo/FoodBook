<script>
  import { auth } from '../stores/auth.js';
  import UserMenu from './UserMenu.svelte';
  
  $: isLoggedIn = $auth.isLoggedIn;
  $: user = $auth.user;
</script>

<header class="bg-gradient-to-br from-orange-50 to-yellow-50 shadow-sm">
  <nav class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8" aria-label="Top">
    <div class="flex w-full items-center justify-between border-b border-gray-200 py-6 lg:border-none">
      <div class="flex items-center">
        <a href={isLoggedIn ? '/#/recipes' : '/#/'}>
          <span class="sr-only">FoodBook</span>
          <div class="flex items-center">
            <span class="text-2xl">🍳</span>
            <span class="ml-2 text-xl font-bold" style="color: #4E71FF;">FoodBook</span>
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
          <a href="/#/login" class="text-gray-500 hover:text-gray-900 px-3 py-2 text-sm font-medium">
            Login
          </a>
          <a href="/#/signup" class="text-white hover:opacity-90 px-3 py-2 rounded-md text-sm font-medium" style="background-color: #4E71FF;">
            Sign Up
          </a>
        {/if}
      </div>
    </div>
  </nav>
</header> 