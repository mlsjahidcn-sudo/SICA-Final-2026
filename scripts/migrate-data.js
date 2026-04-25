/**
 * Data Migration Script using Direct SQL
 * Migrates data from local PostgreSQL to external Supabase using SQL
 */

const { Client } = require('pg');

// Local database connection
const localDb = new Client({
  connectionString: process.env.PGDATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// External Supabase connection (using transaction pooler for direct access)
const externalDb = new Client({
  host: 'aws-0-ap-southeast-1.pooler.supabase.com',
  port: 6543,
  database: 'postgres',
  user: 'postgres.maqzxlcsgfpwnfyleoga',
  password: 'CozeCoding2024!',
  ssl: { rejectUnauthorized: false }
});

// Tables to migrate in order (respecting foreign key constraints)
const TABLES = [
  // Independent tables first
  'universities',
  'blog_categories',
  'blog_tags',
  'partner_showcases',
  
  // Partners before users
  'partners',
  
  // Users (skip auth.users - already handled separately)
  'users',
  
  // Dependent tables
  'students',
  'programs',
  'scholarships',
  'university_scholarships',
  
  // Application related
  'applications',
  'application_status_history',
  'application_documents',
  'application_templates',
  
  // Blog related
  'blog_posts',
  'blog_post_tags',
  
  // Other tables
  'meetings',
  'notifications',
  'documents',
  'favorites',
  'partner_profiles',
  'partner_notes',
  'user_settings',
  'user_favorites',
  'testimonials',
  'leads',
  'lead_activities',
  'email_logs',
  'payments',
  'messages',
  'chatbot_conversations',
  'comparisons',
  'program_comparisons',
  'program_favorites',
  'program_reviews',
  'program_stats',
  'program_translations',
  'reviews',
  
  // Assessment tables
  'assessment_applications',
  'assessment_documents',
  'assessment_reports',
  'assessment_status_history',
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
    return `'${JSON.stringify(value).replace(/'/g, "''").replace(/\\/g, '\\\\')}'`;
  }
  return 'NULL';
}

async function migrate() {
  console.log('🚀 Starting data migration...\n');
  
  try {
    // Connect to both databases
    await localDb.connect();
    console.log('✅ Connected to local database');
    
    await externalDb.connect();
    console.log('✅ Connected to external Supabase\n');
    
    // Migrate each table
    for (const table of TABLES) {
      await migrateTable(table);
    }
    
    console.log('\n✅ Migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    throw error;
  } finally {
    await localDb.end();
    await externalDb.end();
  }
}

async function migrateTable(tableName) {
  console.log(`\n📋 Migrating table: ${tableName}`);
  
  try {
    // Get row count from local
    const countResult = await localDb.query(`SELECT COUNT(*) FROM ${tableName}`);
    const localCount = parseInt(countResult.rows[0].count);
    
    if (localCount === 0) {
      console.log(`   ⏭️  No data in local table, skipping`);
      return;
    }
    
    console.log(`   📊 Local rows: ${localCount}`);
    
    // Get all data from local
    const dataResult = await localDb.query(`SELECT * FROM ${tableName}`);
    const rows = dataResult.rows;
    
    if (rows.length === 0) {
      console.log(`   ⏭️  No rows to migrate`);
      return;
    }
    
    // Get column info from external table
    const colResult = await externalDb.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = $1
      ORDER BY ordinal_position
    `, [tableName]);
    
    const externalColumns = new Set(colResult.rows.map(r => r.column_name));
    
    // Filter rows to only include columns that exist in external table
    const localColumns = Object.keys(rows[0]);
    const commonColumns = localColumns.filter(col => externalColumns.has(col));
    
    console.log(`   📊 Local columns: ${localColumns.length}, External columns: ${externalColumns.size}, Common: ${commonColumns.length}`);
    
    // Check for missing columns
    const missingColumns = localColumns.filter(col => !externalColumns.has(col));
    if (missingColumns.length > 0) {
      console.log(`   ⚠️  Missing columns in external: ${missingColumns.join(', ')}`);
    }
    
    // Get count from external before
    const extCountResult = await externalDb.query(`SELECT COUNT(*) FROM ${tableName}`);
    console.log(`   📊 External rows (before): ${extCountResult.rows[0].count}`);
    
    // Insert data in batches using raw SQL
    const batchSize = 50;
    let inserted = 0;
    let duplicates = 0;
    let errors = 0;
    
    for (let i = 0; i < rows.length; i += batchSize) {
      const batch = rows.slice(i, i + batchSize);
      
      for (const row of batch) {
        // Only use columns that exist in both tables
        const values = commonColumns.map(col => escapeValue(row[col]));
        const columnList = commonColumns.join(', ');
        
        const insertQuery = `
          INSERT INTO ${tableName} (${columnList})
          VALUES (${values.join(', ')})
          ON CONFLICT (id) DO NOTHING
        `;
        
        try {
          const result = await externalDb.query(insertQuery);
          if (result.rowCount > 0) {
            inserted++;
          } else {
            duplicates++;
          }
        } catch (insertError) {
          if (insertError.message.includes('duplicate key')) {
            duplicates++;
          } else if (!insertError.message.includes('violates foreign key')) {
            console.log(`   ⚠️  Error: ${insertError.message.substring(0, 150)}`);
            errors++;
          } else {
            errors++;
          }
        }
      }
      
      const progress = Math.min(i + batchSize, rows.length);
      if (progress % 200 === 0 || progress === rows.length) {
        console.log(`   📝 Processed ${progress}/${rows.length} (inserted: ${inserted}, duplicates: ${duplicates}, errors: ${errors})`);
      }
    }
    
    console.log(`   ✅ Completed: ${inserted} inserted, ${duplicates} duplicates, ${errors} errors`);
    
    // Get count from external after
    const extCountAfterResult = await externalDb.query(`SELECT COUNT(*) FROM ${tableName}`);
    console.log(`   📊 External rows (after): ${extCountAfterResult.rows[0].count}`);
    
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
  }
}

// Run migration
migrate().catch(console.error);
