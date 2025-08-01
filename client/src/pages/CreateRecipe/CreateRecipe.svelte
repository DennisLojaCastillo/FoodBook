<script>
  let title = '';
  let description = '';
  let ingredients = [''];
  let steps = [''];
  
  function addIngredient() {
    ingredients = [...ingredients, ''];
  }
  
  function removeIngredient(index) {
    ingredients = ingredients.filter((_, i) => i !== index);
  }
  
  function addStep() {
    steps = [...steps, ''];
  }
  
  function removeStep(index) {
    steps = steps.filter((_, i) => i !== index);
  }
  
  function handleSubmit() {
    const recipeData = {
      title,
      description,
      ingredients: ingredients.filter(ingredient => ingredient.trim() !== ''),
      steps: steps.filter(step => step.trim() !== '')
    };
    
    // TODO: Implementer POST til API
    console.log('Creating recipe:', recipeData);
  }
</script>

<div class="container mx-auto px-4 py-8">
  <div class="max-w-4xl mx-auto">
    <h1 class="text-3xl font-bold text-gray-900 mb-8">Create New Recipe</h1>
    
    <form on:submit|preventDefault={handleSubmit} class="space-y-8">
      <!-- Title -->
      <div>
        <label for="title" class="block text-sm font-medium text-gray-700 mb-2">Recipe Title</label>
        <input
          id="title"
          type="text"
          required
          bind:value={title}
          placeholder="Enter recipe title..."
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
      
      <!-- Description -->
      <div>
        <label for="description" class="block text-sm font-medium text-gray-700 mb-2">Description</label>
        <textarea
          id="description"
          required
          bind:value={description}
          placeholder="Describe your recipe..."
          rows="4"
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        ></textarea>
      </div>
      
      <!-- Ingredients -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">Ingredients</label>
        <div class="space-y-2">
          {#each ingredients as ingredient, index}
            <div class="flex gap-2">
              <input
                type="text"
                bind:value={ingredients[index]}
                placeholder={`Ingredient ${index + 1}...`}
                class="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              {#if ingredients.length > 1}
                <button
                  type="button"
                  on:click={() => removeIngredient(index)}
                  class="px-3 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
                >
                  Remove
                </button>
              {/if}
            </div>
          {/each}
          <button
            type="button"
            on:click={addIngredient}
            class="w-full px-3 py-2 border-2 border-dashed border-gray-300 rounded-md text-gray-600 hover:border-gray-400 hover:text-gray-700"
          >
            + Add Ingredient
          </button>
        </div>
      </div>
      
      <!-- Steps -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">Steps</label>
        <div class="space-y-2">
          {#each steps as step, index}
            <div class="flex gap-2">
              <div class="flex-shrink-0 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-medium">
                {index + 1}
              </div>
              <textarea
                bind:value={steps[index]}
                placeholder={`Step ${index + 1} instructions...`}
                rows="2"
                class="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              ></textarea>
              {#if steps.length > 1}
                <button
                  type="button"
                  on:click={() => removeStep(index)}
                  class="px-3 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
                >
                  Remove
                </button>
              {/if}
            </div>
          {/each}
          <button
            type="button"
            on:click={addStep}
            class="w-full px-3 py-2 border-2 border-dashed border-gray-300 rounded-md text-gray-600 hover:border-gray-400 hover:text-gray-700"
          >
            + Add Step
          </button>
        </div>
      </div>
      
      <!-- Submit -->
      <div class="flex justify-end space-x-4">
        <button
          type="button"
          class="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          class="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Create Recipe
        </button>
      </div>
    </form>
  </div>
</div> 