# Inventory App - Product Management & Price Estimation

A full-stack inventory management application that allows you to manage products, categories, and create final products with automatic price calculation based on components.

## Features

- **Product Management**: Create, edit, and delete products with details like name, product code, barcode, price, category, stock quantity, supplier, and description
- **Category Management**: Create and manage custom categories for organizing products
- **Final Products**: Create final products composed of multiple components, with automatic total price calculation
- **Price Estimation**: Automatically calculates the total cost of final products based on component prices and quantities
- **Profit Margin**: Add profit margin percentage to calculate final selling price
- **Modern UI**: Clean, responsive design with an intuitive user interface

## Tech Stack

- **Backend**: Node.js, Express.js, PostgreSQL (Sequelize)
- **Frontend**: React.js
- **Database**: PostgreSQL

## Prerequisites

- Node.js (v14 or higher)
- PostgreSQL (local installation or cloud database)
- npm or yarn

## Installation

1. **Clone or navigate to the project directory**

2. **Install backend dependencies:**
   ```bash
   npm install
   ```

3. **Install frontend dependencies:**
   ```bash
   cd client
   npm install
   cd ..
   ```

4. **Set up PostgreSQL database:**
   - Create a PostgreSQL database named `inventory_app` (or your preferred name)
   - You can use the following SQL command:
     ```sql
     CREATE DATABASE inventory_app;
     ```

5. **Set up environment variables:**
   - Copy `.env.example` to `.env`:
     ```bash
     cp .env.example .env
     ```
   - Edit `.env` and update with your PostgreSQL credentials:
     ```
     DB_HOST=localhost
     DB_PORT=5432
     DB_NAME=inventory_app
     DB_USER=postgres
     DB_PASSWORD=your_password
     PORT=5000
     ```
   - For cloud PostgreSQL (like Heroku, AWS RDS, etc.), update the connection details accordingly

## Running the Application

### Development Mode

1. **Start PostgreSQL** (if using local PostgreSQL):
   - Make sure PostgreSQL is running on your system
   - The database will be automatically created/synced when you start the server

2. **Start the backend server:**
   ```bash
   npm run dev
   ```
   The server will run on `http://localhost:5000`

3. **Start the frontend (in a new terminal):**
   ```bash
   npm run client
   ```
   The React app will open in your browser at `http://localhost:3000`

### Production Mode

1. **Build the React app:**
   ```bash
   npm run build
   ```

2. **Start the server:**
   ```bash
   npm start
   ```

   The app will be served from the Express server on `http://localhost:5000`

## Usage

1. **Create Categories**: 
   - Navigate to the "Categories" page
   - Click "+ Add Category" to create product categories

2. **Add Products**:
   - Go to the "Products" page
   - Click "+ Add Product"
   - Fill in product details (name, code, price, category, etc.)
   - Save the product

3. **Create Final Products**:
   - Navigate to "Final Products"
   - Click "+ Add Final Product"
   - Enter product details
   - Add components by selecting products and specifying quantities
   - The total price is automatically calculated
   - Optionally add a profit margin to calculate the selling price
   - Save the final product

## API Endpoints

### Products
- `GET /api/products` - Get all products
- `GET /api/products/:id` - Get single product
- `POST /api/products` - Create product
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product

### Categories
- `GET /api/categories` - Get all categories
- `GET /api/categories/:id` - Get single category
- `POST /api/categories` - Create category
- `PUT /api/categories/:id` - Update category
- `DELETE /api/categories/:id` - Delete category

### Final Products
- `GET /api/final-products` - Get all final products
- `GET /api/final-products/:id` - Get single final product
- `POST /api/final-products` - Create final product
- `PUT /api/final-products/:id` - Update final product
- `DELETE /api/final-products/:id` - Delete final product

## Project Structure

```
inventory_app/
├── server/
│   ├── models/
│   │   ├── Product.js
│   │   ├── Category.js
│   │   └── FinalProduct.js
│   ├── routes/
│   │   ├── products.js
│   │   ├── categories.js
│   │   └── finalProducts.js
│   └── index.js
├── client/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Products.js
│   │   │   ├── Categories.js
│   │   │   └── FinalProducts.js
│   │   ├── App.js
│   │   └── index.js
│   └── package.json
├── package.json
└── README.md
```

## Notes

- Make sure PostgreSQL is running before starting the server
- The database tables will be automatically created on first run
- Product codes and barcodes must be unique
- Category names must be unique
- Final products automatically calculate total price from components
- Profit margin is optional and calculates the final selling price

## Database Schema

The application uses the following PostgreSQL tables:
- `categories` - Product categories
- `products` - Individual products/components
- `final_products` - Final products composed of components
- `components` - Junction table linking final products to their component products

## License

ISC

