<script>
  let searchQuery = '';
  let searchResults = [];
  let isSearching = false;
  
  function handleSearch() {
    if (!searchQuery.trim()) return;
    
    isSearching = true;
    // TODO: Implementer søgning med Tasty API
    console.log('Searching for:', searchQuery);
    
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
        class="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      />
      <button 
        type="submit" 
        disabled={isSearching}
        class="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
      >
        {isSearching ? 'Searching...' : 'Search'}
      </button>
    </form>
  </div>
  
  <!-- Recipe Results -->
  <div class="max-w-4xl mx-auto">
    {#if isSearching}
      <div class="text-center py-8">
        <div class="text-2xl mb-2">🔍</div>
        <p class="text-gray-600">Searching for recipes...</p>
      </div>
    {:else if searchResults.length === 0 && searchQuery}
      <div class="text-center py-8">
        <div class="text-4xl mb-2">🍽️</div>
        <p class="text-gray-600">No results found for "{searchQuery}"</p>
      </div>
    {:else if searchResults.length === 0}
      <div class="text-center py-12">
        <div class="text-6xl mb-4">🍳</div>
        <h2 class="text-xl text-gray-600 mb-2">Discover delicious recipes</h2>
        <p class="text-gray-500">Search above to find recipes from our database and Tasty API</p>
      </div>
    {/if}
  </div>
</div> 