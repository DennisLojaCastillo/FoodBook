<script>
  import { onMount } from 'svelte';
  import api from '../../lib/api.js';
  
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
  
  // UI state
  let isLoading = false;
  let error = '';
  let tagInput = '';
  
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
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      tags = [...tags, tagInput.trim()];
      tagInput = '';
    }
  }
  
  function removeTag(index) {
    tags = tags.filter((_, i) => i !== index);
  }
  
  function handleTagKeydown(event) {
    if (event.key === 'Enter') {
      event.preventDefault();
      addTag();
    }
  }
  
  // Form validation
  function validateForm() {
    error = '';
    
    if (!title.trim()) {
      error = 'Recipe title is required';
      return false;
    }
    
    if (title.length < 2 || title.length > 200) {
      error = 'Recipe title must be between 2 and 200 characters';
      return false;
    }
    
    if (!description.trim()) {
      error = 'Recipe description is required';
      return false;
    }
    
    if (description.length < 10 || description.length > 1000) {
      error = 'Recipe description must be between 10 and 1000 characters';
      return false;
    }
    
    const validIngredients = ingredients.filter(ing => ing.trim());
    if (validIngredients.length === 0) {
      error = 'At least one ingredient is required';
      return false;
    }
    
    const validInstructions = instructions.filter(inst => inst.trim());
    if (validInstructions.length === 0) {
      error = 'At least one instruction is required';
      return false;
    }
    
    if (servings && (parseInt(servings) < 1 || parseInt(servings) > 50)) {
      error = 'Servings must be between 1 and 50';
      return false;
    }
    
    if (totalTimeCookingMinutes && (parseInt(totalTimeCookingMinutes) < 1 || parseInt(totalTimeCookingMinutes) > 1440)) {
      error = 'Cooking time must be between 1 and 1440 minutes';
      return false;
    }
    
    return true;
  }
  
  // Form submission
  async function handleSubmit() {
    if (!validateForm()) {
      return;
    }
    
    isLoading = true;
    error = '';
    
    try {
      // Prepare recipe data
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
      
      // Call API
      const response = await api.createRecipe(recipeData);
      
      // Redirect to recipes page or recipe detail
      window.location.href = '/#/recipes';
      
    } catch (err) {
      console.error('Failed to create recipe:', err);
      error = err.message || 'Failed to create recipe. Please try again.';
    } finally {
      isLoading = false;
    }
  }
</script>

<div class="container mx-auto px-4 py-8 max-w-4xl">
  <h1 class="text-3xl font-bold text-gray-900 mb-8">Create New Recipe</h1>
  
  <!-- Error Message -->
  {#if error}
    <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
      {error}
    </div>
  {/if}
  
  <form on:submit|preventDefault={handleSubmit} class="space-y-8">
    <!-- Basic Information -->
    <div class="bg-white rounded-lg shadow-md p-6">
      <h2 class="text-xl font-semibold mb-4">Basic Information</h2>
      
      <div class="grid md:grid-cols-2 gap-6">
        <!-- Recipe Title -->
        <div class="md:col-span-2">
          <label for="title" class="block text-sm font-medium text-gray-700 mb-2">
            Recipe Title *
          </label>
          <input
            id="title"
            type="text"
            bind:value={title}
            disabled={isLoading}
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 disabled:opacity-50"
            style="focus:ring-color: #4E71FF; focus:border-color: #4E71FF;"
            placeholder="Enter recipe title (2-200 characters)"
            required
          />
        </div>
        
        <!-- Recipe Description -->
        <div class="md:col-span-2">
          <label for="description" class="block text-sm font-medium text-gray-700 mb-2">
            Description *
          </label>
          <textarea
            id="description"
            bind:value={description}
            disabled={isLoading}
            rows="4"
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 disabled:opacity-50"
            style="focus:ring-color: #4E71FF; focus:border-color: #4E71FF;"
            placeholder="Describe your recipe (10-1000 characters)"
            required
          ></textarea>
        </div>
        
        <!-- Servings -->
        <div>
          <label for="servings" class="block text-sm font-medium text-gray-700 mb-2">
            Servings
          </label>
          <input
            id="servings"
            type="number"
            bind:value={servings}
            disabled={isLoading}
            min="1"
            max="50"
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 disabled:opacity-50"
            style="focus:ring-color: #4E71FF; focus:border-color: #4E71FF;"
            placeholder="Number of servings"
          />
        </div>
        
        <!-- Cooking Time -->
        <div>
          <label for="cookTime" class="block text-sm font-medium text-gray-700 mb-2">
            Cooking Time (minutes)
          </label>
          <input
            id="cookTime"
            type="number"
            bind:value={totalTimeCookingMinutes}
            disabled={isLoading}
            min="1"
            max="1440"
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 disabled:opacity-50"
            style="focus:ring-color: #4E71FF; focus:border-color: #4E71FF;"
            placeholder="Total cooking time"
          />
        </div>
      </div>
    </div>
    
    <!-- Recipe Image -->
    <div class="bg-white rounded-lg shadow-md p-6">
      <h2 class="text-xl font-semibold mb-4">Recipe Image</h2>
      
      <div class="space-y-4">
        <div>
          <label for="thumbnail" class="block text-sm font-medium text-gray-700 mb-2">
            Upload Recipe Photo
          </label>
          <input
            id="thumbnail"
            type="file"
            on:change={handleThumbnailChange}
            disabled={isLoading}
            accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 disabled:opacity-50"
            style="focus:ring-color: #4E71FF; focus:border-color: #4E71FF;"
          />
          <p class="text-sm text-gray-500 mt-1">
            Supported formats: JPEG, JPG, PNG, GIF, WebP. Max size: 5MB
          </p>
        </div>
        
        <!-- Image Preview -->
        {#if thumbnailPreview}
          <div class="mt-4">
            <p class="text-sm font-medium text-gray-700 mb-2">Preview:</p>
            <img
              src={thumbnailPreview}
              alt="Recipe preview"
              class="w-48 h-48 object-cover rounded-lg border border-gray-300"
            />
          </div>
        {/if}
      </div>
    </div>
    
    <!-- Ingredients -->
    <div class="bg-white rounded-lg shadow-md p-6">
      <h2 class="text-xl font-semibold mb-4">Ingredients *</h2>
      
      <div class="space-y-3">
        {#each ingredients as ingredient, index}
          <div class="flex gap-2">
            <input
              type="text"
              bind:value={ingredients[index]}
              disabled={isLoading}
              class="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 disabled:opacity-50"
              style="focus:ring-color: #4E71FF; focus:border-color: #4E71FF;"
              placeholder="Enter ingredient {index + 1}"
            />
            {#if ingredients.length > 1}
              <button
                type="button"
                on:click={() => removeIngredient(index)}
                disabled={isLoading}
                class="px-3 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 disabled:opacity-50"
              >
                Remove
              </button>
            {/if}
          </div>
        {/each}
        
        <button
          type="button"
          on:click={addIngredient}
          disabled={isLoading}
          class="text-white px-4 py-2 rounded-md hover:opacity-90 disabled:opacity-50"
          style="background-color: #4E71FF;"
        >
          + Add Ingredient
        </button>
      </div>
    </div>
    
    <!-- Instructions -->
    <div class="bg-white rounded-lg shadow-md p-6">
      <h2 class="text-xl font-semibold mb-4">Instructions *</h2>
      
      <div class="space-y-3">
        {#each instructions as instruction, index}
          <div class="flex gap-2">
            <div class="flex-shrink-0 w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-sm font-medium text-gray-600">
              {index + 1}
            </div>
            <textarea
              bind:value={instructions[index]}
              disabled={isLoading}
              rows="2"
              class="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 disabled:opacity-50"
              style="focus:ring-color: #4E71FF; focus:border-color: #4E71FF;"
              placeholder="Enter step {index + 1} instructions"
            ></textarea>
            {#if instructions.length > 1}
              <button
                type="button"
                on:click={() => removeInstruction(index)}
                disabled={isLoading}
                class="px-3 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 disabled:opacity-50"
              >
                Remove
              </button>
            {/if}
          </div>
        {/each}
        
        <button
          type="button"
          on:click={addInstruction}
          disabled={isLoading}
          class="text-white px-4 py-2 rounded-md hover:opacity-90 disabled:opacity-50"
          style="background-color: #4E71FF;"
        >
          + Add Step
        </button>
      </div>
    </div>
    
    <!-- Tags -->
    <div class="bg-white rounded-lg shadow-md p-6">
      <h2 class="text-xl font-semibold mb-4">Tags</h2>
      
      <div class="space-y-3">
        <div class="flex gap-2">
          <input
            type="text"
            bind:value={tagInput}
            on:keydown={handleTagKeydown}
            disabled={isLoading}
            class="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 disabled:opacity-50"
            style="focus:ring-color: #4E71FF; focus:border-color: #4E71FF;"
            placeholder="Add tags (e.g., vegetarian, quick, dessert)"
          />
          <button
            type="button"
            on:click={addTag}
            disabled={isLoading || !tagInput.trim()}
            class="text-white px-4 py-2 rounded-md hover:opacity-90 disabled:opacity-50"
            style="background-color: #4E71FF;"
          >
            Add Tag
          </button>
        </div>
        
        {#if tags.length > 0}
          <div class="flex flex-wrap gap-2">
            {#each tags as tag, index}
              <span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium text-white" style="background-color: #4E71FF;">
                {tag}
                <button
                  type="button"
                  on:click={() => removeTag(index)}
                  disabled={isLoading}
                  class="ml-2 inline-flex items-center justify-center w-4 h-4 rounded-full hover:bg-white hover:bg-opacity-20 disabled:opacity-50"
                >
                  ×
                </button>
              </span>
            {/each}
          </div>
        {/if}
      </div>
    </div>
    
    <!-- Optional Video URL -->
    <div class="bg-white rounded-lg shadow-md p-6">
      <h2 class="text-xl font-semibold mb-4">Video URL (Optional)</h2>
      
      <input
        type="url"
        bind:value={videoUrl}
        disabled={isLoading}
        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 disabled:opacity-50"
        style="focus:ring-color: #4E71FF; focus:border-color: #4E71FF;"
        placeholder="https://youtube.com/watch?v=..."
      />
    </div>
    
    <!-- Submit Button -->
    <div class="flex justify-end space-x-4">
      <a
        href="/#/recipes"
        class="px-6 py-3 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
      >
        Cancel
      </a>
      
      <button
        type="submit"
        disabled={isLoading}
        class="px-6 py-3 text-white rounded-md hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        style="background-color: #4E71FF;"
      >
        {#if isLoading}
          <div class="flex items-center">
            <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Creating Recipe...
          </div>
        {:else}
          Create Recipe
        {/if}
      </button>
    </div>
  </form>
</div> 