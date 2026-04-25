/**
 * Import SQL to External Supabase
 * Executes the generated SQL file on external Supabase
 */

const fs = require('fs');
const path = require('path');

const sqlFile = path.join(__dirname, 'migrate-data.sql');
const sqlContent = fs.readFileSync(sqlFile, 'utf8');

// Split into individual statements
const statements = sqlContent
  .split('\n')
  .filter(line => line.trim().startsWith('INSERT') || line.trim().startsWith('DELETE'))
  .map(line => line.trim());

console.log(`Total statements: ${statements.length}`);

// Group statements by table
const tableStatements = {};
let currentTable = '';

for (const stmt of statements) {
  if (stmt.startsWith('DELETE')) {
    const match = stmt.match(/DELETE FROM (\w+)/);
    if (match) {
      currentTable = match[1];
      tableStatements[currentTable] = tableStatements[currentTable] || [];
      tableStatements[currentTable].push(stmt);
    }
  } else if (stmt.startsWith('INSERT') && currentTable) {
    tableStatements[currentTable].push(stmt);
  }
}

// Output JSON for easier processing
console.log('\nTable statistics:');
for (const [table, stmts] of Object.entries(tableStatements)) {
  console.log(`${table}: ${stmts.length} statements`);
}

// Save to JSON for API execution
fs.writeFileSync(
  path.join(__dirname, 'migration-statements.json'),
  JSON.stringify(tableStatements, null, 2)
);

console.log('\n✅ Saved to migration-statements.json');
