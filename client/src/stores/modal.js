import { writable } from 'svelte/store';

// Modal store til håndtering af custom modals
function createModalStore() {
  const { subscribe, set, update } = writable({
    isOpen: false,
    type: null,
    title: '',
    message: '',
    confirmText: 'OK',
    cancelText: 'Cancel',
    showCancel: false,
    inputValue: '',
    inputPlaceholder: '',
    resolve: null,
    reject: null
  });

  return {
    subscribe,
    
    // Vis confirm modal (ligesom browser confirm)
    confirm(message, title = 'Confirm', options = {}) {
      return new Promise((resolve) => {
        set({
          isOpen: true,
          type: 'confirm',
          title,
          message,
          confirmText: options.confirmText || 'OK',
          cancelText: options.cancelText || 'Cancel',
          showCancel: true,
          inputValue: '',
          inputPlaceholder: '',
          resolve,
          reject: null
        });
      });
    },
    
    // Vis alert modal (ligesom browser alert)  
    alert(message, title = 'Alert', options = {}) {
      return new Promise((resolve) => {
        set({
          isOpen: true,
          type: 'alert',
          title,
          message,
          confirmText: options.confirmText || 'OK',
          cancelText: '',
          showCancel: false,
          inputValue: '',
          inputPlaceholder: '',
          resolve,
          reject: null
        });
      });
    },
    
    // Vis prompt modal (ligesom browser prompt)
    prompt(message, title = 'Input', defaultValue = '', options = {}) {
      return new Promise((resolve) => {
        set({
          isOpen: true,
          type: 'prompt',
          title,
          message,
          confirmText: options.confirmText || 'OK',
          cancelText: options.cancelText || 'Cancel',
          showCancel: true,
          inputValue: defaultValue,
          inputPlaceholder: options.placeholder || '',
          resolve,
          reject: null
        });
      });
    },
    
    // Vis custom modal med custom content
    custom(options = {}) {
      return new Promise((resolve, reject) => {
        set({
          isOpen: true,
          type: 'custom',
          title: options.title || '',
          message: options.message || '',
          confirmText: options.confirmText || 'OK',
          cancelText: options.cancelText || 'Cancel',
          showCancel: options.showCancel !== false,
          inputValue: options.inputValue || '',
          inputPlaceholder: options.inputPlaceholder || '',
          resolve,
          reject
        });
      });
    },
    
    // Luk modal og returner resultat
    close(result = null) {
      update(state => {
        if (state.resolve) {
          state.resolve(result);
        }
        return {
          isOpen: false,
          type: null,
          title: '',
          message: '',
          confirmText: 'OK',
          cancelText: 'Cancel',
          showCancel: false,
          inputValue: '',
          inputPlaceholder: '',
          resolve: null,
          reject: null
        };
      });
    },
    
    // Cancel modal (returner false/null)
    cancel() {
      update(state => {
        if (state.resolve) {
          state.resolve(false);
        }
        return {
          isOpen: false,
          type: null,
          title: '',
          message: '',
          confirmText: 'OK',
          cancelText: 'Cancel',
          showCancel: false,
          inputValue: '',
          inputPlaceholder: '',
          resolve: null,
          reject: null
        };
      });
    }
  };
}

export const modal = createModalStore();
