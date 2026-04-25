import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const { Pool } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env.local') });

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('❌ DATABASE_URL not found in environment');
  process.exit(1);
}

const pool = new Pool({
  connectionString: databaseUrl,
  ssl: {
    rejectUnauthorized: false
  }
});

async function runMigration() {
  const client = await pool.connect();
  try {
    const sqlPath = path.join(__dirname, '../migrations/022_internal_applications.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    console.log('🚀 Executing migration: 022_internal_applications\n');
    
    await client.query('BEGIN');
    
    // Execute the entire SQL file
    await client.query(sql);
    
    await client.query('COMMIT');
    
    console.log('✅ Migration executed successfully!\n');
    
    // Verify table creation
    const result = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'internal_applications' 
      ORDER BY ordinal_position
    `);
    
    console.log('📊 Table structure:');
    console.log('─'.repeat(50));
    result.rows.forEach(row => {
      console.log(`  ${row.column_name}: ${row.data_type}`);
    });
    console.log('─'.repeat(50));
    console.log(`\n✅ Total columns: ${result.rows.length}`);
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Migration failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration();
