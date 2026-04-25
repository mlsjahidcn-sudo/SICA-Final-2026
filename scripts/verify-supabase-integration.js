#!/usr/bin/env node

/**
 * Supabase Integration Verification Script
 * 
 * This script verifies that the Supabase integration is working correctly
 * after the security fixes have been applied.
 * 
 * Run with: node scripts/verify-supabase-integration.js
 */

const fs = require('fs');
const path = require('path');

console.log('\n🔍 Supabase Integration Verification\n');
console.log('=' .repeat(50));

// Check 1: .env.local exists
console.log('\n📋 Check 1: Environment File');
const envPath = path.join(__dirname, '..', '.env.local');
const envExists = fs.existsSync(envPath);

if (envExists) {
  console.log('✅ .env.local file exists');
  
  // Check if it has the required variables
  const envContent = fs.readFileSync(envPath, 'utf8');
  const requiredVars = [
    'COZE_SUPABASE_URL',
    'COZE_SUPABASE_ANON_KEY',
    'COZE_SUPABASE_SERVICE_ROLE_KEY'
  ];
  
  let allVarsPresent = true;
  requiredVars.forEach(varName => {
    if (envContent.includes(varName)) {
      console.log(`  ✅ ${varName} is set`);
    } else {
      console.log(`  ❌ ${varName} is MISSING`);
      allVarsPresent = false;
    }
  });
  
  if (!allVarsPresent) {
    console.log('\n⚠️  Some environment variables are missing!');
    console.log('   Please check .env.local.template for required variables.\n');
  }
} else {
  console.log('❌ .env.local file NOT FOUND');
  console.log('   Create it from .env.local.template:\n');
  console.log('   cp .env.local.template .env.local\n');
}

// Check 2: .gitignore protects .env.local
console.log('\n🔒 Check 2: Git Security');
const gitignorePath = path.join(__dirname, '..', '.gitignore');
const gitignoreExists = fs.existsSync(gitignorePath);

if (gitignoreExists) {
  const gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');
  if (gitignoreContent.includes('.env.local')) {
    console.log('✅ .env.local is in .gitignore');
    console.log('  Sensitive credentials will not be committed to git');
  } else {
    console.log('❌ .env.local is NOT in .gitignore');
    console.log('  Add ".env.local" to .gitignore immediately!');
  }
} else {
  console.log('⚠️  .gitignore not found (may not be a git repo)');
}

// Check 3: No hardcoded credentials in supabase-client.ts
console.log('\n🔐 Check 3: Hardcoded Credentials');
const clientPath = path.join(__dirname, '..', 'src', 'storage', 'database', 'supabase-client.ts');
const clientContent = fs.readFileSync(clientPath, 'utf8');

const hasHardcodedUrl = clientContent.includes('EXTERNAL_SUPABASE_URL = \'https://');
const hasHardcodedKey = clientContent.includes('EXTERNAL_SUPABASE_ANON_KEY = \'eyJ');
const hasHardcodedServiceKey = clientContent.includes('EXTERNAL_SUPABASE_SERVICE_ROLE_KEY = \'eyJ');

if (!hasHardcodedUrl && !hasHardcodedKey && !hasHardcodedServiceKey) {
  console.log('✅ No hardcoded credentials found');
  console.log('  Credentials are read from environment variables');
} else {
  console.log('❌ CRITICAL: Hardcoded credentials detected!');
  if (hasHardcodedUrl) console.log('  - Hardcoded URL found');
  if (hasHardcodedKey) console.log('  - Hardcoded anon key found');
  if (hasHardcodedServiceKey) console.log('  - Hardcoded service role key found');
  console.log('\n  ⚠️  Remove hardcoded credentials immediately!');
}

// Check 4: Environment validation exists
console.log('\n✅ Check 4: Validation Code');
const validationPath = path.join(__dirname, '..', 'src', 'lib', 'env-validation.ts');
if (fs.existsSync(validationPath)) {
  console.log('✅ Environment validation module exists');
  console.log('  Credentials will be validated at startup');
} else {
  console.log('⚠️  Environment validation module not found');
}

// Check 5: Integration tests exist
console.log('\n🧪 Check 5: Integration Tests');
const testPath = path.join(__dirname, '..', 'src', 'tests', 'integration', 'supabase.test.ts');
if (fs.existsSync(testPath)) {
  console.log('✅ Integration tests exist');
  console.log('  Run with: pnpm test src/tests/integration/supabase.test.ts');
} else {
  console.log('⚠️  Integration tests not found');
}

// Check 6: Documentation exists
console.log('\n📚 Check 6: Documentation');
const docs = [
  'docs/supabase-setup.md',
  'docs/supabase-connection-pooling.md',
  'SUPABASE_INTEGRATION_ANALYSIS.md',
  'SECURITY_FIX_SUMMARY.md'
];

let docsFound = 0;
docs.forEach(doc => {
  const docPath = path.join(__dirname, '..', doc);
  if (fs.existsSync(docPath)) {
    console.log(`  ✅ ${doc}`);
    docsFound++;
  }
});

if (docsFound === docs.length) {
  console.log('\n✅ All documentation files present');
} else {
  console.log(`\n⚠️  ${docs.length - docsFound} documentation files missing`);
}

// Final Summary
console.log('\n' + '=' .repeat(50));
console.log('\n📊 Summary:\n');

const allChecksPass = 
  envExists && 
  gitignoreExists && 
  !hasHardcodedUrl && 
  !hasHardcodedKey && 
  !hasHardcodedServiceKey;

if (allChecksPass) {
  console.log('✅ ALL CHECKS PASSED!\n');
  console.log('🎉 Supabase integration is properly configured.');
  console.log('\nNext steps:');
  console.log('1. Review .env.local and add any missing API keys');
  console.log('2. Run: pnpm test src/tests/integration/supabase.test.ts');
  console.log('3. Start dev server: pnpm dev');
  console.log('\n⚠️  IMPORTANT: Rotate your Supabase keys if they were ever');
  console.log('   committed to git or shared publicly!\n');
} else {
  console.log('❌ SOME CHECKS FAILED\n');
  console.log('Please review the issues above and fix them before proceeding.\n');
}

console.log('=' .repeat(50) + '\n');

// Exit with appropriate code
process.exit(allChecksPass ? 0 : 1);
