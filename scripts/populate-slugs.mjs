import { createClient } from '@supabase/supabase-js';

// Simple slug generator
function generateSlug(name: string, degreeLevel?: string): string {
  let base = name;
  if (degreeLevel) {
    base = `${base} ${degreeLevel}`;
  }
  
  return base
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 100);
}

async function populateSlugs() {
  // Create Supabase client directly with service key
  const supabaseUrl = process.env.COWE_SUPABASE_URL || 'https://maqzxlcsgfpwnfyleoga.supabase.co';
  const supabaseServiceKey = process.env.COWE_SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1hcXp4bGNzZ2Zwd25meWxlb2dhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTU3NzgxMywiZXhwIjoyMDkxMTUzODEzfQ.RG4cM2EoccJXqsSggkQ2cA8aYcDQiToSRmKxKjkZppY';
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  console.log('Fetching all programs without slugs...');
  
  // Get all programs (no is('slug', null) filter since column might not be visible yet)
  const { data: programs, error } = await supabase
    .from('programs')
    .select('id, name, degree_level, university_id')
    .limit(1000); // Process in batches if needed

  if (error) {
    console.error('Error fetching programs:', error);
    return;
  }

  console.log(`Found ${programs.length} programs to update!`);

  let updatedCount = 0;
  let skippedCount = 0;
  let errorCount = 0;

  for (const program of programs) {
    const newSlug = generateSlug(program.name, program.degree_level);

    // Try to update directly - we'll ignore errors for now
    try {
      const { error: updateError } = await supabase
        .from('programs')
        .update({ slug: newSlug })
        .eq('id', program.id);

      if (updateError) {
        // If the error is "column programs.slug does not exist" that means we just need to wait or try again
        if (updateError.message?.includes('column programs.slug does not exist')) {
          console.log('Slug column not yet visible to PostgREST - retrying later');
          skippedCount++;
          break;
        }
        console.warn(`Error updating ${program.id}:`, updateError.message);
        errorCount++;
      } else {
        console.log(`Updated ${program.id}: "${program.name}" -> "${newSlug}"`);
        updatedCount++;
      }
    } catch (e) {
      console.error(`Exception updating ${program.id}:`, e);
      errorCount++;
    }
  }

  console.log('Done!');
  console.log('  Updated:', updatedCount);
  console.log('  Skipped:', skippedCount);
  console.log('  Errors:', errorCount);
}

populateSlugs().catch(console.error);
