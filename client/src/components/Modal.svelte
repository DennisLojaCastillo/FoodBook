<script>
  import { modal } from '../stores/modal.js';
  import { fade, scale } from 'svelte/transition';
  import { onMount, onDestroy } from 'svelte';
  
  // Subscribe til modal store
  $: modalState = $modal;
  
  let inputElement;
  let inputValue = '';
  
  // Sync inputValue med modalState når modal åbnes
  $: if (modalState.isOpen && modalState.type === 'prompt') {
    inputValue = modalState.inputValue;
    if (inputElement) {
      setTimeout(() => {
        inputElement.focus();
        inputElement.select();
      }, 100);
    }
  }
  
  // Handle keyboard events
  function handleKeydown(event) {
    if (!modalState.isOpen) return;
    
    if (event.key === 'Escape') {
      event.preventDefault();
      handleCancel();
    } else if (event.key === 'Enter' && modalState.type !== 'prompt') {
      event.preventDefault();
      handleConfirm();
    }
  }
  
  // Handle backdrop click
  function handleBackdropClick(event) {
    if (event.target === event.currentTarget) {
      handleCancel();
    }
  }
  
  // Handle confirm button
  function handleConfirm() {
    if (modalState.type === 'prompt') {
      modal.close(inputValue);
    } else {
      modal.close(true);
    }
  }
  
  // Handle cancel button
  function handleCancel() {
    modal.cancel();
  }

  
  // Add/remove keyboard event listener
  onMount(() => {
    document.addEventListener('keydown', handleKeydown);
  });
  
  onDestroy(() => {
    document.removeEventListener('keydown', handleKeydown);
  });
</script>

<!-- Modal Backdrop -->
{#if modalState.isOpen}
  <!-- svelte-ignore a11y-click-events-have-key-events -->
  <!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
  <div 
    class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
    transition:fade={{ duration: 200 }}
    on:click={handleBackdropClick}
    role="dialog"
    aria-modal="true"
    aria-labelledby="modal-title"
    aria-describedby="modal-message"
  >
    <!-- Modal Content -->
    <div 
      class="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-hidden"
      transition:scale={{ duration: 200, start: 0.95 }}
      on:click|stopPropagation
      role="document"
    >
      <!-- Modal Header -->
      {#if modalState.title}
        <div class="px-6 py-4 border-b border-gray-200">
          <h2 id="modal-title" class="text-lg font-semibold text-gray-900">
            {modalState.title}
          </h2>
        </div>
      {/if}
      
      <!-- Modal Body -->
      <div class="px-6 py-4">
        {#if modalState.message}
          <p id="modal-message" class="text-gray-700 leading-relaxed mb-4">
            {modalState.message}
          </p>
        {/if}
        
        <!-- Input field for prompt type -->
        {#if modalState.type === 'prompt'}
          <div class="mb-4">
            <input
              bind:this={inputElement}
              type="text"
              bind:value={inputValue}
              placeholder={modalState.inputPlaceholder}
              on:keydown={(e) => e.key === 'Enter' && handleConfirm()}
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        {/if}
      </div>
      
      <!-- Modal Footer -->
      <div class="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
        {#if modalState.showCancel}
          <button
            type="button"
            on:click={handleCancel}
            class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            {modalState.cancelText}
          </button>
        {/if}
        
        <button
          type="button"
          on:click={handleConfirm}
          class="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {modalState.confirmText}
        </button>
      </div>
    </div>
  </div>
{/if}

