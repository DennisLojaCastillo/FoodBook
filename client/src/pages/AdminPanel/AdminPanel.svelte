<script>
  import { onMount } from 'svelte';
  import api from '../../lib/api.js';
  import { notifications } from '../../stores/notifications.js';
  
  // Dashboard data
  let dashboardData = null;
  let dashboardLoading = true;
  let dashboardError = null;
  
  // Users data
  let users = [];
  let usersLoading = false;
  let usersPagination = {};
  let currentUsersPage = 1;
  
  // Active tab management
  let activeTab = 'dashboard'; // 'dashboard', 'users', 'moderation'
  
  // User action modals
  let showUserActionModal = false;
  let selectedUser = null;
  let userActionType = ''; // 'block', 'activate', 'delete', 'promote'
  let userActionReason = '';
  let userActionLoading = false;
  
  onMount(async () => {
    await loadDashboard();
  });
  
  async function loadDashboard() {
    try {
      dashboardLoading = true;
      dashboardError = null;
      
      const response = await api.getAdminDashboard();
      dashboardData = response.data;
      
    } catch (error) {
      console.error('Failed to load admin dashboard:', error);
      dashboardError = error.message || 'Failed to load dashboard data';
      
      if (error.message?.includes('Admin access required')) {
        notifications.error(
          'You do not have permission to access the admin panel',
          'Access Denied'
        );
        window.location.href = '/#/dashboard';
      }
    } finally {
      dashboardLoading = false;
    }
  }
  
  async function loadUsers(page = 1) {
    try {
      usersLoading = true;
      
      const response = await api.getAdminUsers(page, 20);
      users = response.data.users;
      usersPagination = response.data.pagination;
      currentUsersPage = page;
      
    } catch (error) {
      console.error('Failed to load users:', error);
      notifications.error(
        error.message || 'Failed to load users',
        'Error'
      );
    } finally {
      usersLoading = false;
    }
  }
  
  function setActiveTab(tab) {
    activeTab = tab;
    
    // Load data for the tab
    if (tab === 'users' && users.length === 0) {
      loadUsers();
    }
  }
  
  function openUserActionModal(user, actionType) {
    selectedUser = user;
    userActionType = actionType;
    userActionReason = '';
    showUserActionModal = true;
  }
  
  function closeUserActionModal() {
    showUserActionModal = false;
    selectedUser = null;
    userActionType = '';
    userActionReason = '';
  }
  
  async function executeUserAction() {
    if (!selectedUser || !userActionType) return;
    
    // Frontend validering af reason - kun valider hvis der er indhold
    const trimmedReason = userActionReason?.trim() || '';
    if (trimmedReason.length > 0 && trimmedReason.length < 5) {
      notifications.error(
        'If you provide a reason, it must be at least 5 characters long',
        'Validation Error'
      );
      return;
    }
    
    if (trimmedReason.length > 200) {
      notifications.error(
        'Reason cannot be longer than 200 characters',
        'Validation Error'
      );
      return;
    }
    
    try {
      userActionLoading = true;
      
      let response;
      let successMessage = '';
      
      // trimmedReason er allerede defineret ovenfor
      
      switch (userActionType) {
        case 'block':
          response = await api.toggleUserStatus(selectedUser._id, false, trimmedReason);
          successMessage = 'User blocked successfully';
          break;
          
        case 'activate':
          response = await api.toggleUserStatus(selectedUser._id, true, trimmedReason);
          successMessage = 'User activated successfully';
          break;
          
        case 'delete':
          response = await api.deleteUser(selectedUser._id, trimmedReason);
          successMessage = 'User deleted successfully';
          break;
          
        case 'promote':
          response = await api.promoteUserToAdmin(selectedUser._id, trimmedReason);
          successMessage = 'User promoted to admin successfully';
          break;
      }
      
      notifications.success(successMessage, 'Action Completed');
      closeUserActionModal();
      
      // Reload users to reflect changes
      await loadUsers(currentUsersPage);
      
    } catch (error) {
      console.error('User action error:', error);
      
      // Håndter specifikke validerings fejl
      if (error.message?.includes('Validation failed')) {
        notifications.error(
          'Reason must be between 5 and 200 characters or left empty',
          'Validation Error'
        );
      } else if (error.message?.includes('Reason must be between')) {
        notifications.error(
          'Reason must be between 5 and 200 characters or left empty',
          'Validation Error'
        );
      } else if (error.message?.includes('cannot delete other admin') || error.message?.includes('cannot block or activate other admin')) {
        notifications.error(
          'Admins cannot perform this action on other admin accounts',
          'Access Denied'
        );
      } else {
        notifications.error(
          error.message || 'Failed to execute action',
          'Error'
        );
      }
    } finally {
      userActionLoading = false;
    }
  }
  
  function formatDate(dateString) {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
  
  function getUserStatusBadge(user) {
    if (user.isDeleted) {
      return { class: 'bg-red-100 text-red-800', text: 'Deleted' };
    }
    if (user.isActive === false) {
      return { class: 'bg-yellow-100 text-yellow-800', text: 'Blocked' };
    }
    return { class: 'bg-green-100 text-green-800', text: 'Active' };
  }
  
  function getRoleBadge(role) {
    return role === 'admin' 
      ? { class: 'bg-purple-100 text-purple-800', text: 'Admin' }
      : { class: 'bg-blue-100 text-blue-800', text: 'User' };
  }
</script>

<div class="container mx-auto px-4 py-8">
  <!-- Header -->
  <div class="mb-8">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-bold text-gray-900">🛡️ Admin Panel</h1>
        <p class="text-gray-600 mt-2">System administration and content moderation</p>
      </div>
    </div>
  </div>

  <!-- Tab Navigation -->
  <div class="mb-8">
    <nav class="flex space-x-8" aria-label="Admin Tabs">
      <button
        class="whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm {activeTab === 'dashboard' ? 'border-orange-500 text-orange-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}"
        on:click={() => setActiveTab('dashboard')}
      >
        📊 Dashboard
      </button>
      <button
        class="whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm {activeTab === 'users' ? 'border-orange-500 text-orange-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}"
        on:click={() => setActiveTab('users')}
      >
        👥 User Management
      </button>
    </nav>
  </div>

  <!-- Tab Content -->
  {#if activeTab === 'dashboard'}
    <!-- Dashboard Tab -->
    <div class="space-y-6">
      {#if dashboardLoading}
        <div class="flex items-center justify-center h-64">
          <div class="animate-spin w-8 h-8 border-4 border-orange-600 border-t-transparent rounded-full"></div>
        </div>
      {:else if dashboardError}
        <div class="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <div class="text-red-600 text-lg font-medium mb-2">⚠️ Error Loading Dashboard</div>
          <p class="text-red-600">{dashboardError}</p>
          <button 
            on:click={loadDashboard}
            class="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      {:else if dashboardData}
        <!-- Statistics Cards -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div class="bg-white overflow-hidden shadow rounded-lg">
            <div class="p-5">
              <div class="flex items-center">
                <div class="flex-shrink-0">
                  <div class="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                    <span class="text-white font-bold">👥</span>
                  </div>
                </div>
                <div class="ml-5 w-0 flex-1">
                  <dl>
                    <dt class="text-sm font-medium text-gray-500 truncate">Total Users</dt>
                    <dd class="text-lg font-medium text-gray-900">{dashboardData.totalUsers || 0}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div class="bg-white overflow-hidden shadow rounded-lg">
            <div class="p-5">
              <div class="flex items-center">
                <div class="flex-shrink-0">
                  <div class="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                    <span class="text-white font-bold">📖</span>
                  </div>
                </div>
                <div class="ml-5 w-0 flex-1">
                  <dl>
                    <dt class="text-sm font-medium text-gray-500 truncate">Total Recipes</dt>
                    <dd class="text-lg font-medium text-gray-900">{dashboardData.totalRecipes || 0}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div class="bg-white overflow-hidden shadow rounded-lg">
            <div class="p-5">
              <div class="flex items-center">
                <div class="flex-shrink-0">
                  <div class="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                    <span class="text-white font-bold">💬</span>
                  </div>
                </div>
                <div class="ml-5 w-0 flex-1">
                  <dl>
                    <dt class="text-sm font-medium text-gray-500 truncate">Total Comments</dt>
                    <dd class="text-lg font-medium text-gray-900">{dashboardData.totalComments || 0}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div class="bg-white overflow-hidden shadow rounded-lg">
            <div class="p-5">
              <div class="flex items-center">
                <div class="flex-shrink-0">
                  <div class="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
                    <span class="text-white font-bold">🛡️</span>
                  </div>
                </div>
                <div class="ml-5 w-0 flex-1">
                  <dl>
                    <dt class="text-sm font-medium text-gray-500 truncate">Active Users</dt>
                    <dd class="text-lg font-medium text-gray-900">{dashboardData.activeUsers || 0}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Recent Activity -->
        <div class="bg-white shadow rounded-lg">
          <div class="px-6 py-4 border-b border-gray-200">
            <h3 class="text-lg font-medium text-gray-900">📈 System Overview</h3>
          </div>
          <div class="px-6 py-4">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 class="font-medium text-gray-900 mb-2">User Statistics</h4>
                <ul class="space-y-2 text-sm text-gray-600">
                  <li>• Active Users: {dashboardData.activeUsers || 0}</li>
                  <li>• Blocked Users: {dashboardData.blockedUsers || 0}</li>
                  <li>• Admins: {dashboardData.adminUsers || 0}</li>
                  <li>• New Users Today: {dashboardData.newUsersToday || 0}</li>
                </ul>
              </div>
              <div>
                <h4 class="font-medium text-gray-900 mb-2">Content Statistics</h4>
                <ul class="space-y-2 text-sm text-gray-600">
                  <li>• Total Recipes: {dashboardData.totalRecipes || 0}</li>
                  <li>• Total Comments: {dashboardData.totalComments || 0}</li>
                  <li>• New Recipes Today: {dashboardData.newRecipesToday || 0}</li>
                  <li>• New Comments Today: {dashboardData.newCommentsToday || 0}</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      {/if}
    </div>

  {:else if activeTab === 'users'}
    <!-- User Management Tab -->
    <div class="space-y-6">
      <div class="flex justify-between items-center">
        <h2 class="text-xl font-semibold text-gray-900">User Management</h2>
        {#if !usersLoading}
          <button 
            on:click={() => loadUsers(currentUsersPage)}
            class="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700"
          >
            🔄 Refresh
          </button>
        {/if}
      </div>

      {#if usersLoading}
        <div class="flex items-center justify-center h-64">
          <div class="animate-spin w-8 h-8 border-4 border-orange-600 border-t-transparent rounded-full"></div>
        </div>
      {:else}
        <!-- Users Table -->
        <div class="bg-white shadow overflow-hidden sm:rounded-md">
          <ul class="divide-y divide-gray-200">
            {#each users as user (user._id)}
              <li class="px-6 py-4">
                <div class="flex items-center justify-between">
                  <div class="flex items-center">
                    <div class="flex-shrink-0 h-10 w-10">
                      <div class="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                        <span class="text-sm font-medium text-gray-700">
                          {user.username?.charAt(0)?.toUpperCase() || '?'}
                        </span>
                      </div>
                    </div>
                    <div class="ml-4">
                      <div class="flex items-center space-x-2">
                        <div class="text-sm font-medium text-gray-900">{user.username}</div>
                        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium {getRoleBadge(user.role).class}">
                          {getRoleBadge(user.role).text}
                        </span>
                        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium {getUserStatusBadge(user).class}">
                          {getUserStatusBadge(user).text}
                        </span>
                      </div>
                      <div class="text-sm text-gray-500">{user.email}</div>
                      <div class="text-xs text-gray-400">
                        Created: {formatDate(user.createdAt)}
                      </div>
                    </div>
                  </div>
                  
                  <div class="flex items-center space-x-2">
                    {#if !user.isDeleted}
                      {#if user.role === 'admin'}
                        <!-- Admin brugere - kun vis promote knap er skjult -->
                        <span class="px-3 py-1 text-xs bg-purple-100 text-purple-800 rounded-md">
                          🛡️ Admin (Protected)
                        </span>
                      {:else}
                        <!-- Normale brugere - vis alle admin actions -->
                        {#if user.isActive !== false}
                          <button
                            on:click={() => openUserActionModal(user, 'block')}
                            class="px-3 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-md hover:bg-yellow-200"
                          >
                            Block
                          </button>
                        {:else}
                          <button
                            on:click={() => openUserActionModal(user, 'activate')}
                            class="px-3 py-1 text-xs bg-green-100 text-green-800 rounded-md hover:bg-green-200"
                          >
                            Activate
                          </button>
                        {/if}
                        
                        <button
                          on:click={() => openUserActionModal(user, 'promote')}
                          class="px-3 py-1 text-xs bg-purple-100 text-purple-800 rounded-md hover:bg-purple-200"
                        >
                          Promote to Admin
                        </button>
                        
                        <button
                          on:click={() => openUserActionModal(user, 'delete')}
                          class="px-3 py-1 text-xs bg-red-100 text-red-800 rounded-md hover:bg-red-200"
                        >
                          Delete
                        </button>
                      {/if}
                    {:else}
                      <span class="px-3 py-1 text-xs bg-gray-100 text-gray-500 rounded-md">
                        Deleted
                      </span>
                    {/if}
                  </div>
                </div>
              </li>
            {/each}
          </ul>
        </div>

        <!-- Pagination -->
        {#if usersPagination.totalPages > 1}
          <div class="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div class="flex-1 flex justify-between sm:hidden">
              {#if usersPagination.hasPrevPage}
                <button
                  on:click={() => loadUsers(currentUsersPage - 1)}
                  class="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  Previous
                </button>
              {/if}
              {#if usersPagination.hasNextPage}
                <button
                  on:click={() => loadUsers(currentUsersPage + 1)}
                  class="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  Next
                </button>
              {/if}
            </div>
            <div class="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p class="text-sm text-gray-700">
                  Showing page <span class="font-medium">{currentUsersPage}</span> of <span class="font-medium">{usersPagination.totalPages}</span>
                  (<span class="font-medium">{usersPagination.totalUsers}</span> total users)
                </p>
              </div>
              <div>
                <nav class="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  {#if usersPagination.hasPrevPage}
                    <button
                      on:click={() => loadUsers(currentUsersPage - 1)}
                      class="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                    >
                      Previous
                    </button>
                  {/if}
                  
                  <span class="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                    {currentUsersPage}
                  </span>
                  
                  {#if usersPagination.hasNextPage}
                    <button
                      on:click={() => loadUsers(currentUsersPage + 1)}
                      class="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                    >
                      Next
                    </button>
                  {/if}
                </nav>
              </div>
            </div>
          </div>
        {/if}
      {/if}
    </div>
  {/if}
</div>

<!-- User Action Modal -->
{#if showUserActionModal && selectedUser}
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" role="dialog" aria-modal="true">
    <div class="bg-white rounded-lg p-6 w-full max-w-md mx-4 shadow-xl">
      <div class="flex justify-between items-center mb-4">
        <h3 class="text-lg font-semibold text-gray-900">
          {#if userActionType === 'block'}
            Block User
          {:else if userActionType === 'activate'}
            Activate User
          {:else if userActionType === 'delete'}
            Delete User
          {:else if userActionType === 'promote'}
            Promote to Admin
          {/if}
        </h3>
        <button
          on:click={closeUserActionModal}
          class="text-gray-400 hover:text-gray-600"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div class="mb-4">
        <p class="text-sm text-gray-600 mb-2">
          Are you sure you want to {userActionType} user <strong>{selectedUser.username}</strong>?
        </p>
        
        <div>
          <label for="reason" class="block text-sm font-medium text-gray-700 mb-1">
            Reason (optional)
          </label>
          <textarea
            id="reason"
            bind:value={userActionReason}
            placeholder="Enter reason for this action (minimum 5 characters if provided)..."
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            rows="3"
          ></textarea>
          <div class="flex justify-between mt-1">
            <p class="text-xs text-gray-500">
              {#if userActionReason?.trim()}
                Must be 5-200 characters
              {:else}
                Optional: Leave empty or provide 5+ characters
              {/if}
            </p>
            <p class="text-xs text-gray-400">
              {userActionReason?.length || 0}/200
            </p>
          </div>
        </div>
      </div>

      <div class="flex justify-end space-x-3">
        <button
          type="button"
          on:click={closeUserActionModal}
          class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
          disabled={userActionLoading}
        >
          Cancel
        </button>
        <button
          type="button"
          on:click={executeUserAction}
          class="px-4 py-2 text-sm font-medium text-white bg-orange-600 border border-transparent rounded-md hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={userActionLoading}
        >
          {#if userActionLoading}
            <div class="flex items-center">
              <div class="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
              Processing...
            </div>
          {:else}
            Confirm {userActionType.charAt(0).toUpperCase() + userActionType.slice(1)}
          {/if}
        </button>
      </div>
    </div>
  </div>
{/if}