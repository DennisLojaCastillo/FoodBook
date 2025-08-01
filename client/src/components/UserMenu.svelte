<script>
  import { auth } from '../stores/auth.js';
  import { notifications } from '../stores/notifications.js';
  
  export let user;
  
  let isOpen = false;
  
  function toggleDropdown() {
    isOpen = !isOpen;
  }
  
  function handleDashboard() {
    window.location.href = '/#/dashboard';
    isOpen = false;
  }
  
  async function handleLogout() {
    try {
      await auth.logout();
      
      // Vis logout notification
      notifications.info(
        'You have been successfully logged out',
        'Logged Out'
      );
      
      window.location.href = '/';
    } catch (error) {
      console.error('Logout error:', error);
      notifications.error(
        'Failed to log out. Please try again.',
        'Logout Error'
      );
    }
    isOpen = false;
  }
  
  // Luk dropdown hvis der klikkes udenfor
  function handleClickOutside(event) {
    if (!event.target.closest('.user-menu')) {
      isOpen = false;
    }
  }
</script>

<svelte:window on:click={handleClickOutside} />

<div class="user-menu relative inline-block text-left">
  <div>
    <button
      type="button"
      class="inline-flex items-center justify-center w-full rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      on:click={toggleDropdown}
      aria-expanded={isOpen}
      aria-haspopup="true"
    >
      {user?.username || 'User'}
      <svg class="-mr-1 ml-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
        <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" />
      </svg>
    </button>
  </div>

  {#if isOpen}
    <div class="absolute right-0 z-10 mt-2 w-56 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
      <div class="py-1">
        <button
          on:click={handleDashboard}
          class="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900"
        >
          Dashboard
        </button>
        <button
          on:click={handleLogout}
          class="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900"
        >
          Logout
        </button>
      </div>
    </div>
  {/if}
</div> 