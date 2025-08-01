<script>
  import { onMount } from 'svelte';
  import api from '../../lib/api.js';
  import { notifications } from '../../stores/notifications.js';
  
  export let params = {}; // Router sends recipe ID here
  
  let recipe = null;
  let loading = true;
  let error = null;
  
  // Favorite functionality
  let isFavorite = false;
  let favoriteLoading = false;
  
  // Comments functionality
  let comments = [];
  let commentsLoading = true;
  let commentsError = null;
  let newComment = '';
  let commentLoading = false;
  let commentsSection;
  
  onMount(async () => {
    if (params.id) {
      await loadRecipe(params.id);
      await loadComments();
      await checkFavoriteStatus();
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
  
  // Load comments for the recipe
  async function loadComments() {
    if (!params.id) return;
    
    try {
      commentsLoading = true;
      commentsError = null;
      
      const response = await api.getRecipeComments(params.id);
      comments = response.data?.comments || [];
      
    } catch (err) {
      console.error('Failed to load comments:', err);
      commentsError = err.message || 'Failed to load comments';
    } finally {
      commentsLoading = false;
    }
  }
  
  // Check if current recipe is in user's favorites
  async function checkFavoriteStatus() {
    if (!params.id) return;
    
    try {
      const response = await api.getUserProfile();
      const userProfile = response.data?.user || {};
      
      // Get all favorites (both local and external)
      const localFavorites = userProfile.localFavorites || [];
      const externalFavorites = userProfile.externalFavorites || [];
      const allFavorites = [...localFavorites, ...externalFavorites];
      
      // Check if current recipe ID exists in favorites
      isFavorite = allFavorites.some(fav => 
        fav._id === params.id || fav.externalId === params.id
      );
      
    } catch (err) {
      console.error('Failed to check favorite status:', err);
      // If we can't check, default to false - no big deal
      isFavorite = false;
    }
  }
  
  // Add a new comment
  async function handleAddComment() {
    if (!newComment.trim()) return;
    
    try {
      commentLoading = true;
      
      const response = await api.addComment(params.id, newComment.trim());
      const addedComment = response.data?.comment;
      
      // Add new comment to the beginning of the list
      if (addedComment) {
        comments = [addedComment, ...comments];
      }
      
      // Clear the form
      newComment = '';
      
      notifications.success(
        'Your comment has been added successfully',
        'Comment Added'
      );
      
    } catch (err) {
      console.error('Failed to add comment:', err);
      notifications.error(
        err.message || 'Failed to add comment. Please try again.',
        'Error Adding Comment'
      );
    } finally {
      commentLoading = false;
    }
  }
  
  // Toggle favorite status
  async function toggleFavorite() {
    if (!params.id) return;
    
    const originalFavoriteStatus = isFavorite;
    const originalFavoriteCount = recipe?.favoriteCount || 0;
    
    try {
      favoriteLoading = true;
      
      if (isFavorite) {
        // Remove from favorites
        await api.removeFromFavorites(params.id);
        isFavorite = false;
        
        // Update favorite count optimistically
        if (recipe) {
          recipe.favoriteCount = Math.max(0, originalFavoriteCount - 1);
        }
        
        notifications.success(
          'Recipe removed from your favorites',
          'Removed from Favorites'
        );
      } else {
        // Add to favorites
        await api.addToFavorites(params.id);
        isFavorite = true;
        
        // Update favorite count optimistically
        if (recipe) {
          recipe.favoriteCount = originalFavoriteCount + 1;
        }
        
        notifications.success(
          'Recipe added to your favorites',
          'Added to Favorites'
        );
      }
      
    } catch (err) {
      console.error('Failed to toggle favorite:', err);
      
      // Revert optimistic updates on error
      isFavorite = originalFavoriteStatus;
      if (recipe) {
        recipe.favoriteCount = originalFavoriteCount;
      }
      
      // Handle "already in favorites" error gracefully
      if (err.message?.includes('already in favorites')) {
        isFavorite = true;
        if (recipe) {
          recipe.favoriteCount = originalFavoriteCount + 1;
        }
        notifications.info(
          'This recipe is already in your favorites',
          'Already Favorited'
        );
      } else {
        notifications.error(
          err.message || 'Failed to update favorites. Please try again.',
          'Error Updating Favorites'
        );
      }
    } finally {
      favoriteLoading = false;
    }
  }
  
  // Scroll to comments section
  function scrollToComments() {
    if (commentsSection) {
      commentsSection.scrollIntoView({ behavior: 'smooth' });
    }
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
            <button 
              on:click={toggleFavorite}
              disabled={favoriteLoading}
              class="px-6 py-3 {isFavorite ? 'bg-red-500 hover:bg-red-600' : 'bg-gray-500 hover:bg-gray-600'} text-white rounded-lg transition-colors flex items-center disabled:opacity-50"
            >
              <span class="mr-2">{isFavorite ? '❤️' : '🤍'}</span>
              {favoriteLoading ? 'Loading...' : (isFavorite ? 'Remove from Favorites' : 'Save as Favorite')}
            </button>
            
            <button 
              on:click={scrollToComments}
              class="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
            >
              <span class="mr-2">💬</span>
              View Comments ({comments.length})
            </button>
          </div>
        </div>
        
        <!-- Comments Section -->
        <div class="mt-12 pt-8 border-t border-gray-200" bind:this={commentsSection}>
          <h2 class="text-2xl font-bold text-gray-900 mb-6 flex items-center">
            <span class="mr-2">💬</span>
            Comments ({comments.length})
          </h2>
          
          <!-- Add Comment Form -->
          <div class="mb-8">
            <form on:submit|preventDefault={handleAddComment} class="space-y-4">
              <div>
                <textarea
                  bind:value={newComment}
                  placeholder="Share your thoughts about this recipe..."
                  rows="3"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  maxlength="500"
                  required
                ></textarea>
                <div class="text-sm text-gray-500 mt-1">
                  {newComment.length}/500 characters
                </div>
              </div>
              
              <button
                type="submit"
                disabled={commentLoading || !newComment.trim()}
                class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {commentLoading ? 'Adding Comment...' : 'Add Comment'}
              </button>
            </form>
          </div>
          
          <!-- Comments List -->
          {#if commentsLoading}
            <div class="space-y-4">
              {#each Array(3) as _}
                <div class="animate-pulse bg-white rounded-lg p-4 border">
                  <div class="flex items-start gap-3">
                    <div class="w-10 h-10 bg-gray-200 rounded-full"></div>
                    <div class="flex-1">
                      <div class="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                      <div class="h-3 bg-gray-200 rounded w-3/4"></div>
                    </div>
                  </div>
                </div>
              {/each}
            </div>
          {:else if commentsError}
            <div class="text-center py-8 text-red-600">
              <p class="mb-4">{commentsError}</p>
              <button 
                on:click={loadComments}
                class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Retry Loading Comments
              </button>
            </div>
          {:else if comments.length === 0}
            <div class="text-center py-8 text-gray-500">
              <div class="text-4xl mb-4">💭</div>
              <p>No comments yet. Be the first to share your thoughts!</p>
            </div>
          {:else}
            <div class="space-y-4">
              {#each comments as comment (comment._id)}
                <div class="bg-white rounded-lg p-4 border hover:border-gray-300 transition-colors">
                  <div class="flex items-start gap-3">
                    <div class="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <span class="text-sm font-semibold text-blue-600">
                        {comment.author?.username?.charAt(0).toUpperCase() || '?'}
                      </span>
                    </div>
                    
                    <div class="flex-1 min-w-0">
                      <div class="flex items-center gap-2 mb-1">
                        <span class="font-semibold text-gray-900">
                          {comment.author?.username || 'Unknown User'}
                        </span>
                        <span class="text-sm text-gray-500">
                          {formatDate(comment.createdAt)}
                        </span>
                      </div>
                      
                      <p class="text-gray-700 leading-relaxed">
                        {comment.text}
                      </p>
                    </div>
                  </div>
                </div>
              {/each}
            </div>
          {/if}
        </div>
      </div>
    </article>
  {/if}
</div> 