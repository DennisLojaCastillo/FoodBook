<script>
  // Landing page for public users
</script>

<div class="min-h-screen">
  <!-- Hero Section -->
  <section class="bg-white py-20">
    <div class="container mx-auto px-4 text-center">
      <div class="max-w-4xl mx-auto">
        <h1 class="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
          Adventure of <span style="color: #4E71FF;">Delicacies</span>
        </h1>
        <p class="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          Unlock a world of variety culinary recipes and unleash your inner chef the easy way with FoodBook
        </p>
        <div class="flex flex-col sm:flex-row gap-4 justify-center">
          <a href="/#/signup" class="custom-btn-primary text-white px-8 py-3 rounded-full font-semibold transition-all">
            Explore Recipes →
          </a>
          <a href="/#/login" class="custom-btn-secondary px-8 py-3 rounded-full font-semibold transition-all border-2">
            Sign In
          </a>
        </div>
      </div>
      
      <!-- Hero Image Placeholder -->
      <div class="mt-12 max-w-4xl mx-auto">
        <div class="bg-white rounded-2xl shadow-xl p-8">
                     <div class="grid md:grid-cols-2 gap-8 items-center">
             <div class="rounded-xl h-64 overflow-hidden">
               <img 
                 src="/ImageMockUps/HeroRecipeImage.jpg" 
                 alt="Mediterranean Grilled Chicken on grill"
                 class="w-full h-full object-cover"
               />
             </div>
            <div class="text-left">
              <h3 class="text-2xl font-bold mb-3">Mediterranean Grilled Chicken</h3>
              <p class="text-gray-600 mb-4">Indulge in the flavors of the Mediterranean with our succulent grilled chicken</p>
              <div class="flex items-center gap-4 text-sm text-gray-500">
                <span>⏱️ 45 minutes</span>
                <span>👨‍🍳 Chef Emily Parker</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- Features Section -->
  <section class="py-16 bg-white">
    <div class="container mx-auto px-4">
      <div class="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
        <!-- Feature 1 -->
        <div class="text-center">
          <div class="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <span class="text-2xl">👥</span>
          </div>
          <h3 class="text-xl font-semibold mb-2">User-Centered</h3>
          <p class="text-gray-600">Your feedback shapes our platform, ensuring a seamless and satisfying culinary journey</p>
        </div>
        
        <!-- Feature 2 -->
        <div class="text-center">
          <div class="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <span class="text-2xl">🍽️</span>
          </div>
          <h3 class="text-xl font-semibold mb-2">Diverse Recipes</h3>
          <p class="text-gray-600">We celebrate diverse culinary traditions from around the world, inspiring you today</p>
        </div>
        
        <!-- Feature 3 -->
        <div class="text-center">
          <div class="bg-orange-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <span class="text-2xl">❤️</span>
          </div>
          <h3 class="text-xl font-semibold mb-2">Fun Community</h3>
          <p class="text-gray-600">We foster a vibrant foodie community where joy comes with sharing recipes with us</p>
        </div>
      </div>
    </div>
  </section>

  <!-- Featured Recipes Section -->
  <section class="py-16 bg-gray-50">
    <div class="container mx-auto px-4">
      <div class="text-center mb-12">
        <h2 class="text-3xl font-bold text-gray-900 mb-4">Popular Recipes Today</h2>
        <p class="text-gray-600">Discover the most loved recipes by our community</p>
      </div>
      
      <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
                 <!-- Recipe Card 1 -->
         <div class="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow">
           <div class="h-48 overflow-hidden">
             <img 
               src="/ImageMockUps/PastaImage.jpg" 
               alt="Classic Italian Beef Maltagliati"
               class="w-full h-full object-cover"
             />
           </div>
          <div class="p-6">
            <h3 class="text-lg font-semibold mb-2">Classic Italian Beef Maltagliati</h3>
            <p class="text-gray-600 text-sm mb-3">Layers of spicy goodness, hearty meat, and savory sauce. A timeless favorite.</p>
            <div class="flex items-center justify-between text-sm text-gray-500">
              <span>⏱️ 45 min</span>
              <span>⭐ 4.8 (234)</span>
            </div>
          </div>
        </div>
        
                 <!-- Recipe Card 2 -->
         <div class="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow">
           <div class="h-48 overflow-hidden">
             <img 
               src="/ImageMockUps/AsianFood.jpg" 
               alt="Sour & Spicy Korean Kimchi"
               class="w-full h-full object-cover"
             />
           </div>
          <div class="p-6">
            <h3 class="text-lg font-semibold mb-2">Sour & Spicy Korean Kimchi</h3>
            <p class="text-gray-600 text-sm mb-3">Bold flavors and vibrant colors in this traditional Korean fermented dish.</p>
            <div class="flex items-center justify-between text-sm text-gray-500">
              <span>⏱️ 30 min</span>
              <span>⭐ 4.6 (189)</span>
            </div>
          </div>
        </div>
        
                 <!-- Recipe Card 3 -->
         <div class="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow">
           <div class="h-48 overflow-hidden">
             <img 
               src="/ImageMockUps/SaladImage.jpg" 
               alt="Fresh Mediterranean Salad"
               class="w-full h-full object-cover"
             />
           </div>
          <div class="p-6">
            <h3 class="text-lg font-semibold mb-2">Fresh Mediterranean Salad</h3>
            <p class="text-gray-600 text-sm mb-3">Crisp vegetables, olives, and feta cheese with authentic Greek flavors.</p>
            <div class="flex items-center justify-between text-sm text-gray-500">
              <span>⏱️ 15 min</span>
              <span>⭐ 4.9 (312)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- Become a Chef Section -->
  <section class="py-20 text-white" style="background: linear-gradient(to right, #4E71FF, #6B46C1);">
    <div class="container mx-auto px-4 text-center">
      <div class="max-w-4xl mx-auto">
        <h2 class="text-4xl font-bold mb-6">
          Become a true <span class="text-yellow-300">chef</span><br>
          with our recipes.
        </h2>
        <p class="text-xl mb-8 opacity-90">
          We are a home to variety of recipes worldwide for you to learn.
        </p>
        
        <div class="grid md:grid-cols-2 gap-8 items-center mt-12">
                     <div class="bg-white bg-opacity-10 rounded-xl p-8">
             <div class="rounded-xl h-48 overflow-hidden mb-4">
               <img 
                 src="/ImageMockUps/TrueChef.jpg" 
                 alt="Professional chef making noodles"
                 class="w-full h-full object-cover"
               />
             </div>
            <div class="flex items-center justify-center gap-4">
              <div class="text-center">
                <div class="text-2xl font-bold">1000+</div>
                <div class="text-sm opacity-75">Happy Chefs</div>
              </div>
              <div class="text-center">
                <div class="text-2xl font-bold">500+</div>
                <div class="text-sm opacity-75">Recipes</div>
              </div>
            </div>
          </div>
          
          <div class="text-left">
            <div class="mb-6">
              <h3 class="text-xl font-semibold mb-2">🏆 Achievement</h3>
              <p class="opacity-75">Cook 7 foods today</p>
            </div>
            <div class="mb-6">
              <h3 class="text-xl font-semibold mb-2">🔴 Live Now</h3>
              <p class="opacity-75">Chef Mark Johnson</p>
            </div>
                         <a href="/#/signup" class="inline-block bg-white px-8 py-3 rounded-full font-semibold hover:bg-gray-100 transition-colors" style="color: #4E71FF;">
               Start Cooking →
             </a>
          </div>
        </div>
      </div>
    </div>
  </section>
</div>

<style>

  /* Custom button styles with #4E71FF color */
  .custom-btn-primary {
    background-color: #4E71FF;
  }
  
  .custom-btn-primary:hover {
    background-color: #3A5BFF;
  }
  
  .custom-btn-secondary {
    border-color: #4E71FF;
    color: #4E71FF;
  }
  
  .custom-btn-secondary:hover {
    background-color: #4E71FF;
    color: white;
  }
</style> 