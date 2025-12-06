// Migration script to add userId columns to existing tables
// This handles existing data by setting a default userId or making it nullable temporarily

const { sequelize } = require('../models');
const { QueryTypes } = require('sequelize');

async function migrateUserIdColumns() {
  const transaction = await sequelize.transaction();
  
  try {
    console.log('Starting userId migration...');
    
    // List of tables that need userId column
    const tables = [
      'products',
      'categories', 
      'final_products',
      'clients',
      'currencies',
      'components'
    ];
    
    for (const table of tables) {
      try {
        // Check if table exists
        const tableExists = await sequelize.query(
          `SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_name = '${table}'
          )`,
          { type: QueryTypes.SELECT, transaction }
        );
        
        if (!tableExists || !tableExists[0] || !tableExists[0].exists) {
          console.log(`Table ${table} does not exist yet, will be created by sync. Skipping...`);
          continue;
        }
        
        // Check if userId column already exists and its properties
        const columnInfo = await sequelize.query(
          `SELECT column_name, is_nullable 
           FROM information_schema.columns 
           WHERE table_name = '${table}' AND column_name = 'userId'`,
          { type: QueryTypes.SELECT, transaction }
        );
        
        if (columnInfo && columnInfo.length > 0) {
          const isNullable = columnInfo[0].is_nullable === 'YES';
          if (!isNullable) {
            console.log(`Column userId already exists and is NOT NULL in ${table}, skipping...`);
            continue;
          } else {
            console.log(`Column userId exists but is nullable in ${table}, updating to NOT NULL...`);
            // Update existing null values
            await sequelize.query(
              `UPDATE "${table}" SET "userId" = 'migrated-legacy-data' WHERE "userId" IS NULL`,
              { transaction }
            );
            // Make it NOT NULL
            await sequelize.query(
              `ALTER TABLE "${table}" ALTER COLUMN "userId" SET NOT NULL`,
              { transaction }
            );
            console.log(`Successfully updated userId column in ${table} to NOT NULL`);
            continue;
          }
        }
        
        // Check if table has any rows
        const rowCountResult = await sequelize.query(
          `SELECT COUNT(*) as count FROM "${table}"`,
          { type: QueryTypes.SELECT, transaction }
        );
        
        const hasRows = rowCountResult && rowCountResult.length > 0 && parseInt(rowCountResult[0].count) > 0;
      
      if (hasRows) {
        const count = parseInt(rowCountResult[0].count);
        console.log(`Table ${table} has ${count} existing rows.`);
        console.log(`Adding userId column as nullable first...`);
        
        // Add column as nullable first
        await sequelize.query(
          `ALTER TABLE "${table}" ADD COLUMN "userId" VARCHAR(255)`,
          { transaction }
        );
        
        // Set a temporary default userId for existing records
        // In production, you'd want to assign these to actual users
        // For now, we'll use a placeholder that will be filtered out
        await sequelize.query(
          `UPDATE "${table}" SET "userId" = 'migrated-legacy-data' WHERE "userId" IS NULL`,
          { transaction }
        );
        
        // Now make it NOT NULL
        await sequelize.query(
          `ALTER TABLE "${table}" ALTER COLUMN "userId" SET NOT NULL`,
          { transaction }
        );
        
        console.log(`Successfully added userId column to ${table}`);
      } else {
        // Table is empty, can add NOT NULL directly
        console.log(`Table ${table} is empty, adding userId column with NOT NULL...`);
        await sequelize.query(
          `ALTER TABLE "${table}" ADD COLUMN "userId" VARCHAR(255) NOT NULL`,
          { transaction }
        );
        console.log(`Successfully added userId column to ${table}`);
      }
      } catch (tableError) {
        console.error(`Error processing table ${table}:`, tableError.message);
        // Continue with other tables
        continue;
      }
    }
    
    await transaction.commit();
    console.log('Migration completed successfully!');
    console.log('NOTE: Existing records have been assigned userId = "migrated-legacy-data"');
    console.log('You may want to delete these records or assign them to actual users.');
    
  } catch (error) {
    await transaction.rollback();
    console.error('Migration failed:', error);
    throw error;
  }
}

// Run migration if called directly
if (require.main === module) {
  migrateUserIdColumns()
    .then(() => {
      console.log('Migration script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration script failed:', error);
      process.exit(1);
    });
}

module.exports = { migrateUserIdColumns };

