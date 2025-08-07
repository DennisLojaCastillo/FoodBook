<script>
  import { onMount } from 'svelte';
  import api from '../../lib/api.js';
  import { notifications } from '../../stores/notifications.js';
  import { auth } from '../../stores/auth.js';
  
  export let params = {}; // Router sends recipe ID here
  
  // Form state
  let title = '';
  let description = '';
  let ingredients = [''];
  let instructions = [''];
  let servings = '';
  let totalTimeCookingMinutes = '';
  let tags = [];
  let videoUrl = '';
  let thumbnailFile = null;
  let thumbnailPreview = null;
  let existingThumbnail = null;
  
  // UI state
  let isLoading = false;
  let isLoadingRecipe = true;
  let error = '';
  let tagInput = '';
  let recipe = null;
  
  onMount(async () => {
    if (params.id) {
      await loadRecipe(params.id);
    } else {
      error = 'No recipe ID provided';
      isLoadingRecipe = false;
    }
  });
  
  async function loadRecipe(id) {
    try {
      isLoadingRecipe = true;
      error = '';
      
      const response = await api.getRecipe(id);
      recipe = response.data?.recipe || response.recipe;
      
      if (!recipe) {
        error = 'Recipe not found';
        return;
      }
      
      // Check if current user can edit this recipe
      const currentUser = $auth.user;
      if (!currentUser) {
        error = 'You must be logged in to edit recipes';
        return;
      }
      
      const canEdit = (currentUser._id === recipe.author?._id) || (currentUser.role === 'admin');
      if (!canEdit) {
        error = 'You can only edit your own recipes';
        return;
      }
      
      // Populate form with existing recipe data
      title = recipe.title || '';
      description = recipe.description || '';
      ingredients = recipe.ingredients?.length ? [...recipe.ingredients] : [''];
      instructions = recipe.instructions?.length ? [...recipe.instructions] : [''];
      servings = recipe.servings || '';
      totalTimeCookingMinutes = recipe.totalTimeCookingMinutes || '';
      tags = recipe.tags?.length ? [...recipe.tags] : [];
      videoUrl = recipe.videoUrl || '';
      existingThumbnail = recipe.thumbnail || null;
      
    } catch (err) {
      console.error('Failed to load recipe:', err);
      error = err.message || 'Failed to load recipe';
    } finally {
      isLoadingRecipe = false;
    }
  }
  
  // File handling
  function handleThumbnailChange(event) {
    const file = event.target.files[0];
    if (file) {
      // Validate file type and size
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        error = 'Only image files (JPEG, JPG, PNG, GIF, WebP) are allowed!';
        return;
      }
      
      if (file.size > 5 * 1024 * 1024) { // 5MB
        error = 'File size must be less than 5MB!';
        return;
      }
      
      error = '';
      thumbnailFile = file;
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        thumbnailPreview = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }
  
  // Dynamic ingredient management
  function addIngredient() {
    ingredients = [...ingredients, ''];
  }
  
  function removeIngredient(index) {
    if (ingredients.length > 1) {
      ingredients = ingredients.filter((_, i) => i !== index);
    }
  }
  
  // Dynamic instruction management
  function addInstruction() {
    instructions = [...instructions, ''];
  }
  
  function removeInstruction(index) {
    if (instructions.length > 1) {
      instructions = instructions.filter((_, i) => i !== index);
    }
  }
  
  // Tag management
  function addTag() {
    const tag = tagInput.trim().toLowerCase();
    if (tag && !tags.includes(tag)) {
      tags = [...tags, tag];
      tagInput = '';
    }
  }
  
  function removeTag(tagToRemove) {
    tags = tags.filter(tag => tag !== tagToRemove);
  }
  
  function handleTagKeyPress(event) {
    if (event.key === 'Enter') {
      event.preventDefault();
      addTag();
    }
  }
  
  // Form validation
  function validateForm() {
    if (!title.trim()) {
      error = 'Recipe title is required!';
      return false;
    }
    
    if (!description.trim()) {
      error = 'Recipe description is required!';
      return false;
    }
    
    const validIngredients = ingredients.filter(ing => ing.trim());
    if (validIngredients.length === 0) {
      error = 'At least one ingredient is required!';
      return false;
    }
    
    const validInstructions = instructions.filter(inst => inst.trim());
    if (validInstructions.length === 0) {
      error = 'At least one instruction is required!';
      return false;
    }
    
    if (servings && (isNaN(servings) || servings <= 0)) {
      error = 'Servings must be a positive number!';
      return false;
    }
    
    if (totalTimeCookingMinutes && (isNaN(totalTimeCookingMinutes) || totalTimeCookingMinutes <= 0)) {
      error = 'Cooking time must be a positive number!';
      return false;
    }
    
    return true;
  }
  
  // Form submission
  async function handleSubmit() {
    error = '';
    
    if (!validateForm()) {
      return;
    }
    
    try {
      isLoading = true;
      
      // Prepare recipe data (same format as CreateRecipe)
      const recipeData = {
        title: title.trim(),
        description: description.trim(),
        ingredients: ingredients.filter(ing => ing.trim()),
        instructions: instructions.filter(inst => inst.trim()),
      };
      
      // Add optional fields
      if (thumbnailFile) recipeData.thumbnail = thumbnailFile;
      if (servings) recipeData.servings = parseInt(servings);
      if (totalTimeCookingMinutes) recipeData.totalTimeCookingMinutes = parseInt(totalTimeCookingMinutes);
      if (tags.length > 0) recipeData.tags = tags;
      if (videoUrl.trim()) recipeData.videoUrl = videoUrl.trim();
      
      // Submit update
      const response = await api.updateRecipe(params.id, recipeData);
      
      if (response.success) {
        notifications.success(
          'Recipe updated successfully!',
          'Success'
        );
        
        // Redirect back to recipe detail
        window.location.href = `/#/recipe/${params.id}`;
      }
      
    } catch (err) {
      console.error('Recipe update error:', err);
      error = err.message || 'Failed to update recipe. Please try again.';
    } finally {
      isLoading = false;
    }
  }
  
  // Navigate back
  function goBack() {
    window.location.href = `/#/recipe/${params.id}`;
  }
</script>

<div class="container mx-auto px-4 py-8 max-w-4xl">
  {#if isLoadingRecipe}
    <div class="text-center py-16">
      <div class="animate-spin w-12 h-12 border-4 border-green-600 border-t-transparent rounded-full mx-auto mb-4"></div>
      <p class="text-gray-600">Loading recipe...</p>
    </div>
    
  {:else if error && !recipe}
    <div class="text-center py-16">
      <div class="text-6xl mb-4">😔</div>
      <h1 class="text-2xl font-bold text-gray-900 mb-2">Oops!</h1>
      <p class="text-gray-600 mb-6">{error}</p>
      <button 
        on:click={() => window.location.href = '/#/recipes'}
        class="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
      >
        ← Back to Recipes
      </button>
    </div>
    
  {:else}
    <!-- Back button -->
    <button 
      on:click={goBack}
      class="flex items-center text-green-600 hover:text-green-700 mb-6 transition-colors"
    >
      <span class="mr-2">←</span>
      Back to Recipe
    </button>
    
    <div class="bg-white rounded-lg shadow-lg p-8">
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-900 mb-2">✏️ Edit Recipe</h1>
        <p class="text-gray-600">Update your recipe details</p>
      </div>

      <!-- Error message -->
      {#if error}
        <div class="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p class="text-red-600 text-sm">{error}</p>
        </div>
      {/if}

      <form on:submit|preventDefault={handleSubmit} class="space-y-6">
        <!-- Title -->
        <div>
          <label for="title" class="block text-sm font-medium text-gray-700 mb-2">
            Recipe Title *
          </label>
          <input
            type="text"
            id="title"
            bind:value={title}
            placeholder="Enter recipe title..."
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
            required
          />
        </div>

        <!-- Description -->
        <div>
          <label for="description" class="block text-sm font-medium text-gray-700 mb-2">
            Description *
          </label>
          <textarea
            id="description"
            bind:value={description}
            placeholder="Describe your recipe..."
            rows="3"
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 resize-none"
            required
          ></textarea>
        </div>

        <!-- Thumbnail -->
        <div>
          <label for="thumbnail" class="block text-sm font-medium text-gray-700 mb-2">
            Recipe Image
          </label>
          
          {#if existingThumbnail && !thumbnailPreview}
            <div class="mb-4">
              <p class="text-sm text-gray-600 mb-2">Current image:</p>
              <img 
                src={existingThumbnail} 
                alt="Current recipe thumbnail" 
                class="w-32 h-32 object-cover rounded-lg border border-gray-200"
              />
            </div>
          {/if}
          
          {#if thumbnailPreview}
            <div class="mb-4">
              <p class="text-sm text-gray-600 mb-2">New image preview:</p>
              <img 
                src={thumbnailPreview} 
                alt="Recipe thumbnail preview" 
                class="w-32 h-32 object-cover rounded-lg border border-gray-200"
              />
            </div>
          {/if}
          
          <input
            type="file"
            id="thumbnail"
            accept="image/*"
            on:change={handleThumbnailChange}
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
          />
          <p class="text-xs text-gray-500 mt-1">
            Optional. Upload a new image to replace the current one. Max 5MB. Supported: JPEG, PNG, GIF, WebP
          </p>
        </div>

        <!-- Ingredients -->
        <div>
          <div class="block text-sm font-medium text-gray-700 mb-2">
            Ingredients *
          </div>
          <div class="space-y-2">
            {#each ingredients as ingredient, index}
              <div class="flex items-center gap-2">
                <input
                  type="text"
                  bind:value={ingredient}
                  placeholder="Enter ingredient..."
                  class="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
                <button
                  type="button"
                  on:click={() => removeIngredient(index)}
                  class="px-3 py-2 bg-red-100 text-red-600 rounded-md hover:bg-red-200 transition-colors"
                  disabled={ingredients.length === 1}
                >
                  Remove
                </button>
              </div>
            {/each}
          </div>
          <button
            type="button"
            on:click={addIngredient}
            class="mt-2 px-4 py-2 bg-green-100 text-green-600 rounded-md hover:bg-green-200 transition-colors"
          >
            + Add Ingredient
          </button>
        </div>

        <!-- Instructions -->
        <div>
          <div class="block text-sm font-medium text-gray-700 mb-2">
            Instructions *
          </div>
          <div class="space-y-2">
            {#each instructions as instruction, index}
              <div class="flex items-start gap-2">
                <span class="flex-shrink-0 w-8 h-8 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-sm font-semibold mt-1">
                  {index + 1}
                </span>
                <textarea
                  bind:value={instruction}
                  placeholder="Enter step instructions..."
                  rows="2"
                  class="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 resize-none"
                ></textarea>
                <button
                  type="button"
                  on:click={() => removeInstruction(index)}
                  class="flex-shrink-0 px-3 py-2 bg-red-100 text-red-600 rounded-md hover:bg-red-200 transition-colors mt-1"
                  disabled={instructions.length === 1}
                >
                  Remove
                </button>
              </div>
            {/each}
          </div>
          <button
            type="button"
            on:click={addInstruction}
            class="mt-2 px-4 py-2 bg-green-100 text-green-600 rounded-md hover:bg-green-200 transition-colors"
          >
            + Add Step
          </button>
        </div>

        <!-- Recipe Meta -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label for="servings" class="block text-sm font-medium text-gray-700 mb-2">
              Servings
            </label>
            <input
              type="number"
              id="servings"
              bind:value={servings}
              placeholder="e.g. 4"
              min="1"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
            />
          </div>

          <div>
            <label for="cookingTime" class="block text-sm font-medium text-gray-700 mb-2">
              Cooking Time (minutes)
            </label>
            <input
              type="number"
              id="cookingTime"
              bind:value={totalTimeCookingMinutes}
              placeholder="e.g. 30"
              min="1"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
            />
          </div>
        </div>

        <!-- Video URL -->
        <div>
          <label for="videoUrl" class="block text-sm font-medium text-gray-700 mb-2">
            Video URL (optional)
          </label>
          <input
            type="url"
            id="videoUrl"
            bind:value={videoUrl}
            placeholder="https://youtube.com/watch?v=..."
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
          />
        </div>

        <!-- Tags -->
        <div>
          <label for="tagInput" class="block text-sm font-medium text-gray-700 mb-2">
            Tags
          </label>
          <div class="flex items-center gap-2 mb-2">
            <input
              type="text"
              id="tagInput"
              bind:value={tagInput}
              on:keypress={handleTagKeyPress}
              placeholder="Add a tag and press Enter..."
              class="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
            />
            <button
              type="button"
              on:click={addTag}
              class="px-4 py-2 bg-green-100 text-green-600 rounded-md hover:bg-green-200 transition-colors"
            >
              Add Tag
            </button>
          </div>
          
          {#if tags.length > 0}
            <div class="flex flex-wrap gap-2">
              {#each tags as tag}
                <span class="inline-flex items-center px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full">
                  {tag}
                  <button
                    type="button"
                    on:click={() => removeTag(tag)}
                    class="ml-2 text-green-600 hover:text-green-800"
                  >
                    ×
                  </button>
                </span>
              {/each}
            </div>
          {/if}
        </div>

        <!-- Submit buttons -->
        <div class="flex items-center justify-end gap-4 pt-6">
          <button
            type="button"
            on:click={goBack}
            class="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
            disabled={isLoading}
          >
            Cancel
          </button>
          
          <button
            type="submit"
            class="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            disabled={isLoading}
          >
            {#if isLoading}
              <div class="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
              Updating...
            {:else}
              ✏️ Update Recipe
            {/if}
          </button>
        </div>
      </form>
    </div>
  {/if}
</div>
