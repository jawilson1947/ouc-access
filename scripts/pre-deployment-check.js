#!/usr/bin/env node

/**
 * Pre-Deployment Check Script
 * 
 * This script validates critical functionality before deployment to prevent regressions.
 * Run this before any deployment or code changes to critical sections.
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Running Pre-Deployment Checks for OUC Access Request Application...\n');

let hasErrors = false;

// Check 1: Validate wildcard search query building logic
function checkWildcardSearchLogic() {
  console.log('1. 🧪 Checking wildcard search logic...');
  
  const searchRouteFile = 'src/app/api/church-members/search/route.ts';
  
  if (!fs.existsSync(searchRouteFile)) {
    console.log('   ❌ Search route file not found');
    hasErrors = true;
    return;
  }
  
  const content = fs.readFileSync(searchRouteFile, 'utf8');
  
  // Critical patterns that should exist
  const requiredPatterns = [
    'if (isWildcardSearch)',
    'WILDCARD SEARCH: Return ALL records without any constraints',
    'else if (isInitialSearch)',
    'else {',
    '// NORMAL SEARCH: Apply all relevant search criteria'
  ];
  
  const missingPatterns = requiredPatterns.filter(pattern => !content.includes(pattern));
  
  if (missingPatterns.length > 0) {
    console.log('   ❌ Missing required patterns in wildcard search logic:');
    missingPatterns.forEach(pattern => console.log(`      - "${pattern}"`));
    hasErrors = true;
  } else {
    console.log('   ✅ Wildcard search logic structure is correct');
  }
  
  // Anti-patterns that should NOT exist
  const forbiddenPatterns = [
    'if (searchCriteria.email) {' // This should only be inside the else blocks
  ];
  
  // Check if email constraint is in the wildcard block (not in else if or else blocks)
  const lines = content.split('\n');
  let inWildcardBlock = false;
  let foundWildcardStart = false;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Start tracking when we enter the wildcard conditional block
    if (line.includes('if (isWildcardSearch) {')) {
      inWildcardBlock = true;
      foundWildcardStart = true;
      continue;
    }
    
    // Stop tracking when we hit else if or else
    if (foundWildcardStart && (line.includes('} else if (isInitialSearch)') || line.includes('} else {'))) {
      inWildcardBlock = false;
    }
    
    // Check for forbidden patterns only within the wildcard block
    if (inWildcardBlock && line.includes('query += \' AND email = ?\'')) {
      console.log('   ❌ Found email constraint in wildcard search block');
      console.log(`      Line ${i + 1}: ${line}`);
      hasErrors = true;
    }
  }
  
  if (!hasErrors) {
    console.log('   ✅ No forbidden patterns found in wildcard search logic');
  }
}

// Check 2: Validate admin detection logic
function checkAdminDetectionLogic() {
  console.log('\n2. 🧪 Checking admin detection logic...');
  
  const formFile = 'src/components/AccessRequestForm.tsx';
  
  if (!fs.existsSync(formFile)) {
    console.log('   ❌ AccessRequestForm file not found');
    hasErrors = true;
    return;
  }
  
  const content = fs.readFileSync(formFile, 'utf8');
  
  // Check for correct admin detection patterns
  const requiredPatterns = [
    'formData.email',
    'localStorage.getItem(\'nonGmailEmail\')',
    'process.env.NEXT_PUBLIC_ADMIN_EMAIL'
  ];
  
  const hasAllPatterns = requiredPatterns.every(pattern => content.includes(pattern));
  
  if (!hasAllPatterns) {
    console.log('   ❌ Missing required admin detection patterns');
    hasErrors = true;
  } else {
    console.log('   ✅ Admin detection patterns are present');
  }
  
  // Check for forbidden patterns
  const forbiddenPatterns = [
    'session?.user?.email',
    'session?.user?.isAdmin'
  ];
  
  const hasForbiddenPatterns = forbiddenPatterns.some(pattern => content.includes(pattern));
  
  if (hasForbiddenPatterns) {
    console.log('   ❌ Found forbidden session-based admin detection patterns');
    forbiddenPatterns.forEach(pattern => {
      if (content.includes(pattern)) {
        console.log(`      - Found: ${pattern}`);
      }
    });
    hasErrors = true;
  } else {
    console.log('   ✅ No forbidden session-based patterns found');
  }
}

// Check 3: Validate environment variables
function checkEnvironmentVariables() {
  console.log('\n3. 🧪 Checking environment variables...');
  
  const envFile = '.env.local';
  
  if (!fs.existsSync(envFile)) {
    console.log('   ❌ .env.local file not found');
    hasErrors = true;
    return;
  }
  
  const content = fs.readFileSync(envFile, 'utf8');
  
  const requiredEnvVars = [
    'ADMIN_EMAIL=jawilson1947@gmail.com',
    'NEXT_PUBLIC_ADMIN_EMAIL=jawilson1947@gmail.com'
  ];
  
  const missingVars = requiredEnvVars.filter(envVar => !content.includes(envVar));
  
  if (missingVars.length > 0) {
    console.log('   ❌ Missing required environment variables:');
    missingVars.forEach(envVar => console.log(`      - ${envVar}`));
    hasErrors = true;
  } else {
    console.log('   ✅ All required environment variables are present');
  }
}

// Check 4: Run unit tests
function runUnitTests() {
  console.log('\n4. 🧪 Running unit tests...');
  
  try {
    const { execSync } = require('child_process');
    const output = execSync('node tests/wildcard-search.test.js', { encoding: 'utf8' });
    
    if (output.includes('FAIL')) {
      console.log('   ❌ Unit tests failed');
      console.log(output);
      hasErrors = true;
    } else {
      console.log('   ✅ All unit tests passed');
    }
  } catch (error) {
    console.log('   ❌ Failed to run unit tests');
    console.log(error.message);
    hasErrors = true;
  }
}

// Critical functionality validation
console.log('\n📋 Checking Critical Functionality...');

// Check 1: Wildcard search backend logic
console.log('🔍 Validating wildcard search backend logic...');
const searchRouteContent = fs.readFileSync('src/app/api/church-members/search/route.ts', 'utf8');

// NEW: Check for admin state preservation patterns
console.log('🔐 Validating admin state preservation patterns...');
const accessFormContent = fs.readFileSync('src/components/AccessRequestForm.tsx', 'utf8');

// Check for admin email preservation during search browsing
if (!accessFormContent.includes('Preserve admin email during') ||
    !accessFormContent.match(/email: isAdminUser \? currentUserEmail : \(record\.email \|\| ''\)/)) {
  console.error('❌ CRITICAL: Admin email preservation during search browsing is missing!');
  process.exit(1);
}

// Check for admin email preservation during navigation  
const previousPattern = /const handlePrevious[\s\S]*?email: isAdminUser \? currentUserEmail : \(record\.email \|\| ''\)/;
const nextPattern = /const handleNext[\s\S]*?email: isAdminUser \? currentUserEmail : \(record\.email \|\| ''\)/;

if (!previousPattern.test(accessFormContent) || !nextPattern.test(accessFormContent)) {
  console.error('❌ CRITICAL: Admin email preservation during navigation is missing!');
  process.exit(1);
}

// Check for enhanced admin detection with localStorage fallback
if (!accessFormContent.includes('const storedAdminEmail = localStorage.getItem(\'nonGmailEmail\')') ||
    !accessFormContent.includes('const isStoredAdmin = storedAdminEmail === adminEmail') ||
    !accessFormContent.includes('const isUserAdmin = isStoredAdmin || isCurrentAdmin')) {
  console.error('❌ CRITICAL: Enhanced admin detection logic is missing!');
  process.exit(1);
}

// Check for proper navigation button state logic
if (!accessFormContent.includes('setCanNavigate(result.data.length > 1)')) {
  console.error('❌ CRITICAL: Navigation button state logic is missing!');
  process.exit(1);
}

// Check for proper button disabled logic
const prevButtonPattern = /disabled=\{!isSearchEnabled \|\| !canNavigate \|\| currentRecordIndex <= 0\}/;
const nextButtonPattern = /disabled=\{!isSearchEnabled \|\| !canNavigate \|\| currentRecordIndex >= allRecords\.length - 1\}/;

if (!prevButtonPattern.test(accessFormContent) || !nextButtonPattern.test(accessFormContent)) {
  console.error('❌ CRITICAL: Navigation button disabled logic is incorrect!');
  process.exit(1);
}

// Check for search button text logic
if (!accessFormContent.includes('{isSearchEnabled ? \'Search\' : \'Admin Only\'}')) {
  console.error('❌ CRITICAL: Search button text logic is missing!');
  process.exit(1);
}

console.log('✅ Admin state preservation patterns validated');
console.log('✅ Navigation button functionality validated');

// Run all checks
checkWildcardSearchLogic();
checkAdminDetectionLogic();
checkEnvironmentVariables();
runUnitTests();

console.log('\n' + '='.repeat(50));

if (hasErrors) {
  console.log('❌ Pre-deployment checks FAILED');
  console.log('🚫 DO NOT DEPLOY until all issues are resolved');
  process.exit(1);
} else {
  console.log('✅ All pre-deployment checks PASSED');
  console.log('🚀 Safe to deploy');
  process.exit(0);
} 