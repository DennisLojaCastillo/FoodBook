<script>
  export let params = {}; // Router sender recipe ID her
  
  let recipe = null;
  let loading = true;
  
  // TODO: Indlæs opskrift data baseret på params.id
  setTimeout(() => {
    loading = false;
    // Mock opskrift data - vil blive erstattet med rigtige API kald
    recipe = {
      id: params.id || '1',
      title: 'Loading recipe...',
      description: 'Recipe details will be loaded from API'
    };
  }, 1000);
</script>

<div class="container mx-auto px-4 py-8">
  {#if loading}
    <div class="text-center py-12">
      <div class="text-4xl mb-4">⏳</div>
      <p class="text-gray-600">Loading recipe...</p>
    </div>
  {:else if recipe}
    <div class="max-w-4xl mx-auto">
      <h1 class="text-3xl font-bold text-gray-900 mb-4">{recipe.title}</h1>
      
      <div class="bg-white rounded-lg shadow-lg p-6">
        <p class="text-gray-600 mb-6">{recipe.description}</p>
        
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <!-- Ingredients -->
          <div>
            <h2 class="text-xl font-semibold mb-4">Ingredients</h2>
            <div class="text-gray-500">
              Ingredients will be loaded from API...
            </div>
          </div>
          
          <!-- Instructions -->
          <div>
            <h2 class="text-xl font-semibold mb-4">Instructions</h2>
            <div class="text-gray-500">
              Instructions will be loaded from API...
            </div>
          </div>
        </div>
        
        <!-- Actions -->
        <div class="mt-8 flex gap-4">
          <button class="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600">
            ❤️ Save as favorite
          </button>
          <button class="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600">
            💬 Add comment
          </button>
        </div>
      </div>
    </div>
  {:else}
    <div class="text-center py-12">
      <div class="text-4xl mb-4">❌</div>
      <p class="text-gray-600">Recipe not found</p>
    </div>
  {/if}
</div> 