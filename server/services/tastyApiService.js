import https from 'https';
import NodeCache from 'node-cache';

// Cache for 15 minutes (900 seconds)
const cache = new NodeCache({ stdTTL: 900 });

class TastyApiService {
  constructor() {
    this.apiKey = process.env.RAPIDAPI_KEY;
    this.apiHost = process.env.RAPIDAPI_HOST || 'tasty.p.rapidapi.com';
    this.baseUrl = `https://${this.apiHost}`;
  }

  // Generel HTTP request metode
  async makeRequest(endpoint, queryParams = {}) {
    try {
      // Opbyg query string
      const queryString = Object.keys(queryParams)
        .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(queryParams[key])}`)
        .join('&');
      
      const url = `${this.baseUrl}${endpoint}${queryString ? `?${queryString}` : ''}`;
      
      // Tjek cache først
      const cacheKey = `tasty_${endpoint}_${queryString}`;
      const cachedData = cache.get(cacheKey);
      
      if (cachedData) {
        return cachedData;
      }

      const options = {
        method: 'GET',
        headers: {
          'X-RapidAPI-Key': this.apiKey,
          'X-RapidAPI-Host': this.apiHost
        }
      };

      const data = await this.httpRequest(url, options);
      
      // Cache resultatet
      cache.set(cacheKey, data);
      
      return data;

    } catch (error) {
      console.error('❌ Tasty API error:', error);
      throw new Error(`Tasty API request failed: ${error.message}`);
    }
  }

  // HTTP request wrapper med Promise
  httpRequest(url, options) {
    return new Promise((resolve, reject) => {
      const req = https.request(url, options, (res) => {
        let data = '';

        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          try {
            if (res.statusCode >= 200 && res.statusCode < 300) {
              const parsedData = JSON.parse(data);
              resolve(parsedData);
            } else {
              reject(new Error(`HTTP ${res.statusCode}: ${data}`));
            }
          } catch (error) {
            reject(new Error(`JSON parse error: ${error.message}`));
          }
        });
      });

      req.on('error', (error) => {
        reject(error);
      });

      req.end();
    });
  }

  // Søg opskrifter
  async searchRecipes(query, from = 0, size = 20) {
    try {
      const endpoint = '/recipes/list';
      const params = {
        from: from,
        size: Math.min(size, 40), // Begræns til max 40
        q: query
      };

      const response = await this.makeRequest(endpoint, params);
      
      // Transform data til vores format
      const recipes = response.results || [];
      const transformedRecipes = recipes.map(recipe => ({
        externalId: recipe.id,
        title: recipe.name || 'Untitled Recipe',
        description: recipe.description || 'No description available',
        thumbnail: recipe.thumbnail_url || null,
        videoUrl: recipe.original_video_url || null,
        source: 'tasty',
        totalTimeCookingMinutes: recipe.total_time_minutes || null,
        servings: recipe.num_servings || null,
        ingredients: this.extractIngredients(recipe.sections),
        instructions: this.extractInstructions(recipe.instructions),
        tags: recipe.tags ? recipe.tags.map(tag => tag.name) : [],
        nutrition: recipe.nutrition || null,
        originalUrl: `https://tasty.co/recipe/${recipe.slug || recipe.id}`
      }));

      return {
        recipes: transformedRecipes,
        total: response.count || 0,
        from: from,
        size: size
      };

    } catch (error) {
      console.error('❌ Search recipes error:', error);
      throw error;
    }
  }

  // Hent enkelt opskrift detaljer
  async getRecipeDetails(recipeId) {
    try {
      const endpoint = '/recipes/get-more-info';
      const params = { id: recipeId };

      const response = await this.makeRequest(endpoint, params);
      
      if (!response) {
        throw new Error('Recipe not found');
      }

      return {
        externalId: response.id,
        title: response.name || 'Untitled Recipe',
        description: response.description || 'No description available',
        thumbnail: response.thumbnail_url || null,
        videoUrl: response.original_video_url || null,
        source: 'tasty',
        totalTimeCookingMinutes: response.total_time_minutes || null,
        servings: response.num_servings || null,
        ingredients: this.extractIngredients(response.sections),
        instructions: this.extractInstructions(response.instructions),
        tags: response.tags ? response.tags.map(tag => tag.name) : [],
        nutrition: response.nutrition || null,
        originalUrl: `https://tasty.co/recipe/${response.slug || response.id}`
      };

    } catch (error) {
      console.error('❌ Get recipe details error:', error);
      throw error;
    }
  }

  // Auto-complete søgning
  async autocomplete(prefix) {
    try {
      const endpoint = '/recipes/auto-complete';
      const params = { prefix: prefix };

      const response = await this.makeRequest(endpoint, params);
      
      return response.results || [];

    } catch (error) {
      console.error('❌ Autocomplete error:', error);
      throw error;
    }
  }

  // Hent tags/kategorier
  async getTags() {
    try {
      const endpoint = '/tags/list';
      const response = await this.makeRequest(endpoint);
      
      return response.results || [];

    } catch (error) {
      console.error('❌ Get tags error:', error);
      throw error;
    }
  }

  // Helper: Ekstrahér ingredienser fra sektioner
  extractIngredients(sections) {
    if (!sections || !Array.isArray(sections)) return [];
    
    const ingredients = [];
    sections.forEach(section => {
      if (section.components && Array.isArray(section.components)) {
        section.components.forEach(component => {
          if (component.raw_text) {
            ingredients.push(component.raw_text);
          }
        });
      }
    });
    
    return ingredients;
  }

  // Helper: Ekstrahér instruktioner
  extractInstructions(instructions) {
    if (!instructions || !Array.isArray(instructions)) return [];
    
    return instructions.map(instruction => instruction.display_text || '').filter(text => text.length > 0);
  }

  // Cache statistikker
  getCacheStats() {
    return {
      keys: cache.keys().length,
      hits: cache.getStats().hits,
      misses: cache.getStats().misses
    };
  }

  // Ryd cache
  clearCache() {
    cache.flushAll();
  }
}

export default new TastyApiService(); 