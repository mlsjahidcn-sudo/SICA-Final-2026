/**
 * Data Export Script
 * Exports data from local PostgreSQL as SQL INSERT statements
 */

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Local database connection
const localDb = new Client({
  connectionString: process.env.PGDATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Tables to export
const TABLES = [
  'universities',
  'partners',
  'users',
  'students',
  'programs',
  'applications',
  'application_status_history',
  'application_documents',
  'application_templates',
  'meetings',
  'notifications',
  'documents',
  'favorites',
  'partner_profiles',
  'partner_notes',
  'user_settings',
  'testimonials',
  'leads',
  'lead_activities',
  'blog_posts',
  'blog_categories',
  'blog_tags',
  'blog_post_tags',
  'partner_showcases',
  'scholarships',
  'university_scholarships',
];

function escapeValue(value) {
  if (value === null || value === undefined) return 'NULL';
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  if (typeof value === 'number') return value.toString();
  if (typeof value === 'string') {
    return `'${value.replace(/'/g, "''").replace(/\\/g, '\\\\')}'`;
  }
  if (value instanceof Date) {
    return `'${value.toISOString()}'`;
  }
  if (typeof value === 'object') {
    return `'${JSON.stringify(value).replace(/'/g, "''").replace(/\\/g, '\\\\')}'::jsonb`;
  }
  return 'NULL';
}

async function exportData() {
  console.log('🚀 Starting data export...\n');
  
  const outputFile = path.join(__dirname, 'migrate-data.sql');
  const stream = fs.createWriteStream(outputFile);
  
  try {
    await localDb.connect();
    console.log('✅ Connected to local database\n');
    
    stream.write('-- Data Migration SQL\n');
    stream.write('-- Generated at: ' + new Date().toISOString() + '\n\n');
    
    for (const tableName of TABLES) {
      console.log(`📋 Exporting table: ${tableName}`);
      
      try {
        // Get row count
        const countResult = await localDb.query(`SELECT COUNT(*) FROM ${tableName}`);
        const count = parseInt(countResult.rows[0].count);
        
        if (count === 0) {
          console.log(`   ⏭️  No data, skipping\n`);
          continue;
        }
        
        console.log(`   📊 Rows: ${count}`);
        
        // Get all data
        const dataResult = await localDb.query(`SELECT * FROM ${tableName}`);
        const rows = dataResult.rows;
        
        if (rows.length === 0) continue;
        
        // Get column names
        const columns = Object.keys(rows[0]);
        const columnList = columns.join(', ');
        
        stream.write(`\n-- Table: ${tableName} (${rows.length} rows)\n`);
        stream.write(`DELETE FROM ${tableName};\n`);
        
        // Generate INSERT statements
        for (const row of rows) {
          const values = columns.map(col => escapeValue(row[col]));
          stream.write(`INSERT INTO ${tableName} (${columnList}) VALUES (${values.join(', ')}) ON CONFLICT (id) DO NOTHING;\n`);
        }
        
        console.log(`   ✅ Exported ${rows.length} rows\n`);
        
      } catch (error) {
        console.log(`   ❌ Error: ${error.message}\n`);
      }
    }
    
    stream.end();
    console.log(`\n✅ Export completed! Output: ${outputFile}`);
    
  } catch (error) {
    console.error('❌ Export failed:', error.message);
    throw error;
  } finally {
    await localDb.end();
  }
}

// Run export
exportData().catch(console.error);
