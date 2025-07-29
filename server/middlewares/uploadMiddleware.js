import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current directory for ES6 modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Konfigurer multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Gem alle recipe billeder i uploads/recipes/
    cb(null, path.join(__dirname, '../uploads/recipes'));
  },
  filename: (req, file, cb) => {
    // Generer unikt filnavn: recipe-timestamp-randomnumber.jpg
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const fileExtension = path.extname(file.originalname);
    const fileName = `recipe-${uniqueSuffix}${fileExtension}`;
    cb(null, fileName);
  }
});

// File filter til at validere image types
const fileFilter = (req, file, cb) => {
  // Tillad kun image filer
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    console.log(`✅ Valid image uploaded: ${file.originalname}`);
    cb(null, true);
  } else {
    console.log(`❌ Invalid file type: ${file.originalname}`);
    cb(new Error('Only image files (JPEG, JPG, PNG, GIF, WebP) are allowed!'));
  }
};

// Konfigurer multer
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max file size
    files: 1 // Max 1 file per request
  },
  fileFilter: fileFilter
});

// Single file upload middleware til recipe thumbnails
export const uploadRecipeImage = upload.single('thumbnail');

// Error handling middleware til upload fejl
export const handleUploadError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    console.error('❌ Multer error:', error);
    
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File too large. Maximum size is 5MB.'
      });
    }
    
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Too many files. Only one image is allowed.'
      });
    }
    
    return res.status(400).json({
      success: false,
      message: 'File upload error: ' + error.message
    });
  }
  
  if (error.message.includes('Only image files')) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
  
  next(error);
};

// Helper function til at generere image URL
export const generateImageUrl = (req, filename) => {
  if (!filename) return null;
  return `${req.protocol}://${req.get('host')}/uploads/recipes/${filename}`;
}; 