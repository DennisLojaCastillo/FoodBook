// Environment variables validation
const requiredEnvVars = [
  'MONGODB_URI',
  'JWT_SECRET', 
  'JWT_REFRESH_SECRET',
  'RAPIDAPI_KEY'
];

const optionalEnvVars = [
  'PORT',
  'CLIENT_URL',
  'JWT_ACCESS_EXPIRES_IN',
  'JWT_REFRESH_EXPIRES_IN', 
  'RAPIDAPI_HOST',
  'NODE_ENV'
];

const validateEnvironmentVariables = () => {
  console.log('🔍 Validating environment variables...');
  
  const missing = [];
  const warnings = [];
  
  // Check required variables
  requiredEnvVars.forEach(envVar => {
    if (!process.env[envVar]) {
      missing.push(envVar);
    } else {
      console.log(`✅ ${envVar}: ${envVar.includes('SECRET') || envVar.includes('KEY') ? '***' : process.env[envVar]}`);
    }
  });
  
  // Check optional variables (warnings only)
  optionalEnvVars.forEach(envVar => {
    if (!process.env[envVar]) {
      warnings.push(envVar);
    } else {
      console.log(`✅ ${envVar}: ${process.env[envVar]}`);
    }
  });
  
  // Report warnings
  if (warnings.length > 0) {
    console.log(`⚠️  Optional environment variables missing (using defaults):`);
    warnings.forEach(envVar => {
      console.log(`   - ${envVar}`);
    });
  }
  
  // Handle missing required variables
  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:');
    missing.forEach(envVar => {
      console.error(`   - ${envVar}`);
    });
    console.error('\n💡 Please check your .env file and ensure all required variables are set.');
    console.error('📖 See README.md for setup instructions.');
    process.exit(1);
  }
  
  // Validate specific formats
  validateSpecificFormats();
  
  console.log('✅ All required environment variables validated successfully!');
};

const validateSpecificFormats = () => {
  // Validate MongoDB URI format
  if (process.env.MONGODB_URI && !process.env.MONGODB_URI.startsWith('mongodb')) {
    console.error('❌ MONGODB_URI must start with "mongodb://" or "mongodb+srv://"');
    process.exit(1);
  }
  
  // Validate JWT secrets length (security)
  if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
    console.error('❌ JWT_SECRET should be at least 32 characters for security');
    process.exit(1);
  }
  
  if (process.env.JWT_REFRESH_SECRET && process.env.JWT_REFRESH_SECRET.length < 32) {
    console.error('❌ JWT_REFRESH_SECRET should be at least 32 characters for security');
    process.exit(1);
  }
  
  // Validate CLIENT_URL format if provided
  if (process.env.CLIENT_URL && !process.env.CLIENT_URL.startsWith('http')) {
    console.error('❌ CLIENT_URL must start with "http://" or "https://"');
    process.exit(1);
  }
};

export default validateEnvironmentVariables; 