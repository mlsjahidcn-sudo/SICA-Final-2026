// Simple slug generator
function generateSlug(name: string, degreeLevel?: string): string {
  let base = name;
  if (degreeLevel) {
    base = `${base} ${degreeLevel}`;
  }
  
  return base
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric with hyphens
    .replace(/^-+|-+$/g, '') // Trim leading/trailing hyphens
    .slice(0, 100); // Keep under 100 chars
}

// For testing, just output the first few program IDs + names to see
console.log('Slug generator test:');
console.log('Example 1:', generateSlug('Aerospace Engineering', 'Bachelor'));
console.log('Example 2:', generateSlug('Agricultural Resource and Environment', 'Master'));
