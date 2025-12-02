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

// Only serve static files if build directory exists (production)
const buildPath = path.join(__dirname, '../client/build');
if (fs.existsSync(buildPath)) {
  app.use(express.static(buildPath));
}

// PostgreSQL connection
sequelize.authenticate()
  .then(() => {
    console.log('PostgreSQL connected successfully');
    // Sync database (creates tables if they don't exist)
    return sequelize.sync({ alter: false });
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

