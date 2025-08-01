<script>
  // TODO: Indlæs brugerdata og favoritter fra API
  let user = {
    username: 'Loading...',
    email: 'Loading...'
  };
  let favorites = [];
  let myRecipes = [];
  let showEditModal = false;
  
  function openEditModal() {
    showEditModal = true;
  }
  
  function closeEditModal() {
    showEditModal = false;
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
        <div class="space-y-2 mb-4">
          <p><strong>Username:</strong> {user.username}</p>
          <p><strong>Email:</strong> {user.email}</p>
        </div>
        <div class="space-y-2">
          <button 
            on:click={navigateToCreateRecipe}
            class="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
          >
            Create New Recipe
          </button>
          <button 
            on:click={openEditModal}
            class="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-md text-sm font-medium"
          >
            Edit Profile
          </button>
        </div>
      </div>
    </div>
    
    <!-- Favorites and Recipes -->
    <div class="lg:col-span-2">
      <div class="space-y-8">
        <!-- My Recipes -->
        <div>
          <h2 class="text-xl font-semibold mb-4">My Recipes</h2>
          <div class="text-center py-8 text-gray-500">
            You haven't created any recipes yet.
          </div>
        </div>
        
        <!-- Favorite Recipes -->
        <div>
          <h2 class="text-xl font-semibold mb-4">My Favorite Recipes</h2>
          <div class="text-center py-8 text-gray-500">
            No favorites yet - add some by browsing recipes!
          </div>
        </div>
      </div>
    </div>
  </div>
</div>

<!-- Edit Profile Modal - TODO: Extract to separate component -->
{#if showEditModal}
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div class="bg-white rounded-lg p-6 w-full max-w-md">
      <h3 class="text-lg font-semibold mb-4">Edit Profile</h3>
      <p class="text-gray-600 mb-4">Profile editing functionality will be implemented here.</p>
      <div class="flex justify-end space-x-2">
        <button 
          on:click={closeEditModal}
          class="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
        >
          Cancel
        </button>
        <button class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
          Save Changes
        </button>
      </div>
    </div>
  </div>
{/if} 