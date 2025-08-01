<script>
  import { onMount, onDestroy } from 'svelte';
  import Navigo from 'navigo';
  import { auth } from './stores/auth.js';
  import { notifications } from './stores/notifications.js';
  
  // Import komponenter
  import Header from './components/Header.svelte';
  import Footer from './components/Footer.svelte';
  import Notifications from './components/Notifications.svelte';
  
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
  let router;
  let authState = { isLoggedIn: false, user: null, isLoading: true };
  let currentRoute = '/';
  let currentRouteParams = {};
  
  // Subscribe til auth store for at tracke login status
  const unsubscribe = auth.subscribe(state => {
    const wasLoading = authState.isLoading;
    authState = state;
    
    // Re-evaluate current route når auth state ændres
    if (wasLoading && !state.isLoading && router) {
      // Auth state er nu initialiseret - re-evaluate current route
      evaluateRoute(currentRoute, currentRouteParams);
    }
  });
  
  // Evaluér route baseret på current route og auth state
  function evaluateRoute(route, params = {}) {
    currentRoute = route;
    currentRouteParams = params;
    
    // Route definitions med deres guards
    const routes = {
      '/': () => allowPublic(Home),
      '/recipes': () => allowPublic(Recipes),
      '/recipe/:id': () => allowPublic(RecipeDetail, params),
      '/login': () => requireGuest(Login),
      '/signup': () => requireGuest(Signup),
      '/dashboard': () => requireAuth(Dashboard),
      '/create-recipe': () => requireAuth(CreateRecipe)
    };
    
    // Find matching route og kald dens guard
    const routeHandler = routes[route] || routes['/recipe/:id'];
    if (routeHandler) {
      routeHandler();
    }
  }
  
  // Route guard funktioner
  function requireAuth(component, params = {}) {
    if (authState.isLoading) {
      // Vent på auth initialization
      return;
    }
    
    if (!authState.isLoggedIn) {
      // Vis notification og redirect til login
      notifications.warning(
        'You need to be logged in to access this page',
        'Authentication Required'
      );
      router.navigate('/login');
      return;
    }
    
    // User er authenticated - vis siden
    currentComponent = component;
    currentParams = params;
  }
  
  function requireGuest(component, params = {}) {
    if (authState.isLoading) {
      // Vent på auth initialization
      return;
    }
    
    if (authState.isLoggedIn) {
      // Vis notification og redirect authenticated users væk fra login/signup
      notifications.info(
        'You are already logged in',
        'Already Authenticated'
      );
      router.navigate('/dashboard');
      return;
    }
    
    // User er ikke logged in - vis siden
    currentComponent = component;
    currentParams = params;
  }
  
  function allowPublic(component, params = {}) {
    // Public routes - tilgængelige for alle
    currentComponent = component;
    currentParams = params;
  }
  
  onMount(() => {
    // Initialiser auth store FØRST
    auth.init();
    
    // Setup Navigo router
    router = new Navigo('/', { hash: true });
    
    router
      // Public routes - tilgængelige for alle
      .on('/', () => {
        evaluateRoute('/');
      })
      .on('/recipes', () => {
        evaluateRoute('/recipes');
      })
      .on('/recipe/:id', (match) => {
        evaluateRoute('/recipe/:id', { id: match.data.id });
      })
      
      // Guest-only routes - kun for ikke-logged-in brugere
      .on('/login', () => {
        evaluateRoute('/login');
      })
      .on('/signup', () => {
        evaluateRoute('/signup');
      })
      
      // Protected routes - kun for authenticated brugere
      .on('/dashboard', () => {
        evaluateRoute('/dashboard');
      })
      .on('/create-recipe', () => {
        evaluateRoute('/create-recipe');
      })
      
      .resolve();
  });
  
  onDestroy(() => {
    // Cleanup subscription
    unsubscribe();
  });
</script>

<div class="min-h-screen flex flex-col">
  <Header />
  
  <main class="flex-1">
    {#if authState.isLoading}
      <!-- Vis loading mens auth initialiseres -->
      <div class="flex items-center justify-center h-64">
        <div class="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
      </div>
    {:else}
      <svelte:component this={currentComponent} params={currentParams} />
    {/if}
  </main>

  <Footer />
  
  <!-- Notifications -->
  <Notifications />
</div>

<style>
  :global(body) {
    margin: 0;
    padding: 0;
  }
</style>
