import { writable } from 'svelte/store';
import api from '../lib/api.js';

// Auth state store
function createAuthStore() {
  const { subscribe, set, update } = writable({
    isLoggedIn: false,
    user: null,
    isLoading: false,
    error: null
  });

  let initialized = false;

  return {
    subscribe,
    
    // Initialiser auth state fra localStorage (kun én gang)
    init() {
      if (initialized) {
        return;
      }
      
      initialized = true;
      const tokens = api.getTokens();
      
      if (tokens.accessToken) {
        // Kun prøv at hente bruger data hvis vi har token og det ikke er expired
        // Vi tjekker dette stille og roligt
        this.getCurrentUser().catch(() => {
          // Hvis der er problemer, bare ignorer dem - brugeren kan logge ind igen
        });
      } else {
        // Ingen token - sæt state til logged out
        set({
          isLoggedIn: false,
          user: null,
          isLoading: false,
          error: null
        });
      }
    },
    
    // Login bruger
    async login(email, password) {
      update(state => ({ ...state, isLoading: true, error: null }));
      
      try {
        const response = await api.login(email, password);
        
        set({
          isLoggedIn: true,
          user: response.data.user,
          isLoading: false,
          error: null
        });
        
        return response;
        
      } catch (error) {
        set({
          isLoggedIn: false,
          user: null,
          isLoading: false,
          error: error.message
        });
        throw error;
      }
    },
    
    // Signup ny bruger
    async signup(email, username, password) {
      update(state => ({ ...state, isLoading: true, error: null }));
      
      try {
        const response = await api.signup(email, username, password);
        
        set({
          isLoggedIn: true,
          user: response.data.user,
          isLoading: false,
          error: null
        });
        
        return response;
        
      } catch (error) {
        set({
          isLoggedIn: false,
          user: null,
          isLoading: false,
          error: error.message
        });
        throw error;
      }
    },
    
    // Logout bruger
    async logout() {
      update(state => ({ ...state, isLoading: true }));
      
      try {
        await api.logout();
      } catch (error) {
        console.error('Logout error:', error);
      } finally {
        set({
          isLoggedIn: false,
          user: null,
          isLoading: false,
          error: null
        });
      }
    },
    
    // Hent nuværende bruger (til at genopfriske state)
    async getCurrentUser() {
      if (!api.isAuthenticated()) {
        set({
          isLoggedIn: false,
          user: null,
          isLoading: false,
          error: null
        });
        return;
      }
      
      update(state => ({ ...state, isLoading: true }));
      
      try {
        const response = await api.getCurrentUser();
        
        set({
          isLoggedIn: true,
          user: response.data.user,
          isLoading: false,
          error: null
        });
        
      } catch (error) {
        // Silent fail for getCurrentUser - ikke log fejl da det er normalt efter logout
        set({
          isLoggedIn: false,
          user: null,
          isLoading: false,
          error: null
        });
      }
    },
    
    // Clear error
    clearError() {
      update(state => ({ ...state, error: null }));
    },
    
    // Update user data (efter profil opdatering)
    updateUser(userData) {
      update(state => ({ 
        ...state, 
        user: userData 
      }));
    }
  };
}

export const auth = createAuthStore(); 