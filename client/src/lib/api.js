// API Client for FoodBook server communication
class ApiClient {
  constructor() {
    this.baseURL = 'http://localhost:5000/api';
    this.accessToken = localStorage.getItem('accessToken');
    this.refreshToken = localStorage.getItem('refreshToken');
  }

  // Gem tokens i localStorage
  setTokens(accessToken, refreshToken) {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
  }

  // Fjern tokens fra localStorage
  clearTokens() {
    this.accessToken = null;
    this.refreshToken = null;
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  }

  // Hent authorization headers
  getAuthHeaders(includeContentType = true) {
    const headers = {};
    
    // Force sync tokens from localStorage if missing
    if (!this.accessToken) {
      this.accessToken = localStorage.getItem('accessToken');
      this.refreshToken = localStorage.getItem('refreshToken');
    }
    
    // Only add Content-Type for JSON requests, not for FormData
    if (includeContentType) {
      headers['Content-Type'] = 'application/json';
    }
    
    if (this.accessToken) {
      headers.Authorization = `Bearer ${this.accessToken}`;
    }
    
    return headers;
  }

  // Basis HTTP request med error handling
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    
    const config = {
      headers: this.getAuthHeaders(),
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      // Hvis token er expired, prøv at refresh
      if (response.status === 401 && this.refreshToken) {
        const refreshed = await this.refreshAccessToken();
        if (refreshed) {
          // Prøv request igen med ny token
          config.headers = this.getAuthHeaders();
          const retryResponse = await fetch(url, config);
          return await this.handleResponse(retryResponse);
        }
      }
      
      return await this.handleResponse(response);
    } catch (error) {
      console.error('API Request failed:', error);
      throw new Error('Network error occurred');
    }
  }

  // Handle API response
  async handleResponse(response) {
    const contentType = response.headers.get('content-type');
    
    if (contentType && contentType.includes('application/json')) {
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }
      
      return data;
    } else {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response;
    }
  }

  // Refresh access token
  async refreshAccessToken() {
    if (!this.refreshToken) {
      return false;
    }

    try {
      const response = await fetch(`${this.baseURL}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          refreshToken: this.refreshToken,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        this.setTokens(data.data.accessToken, data.data.refreshToken || this.refreshToken);
        return true;
      } else {
        // Refresh token er invalid, log brugeren ud
        this.clearTokens();
        return false;
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
      this.clearTokens();
      return false;
    }
  }

  // ======================
  // AUTH ENDPOINTS
  // ======================

  // Login bruger
  async login(email, password) {
    const data = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    
    // Gem tokens efter successfuldt login
    if (data.data && data.data.accessToken && data.data.refreshToken) {
      this.setTokens(data.data.accessToken, data.data.refreshToken);
    }
    
    return data;
  }

  // Signup ny bruger
  async signup(email, username, password) {
    const data = await this.request('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ email, username, password }),
    });
    
    // Gem tokens efter successfuldt signup
    if (data.data && data.data.accessToken && data.data.refreshToken) {
      this.setTokens(data.data.accessToken, data.data.refreshToken);
    }
    
    return data;
  }

  // Logout bruger
  async logout() {
    try {
      if (this.refreshToken) {
        await this.request('/auth/logout', {
          method: 'POST',
          body: JSON.stringify({ refreshToken: this.refreshToken }),
        });
      }
    } catch (error) {
      // Silent fail på logout - det er okay hvis serveren ikke kan nås
      // Vi rydder tokens lokalt uanset hvad
    } finally {
      // Ryd tokens uanset om request lykkes
      this.clearTokens();
    }
  }

  // Hent nuværende bruger data
  async getCurrentUser() {
    return await this.request('/auth/me');
  }

  // Hent bruger profil med favoritter
  async getUserProfile() {
    return await this.request('/auth/profile');
  }

  // Opdater bruger profil
  async updateProfile(profileData) {
    return await this.request('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  }

  // ======================
  // RECIPE ENDPOINTS
  // ======================

  // Hent alle opskrifter
  async getRecipes(page = 1, limit = 10) {
    return await this.request(`/recipes?page=${page}&limit=${limit}`);
  }

  // Hent specifik opskrift
  async getRecipe(id) {
    return await this.request(`/recipes/${id}`);
  }

  // Opret ny opskrift (med file upload support)
  async createRecipe(recipeData) {
    // Check if there's a file to upload
    if (recipeData.thumbnail instanceof File) {
      // Use FormData for multipart upload
      const formData = new FormData();
      
      // Add file
      formData.append('thumbnail', recipeData.thumbnail);
      
      // Add other fields (arrays need to be JSON stringified for multipart)
      formData.append('title', recipeData.title);
      formData.append('description', recipeData.description);
      formData.append('ingredients', JSON.stringify(recipeData.ingredients));
      formData.append('instructions', JSON.stringify(recipeData.instructions));
      
      // Optional fields
      if (recipeData.servings) formData.append('servings', recipeData.servings.toString());
      if (recipeData.totalTimeCookingMinutes) formData.append('totalTimeCookingMinutes', recipeData.totalTimeCookingMinutes.toString());
      if (recipeData.tags && recipeData.tags.length > 0) formData.append('tags', JSON.stringify(recipeData.tags));
      if (recipeData.videoUrl) formData.append('videoUrl', recipeData.videoUrl);
      if (recipeData.nutrition) formData.append('nutrition', JSON.stringify(recipeData.nutrition));
      
      // Make request with FormData (don't set Content-Type, browser will set it with boundary)
      const response = await fetch(`${this.baseURL}/recipes`, {
        method: 'POST',
        headers: {
          ...this.getAuthHeaders(false), // Don't include Content-Type for FormData
        },
        body: formData,
      });
      
      return await this.handleResponse(response);
    } else {
      // No file upload, use regular JSON
      return await this.request('/recipes', {
        method: 'POST',
        body: JSON.stringify(recipeData),
      });
    }
  }

  // Opdater opskrift
  async updateRecipe(id, recipeData) {
    return await this.request(`/recipes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(recipeData),
    });
  }

  // Slet opskrift
  async deleteRecipe(id) {
    return await this.request(`/recipes/${id}`, {
      method: 'DELETE',
    });
  }

  // Tilføj til favoritter
  async addToFavorites(recipeId) {
    return await this.request(`/recipes/${recipeId}/favorite`, {
      method: 'POST',
    });
  }

  // Fjern fra favoritter
  async removeFromFavorites(recipeId) {
    return await this.request(`/recipes/${recipeId}/favorite`, {
      method: 'DELETE',
    });
  }

  // Hent kommentarer til opskrift
  async getRecipeComments(recipeId) {
    return await this.request(`/recipes/${recipeId}/comments`);
  }

  // Tilføj kommentar
  async addComment(recipeId, comment) {
    return await this.request(`/recipes/${recipeId}/comment`, {
      method: 'POST',
      body: JSON.stringify({ text: comment }),
    });
  }

  // ======================
  // SEARCH ENDPOINTS
  // ======================

  // Søg opskrifter (Tasty API)
  async searchRecipes(query) {
    return await this.request(`/search?q=${encodeURIComponent(query)}`);
  }

  // Gem ekstern opskrift som favorit
  async saveExternalFavorite(externalRecipeData) {
    return await this.request('/external/favorite', {
      method: 'POST',
      body: JSON.stringify(externalRecipeData),
    });
  }

  // Fjern ekstern favorit
  async removeExternalFavorite(externalId) {
    return await this.request(`/external/favorite/${externalId}`, {
      method: 'DELETE',
    });
  }

  // ======================
  // AUTH HELPERS
  // ======================

  // Tjek om bruger er logged ind
  isAuthenticated() {
    return !!this.accessToken;
  }

  // Hent stored tokens
  getTokens() {
    // Synkroniser med localStorage hvis tokens mangler i memory
    if (!this.accessToken) {
      this.accessToken = localStorage.getItem('accessToken');
      this.refreshToken = localStorage.getItem('refreshToken');
    }
    
    return {
      accessToken: this.accessToken,
      refreshToken: this.refreshToken,
    };
  }
}

// Eksporter singleton instance
export const api = new ApiClient();

// Eksporter default
export default api; 