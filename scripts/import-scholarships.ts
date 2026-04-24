import fs from 'fs';
import path from 'path';
import csv from 'csv-parser';
import { getSupabaseClient } from '../src/storage/database/supabase-client';

// Function to parse JSON strings from CSV (handle escaped quotes)
function parseJsonField(value: string): unknown {
  if (!value || value === '[]' || value === '{}') {
    return [];
  }
  try {
    // Fix escaped quotes: "" → "
    const cleaned = value.replace(/""/g, '"');
    return JSON.parse(cleaned);
  } catch (e) {
    console.warn(`Failed to parse JSON: ${value}`, e);
    return [];
  }
}

// Function to parse boolean fields
function parseBooleanField(value: string): boolean {
  if (typeof value === 'boolean') return value;
  return value === 'true' || value === '1';
}

// Function to parse number fields
function parseNumberField(value: string): number | null {
  if (!value || value === '') return null;
  const num = parseFloat(value);
  return isNaN(num) ? null : num;
}

async function importScholarships() {
  const csvFilePath = path.join(process.cwd(), 'scholarships.csv');
  
  if (!fs.existsSync(csvFilePath)) {
    console.error('CSV file not found:', csvFilePath);
    process.exit(1);
  }

  const supabase = getSupabaseClient();
interface CsvRow {
  id: string;
  name: string;
  name_chinese: string;
  type: string;
  amount_min: string;
  amount_max: string;
  currency: string;
  [key: string]: string;
}

  const results: CsvRow[] = [];

  console.log('Reading CSV file...');
  
  // Read CSV
  await new Promise<void>((resolve, reject) => {
    fs.createReadStream(csvFilePath)
      .pipe(csv({ separator: ';' }))
      .on('data', (data) => results.push(data))
      .on('end', resolve)
      .on('error', reject);
  });

  console.log(`Found ${results.length} scholarships in CSV`);

  // Process each scholarship
  let successCount = 0;
  let errorCount = 0;

  for (const row of results) {
    try {
      // Map CSV fields to database fields
      const scholarshipData = {
        id: row.id,
        name: row.name,
        name_chinese: row.name_chinese,
        type: row.type,
        amount_min: parseNumberField(row.amount_min),
        amount_max: parseNumberField(row.amount_max),
        currency: row.currency || 'CNY',
        description: row.description,
        eligibility: row.eligibility,
        deadline: row.deadline,
        coverage: row.coverage,
        duration_years: parseNumberField(row.duration_years),
        university_id: row.university_id || null,
        program_ids: parseJsonField(row.program_ids),
        created_at: row.created_at,
        updated_at: row.updated_at,
        required_documents: parseJsonField(row.required_documents),
        notes: row.notes,
        is_generic: parseBooleanField(row.is_generic),
        category: row.category,
        application_process: row.application_process,
        application_url: row.application_url,
        slug: row.slug,
        degree_levels: parseJsonField(row.degree_levels),
      };

      // Check if scholarship already exists
      const { data: existing } = await supabase
        .from('scholarships')
        .select('id')
        .eq('id', scholarshipData.id)
        .single();

      if (existing) {
        // Update existing scholarship
        const { error } = await supabase
          .from('scholarships')
          .update(scholarshipData)
          .eq('id', scholarshipData.id);
        
        if (error) {
          console.error(`Error updating scholarship ${scholarshipData.id}:`, error);
          errorCount++;
        } else {
          console.log(`Updated scholarship: ${scholarshipData.name}`);
          successCount++;
        }
      } else {
        // Insert new scholarship
        const { error } = await supabase
          .from('scholarships')
          .insert(scholarshipData);
        
        if (error) {
          console.error(`Error inserting scholarship ${scholarshipData.id}:`, error);
          errorCount++;
        } else {
          console.log(`Inserted scholarship: ${scholarshipData.name}`);
          successCount++;
        }
      }
    } catch (error) {
      console.error(`Error processing scholarship ${row.id}:`, error);
      errorCount++;
    }
  }

  console.log('\nImport complete!');
  console.log(`Success: ${successCount}`);
  console.log(`Errors: ${errorCount}`);
}

importScholarships().catch((error) => {
  console.error('Import failed:', error);
  process.exit(1);
});
