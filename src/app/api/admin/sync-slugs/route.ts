import { NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

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

export async function POST() {
  const supabase = getSupabaseClient();
  
  // Get all programs
  const { data: programs, error: fetchError } = await supabase
    .from('programs')
    .select('id, name, degree_level, slug, university_id')
    .is('slug', null) // Only update programs without a slug yet
    .limit(1000);
  
  if (fetchError) {
    console.error('Error fetching programs:', fetchError);
    return NextResponse.json({ 
      error: fetchError.message 
    }, { 
      status: 500 
    });
  }

  if (!programs || programs.length === 0) {
    return NextResponse.json({ 
      message: 'No programs without slugs found', 
      updated: 0 
    });
  }

  let updatedCount = 0;
  const errors: Array<{ id: string; error: string }> = [];

  for (const program of programs) {
    const newSlug = generateSlug(program.name, program.degree_level);

    // Now check uniqueness at this university
    const { data: existing } = await supabase
      .from('programs')
      .select('id, slug')
      .eq('slug', newSlug)
      .eq('university_id', program.university_id)
      .not('id', 'eq', program.id)
      .single();

    let finalSlug = newSlug;
    let counter = 1;

    // If there is a conflict, add a counter to make it unique
    while (existing) {
      finalSlug = `${newSlug}-${counter}`;
      const { data: checkAgain } = await supabase
        .from('programs')
        .select('id')
        .eq('slug', finalSlug)
        .eq('university_id', program.university_id)
        .single();
      
      if (!checkAgain) break;
      counter++;
    }

    // Now update!
    const { error: updateError } = await supabase
      .from('programs')
      .update({ slug: finalSlug })
      .eq('id', program.id);

    if (updateError) {
      errors.push({ id: program.id, error: updateError.message });
      console.error(`Failed to update ${program.id}:`, updateError.message);
    } else {
      updatedCount++;
    }
  }

  return NextResponse.json({
    message: 'Slug population complete',
    updated: updatedCount,
    total: programs.length,
    errors
  });
}
