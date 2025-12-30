#!/usr/bin/env node

/**
 * Test Static File Serving
 * 
 * This script tests how Next.js serves static files and helps identify
 * why some images work and others don't.
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

console.log('🔍 Testing Static File Serving...\n');

// Configuration
const LOCAL_IMAGES_DIR = path.join(__dirname, '..', 'public', 'images');
const PRODUCTION_URL = 'https://access.oucsda.org';

// Function to test a single image
function testImage(filename) {
  return new Promise((resolve) => {
    const url = `${PRODUCTION_URL}/images/${filename}`;
    
    console.log(`🖼️ Testing: ${filename}`);
    console.log(`   URL: ${url}`);
    
    const req = https.get(url, (res) => {
      console.log(`   Status: ${res.statusCode}`);
      console.log(`   Content-Type: ${res.headers['content-type']}`);
      console.log(`   Content-Length: ${res.headers['content-length']}`);
      console.log(`   Result: ${res.statusCode === 200 ? '✅ SUCCESS' : '❌ FAILED'}`);
      console.log('');
      
      resolve({
        filename,
        statusCode: res.statusCode,
        contentType: res.headers['content-type'],
        contentLength: res.headers['content-length'],
        success: res.statusCode === 200
      });
    });
    
    req.on('error', (err) => {
      console.log(`   Error: ${err.message}`);
      console.log(`   Result: ❌ FAILED`);
      console.log('');
      resolve({
        filename,
        statusCode: 0,
        error: err.message,
        success: false
      });
    });
    
    req.setTimeout(5000, () => {
      console.log(`   Timeout after 5 seconds`);
      console.log(`   Result: ❌ FAILED`);
      console.log('');
      req.destroy();
      resolve({
        filename,
        statusCode: 0,
        error: 'Timeout',
        success: false
      });
    });
  });
}

// Function to check local file existence
function checkLocalFile(filename) {
  const filePath = path.join(LOCAL_IMAGES_DIR, filename);
  const exists = fs.existsSync(filePath);
  
  if (exists) {
    const stats = fs.statSync(filePath);
    return {
      exists: true,
      size: stats.size,
      modified: stats.mtime
    };
  } else {
    return { exists: false };
  }
}

// Main test function
async function runTests() {
  console.log('📁 Local images directory:', LOCAL_IMAGES_DIR);
  console.log('🌐 Production URL:', PRODUCTION_URL);
  console.log('');
  
  // Test images
  const testImages = [
    'PhotoID.jpeg',           // Should work
    'WilsonJames0350.jpeg',   // Should work
    'WilsonJustin2648.jpeg',  // Should work
    'WilsonPaula0850.jpeg',   // Problematic file
    'WilsonShia2648.jpeg'     // Should work
  ];
  
  const results = [];
  
  for (const filename of testImages) {
    console.log(`🔍 Testing ${filename}...`);
    
    // Check local file
    const localInfo = checkLocalFile(filename);
    console.log(`   Local: ${localInfo.exists ? '✅ EXISTS' : '❌ MISSING'}`);
    if (localInfo.exists) {
      console.log(`   Size: ${localInfo.size} bytes`);
      console.log(`   Modified: ${localInfo.modified}`);
    }
    
    // Test remote access
    const remoteResult = await testImage(filename);
    results.push({
      filename,
      local: localInfo,
      remote: remoteResult
    });
  }
  
  // Analysis
  console.log('\n📊 Analysis:');
  console.log('============');
  
  const workingImages = results.filter(r => r.remote.success);
  const brokenImages = results.filter(r => !r.remote.success);
  
  console.log(`✅ Working images: ${workingImages.length}`);
  workingImages.forEach(r => console.log(`   - ${r.filename}`));
  
  console.log(`❌ Broken images: ${brokenImages.length}`);
  brokenImages.forEach(r => {
    console.log(`   - ${r.filename} (Status: ${r.remote.statusCode})`);
    if (r.local.exists) {
      console.log(`     Local exists but remote fails - this is the Next.js issue!`);
    } else {
      console.log(`     Missing locally - needs upload`);
    }
  });
  
  // Check for patterns
  console.log('\n🔍 Pattern Analysis:');
  console.log('===================');
  
  const allLocalExist = results.every(r => r.local.exists);
  const allRemoteWork = results.every(r => r.remote.success);
  
  if (allLocalExist && !allRemoteWork) {
    console.log('⚠️  All files exist locally but some fail remotely');
    console.log('   This indicates a Next.js static file serving issue');
    console.log('   Possible causes:');
    console.log('   1. Next.js not properly serving /images/ directory');
    console.log('   2. File permissions issue in production');
    console.log('   3. Cloudflare Workers interfering with static serving');
    console.log('   4. Next.js build process not including all files');
  } else if (!allLocalExist) {
    console.log('⚠️  Some files missing locally');
    console.log('   Need to sync files to production');
  } else if (allRemoteWork) {
    console.log('✅ All files working correctly');
  }
  
  // Test the image serve API as alternative
  console.log('\n🔍 Testing Image Serve API:');
  console.log('===========================');
  
  for (const result of brokenImages) {
    const apiUrl = `${PRODUCTION_URL}/api/images/serve?filename=${encodeURIComponent(result.filename)}`;
    console.log(`Testing API for ${result.filename}: ${apiUrl}`);
    
    try {
      const response = await fetch(apiUrl);
      console.log(`   API Status: ${response.status} ${response.status === 200 ? '✅' : '❌'}`);
    } catch (error) {
      console.log(`   API Error: ${error.message}`);
    }
  }
}

// Run the tests
runTests().catch(console.error); 