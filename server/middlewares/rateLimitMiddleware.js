import rateLimit from 'express-rate-limit';

// General API rate limiting
export const apiLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutter
  max: 100, // Maksimum 100 requests per 15 minutter
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: (req, res) => {
    console.log(`⚠️ Rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      success: false,
      message: 'Too many requests from this IP, please try again later.',
      retryAfter: '15 minutes'
    });
  }
});

// Strict rate limiting for external API calls (mindre requests per minut)
export const externalApiLimit = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minut
  max: 10, // Maksimum 10 external API requests per minut
  message: {
    success: false,
    message: 'Too many external API requests, please slow down.',
    retryAfter: '1 minute'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    console.log(`⚠️ External API rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      success: false,
      message: 'Too many external API requests, please slow down.',
      retryAfter: '1 minute'
    });
  }
});

// Auth endpoint rate limiting (stricter for login/signup)
export const authLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutter
  max: 5, // Maksimum 5 login/signup attempts per 15 minutter
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Tæl kun failed requests
  handler: (req, res) => {
    console.log(`⚠️ Auth rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      success: false,
      message: 'Too many authentication attempts, please try again later.',
      retryAfter: '15 minutes'
    });
  }
});

// Recipe creation rate limiting
export const recipeCreateLimit = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minut
  max: 5, // Maksimum 5 recipes per minut
  message: {
    success: false,
    message: 'Too many recipes created, please slow down.',
    retryAfter: '1 minute'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    console.log(`⚠️ Recipe creation rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      success: false,
      message: 'Too many recipes created, please slow down.',
      retryAfter: '1 minute'
    });
  }
});

// Comment rate limiting
export const commentLimit = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minut
  max: 10, // Maksimum 10 comments per minut
  message: {
    success: false,
    message: 'Too many comments posted, please slow down.',
    retryAfter: '1 minute'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    console.log(`⚠️ Comment rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      success: false,
      message: 'Too many comments posted, please slow down.',
      retryAfter: '1 minute'
    });
  }
}); 