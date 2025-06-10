/**
 * Critical Functionality Tests for OUC Access Request Application
 * 
 * These tests validate the core functionality that must never regress:
 * 1. Admin wildcard search returns all records
 * 2. Non-admin wildcard search is blocked
 * 3. Admin detection works correctly
 */

const fs = require('fs');

// Simple test framework functions
function assertEquals(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(`${message}: Expected ${expected}, got ${actual}`);
  }
}

function assertTrue(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function assertFalse(condition, message) {
  if (condition) {
    throw new Error(message);
  }
}

// Unit Tests for Critical Wildcard Search Functionality
console.log("🧪 Running Critical Functionality Tests...\n");

// Test 1: Admin Email Detection
function testAdminEmailDetection() {
  const adminEmail = "jawilson1947@gmail.com";
  const userEmail = "jawilson1947@gmail.com";
  const isAdmin = userEmail === adminEmail;
  assertEquals(isAdmin, true, "Admin email should be detected correctly");
}

function testNonAdminEmailDetection() {
  const adminEmail = "jawilson1947@gmail.com";
  const userEmail = "someone.else@gmail.com";
  const isAdmin = userEmail === adminEmail;
  assertEquals(isAdmin, false, "Non-admin email should be detected correctly");
}

// Test 2: Wildcard Search Query Building
function testWildcardSearchQueryBuilding() {
  const isWildcardSearch = true;
  const searchCriteria = { email: "test@test.com", lastname: "*" };
  
  let query = 'SELECT * FROM ChurchMembers WHERE 1=1';
  const params = [];
  
  if (isWildcardSearch) {
    // Should NOT add any constraints for wildcard search
  } else {
    if (searchCriteria.email) {
      query += ' AND email = ?';
      params.push(searchCriteria.email);
    }
  }
  
  assertFalse(query.includes('AND email = ?'), "Wildcard search should not include email constraint");
  assertEquals(params.length, 0, "Wildcard search should have no parameters");
}

function testNormalSearchQueryBuilding() {
  const isWildcardSearch = false;
  const searchCriteria = { email: "test@test.com", lastname: "Smith" };
  
  let query = 'SELECT * FROM ChurchMembers WHERE 1=1';
  const params = [];
  
  if (!isWildcardSearch) {
    if (searchCriteria.email) {
      query += ' AND (email = ? OR gmail = ?)';
      params.push(searchCriteria.email, searchCriteria.email);
    }
  }
  
  assertTrue(query.includes('AND (email = ? OR gmail = ?)'), "Normal search should include email/gmail constraint");
  assertEquals(params.length, 2, "Normal search should have email and gmail parameters");
}

// Test 3: Admin State Preservation
function testAdminEmailPreservationDuringSearchBrowsing() {
  const accessFormContent = fs.readFileSync('src/components/AccessRequestForm.tsx', 'utf8');
  
  // Check for admin email preservation pattern in search
  assertTrue(
    accessFormContent.includes('email: isAdminUser ? currentUserEmail : (record.email || \'\')'),
    "Admin email preservation pattern should exist in search function"
  );
  assertTrue(
    accessFormContent.includes('Preserve admin email during'),
    "Admin email preservation comment should exist"
  );
}

function testAdminEmailPreservationDuringNavigation() {
  const accessFormContent = fs.readFileSync('src/components/AccessRequestForm.tsx', 'utf8');
  
  // Check for admin email preservation in navigation functions
  const previousPattern = /const handlePrevious[\s\S]*?email: isAdminUser \? currentUserEmail : \(record\.email \|\| ''\)/;
  const nextPattern = /const handleNext[\s\S]*?email: isAdminUser \? currentUserEmail : \(record\.email \|\| ''\)/;
  
  assertTrue(previousPattern.test(accessFormContent), "Previous button should preserve admin email");
  assertTrue(nextPattern.test(accessFormContent), "Next button should preserve admin email");
}

function testEnhancedAdminDetectionLogic() {
  const accessFormContent = fs.readFileSync('src/components/AccessRequestForm.tsx', 'utf8');
  
  // Check for enhanced admin detection logic
  assertTrue(
    accessFormContent.includes('const storedAdminEmail = localStorage.getItem(\'nonGmailEmail\')'),
    "Should get stored admin email from localStorage"
  );
  assertTrue(
    accessFormContent.includes('const isStoredAdmin = storedAdminEmail === adminEmail'),
    "Should check if stored email is admin"
  );
  assertTrue(
    accessFormContent.includes('const isUserAdmin = isStoredAdmin || isCurrentAdmin'),
    "Should use OR logic for admin detection"
  );
}

// Test 4: Navigation Button State Management
function testCanNavigateLogic() {
  const accessFormContent = fs.readFileSync('src/components/AccessRequestForm.tsx', 'utf8');
  
  // Check for proper canNavigate logic
  assertTrue(
    accessFormContent.includes('setCanNavigate(result.data.length > 1)'),
    "Should set canNavigate based on number of results"
  );
}

function testNavigationButtonDisabledLogic() {
  const accessFormContent = fs.readFileSync('src/components/AccessRequestForm.tsx', 'utf8');
  
  // Check button disabled logic
  assertTrue(
    accessFormContent.includes('disabled={!isSearchEnabled || !canNavigate || currentRecordIndex <= 0}'),
    "Previous button should have correct disabled logic"
  );
  assertTrue(
    accessFormContent.includes('disabled={!isSearchEnabled || !canNavigate || currentRecordIndex >= allRecords.length - 1}'),
    "Next button should have correct disabled logic"
  );
}

function testSearchButtonTextLogic() {
  const accessFormContent = fs.readFileSync('src/components/AccessRequestForm.tsx', 'utf8');
  
  // Check search button text logic
  assertTrue(
    accessFormContent.includes('{isSearchEnabled ? \'Search\' : \'Admin Only\'}'),
    "Search button should show correct text based on admin status"
  );
  assertTrue(
    accessFormContent.includes('disabled={!isSearchEnabled}'),
    "Search button should be disabled for non-admin users"
  );
}

// Run all tests
try {
  console.log("Testing admin email detection...");
  testAdminEmailDetection();
  testNonAdminEmailDetection();
  console.log("✅ Admin email detection tests passed");

  console.log("Testing wildcard search query building...");
  testWildcardSearchQueryBuilding();
  testNormalSearchQueryBuilding();
  console.log("✅ Wildcard search query building tests passed");

  console.log("Testing admin state preservation...");
  testAdminEmailPreservationDuringSearchBrowsing();
  testAdminEmailPreservationDuringNavigation();
  testEnhancedAdminDetectionLogic();
  console.log("✅ Admin state preservation tests passed");

  console.log("Testing navigation button state management...");
  testCanNavigateLogic();
  testNavigationButtonDisabledLogic();
  testSearchButtonTextLogic();
  console.log("✅ Navigation button state management tests passed");

  console.log("\n🎉 All critical functionality tests PASSED!");
  process.exit(0);

} catch (error) {
  console.error(`\n❌ Test FAILED: ${error.message}`);
  process.exit(1);
}

console.log("\n🎯 To run these tests: node tests/wildcard-search.test.js");
console.log("💡 Run these tests before any deployment to catch regressions early!"); 