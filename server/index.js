const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config();
const { sequelize } = require('./models');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Serve uploaded images
const uploadsPath = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsPath)) {
  fs.mkdirSync(uploadsPath, { recursive: true });
}
app.use('/uploads', express.static(uploadsPath));

// Only serve static files if build directory exists (production)
// In Docker production, frontend is served separately via nginx, so skip this
const buildPath = path.join(__dirname, '../client/build');
const buildIndexPath = path.join(buildPath, 'index.html');
const shouldServeFrontend = fs.existsSync(buildPath) && fs.existsSync(buildIndexPath);

if (shouldServeFrontend) {
  app.use(express.static(buildPath));
}

// PostgreSQL connection with retry logic
const connectWithRetry = async (maxRetries = 5, delay = 5000) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      await sequelize.authenticate();
      console.log('PostgreSQL connected successfully');
      
      // Run migration to add userId columns to existing tables
      await require('./migrations/add-userId-columns').migrateUserIdColumns();
      
      // Sync database (creates tables if they don't exist, alters if schema changed)
      await sequelize.sync({ alter: true });
      
      console.log('Database synced successfully');
      return;
    } catch (err) {
      console.error(`Database connection attempt ${i + 1}/${maxRetries} failed:`, err.message);
      if (i < maxRetries - 1) {
        console.log(`Retrying in ${delay / 1000} seconds...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        console.error('Database connection error after all retries:', err);
      }
    }
  }
};

connectWithRetry();

// Routes
app.use('/api/products', require('./routes/products'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api/final-products', require('./routes/finalProducts'));
app.use('/api/currencies', require('./routes/currencies'));
app.use('/api/clients', require('./routes/clients'));
app.use('/api/upload', require('./routes/upload'));

// Serve React app (only if build exists)
// Skip API routes - they're handled above
app.get('*', (req, res, next) => {
  // Skip if it's an API route
  if (req.path.startsWith('/api')) {
    return next();
  }
  
  // Only serve React app if build exists
  if (shouldServeFrontend) {
    res.sendFile(buildIndexPath);
  } else {
    // When frontend is separate (Docker production) or in development, return API info
    res.json({ 
      message: 'API Server is running. Frontend is served separately in production.',
      endpoints: {
        products: '/api/products',
        categories: '/api/categories',
        finalProducts: '/api/final-products',
        currencies: '/api/currencies',
        clients: '/api/clients',
        upload: '/api/upload'
      }
    });
  }
});

const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || '0.0.0.0'; // Listen on all interfaces
app.listen(PORT, HOST, () => {
  console.log(`Server running on ${HOST}:${PORT}`);
});

