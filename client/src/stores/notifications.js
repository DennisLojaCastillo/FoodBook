import { writable } from 'svelte/store';

// Notification store til toast meddelelser
function createNotificationStore() {
  const { subscribe, set, update } = writable([]);

  return {
    subscribe,
    
    // Tilføj en ny notification
    add(notification) {
      const id = Date.now() + Math.random();
      const newNotification = {
        id,
        type: notification.type || 'info', // 'success', 'error', 'warning', 'info'
        title: notification.title || '',
        message: notification.message || '',
        duration: notification.duration || 4000, // Auto-hide efter 4 sekunder
        dismissible: notification.dismissible !== false // Default true
      };
      
      update(notifications => [...notifications, newNotification]);
      
      // Auto-hide notification efter duration
      if (newNotification.duration > 0) {
        setTimeout(() => {
          this.remove(id);
        }, newNotification.duration);
      }
      
      return id;
    },
    
    // Fjern notification baseret på ID
    remove(id) {
      update(notifications => notifications.filter(n => n.id !== id));
    },
    
    // Ryd alle notifications
    clear() {
      set([]);
    },
    
    // Helper metoder for forskellige typer
    success(message, title = 'Success') {
      return this.add({ type: 'success', title, message });
    },
    
    error(message, title = 'Error') {
      return this.add({ type: 'error', title, message, duration: 6000 });
    },
    
    warning(message, title = 'Warning') {
      return this.add({ type: 'warning', title, message });
    },
    
    info(message, title = 'Info') {
      return this.add({ type: 'info', title, message });
    }
  };
}

export const notifications = createNotificationStore(); 