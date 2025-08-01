<script>
  import { onMount } from 'svelte';
  import api from '../../lib/api.js';
  import RecipeCard from '../../components/RecipeCard.svelte';
  
  let searchQuery = '';
  let searchResults = [];
  let isSearching = false;
  
  // Recipe listing functionality (moved from Home.svelte)
  let recipes = [];
  let isLoading = true;
  let error = null;
  
  onMount(async () => {
    await loadRecipes();
  });
  
  async function loadRecipes() {
    try {
      isLoading = true;
      const response = await api.getRecipes(1, 12); // Page 1, 12 recipes per page
      
      recipes = response.data?.recipes || response.recipes || [];
      
    } catch (err) {
      console.error('Recipes: Failed to load recipes:', err);
      error = err.message || 'Failed to load recipes';
    } finally {
      isLoading = false;
    }
  }
  
  function handleSearch() {
    if (!searchQuery.trim()) return;
    
    isSearching = true;
    // TODO: Implementer søgning med Tasty API
    
    // Simuler søgeforsinkelse
    setTimeout(() => {
      isSearching = false;
      // Mock resultater - vil blive erstattet med rigtige API kald
      searchResults = [];
    }, 1000);
  }
</script>

<div class="container mx-auto px-4 py-8">
  <h1 class="text-3xl font-bold text-gray-900 mb-8">Recipes</h1>
  
  <!-- Search Bar -->
  <div class="max-w-2xl mx-auto mb-8">
    <form on:submit|preventDefault={handleSearch} class="flex gap-4">
      <input 
        type="text" 
        bind:value={searchQuery}
        placeholder="Search for recipes..."
        class="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2" style="focus:ring-color: #4E71FF; focus:border-color: #4E71FF;"
      />
      <button 
        type="submit" 
        disabled={isSearching}
        class="px-6 py-2 text-white rounded-md hover:opacity-90 focus:outline-none focus:ring-2 disabled:opacity-50" style="background-color: #4E71FF; ring-color: #4E71FF;"
      >
        {isSearching ? 'Searching...' : 'Search'}
      </button>
    </form>
  </div>
  
  {#if isSearching}
    <!-- Search in progress -->
    <div class="text-center py-8">
      <div class="text-2xl mb-2">🔍</div>
      <p class="text-gray-600">Searching for recipes...</p>
    </div>
    
  {:else if searchQuery && searchResults.length === 0}
    <!-- No search results -->
    <div class="text-center py-8">
      <div class="text-4xl mb-2">🍽️</div>
      <p class="text-gray-600">No results found for "{searchQuery}"</p>
      <button 
        on:click={() => { searchQuery = ''; searchResults = []; }}
        class="mt-4 hover:opacity-80" style="color: #4E71FF;"
      >
        Clear search
      </button>
    </div>
    
  {:else if isLoading}
    <!-- Loading State -->
    <div class="text-center py-12">
      <div class="text-6xl mb-4">🍳</div>
      <h2 class="text-xl text-gray-600 mb-2">Loading delicious recipes...</h2>
      <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>
    
  {:else if error}
    <!-- Error State -->
    <div class="text-center py-12">
      <div class="text-6xl mb-4">⚠️</div>
      <h2 class="text-xl text-red-600 mb-2">Oops! Something went wrong</h2>
      <p class="text-gray-500 mb-4">{error}</p>
      <button 
        on:click={loadRecipes} 
        class="px-4 py-2 text-white rounded-md hover:opacity-90" style="background-color: #4E71FF;"
      >
        Try Again
      </button>
    </div>
    
  {:else if recipes.length === 0}
    <!-- Empty State -->
    <div class="text-center py-12">
      <div class="text-6xl mb-4">📝</div>
      <h2 class="text-xl text-gray-600 mb-2">No recipes yet!</h2>
      <p class="text-gray-500 mb-4">Be the first to create a delicious recipe</p>
      <a 
        href="/#/create-recipe" 
        class="inline-block px-6 py-2 text-white rounded-md hover:opacity-90" style="background-color: #4E71FF;"
      >
        Create First Recipe
      </a>
    </div>
    
  {:else}
    <!-- Recipes Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {#each recipes as recipe (recipe._id)}
        <RecipeCard {recipe} />
      {/each}
    </div>
    
    <!-- Show recipe count -->
    <div class="text-center mt-8 text-gray-500">
      Showing {recipes.length} recipe{recipes.length !== 1 ? 's' : ''}
    </div>
  {/if}
</div>

 