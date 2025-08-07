import { modal } from '../stores/modal.js';

// Helper funktioner for at gøre modal usage endnu lettere

// Confirm deletion med standardtekst og styling
export async function confirmDelete(itemName = 'this item') {
  return await modal.confirm(
    `This action cannot be undone. Are you sure you want to delete ${itemName}?`,
    'Delete Confirmation',
    {
      confirmText: 'Delete',
      cancelText: 'Cancel'
    }
  );
}

// Confirm logout
export async function confirmLogout() {
  return await modal.confirm(
    'Are you sure you want to log out?',
    'Logout Confirmation',
    {
      confirmText: 'Logout',
      cancelText: 'Stay logged in'
    }
  );
}

// Confirm navigation away from unsaved changes
export async function confirmUnsavedChanges() {
  return await modal.confirm(
    'You have unsaved changes. Are you sure you want to leave this page?',
    'Unsaved Changes',
    {
      confirmText: 'Leave page',
      cancelText: 'Stay on page'
    }
  );
}

// Success alert med standardtekst
export async function showSuccess(message, title = 'Success') {
  return await modal.alert(message, title, {
    confirmText: 'Great!'
  });
}

// Error alert med standardtekst
export async function showError(message, title = 'Error') {
  return await modal.alert(message, title, {
    confirmText: 'OK'
  });
}

// Prompt for text input med validering
export async function promptText(message, title = 'Enter text', defaultValue = '', options = {}) {
  const result = await modal.prompt(message, title, defaultValue, {
    placeholder: options.placeholder || 'Enter text...',
    confirmText: options.confirmText || 'OK',
    cancelText: options.cancelText || 'Cancel'
  });
  
  // Return null hvis cancelled eller tom streng hvis ikke tilladt
  if (result === false) return null;
  if (!options.allowEmpty && !result?.trim()) return null;
  
  return result;
}
