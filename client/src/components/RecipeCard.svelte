<script>
  export let recipe;
  
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
    window.location.href = `/#/recipe/${recipe._id}`;
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
      <!-- Author -->
      <div class="flex items-center">
        <span class="font-medium">👨‍🍳 {recipe.author?.username || 'Unknown chef'}</span>
      </div>
      
      <!-- Date -->
      <span>{formatDate(recipe.createdAt)}</span>
    </div>
    
    <!-- Footer with stats -->
    <div class="flex items-center justify-between pt-4 border-t border-gray-100">
      <!-- Favorites -->
      <div class="flex items-center text-red-500">
        <span class="mr-1">❤️</span>
        <span class="text-sm font-medium">{recipe.favoriteCount || 0}</span>
      </div>
      
      <!-- Ingredients count -->
      <div class="flex items-center text-green-600">
        <span class="mr-1">🥬</span>
        <span class="text-sm">{recipe.ingredients?.length || 0} ingredients</span>
      </div>
      
      <!-- View Recipe -->
      <div class="text-blue-600 font-medium text-sm group-hover:text-blue-700">
        View Recipe →
      </div>
    </div>
  </div>
</article> 