<script>
  import { onMount } from 'svelte';
  import api from '../../lib/api.js';
  
  export let params = {}; // Router sends recipe ID here
  
  let recipe = null;
  let loading = true;
  let error = null;
  
  onMount(async () => {
    if (params.id) {
      await loadRecipe(params.id);
    } else {
      error = 'No recipe ID provided';
      loading = false;
    }
  });
  
  async function loadRecipe(id) {
    try {
      loading = true;
      error = null;
      
      const response = await api.getRecipe(id);
      recipe = response.data?.recipe || response.recipe;
      
      if (!recipe) {
        error = 'Recipe not found';
      }
      
    } catch (err) {
      console.error('Failed to load recipe:', err);
      error = err.message || 'Failed to load recipe';
    } finally {
      loading = false;
    }
  }
  
  // Format date
  function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  }
  
  // Navigate back to recipes
  function goBack() {
    window.location.href = '/#/recipes';
  }
</script>

<div class="container mx-auto px-4 py-8 max-w-4xl">
  {#if loading}
    <div class="text-center py-16">
      <div class="animate-spin w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
      <p class="text-gray-600">Loading recipe...</p>
    </div>
    
  {:else if error}
    <div class="text-center py-16">
      <div class="text-6xl mb-4">😔</div>
      <h1 class="text-2xl font-bold text-gray-900 mb-2">Oops!</h1>
      <p class="text-gray-600 mb-6">{error}</p>
      <button 
        on:click={goBack}
        class="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
      >
        ← Back to Recipes
      </button>
    </div>
    
  {:else if recipe}
    <!-- Back button -->
    <button 
      on:click={goBack}
      class="flex items-center text-blue-600 hover:text-blue-700 mb-6 transition-colors"
    >
      <span class="mr-2">←</span>
      Back to Recipes
    </button>
    
    <article class="bg-white rounded-lg shadow-lg overflow-hidden">
      <!-- Recipe Header -->
      <div class="p-8 border-b border-gray-200">
        <h1 class="text-3xl font-bold text-gray-900 mb-4">{recipe.title}</h1>
        
        <p class="text-gray-600 text-lg leading-relaxed mb-6">{recipe.description}</p>
        
        <!-- Recipe Meta -->
        <div class="flex flex-wrap items-center gap-6 text-sm text-gray-500">
          <div class="flex items-center">
            <span class="mr-2">👨‍🍳</span>
            <span class="font-medium">{recipe.author?.username || 'Unknown chef'}</span>
          </div>
          
          <div class="flex items-center">
            <span class="mr-2">📅</span>
            <span>{formatDate(recipe.createdAt)}</span>
          </div>
          
          {#if recipe.servings}
            <div class="flex items-center">
              <span class="mr-2">🍽️</span>
              <span>{recipe.servings} servings</span>
            </div>
          {/if}
          
          {#if recipe.totalTimeCookingMinutes}
            <div class="flex items-center">
              <span class="mr-2">⏱️</span>
              <span>{recipe.totalTimeCookingMinutes} minutes</span>
            </div>
          {/if}
          
          <div class="flex items-center">
            <span class="mr-2">❤️</span>
            <span>{recipe.favoriteCount || 0} favorites</span>
          </div>
        </div>
        
        <!-- Tags -->
        {#if recipe.tags && recipe.tags.length > 0}
          <div class="mt-4">
            <div class="flex flex-wrap gap-2">
              {#each recipe.tags as tag}
                <span class="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                  {tag}
                </span>
              {/each}
            </div>
          </div>
        {/if}
      </div>
      
      <!-- Recipe Image -->
      {#if recipe.thumbnail}
        <div class="h-64 md:h-80">
          <img 
            src={recipe.thumbnail} 
            alt={recipe.title}
            class="w-full h-full object-cover"
          />
        </div>
      {/if}
      
      <!-- Recipe Content -->
      <div class="p-8">
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <!-- Ingredients -->
          <section>
            <h2 class="text-2xl font-bold text-gray-900 mb-6 flex items-center">
              <span class="mr-2">🥬</span>
              Ingredients
            </h2>
            
            {#if recipe.ingredients && recipe.ingredients.length > 0}
              <ul class="space-y-3">
                {#each recipe.ingredients as ingredient}
                  <li class="flex items-start">
                    <span class="w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    <span class="text-gray-700">{ingredient}</span>
                  </li>
                {/each}
              </ul>
            {:else}
              <p class="text-gray-500">No ingredients listed</p>
            {/if}
          </section>
          
          <!-- Instructions -->
          <section>
            <h2 class="text-2xl font-bold text-gray-900 mb-6 flex items-center">
              <span class="mr-2">📝</span>
              Instructions
            </h2>
            
            {#if recipe.instructions && recipe.instructions.length > 0}
              <ol class="space-y-4">
                {#each recipe.instructions as instruction, index}
                  <li class="flex items-start">
                    <span class="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-semibold mr-4 mt-0.5">
                      {index + 1}
                    </span>
                    <div class="text-gray-700 leading-relaxed">{instruction}</div>
                  </li>
                {/each}
              </ol>
            {:else if recipe.steps && recipe.steps.length > 0}
              <!-- Fallback for old 'steps' field -->
              <ol class="space-y-4">
                {#each recipe.steps as step, index}
                  <li class="flex items-start">
                    <span class="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-semibold mr-4 mt-0.5">
                      {index + 1}
                    </span>
                    <div class="text-gray-700 leading-relaxed">{step}</div>
                  </li>
                {/each}
              </ol>
            {:else}
              <p class="text-gray-500">No instructions provided</p>
            {/if}
          </section>
        </div>
        
        <!-- Video (if available) -->
        {#if recipe.videoUrl}
          <section class="mt-12">
            <h2 class="text-2xl font-bold text-gray-900 mb-6 flex items-center">
              <span class="mr-2">🎥</span>
              Video Tutorial
            </h2>
            
            <div class="aspect-video">
              <iframe
                src={recipe.videoUrl}
                title="Recipe video tutorial"
                class="w-full h-full rounded-lg"
                allowfullscreen
              ></iframe>
            </div>
          </section>
        {/if}
        
        <!-- Nutrition (if available) -->
        {#if recipe.nutrition}
          <section class="mt-12">
            <h2 class="text-2xl font-bold text-gray-900 mb-6 flex items-center">
              <span class="mr-2">📊</span>
              Nutrition Information
            </h2>
            
            <div class="bg-gray-50 rounded-lg p-6">
              <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                {#each Object.entries(recipe.nutrition) as [key, value]}
                  <div class="text-center">
                    <div class="text-lg font-semibold text-gray-900">{value}</div>
                    <div class="text-sm text-gray-600 capitalize">{key}</div>
                  </div>
                {/each}
              </div>
            </div>
          </section>
        {/if}
        
        <!-- Action Buttons -->
        <div class="mt-12 pt-8 border-t border-gray-200">
          <div class="flex flex-wrap gap-4 justify-center">
            <button class="px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center">
              <span class="mr-2">❤️</span>
              Save as Favorite
            </button>
            
            <button class="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center">
              <span class="mr-2">💬</span>
              Add Comment
            </button>
            
            <button class="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center">
              <span class="mr-2">📤</span>
              Share Recipe
            </button>
          </div>
        </div>
      </div>
    </article>
  {/if}
</div> 