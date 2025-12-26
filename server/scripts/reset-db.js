// Script to reset the database
// WARNING: This will delete all data!
// Usage: node server/scripts/reset-db.js

const { sequelize } = require('../models');
const { QueryTypes } = require('sequelize');

async function resetDatabase() {
  try {
    console.log('⚠️  WARNING: This will drop all tables and recreate them!');
    console.log('Connecting to database...');
    
    await sequelize.authenticate();
    console.log('Connected to database successfully');

    // Drop all tables in correct order (respecting foreign key constraints)
    console.log('\nDropping all tables...');
    
    const dropOrder = [
      'components',
      'final_products',
      'products',
      'categories',
      'clients',
      'currencies'
    ];

    // First, drop all foreign key constraints by dropping tables
    // We'll use CASCADE to drop dependent objects
    for (const table of dropOrder) {
      try {
        await sequelize.query(`DROP TABLE IF EXISTS "${table}" CASCADE`, {
          type: QueryTypes.RAW
        });
        console.log(`✓ Dropped table: ${table}`);
      } catch (err) {
        console.log(`⚠ Could not drop table ${table}: ${err.message}`);
      }
    }

    // Drop any remaining tables
    const allTables = await sequelize.query(
      `SELECT tablename FROM pg_tables WHERE schemaname = 'public'`,
      { type: QueryTypes.SELECT }
    );

    for (const table of allTables) {
      if (table.tablename !== 'spatial_ref_sys') { // Skip PostGIS system table
        try {
          await sequelize.query(`DROP TABLE IF EXISTS "${table.tablename}" CASCADE`, {
            type: QueryTypes.RAW
          });
          console.log(`✓ Dropped table: ${table.tablename}`);
        } catch (err) {
          console.log(`⚠ Could not drop table ${table.tablename}: ${err.message}`);
        }
      }
    }

    console.log('\nAll tables dropped. Syncing database schema...');
    
    // Sync will create all tables with correct schema
    await sequelize.sync({ force: true });
    
    console.log('✓ Database schema synced successfully!');
    console.log('\n✅ Database reset complete!');
    console.log('All tables have been recreated with the correct schema.');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error resetting database:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  resetDatabase();
}

module.exports = { resetDatabase };

