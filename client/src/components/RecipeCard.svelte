<script>
  import api from '../lib/api.js';
  import { notifications } from '../stores/notifications.js';
  
  export let recipe;
  
  let favoriteLoading = false;
  
  // Funktion til at truncate description
  function truncateText(text, maxLength = 120) {
    if (!text) return '';
    return text.length > maxLength ? text.slice(0, maxLength) + '...' : text;
  }
  
  // Formater dato
  function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  }
  
  // Navigate til recipe detail
  function handleClick() {
    // Check if it's an external recipe
    if (recipe.externalId && recipe.source === 'tasty') {
      // External recipe - navigate to external route
      window.location.href = `/#/recipe/external/${recipe.externalId}`;
    } else {
      // Local recipe - navigate to normal route  
      window.location.href = `/#/recipe/${recipe._id}`;
    }
  }
  
  // Toggle favorite status
  async function toggleFavorite(event) {
    event.stopPropagation(); // Prevent card click
    
    if (favoriteLoading) return;
    
    try {
      favoriteLoading = true;
      
      // For now, we'll always add to favorites since we don't track user's favorite status per card
      // This could be enhanced to track actual favorite status if needed
      await api.addToFavorites(recipe._id);
      
      // Update local count optimistically  
      recipe.favoriteCount = (recipe.favoriteCount || 0) + 1;
      
      notifications.success(
        'Recipe added to your favorites',
        'Added to Favorites'
      );
      
    } catch (err) {
      console.error('Failed to add to favorites:', err);
      
      // Revert optimistic update
      recipe.favoriteCount = Math.max(0, (recipe.favoriteCount || 1) - 1);
      
      if (err.message?.includes('already in favorites')) {
        notifications.info(
          'This recipe is already in your favorites',
          'Already Favorited'
        );
      } else {
        notifications.error(
          'Failed to add to favorites. Please try again.',
          'Error'
        );
      }
    } finally {
      favoriteLoading = false;
    }
  }
</script>

<article 
  class="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300 cursor-pointer group"
  on:click={handleClick}
  on:keydown={(e) => e.key === 'Enter' && handleClick()}
  tabindex="0"
  role="button"
  aria-label="View recipe: {recipe.title}"
>
  <!-- Recipe Image -->
  <div class="h-48 bg-gray-200 overflow-hidden">
    {#if recipe.thumbnail}
      <img 
        src={recipe.thumbnail} 
        alt={recipe.title}
        class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        loading="lazy"
      />
    {:else}
      <!-- Placeholder når der ikke er billede -->
      <div class="w-full h-full flex items-center justify-center bg-gradient-to-br from-orange-100 to-yellow-100">
        <div class="text-center text-gray-500">
          <div class="text-4xl mb-2">🍽️</div>
          <p class="text-sm">No image</p>
        </div>
      </div>
    {/if}
  </div>
  
  <!-- Recipe Content -->
  <div class="p-6">
    <!-- Title -->
    <h3 class="text-xl font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
      {recipe.title}
    </h3>
    
    <!-- Description -->
    <p class="text-gray-600 mb-4 leading-relaxed">
      {truncateText(recipe.description)}
    </p>
    
    <!-- Recipe Meta Info -->
    <div class="flex items-center justify-between text-sm text-gray-500 mb-4">
      <!-- Author/Source -->
      <div class="flex items-center">
        {#if recipe.externalId && recipe.source === 'tasty'}
          <span class="font-medium">🌐 {recipe.source || 'External'}</span>
        {:else}
          <span class="font-medium">👨‍🍳 {recipe.author?.username || 'Unknown chef'}</span>
        {/if}
      </div>
      
      <!-- Date/Badge -->
      {#if recipe.externalId && recipe.source === 'tasty'}
        <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-bold bg-green-100 text-green-800">
          EXTERNAL
        </span>
      {:else}
        <span>{formatDate(recipe.createdAt)}</span>
      {/if}
    </div>
    
    <!-- Footer with stats -->
    <div class="flex items-center justify-between pt-4 border-t border-gray-100">
      <!-- Favorites (only for local recipes) -->
      {#if !(recipe.externalId && recipe.source === 'tasty')}
        <button 
          on:click={toggleFavorite}
          disabled={favoriteLoading}
          class="flex items-center text-red-500 hover:text-red-600 transition-colors disabled:opacity-50 p-1 -m-1 rounded"
          title="Add to favorites"
        >
          <span class="mr-1">{favoriteLoading ? '⏳' : '❤️'}</span>
          <span class="text-sm font-medium">{recipe.favoriteCount || 0}</span>
        </button>
      {:else}
        <div class="flex items-center text-green-600">
          <span class="mr-1">⭐</span>
          <span class="text-sm font-medium">External Recipe</span>
        </div>
      {/if}
      
      <!-- Ingredients count (only for local recipes) -->
      {#if !(recipe.externalId && recipe.source === 'tasty')}
        <div class="flex items-center text-green-600">
          <span class="mr-1">🥬</span>
          <span class="text-sm">{recipe.ingredients?.length || 0} ingredients</span>
        </div>
      {/if}
      
      <!-- View Recipe -->
      <div class="text-blue-600 font-medium text-sm group-hover:text-blue-700">
        View Recipe →
      </div>
    </div>
  </div>
</article> 