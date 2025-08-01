<script>
  import { onMount } from 'svelte';
  import api from '../../lib/api.js';
  import RecipeCard from '../../components/RecipeCard.svelte';
  import { notifications } from '../../stores/notifications.js';
  
  let searchQuery = '';
  let localSearchResults = [];
  let externalSearchResults = [];
  let isSearching = false;
  let searchTimeout;
  
  // Recipe listing functionality (all local recipes)
  let recipes = [];
  let isLoading = true;
  let error = null;
  
  // Default external recipes (shown when not searching)
  let defaultExternalRecipes = [];
  let defaultExternalLoading = true;
  let defaultExternalError = null;
  
  // Search state tracking
  let hasSearched = false;
  let localSearchError = null;
  let externalSearchError = null;
  
  // Favorite tracking
  let userExternalFavorites = [];
  
  onMount(async () => {
    await Promise.all([
      loadRecipes(),
      loadUserFavorites(),
      loadDefaultExternalRecipes()
    ]);
  });
  
  // Load user's external favorites to check status
  async function loadUserFavorites() {
    try {
      const response = await api.getUserProfile();
      const userProfile = response.data?.user || {};
      userExternalFavorites = userProfile.externalFavorites || [];
    } catch (err) {
      console.error('Failed to load user favorites:', err);
      // Not critical - just means we can't show favorite status
    }
  }
  
  // Load default external recipes (popular recipes)
  async function loadDefaultExternalRecipes() {
    try {
      defaultExternalLoading = true;
      defaultExternalError = null;
      
      // Search for popular recipes
      const response = await api.searchExternalRecipes('chicken', 0, 6);
      defaultExternalRecipes = response.data?.recipes || [];
      
    } catch (err) {
      console.error('Failed to load default external recipes:', err);
      defaultExternalError = err.message || 'Failed to load external recipes';
    } finally {
      defaultExternalLoading = false;
    }
  }
  
  async function loadRecipes() {
    try {
      isLoading = true;
      error = null;
      const response = await api.getRecipes(1, 12); // Page 1, 12 recipes per page
      
      recipes = response.data?.recipes || response.recipes || [];
      
    } catch (err) {
      console.error('Recipes: Failed to load recipes:', err);
      error = err.message || 'Failed to load recipes';
    } finally {
      isLoading = false;
    }
  }
  
  // Debounced search function
  function handleSearchInput() {
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
    
    searchTimeout = setTimeout(() => {
      if (searchQuery.trim()) {
        performSearch();
      } else {
        clearSearch();
      }
    }, 500); // 500ms debounce
  }
  
  async function performSearch() {
    if (!searchQuery.trim()) return;
    
    try {
      isSearching = true;
      hasSearched = true;
      localSearchError = null;
      externalSearchError = null;
      
      console.log(`🔍 Searching for: "${searchQuery}"`);
      
      const results = await api.searchAllRecipes(searchQuery.trim());
      
      localSearchResults = results.data.localRecipes || [];
      externalSearchResults = results.data.externalRecipes || [];
      
      // Handle partial errors gracefully
      if (results.data.localError) {
        localSearchError = results.data.localError.message || 'Local search failed';
        console.warn('Local search error:', results.data.localError);
      }
      
      if (results.data.externalError) {
        externalSearchError = results.data.externalError.message || 'External search failed';
        console.warn('External search error:', results.data.externalError);
      }
      
      const totalResults = localSearchResults.length + externalSearchResults.length;
      console.log(`✅ Search complete: ${localSearchResults.length} local, ${externalSearchResults.length} external recipes`);
      
      if (totalResults === 0 && !localSearchError && !externalSearchError) {
        notifications.info(
          `No recipes found for "${searchQuery}"`,
          'Search Results'
        );
      }
      
    } catch (err) {
      console.error('Search failed:', err);
      localSearchError = err.message || 'Search failed';
      notifications.error(
        'Search failed. Please try again.',
        'Search Error'
      );
    } finally {
      isSearching = false;
    }
  }
  
  function handleSearch() {
    performSearch();
  }
  
  function clearSearch() {
    searchQuery = '';
    localSearchResults = [];
    externalSearchResults = [];
    hasSearched = false;
    localSearchError = null;
    externalSearchError = null;
    
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
  }
  
  // Check if external recipe is already favorited
  function isExternalFavorited(externalId) {
    return userExternalFavorites.some(fav => 
      parseInt(fav.externalId) === parseInt(externalId)
    );
  }
  
  // Handle external recipe favorites (toggle add/remove)
  async function handleExternalFavorite(externalRecipe) {
    try {
      const isCurrentlyFavorited = isExternalFavorited(externalRecipe.externalId);
      
      if (isCurrentlyFavorited) {
        // Remove from favorites
        await api.removeExternalFavorite(externalRecipe.externalId);
        
        // Update local state  
        userExternalFavorites = userExternalFavorites.filter(
          fav => parseInt(fav.externalId) !== parseInt(externalRecipe.externalId)
        );
        
        notifications.success(
          `"${externalRecipe.title}" removed from your favorites`,
          'Removed from Favorites'
        );
        
      } else {
        // Add to favorites
        const favoriteData = {
          externalId: externalRecipe.externalId,
          title: externalRecipe.title,
          thumbnail: externalRecipe.thumbnail,
          source: externalRecipe.source || 'tasty',
          description: externalRecipe.description,
          ingredients: externalRecipe.ingredients || [],
          servings: externalRecipe.servings,
          totalTimeCookingMinutes: externalRecipe.totalTimeCookingMinutes
        };
        
        const response = await api.saveExternalFavorite(favoriteData);
        
        // Update local state - use the actual saved favorite from response
        const savedFavorite = response.data?.favorite || favoriteData;
        userExternalFavorites = [...userExternalFavorites, savedFavorite];
        
        notifications.success(
          `"${externalRecipe.title}" added to your favorites`,
          'Added to Favorites'
        );
      }
      
    } catch (err) {
      console.error('Failed to toggle external favorite:', err);
      
      if (err.message?.includes('already in favorites')) {
        notifications.info(
          'This recipe is already in your favorites',
          'Already Saved'
        );
      } else if (err.message?.includes('not found')) {
        notifications.info(
          'This recipe was not in your favorites',
          'Not Found'
        );
      } else {
        notifications.error(
          err.message || 'Failed to update favorites',
          'Error'
        );
      }
    }
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
        on:input={handleSearchInput}
        placeholder="Search for recipes (local & external)..."
        class="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2" style="focus:ring-color: #4E71FF; focus:border-color: #4E71FF;"
      />
      <button 
        type="submit" 
        disabled={isSearching}
        class="px-6 py-2 text-white rounded-md hover:opacity-90 focus:outline-none focus:ring-2 disabled:opacity-50" style="background-color: #4E71FF; ring-color: #4E71FF;"
      >
        {isSearching ? 'Searching...' : 'Search'}
      </button>
      
      {#if hasSearched || searchQuery}
        <button 
          type="button"
          on:click={clearSearch}
          class="px-4 py-2 border border-gray-300 text-gray-600 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2"
        >
          Clear
        </button>
      {/if}
    </form>
  </div>
  
  {#if isSearching}
    <!-- Search in progress -->
    <div class="text-center py-8">
      <div class="text-2xl mb-2">🔍</div>
      <p class="text-gray-600">Searching local and external recipes...</p>
      <div class="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mt-2"></div>
    </div>
    
  {:else if hasSearched}
    <!-- Search Results -->
    {#if localSearchResults.length === 0 && externalSearchResults.length === 0 && !localSearchError && !externalSearchError}
      <!-- No search results at all -->
      <div class="text-center py-8">
        <div class="text-4xl mb-2">🍽️</div>
        <p class="text-gray-600">No recipes found for "{searchQuery}"</p>
        <p class="text-sm text-gray-500 mt-1">Try searching for something else or create your own recipe!</p>
        <button 
          on:click={clearSearch}
          class="mt-4 hover:opacity-80" style="color: #4E71FF;"
        >
          Clear search
        </button>
      </div>
    {:else}
      <!-- Search Results with Local and External sections -->
      <div class="space-y-12">
        
        <!-- Local Recipes Results -->
        {#if localSearchResults.length > 0}
          <section>
            <div class="flex items-center mb-6">
              <h2 class="text-2xl font-bold text-gray-900">
                🏠 Your Community Recipes
              </h2>
              <span class="ml-3 bg-blue-100 text-blue-800 text-sm font-medium px-2.5 py-0.5 rounded">
                {localSearchResults.length} found
              </span>
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {#each localSearchResults as recipe (recipe._id)}
                <RecipeCard {recipe} />
              {/each}
            </div>
          </section>
        {:else if localSearchError}
          <section>
            <div class="bg-red-50 border border-red-200 rounded-lg p-4">
              <h3 class="text-lg font-medium text-red-800 mb-1">Local Search Error</h3>
              <p class="text-red-600">{localSearchError}</p>
            </div>
          </section>
        {/if}
        
        <!-- External Recipes Results (Tasty API) -->
        {#if externalSearchResults.length > 0}
          <section>
            <div class="flex items-center mb-6">
              <h2 class="text-2xl font-bold text-gray-900">
                🌍 Discover More Recipes
              </h2>
              <span class="ml-3 bg-green-100 text-green-800 text-sm font-medium px-2.5 py-0.5 rounded">
                {externalSearchResults.length} found
              </span>
              <span class="ml-2 text-xs text-gray-500">from Tasty</span>
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {#each externalSearchResults as externalRecipe (externalRecipe.externalId)}
                <div 
                  class="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow overflow-hidden cursor-pointer"
                  on:click={() => window.location.href = `/#/recipe/external/${externalRecipe.externalId}`}
                  on:keydown={(e) => e.key === 'Enter' && (window.location.href = `/#/recipe/external/${externalRecipe.externalId}`)}
                  tabindex="0"
                  role="button"
                  aria-label="View {externalRecipe.title} recipe details"
                >
                  <!-- Recipe Image -->
                  <div class="aspect-video bg-gradient-to-br from-orange-100 to-yellow-100 flex items-center justify-center relative">
                    {#if externalRecipe.thumbnail}
                      <img 
                        src={externalRecipe.thumbnail} 
                        alt={externalRecipe.title}
                        class="w-full h-full object-cover"
                        loading="lazy"
                      />
                    {:else}
                      <div class="text-4xl text-gray-400">🍽️</div>
                    {/if}
                    
                    <!-- External badge -->
                    <div class="absolute top-2 left-2 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded">
                      EXTERNAL
                    </div>
                  </div>
                  
                  <!-- Recipe Content -->
                  <div class="p-4">
                    <h3 class="font-bold text-lg text-gray-900 mb-2 line-clamp-2">
                      {externalRecipe.title}
                    </h3>
                    
                    {#if externalRecipe.description}
                      <p class="text-gray-600 text-sm mb-3 line-clamp-2">
                        {externalRecipe.description}
                      </p>
                    {/if}
                    
                    <!-- Recipe Meta -->
                    <div class="flex justify-between items-center text-sm text-gray-500 mb-3">
                      <div class="flex items-center gap-4">
                        {#if externalRecipe.servings}
                          <span>👥 {externalRecipe.servings} servings</span>
                        {/if}
                        {#if externalRecipe.totalTimeCookingMinutes}
                          <span>⏱️ {externalRecipe.totalTimeCookingMinutes}min</span>
                        {/if}
                      </div>
                    </div>
                    
                    <!-- Quick Actions -->
                    <div class="flex gap-2">
                      {#if isExternalFavorited(externalRecipe.externalId)}
                        <button
                          on:click|stopPropagation={() => handleExternalFavorite(externalRecipe)}
                          class="flex-1 px-3 py-2 bg-red-500 text-white text-sm rounded-md hover:bg-red-600 transition-colors"
                        >
                          ❤️ Remove Favorite
                        </button>
                      {:else}
                        <button
                          on:click|stopPropagation={() => handleExternalFavorite(externalRecipe)}
                          class="flex-1 px-3 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 transition-colors"
                        >
                          ⭐ Save Favorite
                        </button>
                      {/if}
                      
                      <span class="px-3 py-2 border border-gray-300 text-gray-600 text-sm rounded-md bg-gray-50">
                        Click to view details
                      </span>
                    </div>
                  </div>
                </div>
              {/each}
            </div>
          </section>
        {:else if externalSearchError}
          <section>
            <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h3 class="text-lg font-medium text-yellow-800 mb-1">External Search Unavailable</h3>
              <p class="text-yellow-600">{externalSearchError}</p>
              <p class="text-sm text-yellow-600 mt-1">Only showing local community recipes for now.</p>
            </div>
          </section>
        {/if}
        
        <!-- Search Summary -->
        <div class="text-center text-gray-500 pt-4 border-t">
          Found {localSearchResults.length + externalSearchResults.length} total results for "{searchQuery}"
          <button 
            on:click={clearSearch}
            class="ml-2 hover:opacity-80" style="color: #4E71FF;"
          >
            • Clear search
          </button>
        </div>
      </div>
    {/if}
    
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
    <!-- Default: Local + External Recipes -->
    <div class="space-y-12">
      
      <!-- Local Community Recipes -->
      <section>
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-2xl font-bold text-gray-900">🏠 All Community Recipes</h2>
          <span class="text-gray-500">{recipes.length} recipe{recipes.length !== 1 ? 's' : ''}</span>
        </div>
        
        {#if isLoading}
          <div class="text-center py-8">
            <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p class="text-gray-600 mt-2">Loading community recipes...</p>
          </div>
        {:else}
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {#each recipes as recipe (recipe._id)}
              <RecipeCard {recipe} />
            {/each}
          </div>
        {/if}
      </section>

      <!-- External Recipes -->
      <section>
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-2xl font-bold text-gray-900">🌍 Discover Popular Recipes</h2>
          <span class="text-gray-500 text-sm">from Tasty</span>
        </div>
        
        {#if defaultExternalLoading}
          <div class="text-center py-8">
            <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
            <p class="text-gray-600 mt-2">Loading popular recipes...</p>
          </div>
        {:else if defaultExternalError}
          <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h3 class="text-lg font-medium text-yellow-800 mb-1">External Recipes Unavailable</h3>
            <p class="text-yellow-600">{defaultExternalError}</p>
            <button 
              on:click={loadDefaultExternalRecipes}
              class="mt-2 text-sm text-yellow-700 hover:text-yellow-900 underline"
            >
              Try again
            </button>
          </div>
        {:else if defaultExternalRecipes.length > 0}
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {#each defaultExternalRecipes as externalRecipe (externalRecipe.externalId)}
              <div 
                class="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow overflow-hidden cursor-pointer"
                on:click={() => window.location.href = `/#/recipe/external/${externalRecipe.externalId}`}
                on:keydown={(e) => e.key === 'Enter' && (window.location.href = `/#/recipe/external/${externalRecipe.externalId}`)}
                tabindex="0"
                role="button"
                aria-label="View {externalRecipe.title} recipe details"
              >
                <!-- Recipe Image -->
                <div class="aspect-video bg-gradient-to-br from-orange-100 to-yellow-100 flex items-center justify-center relative">
                  {#if externalRecipe.thumbnail}
                    <img 
                      src={externalRecipe.thumbnail} 
                      alt={externalRecipe.title}
                      class="w-full h-full object-cover"
                      loading="lazy"
                    />
                  {:else}
                    <div class="text-4xl text-gray-400">🍽️</div>
                  {/if}
                  
                  <!-- External badge -->
                  <div class="absolute top-2 left-2 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded">
                    EXTERNAL
                  </div>
                </div>
                
                <!-- Recipe Content -->
                <div class="p-4">
                  <h3 class="font-bold text-lg text-gray-900 mb-2 line-clamp-2">
                    {externalRecipe.title}
                  </h3>
                  
                  {#if externalRecipe.description}
                    <p class="text-gray-600 text-sm mb-3 line-clamp-2">
                      {externalRecipe.description}
                    </p>
                  {/if}
                  
                  <!-- Recipe Meta -->
                  <div class="flex justify-between items-center text-sm text-gray-500 mb-3">
                    <div class="flex items-center gap-4">
                      {#if externalRecipe.servings}
                        <span>👥 {externalRecipe.servings} servings</span>
                      {/if}
                      {#if externalRecipe.totalTimeCookingMinutes}
                        <span>⏱️ {externalRecipe.totalTimeCookingMinutes}min</span>
                      {/if}
                    </div>
                  </div>
                  
                  <!-- Quick Actions -->
                  <div class="flex gap-2">
                    {#if isExternalFavorited(externalRecipe.externalId)}
                      <button
                        on:click|stopPropagation={() => handleExternalFavorite(externalRecipe)}
                        class="flex-1 px-3 py-2 bg-red-500 text-white text-sm rounded-md hover:bg-red-600 transition-colors"
                      >
                        ❤️ Remove Favorite
                      </button>
                    {:else}
                      <button
                        on:click|stopPropagation={() => handleExternalFavorite(externalRecipe)}
                        class="flex-1 px-3 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 transition-colors"
                      >
                        ⭐ Save Favorite
                      </button>
                    {/if}
                    
                    <span class="px-3 py-2 border border-gray-300 text-gray-600 text-sm rounded-md bg-gray-50">
                      Click to view details
                    </span>
                  </div>
                </div>
              </div>
            {/each}
          </div>
        {:else}
          <div class="text-center py-8 text-gray-500">
            <div class="text-4xl mb-2">🍽️</div>
            <p>No external recipes available at the moment.</p>
          </div>
        {/if}
      </section>
      
    </div>
  {/if}
</div>

 