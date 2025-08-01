<script>
  import { auth } from '../../stores/auth.js';
  
  let email = '';
  let username = '';
  let password = '';
  let confirmPassword = '';
  let errorMessage = '';
  
  $: isLoading = $auth.isLoading;
  
  async function handleSubmit() {
    if (!email || !username || !password || !confirmPassword) {
      errorMessage = 'Please fill in all fields';
      return;
    }
    
    if (password !== confirmPassword) {
      errorMessage = 'Passwords do not match!';
      return;
    }
    
    errorMessage = '';
    
    try {
      await auth.signup(email, username, password);
      
      // Redirect til /recipes efter succesfuld signup
      window.location.href = '/#/recipes';
      
    } catch (error) {
      console.error('Signup failed:', error);
      errorMessage = error.message || 'Signup failed. Please try again.';
    }
  }
</script>

<div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
  <div class="max-w-md w-full space-y-8">
    <div>
      <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
        Create your account
      </h2>
    </div>
    
    <!-- Error Message -->
    {#if errorMessage}
      <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        {errorMessage}
      </div>
    {/if}
    
    <form class="mt-8 space-y-6" on:submit|preventDefault={handleSubmit}>
      <div class="rounded-md shadow-sm -space-y-px">
        <div>
          <label for="email" class="sr-only">Email</label>
          <input 
            id="email" 
            name="email" 
            type="email" 
            required 
            disabled={isLoading}
            bind:value={email}
            class="relative block w-full px-3 py-2 border border-gray-300 rounded-t-md placeholder-gray-500 text-gray-900 focus:outline-none disabled:opacity-50" style="focus:ring-color: #4E71FF; focus:border-color: #4E71FF;" 
            placeholder="Email address"
          />
        </div>
        <div>
          <label for="username" class="sr-only">Username</label>
          <input 
            id="username" 
            name="username" 
            type="text" 
            required 
            disabled={isLoading}
            bind:value={username}
            class="relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none disabled:opacity-50" style="focus:ring-color: #4E71FF; focus:border-color: #4E71FF;" 
            placeholder="Username"
          />
        </div>
        <div>
          <label for="password" class="sr-only">Password</label>
          <input 
            id="password" 
            name="password" 
            type="password" 
            required 
            disabled={isLoading}
            bind:value={password}
            class="relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none disabled:opacity-50" style="focus:ring-color: #4E71FF; focus:border-color: #4E71FF;" 
            placeholder="Password (min 6 chars, 1 uppercase, 1 lowercase, 1 number)"
          />
        </div>
        <div>
          <label for="confirmPassword" class="sr-only">Confirm Password</label>
          <input 
            id="confirmPassword" 
            name="confirmPassword" 
            type="password" 
            required 
            disabled={isLoading}
            bind:value={confirmPassword}
            class="relative block w-full px-3 py-2 border border-gray-300 rounded-b-md placeholder-gray-500 text-gray-900 focus:outline-none disabled:opacity-50" style="focus:ring-color: #4E71FF; focus:border-color: #4E71FF;" 
            placeholder="Confirm password"
          />
        </div>
      </div>

      <div>
        <button 
          type="submit" 
          disabled={isLoading}
          class="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed" style="background-color: #4E71FF; ring-color: #4E71FF;"
        >
          {#if isLoading}
            <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Creating Account...
          {:else}
            Create Account
          {/if}
        </button>
      </div>
      
      <div class="text-center">
        <a href="/login" class="hover:opacity-80" style="color: #4E71FF;">
          Already have an account? Sign in here
        </a>
      </div>
    </form>
  </div>
</div> 