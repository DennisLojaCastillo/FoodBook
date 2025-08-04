<script>
  import { onMount } from 'svelte';
  import api from '../../lib/api.js';
  import { notifications } from '../../stores/notifications.js';
  import RecipeCard from '../../components/RecipeCard.svelte';
  
  // User data
  let user = null;
  let userLoading = true;
  let userError = null;
  
  // User's recipes
  let myRecipes = [];
  let myRecipesLoading = true;
  let myRecipesError = null;
  
  // Favorite recipes  
  let favorites = [];
  let favoritesLoading = true;
  let favoritesError = null;
  
  onMount(async () => {
    await loadDashboardData();
  });
  
  async function loadDashboardData() {
    try {
      userLoading = true;
      myRecipesLoading = true;
      favoritesLoading = true;
      
      userError = null;
      myRecipesError = null;
      favoritesError = null;
      
      // Get complete user profile with recipes and favorites in one call
      const response = await api.getUserProfile();
      const userProfile = response.data?.user || {};
      
      // Set user data
      user = {
        username: userProfile.username,
        email: userProfile.email,
        _id: userProfile._id
      };
      
      // Set user's recipes
      myRecipes = userProfile.myRecipes || [];
      
      // Combine local and external favorites
      const localFavorites = userProfile.localFavorites || [];
      const externalFavorites = userProfile.externalFavorites || [];
      favorites = [...localFavorites, ...externalFavorites];
      
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      const errorMessage = error.message || 'Failed to load dashboard information';
      
      userError = errorMessage;
      myRecipesError = errorMessage;
      favoritesError = errorMessage;
      
      notifications.error(
        'Failed to load your dashboard information',
        'Error Loading Dashboard'
      );
    } finally {
      userLoading = false;
      myRecipesLoading = false;
      favoritesLoading = false;
    }
  }
  
  // Individual reload functions for retry buttons
  async function loadUserRecipes() {
    try {
      myRecipesLoading = true;
      myRecipesError = null;
      
      const response = await api.getUserProfile();
      const userProfile = response.data?.user || {};
      myRecipes = userProfile.myRecipes || [];
      
    } catch (error) {
      console.error('Failed to load user recipes:', error);
      myRecipesError = error.message || 'Failed to load your recipes';
    } finally {
      myRecipesLoading = false;
    }
  }
  
  async function loadFavorites() {
    try {
      favoritesLoading = true;
      favoritesError = null;
      
      const response = await api.getUserProfile();
      const userProfile = response.data?.user || {};
      
      // Combine local and external favorites
      const localFavorites = userProfile.localFavorites || [];
      const externalFavorites = userProfile.externalFavorites || [];
      favorites = [...localFavorites, ...externalFavorites];
      
    } catch (error) {
      console.error('Failed to load favorites:', error);
      favoritesError = error.message || 'Failed to load your favorites';
    } finally {
      favoritesLoading = false;
    }
  }
  

  
  function navigateToCreateRecipe() {
    window.location.href = '/#/create-recipe';
  }
</script>

<div class="container mx-auto px-4 py-8">
  <h1 class="text-3xl font-bold text-gray-900 mb-8">Dashboard</h1>
  
  <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
    <!-- User Info -->
    <div class="lg:col-span-1">
      <div class="bg-white rounded-lg shadow p-6">
        <h2 class="text-xl font-semibold mb-4">User Information</h2>
        
        {#if userLoading}
          <div class="space-y-2 mb-4">
            <div class="animate-pulse">
              <div class="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div class="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        {:else if userError}
          <div class="text-red-600 text-sm mb-4">
            {userError}
          </div>
        {:else if user}
          <div class="space-y-2 mb-4">
            <p><strong>Username:</strong> {user.username}</p>
            <p><strong>Email:</strong> {user.email}</p>
          </div>
        {:else}
          <div class="text-gray-500 mb-4">
            No user information available
          </div>
        {/if}
        
        <div class="space-y-2">
          <button 
            on:click={navigateToCreateRecipe}
            class="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
          >
            Create New Recipe
          </button>
        </div>
      </div>
    </div>
    
    <!-- Recipes and Favorites -->
    <div class="lg:col-span-2">
      <div class="space-y-8">
        
        <!-- My Recipes -->
        <div>
          <h2 class="text-xl font-semibold mb-4">My Recipes</h2>
          
          {#if myRecipesLoading}
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <!-- Loading skeletons -->
              {#each Array(4) as _}
                <div class="animate-pulse bg-white rounded-lg shadow p-4">
                  <div class="h-32 bg-gray-200 rounded mb-4"></div>
                  <div class="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div class="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              {/each}
            </div>
          {:else if myRecipesError}
            <div class="text-center py-8 text-red-600">
              <p class="mb-4">{myRecipesError}</p>
              <button 
                on:click={loadUserRecipes}
                class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Retry
              </button>
            </div>
          {:else if myRecipes.length === 0}
            <div class="text-center py-8 text-gray-500">
              <div class="text-4xl mb-4">📝</div>
              <p class="mb-4">You haven't created any recipes yet.</p>
              <button 
                on:click={navigateToCreateRecipe}
                class="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Create Your First Recipe
              </button>
            </div>
          {:else}
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              {#each myRecipes as recipe (recipe._id)}
                <RecipeCard {recipe} />
              {/each}
            </div>
          {/if}
        </div>
        
        <!-- Favorite Recipes -->
        <div>
          <h2 class="text-xl font-semibold mb-4">My Favorite Recipes</h2>
          
          {#if favoritesLoading}
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <!-- Loading skeletons -->
              {#each Array(4) as _}
                <div class="animate-pulse bg-white rounded-lg shadow p-4">
                  <div class="h-32 bg-gray-200 rounded mb-4"></div>
                  <div class="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div class="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              {/each}
            </div>
          {:else if favoritesError}
            <div class="text-center py-8 text-red-600">
              <p class="mb-4">{favoritesError}</p>
              <button 
                on:click={loadFavorites}
                class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Retry
              </button>
            </div>
          {:else if favorites.length === 0}
            <div class="text-center py-8 text-gray-500">
              <div class="text-4xl mb-4">❤️</div>
              <p class="mb-4">No favorites yet - add some by browsing recipes!</p>
              <a 
                href="/#/recipes" 
                class="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors inline-block"
              >
                Browse Recipes
              </a>
            </div>
          {:else}
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              {#each favorites as recipe (recipe._id)}
                <RecipeCard {recipe} />
              {/each}
            </div>
          {/if}
        </div>
      </div>
    </div>
  </div>
</div>

 