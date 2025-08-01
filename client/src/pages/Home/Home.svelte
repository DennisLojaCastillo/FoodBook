<script>
  // Dette vil blive udvidet med recipe data senere
  import { onMount } from 'svelte';
  
  let recipes = [];
  
  onMount(() => {
    // TODO: Hent opskrifter fra API
    console.log('Home page mounted - ready for recipe integration');
  });
</script>

<div class="container mx-auto px-4 py-8">
  <h1 class="text-3xl font-bold text-gray-900 mb-8">All Recipes</h1>
  
  <div class="text-center py-12">
    <div class="text-6xl mb-4">🍳</div>
    <h2 class="text-xl text-gray-600 mb-2">Welcome to FoodBook!</h2>
    <p class="text-gray-500">All recipes will be displayed here when we integrate with the API</p>
  </div>
</div> 