# Critical Functionality Documentation

## Overview
This document identifies critical code sections that must not be modified without extreme caution. These sections have been repeatedly broken by well-intentioned fixes, causing regressions.

## ⚠️ CRITICAL CODE SECTIONS - DO NOT MODIFY WITHOUT TESTING

This document identifies code sections that are critical to the application's core functionality and have experienced regressions in the past.

### 1. Admin Wildcard Search (🔥 HIGH PRIORITY)

**Files:**
- `src/app/api/church-members/search/route.ts` (lines 50-95)
- `src/components/AccessRequestForm.tsx` (lines 105-130)

**Critical Requirements:**
1. ✅ When admin enters `*` in lastname field, search should return ALL records
2. ✅ Wildcard search should NOT add any email constraints to the SQL query  
3. ✅ Non-admin users entering `*` should have it cleared and no search performed
4. ✅ Admin detection should use direct email comparison, not session data

**Known Regression Points:**
- The email constraint (`AND email = ?`) being added even for wildcard searches
- Admin detection relying on broken session authentication instead of direct email comparison

**Test Command:**
```bash
node tests/wildcard-search.test.js
```

### 2. Admin Detection Logic (🔥 HIGH PRIORITY)

**Files:**
- `src/components/AccessRequestForm.tsx` (lines 105-130)
- `src/app/api/church-members/search/route.ts` (lines 25-40)

**Critical Requirements:**
1. ✅ Admin detection must use `formData.email` or `localStorage.getItem('nonGmailEmail')`
2. ✅ Admin detection must NOT rely on session data (session auth is broken)
3. ✅ Comparison: `userEmail === process.env.NEXT_PUBLIC_ADMIN_EMAIL`
4. ✅ Fallback admin email: `'jawilson1947@gmail.com'`

**Never Use:**
- `session?.user?.email` (always undefined due to NextAuth issues)
- `session?.user?.isAdmin` (not set correctly)

### 3. Query Building Logic for Wildcard Search

**File:** `src/app/api/church-members/search/route.ts`

**Critical Code Pattern:**
```javascript
if (isWildcardSearch) {
  // WILDCARD SEARCH: Return ALL records without any constraints
  console.log('🔍 Explicit wildcard search - returning ALL records');
  // Intentionally empty - no search constraints added
} else if (isInitialSearch) {
  // INITIAL SEARCH: User just logged in, search exact email only
  query += ' AND email = ?';
  params.push(searchCriteria.email);
} else {
  // NORMAL SEARCH: Apply all relevant search criteria
  if (searchCriteria.email) {
    query += ' AND (email = ? OR gmail = ?)';
    params.push(searchCriteria.email, searchCriteria.email);
  }
}
```

**❌ NEVER DO THIS:**
```javascript
// This is WRONG - adds email constraint for wildcard searches
if (searchCriteria.email) {
  query += ' AND email = ?';  // This breaks wildcard search!
  params.push(searchCriteria.email);
}
```

### 4. Frontend Non-Admin Wildcard Handling

**File:** `src/components/AccessRequestForm.tsx`

**Critical Code Pattern:**
```javascript
if (searchLastname === '*' && !isSearchEnabled) {
  // Clear the asterisk and do nothing for non-admin users
  setFormData(prev => ({ ...prev, lastname: '' }));
  return;
}
```

## 2. Admin State Preservation (NEW - Critical for Navigation)

### Frontend Admin State Management (`src/components/AccessRequestForm.tsx`)

#### CRITICAL: Enhanced Admin Detection with localStorage Fallback
```javascript
const storedAdminEmail = localStorage.getItem('nonGmailEmail');
const isStoredAdmin = storedAdminEmail === adminEmail;
const isCurrentAdmin = userEmail === adminEmail;
const isUserAdmin = isStoredAdmin || isCurrentAdmin;
```

#### CRITICAL: Admin Email Preservation During Search Browsing
```javascript
// In handleSearch function:
const currentUserEmail = formData.email;
const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'jawilson1947@gmail.com';
const isAdminUser = currentUserEmail === adminEmail || localStorage.getItem('nonGmailEmail') === adminEmail;

setFormData(prevData => ({
  ...prevData,
  email: isAdminUser ? currentUserEmail : (record.email || ''), // Preserve admin email during browsing
  // ... other fields
}));
```

#### CRITICAL: Admin Email Preservation During Navigation (Previous/Next)
```javascript
// In handlePrevious and handleNext functions:
const currentUserEmail = formData.email;
const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'jawilson1947@gmail.com';
const isAdminUser = currentUserEmail === adminEmail || localStorage.getItem('nonGmailEmail') === adminEmail;

setFormData(prevData => ({
  ...prevData,
  email: isAdminUser ? currentUserEmail : (record.email || ''), // Preserve admin email during navigation
  // ... other fields
}));
```

#### FORBIDDEN: Overwriting admin email with browsed record email
```javascript
// ❌ NEVER DO THIS - it breaks admin state:
email: record.email || '',
```

## 3. Navigation Button State Management

### CRITICAL: Navigation State Logic
```javascript
// Proper canNavigate setting after search:
setCanNavigate(result.data.length > 1);

// Proper button disabled logic:
disabled={!isSearchEnabled || !canNavigate || currentRecordIndex <= 0}
disabled={!isSearchEnabled || !canNavigate || currentRecordIndex >= allRecords.length - 1}
```

### CRITICAL: Search Button Text Logic
```javascript
{isSearchEnabled ? 'Search' : 'Admin Only'}
```

#### FORBIDDEN: Breaking navigation state
```javascript
// ❌ NEVER set canNavigate to false when records > 1:
setCanNavigate(false); // when result.data.length > 1
```

## Testing Checklist Before Any Deployment

1. **Run Critical Tests:**
   ```bash
   node tests/wildcard-search.test.js
   ```

2. **Manual Test Cases:**
   - [ ] Log in as admin (`jawilson1947@gmail.com`)
   - [ ] Enter `*` in lastname field and click Search
   - [ ] Verify all 11+ records are returned
   - [ ] Log in as non-admin user
   - [ ] Enter `*` in lastname field
   - [ ] Verify `*` is cleared and no search is performed

3. **Check Browser Console:**
   - [ ] No errors related to admin detection
   - [ ] Logs show: `🔍 Explicit wildcard search - returning ALL records`
   - [ ] Query should NOT contain `AND email = ?` for wildcard searches

## Environment Variables

**Required for Admin Detection:**
```
ADMIN_EMAIL=jawilson1947@gmail.com
NEXT_PUBLIC_ADMIN_EMAIL=jawilson1947@gmail.com
```

## Regression Prevention

1. **Always run tests before deployment**
2. **Never modify query building logic without understanding the wildcard search requirements**
3. **Never change admin detection logic without testing both frontend and backend**
4. **Always test with actual admin email (`jawilson1947@gmail.com`)**

---

**Last Updated:** After fixing wildcard search regression  
**Next Review:** Before any major deployment 