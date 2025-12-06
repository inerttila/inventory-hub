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
const buildPath = path.join(__dirname, '../client/build');
if (fs.existsSync(buildPath)) {
  app.use(express.static(buildPath));
}

// PostgreSQL connection and migration
sequelize.authenticate()
  .then(() => {
    console.log('PostgreSQL connected successfully');
    // Run migration to add userId columns to existing tables
    return require('./migrations/add-userId-columns').migrateUserIdColumns();
  })
  .then(() => {
    // Sync database (creates tables if they don't exist, alters if schema changed)
    return sequelize.sync({ alter: true });
  })
  .then(() => {
    console.log('Database synced successfully');
  })
  .catch(err => {
    console.error('Database connection error:', err);
  });

// Routes
app.use('/api/products', require('./routes/products'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api/final-products', require('./routes/finalProducts'));
app.use('/api/currencies', require('./routes/currencies'));
app.use('/api/clients', require('./routes/clients'));
app.use('/api/upload', require('./routes/upload'));

// Serve React app (only if build exists)
app.get('*', (req, res) => {
  // Only serve React app in production (when build exists)
  if (fs.existsSync(buildPath)) {
    res.sendFile(path.join(buildPath, 'index.html'));
  } else {
    // In development, just return API info
    res.json({ 
      message: 'API Server is running. In development, start the React app separately with "npm run client"',
      endpoints: {
        products: '/api/products',
        categories: '/api/categories',
        finalProducts: '/api/final-products'
      }
    });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

