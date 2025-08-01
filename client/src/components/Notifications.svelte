<script>
  import { notifications } from '../stores/notifications.js';
  import { fly, fade } from 'svelte/transition';
  
  // Subscribe til notifications store
  $: notificationList = $notifications;
  
  // Ikoner for forskellige notification typer
  const icons = {
    success: '✅',
    error: '❌', 
    warning: '⚠️',
    info: 'ℹ️'
  };
  
  // Farver for forskellige notification typer
  const colors = {
    success: 'bg-green-500 border-green-600',
    error: 'bg-red-500 border-red-600',
    warning: 'bg-yellow-500 border-yellow-600', 
    info: 'bg-blue-500 border-blue-600'
  };
  
  // Fjern notification når der klikkes på X
  function dismiss(id) {
    notifications.remove(id);
  }
</script>

<!-- Notification Container -->
<div class="fixed top-4 right-4 z-50 space-y-3 pointer-events-none">
  {#each notificationList as notification (notification.id)}
    <div 
      class="min-w-80 max-w-lg w-full shadow-lg rounded-lg pointer-events-auto {colors[notification.type]} text-white border-l-4"
      in:fly="{{ x: 300, duration: 300 }}"
      out:fade="{{ duration: 200 }}"
    >
      <div class="p-5">
        <div class="flex items-start gap-3">
          <!-- Icon -->
          <div class="flex-shrink-0 mt-0.5">
            <span class="text-2xl" role="img" aria-label={notification.type}>
              {icons[notification.type]}
            </span>
          </div>
          
          <!-- Content -->
          <div class="flex-1 min-w-0">
            {#if notification.title}
              <p class="text-base font-semibold leading-tight">
                {notification.title}
              </p>
            {/if}
            
            {#if notification.message}
              <p class="text-sm {notification.title ? 'mt-2' : ''} opacity-95 leading-relaxed">
                {notification.message}
              </p>
            {/if}
          </div>
          
          <!-- Dismiss button -->
          {#if notification.dismissible}
            <div class="flex-shrink-0">
              <button
                class="inline-flex items-center justify-center w-8 h-8 text-white hover:text-gray-200 hover:bg-black hover:bg-opacity-10 rounded-full focus:outline-none focus:text-gray-200 transition-all duration-200"
                on:click={() => dismiss(notification.id)}
                aria-label="Close notification"
              >
                <span class="text-xl leading-none">×</span>
              </button>
            </div>
          {/if}
        </div>
      </div>
      
      <!-- Progress bar for auto-hide -->
      {#if notification.duration > 0}
        <div class="h-1 bg-black bg-opacity-20">
          <div 
            class="h-full bg-white bg-opacity-30 transition-all ease-linear"
            style="animation: progress {notification.duration}ms linear;"
          ></div>
        </div>
      {/if}
    </div>
  {/each}
</div>

<style>
  @keyframes progress {
    from {
      width: 100%;
    }
    to {
      width: 0%;
    }
  }
</style> 