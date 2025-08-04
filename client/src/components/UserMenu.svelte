<script>
  import { auth } from '../stores/auth.js';
  import { notifications } from '../stores/notifications.js';
  import api from '../lib/api.js';
  
  export let user;
  
  let isOpen = false;
  let showEditModal = false;
  let isUpdating = false;
  
  // Form fields
  let formData = {
    username: '',
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  };
  
  // Form validation
  let formErrors = {};
  
  function toggleDropdown() {
    isOpen = !isOpen;
  }
  
  function handleEditProfile() {
    // Pre-populate form med nuværende user data
    formData = {
      username: user?.username || '',
      email: user?.email || '',
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    };
    formErrors = {};
    showEditModal = true;
    isOpen = false;
  }
  
  function closeEditModal() {
    showEditModal = false;
    formData = {
      username: '',
      email: '',
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    };
    formErrors = {};
  }
  
  function handleAdminPanel() {
    window.location.href = '/#/admin';
    isOpen = false;
  }
  
  function validateForm() {
    formErrors = {};
    
    // Username validation
    if (!formData.username?.trim()) {
      formErrors.username = 'Username is required';
    } else if (formData.username.length < 2 || formData.username.length > 50) {
      formErrors.username = 'Username must be between 2 and 50 characters';
    } else if (!/^[a-zA-Z0-9_-]+$/.test(formData.username)) {
      formErrors.username = 'Username can only contain letters, numbers, underscore and dash';
    }
    
    // Email validation
    if (!formData.email?.trim()) {
      formErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      formErrors.email = 'Please provide a valid email address';
    }
    
    // Password validation (hvis der er angivet et nyt password)
    if (formData.newPassword) {
      if (!formData.currentPassword) {
        formErrors.currentPassword = 'Current password is required when changing password';
      }
      
      if (formData.newPassword.length < 6) {
        formErrors.newPassword = 'New password must be at least 6 characters long';
      } else if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.newPassword)) {
        formErrors.newPassword = 'New password must contain at least one lowercase letter, one uppercase letter, and one number';
      }
      
      if (formData.newPassword !== formData.confirmPassword) {
        formErrors.confirmPassword = 'Passwords do not match';
      }
    }
    
    return Object.keys(formErrors).length === 0;
  }
  
  async function handleSubmit() {
    if (!validateForm()) {
      return;
    }
    
    try {
      isUpdating = true;
      
      // Prepare update data
      const updateData = {
        username: formData.username,
        email: formData.email
      };
      
      // Add password fields if new password is provided
      if (formData.newPassword) {
        updateData.newPassword = formData.newPassword;
        updateData.currentPassword = formData.currentPassword;
      }
      
      const response = await api.updateProfile(updateData);
      
      if (response.success) {
        // Update auth store med nye user data
        auth.updateUser(response.data.user);
        
        notifications.success(
          'Your profile has been updated successfully',
          'Profile Updated'
        );
        
        closeEditModal();
      }
      
    } catch (error) {
      console.error('Update profile error:', error);
      
      if (error.message?.includes('Current password is incorrect')) {
        formErrors.currentPassword = 'Current password is incorrect';
      } else if (error.message?.includes('Email address is already registered')) {
        formErrors.email = 'Email address is already registered';
      } else {
        notifications.error(
          error.message || 'Failed to update profile. Please try again.',
          'Update Error'
        );
      }
    } finally {
      isUpdating = false;
    }
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
    if (!event.target.closest('.user-menu') && !event.target.closest('.edit-modal')) {
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
          on:click={handleEditProfile}
          class="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900"
        >
          Edit Profile
        </button>
        
        <!-- Admin Panel - kun vis til admin brugere -->
        {#if user?.role === 'admin'}
          <button
            on:click={handleAdminPanel}
            class="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 hover:text-gray-900"
          >
            Admin Panel
          </button>
        {/if}
        
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

<!-- Edit Profile Modal -->
{#if showEditModal}
  <div class="edit-modal fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" role="dialog" aria-modal="true" aria-labelledby="edit-profile-title">
    <div class="bg-white rounded-lg p-6 w-full max-w-md mx-4 shadow-xl">
      <div class="flex justify-between items-center mb-6">
        <h3 id="edit-profile-title" class="text-lg font-semibold text-gray-900">Edit Profile</h3>
        <button
          on:click={closeEditModal}
          class="text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Close modal"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <form on:submit|preventDefault={handleSubmit} class="space-y-4">
        <!-- Username Field -->
        <div>
          <label for="username" class="block text-sm font-medium text-gray-700 mb-1">
            Username
          </label>
          <input
            id="username"
            type="text"
            bind:value={formData.username}
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            class:border-red-500={formErrors.username}
            placeholder="Enter your username"
            required
          />
          {#if formErrors.username}
            <p class="text-red-500 text-sm mt-1">{formErrors.username}</p>
          {/if}
        </div>

        <!-- Email Field -->
        <div>
          <label for="email" class="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <input
            id="email"
            type="email"
            bind:value={formData.email}
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            class:border-red-500={formErrors.email}
            placeholder="Enter your email"
            required
          />
          {#if formErrors.email}
            <p class="text-red-500 text-sm mt-1">{formErrors.email}</p>
          {/if}
        </div>

        <!-- Password Section -->
        <div class="border-t pt-4">
          <h4 class="text-sm font-medium text-gray-900 mb-3">Change Password (Optional)</h4>
          
          <!-- Current Password -->
          <div class="mb-3">
            <label for="currentPassword" class="block text-sm font-medium text-gray-700 mb-1">
              Current Password
            </label>
            <input
              id="currentPassword"
              type="password"
              bind:value={formData.currentPassword}
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              class:border-red-500={formErrors.currentPassword}
              placeholder="Enter current password"
            />
            {#if formErrors.currentPassword}
              <p class="text-red-500 text-sm mt-1">{formErrors.currentPassword}</p>
            {/if}
          </div>

          <!-- New Password -->
          <div class="mb-3">
            <label for="newPassword" class="block text-sm font-medium text-gray-700 mb-1">
              New Password
            </label>
            <input
              id="newPassword"
              type="password"
              bind:value={formData.newPassword}
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              class:border-red-500={formErrors.newPassword}
              placeholder="Enter new password"
            />
            {#if formErrors.newPassword}
              <p class="text-red-500 text-sm mt-1">{formErrors.newPassword}</p>
            {/if}
          </div>

          <!-- Confirm Password -->
          <div>
            <label for="confirmPassword" class="block text-sm font-medium text-gray-700 mb-1">
              Confirm New Password
            </label>
            <input
              id="confirmPassword"
              type="password"
              bind:value={formData.confirmPassword}
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              class:border-red-500={formErrors.confirmPassword}
              placeholder="Confirm new password"
            />
            {#if formErrors.confirmPassword}
              <p class="text-red-500 text-sm mt-1">{formErrors.confirmPassword}</p>
            {/if}
          </div>
        </div>

        <!-- Form Actions -->
        <div class="flex justify-end space-x-3 pt-4">
          <button
            type="button"
            on:click={closeEditModal}
            class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
            disabled={isUpdating}
          >
            Cancel
          </button>
          <button
            type="submit"
            class="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            disabled={isUpdating}
          >
            {#if isUpdating}
              <div class="flex items-center">
                <div class="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                Updating...
              </div>
            {:else}
              Save Changes
            {/if}
          </button>
        </div>
      </form>
    </div>
  </div>
{/if} 