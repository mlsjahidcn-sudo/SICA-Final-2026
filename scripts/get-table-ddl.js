/**
 * Get table DDL from local database
 */

const { Client } = require('pg');

const localDb = new Client({
  connectionString: process.env.PGDATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function getTableDDL() {
  await localDb.connect();
  console.log('✅ Connected to local database\n');

  // Tables to get DDL for
  const tables = [
    'applications',
    'application_status_history',
    'application_documents',
    'application_templates',
    'assessment_applications',
    'assessment_documents',
    'assessment_reports',
    'assessment_status_history',
  ];

  for (const tableName of tables) {
    console.log(`\n-- ========================================`);
    console.log(`-- Table: ${tableName}`);
    console.log(`-- ========================================\n`);

    // Get column info
    const colQuery = `
      SELECT 
        column_name,
        data_type,
        character_maximum_length,
        numeric_precision,
        numeric_scale,
        is_nullable,
        column_default
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = $1
      ORDER BY ordinal_position
    `;
    const colResult = await localDb.query(colQuery, [tableName]);
    
    if (colResult.rows.length === 0) {
      console.log(`-- Table ${tableName} does not exist in local database`);
      continue;
    }

    // Get constraint info
    const constraintQuery = `
      SELECT 
        tc.constraint_name,
        tc.constraint_type,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
      FROM information_schema.table_constraints tc
      LEFT JOIN information_schema.key_column_usage kcu 
        ON tc.constraint_name = kcu.constraint_name
      LEFT JOIN information_schema.constraint_column_usage ccu 
        ON ccu.constraint_name = tc.constraint_name
      WHERE tc.table_schema = 'public' AND tc.table_name = $1
    `;
    const constraintResult = await localDb.query(constraintQuery, [tableName]);

    // Get index info
    const indexQuery = `
      SELECT 
        indexname,
        indexdef
      FROM pg_indexes
      WHERE schemaname = 'public' AND tablename = $1
    `;
    const indexResult = await localDb.query(indexQuery, [tableName]);

    // Get row count
    const countResult = await localDb.query(`SELECT COUNT(*) FROM ${tableName}`);
    const rowCount = countResult.rows[0].count;

    console.log(`-- Row count: ${rowCount}`);
    console.log(`-- Columns: ${colResult.rows.length}`);
    
    console.log('\n-- Columns:');
    for (const col of colResult.rows) {
      let type = col.data_type;
      if (col.character_maximum_length) {
        type += `(${col.character_maximum_length})`;
      } else if (col.numeric_precision && col.numeric_scale) {
        type += `(${col.numeric_precision},${col.numeric_scale})`;
      }
      console.log(`--   ${col.column_name}: ${type} ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'} ${col.column_default ? `DEFAULT ${col.column_default}` : ''}`);
    }

    if (constraintResult.rows.length > 0) {
      console.log('\n-- Constraints:');
      for (const c of constraintResult.rows) {
        if (c.constraint_type === 'PRIMARY KEY') {
          console.log(`--   PRIMARY KEY (${c.column_name})`);
        } else if (c.constraint_type === 'FOREIGN KEY') {
          console.log(`--   FOREIGN KEY (${c.column_name}) REFERENCES ${c.foreign_table_name}(${c.foreign_column_name})`);
        } else if (c.constraint_type === 'UNIQUE') {
          console.log(`--   UNIQUE (${c.column_name})`);
        }
      }
    }

    if (indexResult.rows.length > 0) {
      console.log('\n-- Indexes:');
      for (const idx of indexResult.rows) {
        console.log(`--   ${idx.indexname}`);
      }
    }
  }

  await localDb.end();
}

getTableDDL().catch(console.error);
