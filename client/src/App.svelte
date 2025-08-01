<script>
  import { onMount } from 'svelte';
  import Navigo from 'navigo';
  import { auth } from './stores/auth.js';
  
  // Import komponenter
  import Header from './components/Header.svelte';
  import Footer from './components/Footer.svelte';
  
  // Import pages  
  import Home from './pages/Home/Home.svelte';
  import Login from './pages/Login/Login.svelte';
  import Signup from './pages/Signup/Signup.svelte';
  import Dashboard from './pages/Dashboard/Dashboard.svelte';
  import Recipes from './pages/Recipes/Recipes.svelte';
  import CreateRecipe from './pages/CreateRecipe/CreateRecipe.svelte';
  import RecipeDetail from './pages/RecipeDetail/RecipeDetail.svelte';
  
  let currentComponent = Home;
  let currentParams = {};
  
  onMount(() => {
    // Initialiser auth store FØRST
    auth.init();
    
    // Setup Navigo router
    const router = new Navigo('/', { hash: true });
    
    router
      .on('/', () => {
        currentComponent = Home;
        currentParams = {};
      })
      .on('/login', () => {
        currentComponent = Login;
        currentParams = {};
      })
      .on('/signup', () => {
        currentComponent = Signup;
        currentParams = {};
      })
      .on('/dashboard', () => {
        currentComponent = Dashboard;
        currentParams = {};
      })
      .on('/recipes', () => {
        currentComponent = Recipes;
        currentParams = {};
      })
      .on('/create-recipe', () => {
        currentComponent = CreateRecipe;
        currentParams = {};
      })
      .on('/recipe/:id', (match) => {
        currentComponent = RecipeDetail;
        currentParams = { id: match.data.id };
      })
      .resolve();
  });
</script>

<div class="min-h-screen flex flex-col">
  <Header />
  
  <main class="flex-1">
    <svelte:component this={currentComponent} params={currentParams} />
  </main>
  
  <Footer />
</div>

<style>
  :global(body) {
    margin: 0;
    padding: 0;
  }
</style>
