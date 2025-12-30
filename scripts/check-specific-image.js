#!/usr/bin/env node

/**
 * Check Specific Image File
 * 
 * This script checks if a specific image file exists and is accessible
 * on the production server.
 */

const https = require('https');
const http = require('http');

console.log('🔍 Checking specific image file...\n');

// Configuration
const PRODUCTION_URL = 'https://access.oucsda.org';
const PROBLEMATIC_IMAGE = 'MannKimberly4331.jpeg';
const WORKING_IMAGE = 'WilsonJames0350.jpeg'; // Known working image for comparison

// Function to test image accessibility
async function testImageAccess(filename) {
  console.log(`🖼️ Testing image: ${filename}\n`);
  
  const testUrls = [
    {
      name: 'Direct Apache Alias',
      url: `${PRODUCTION_URL}/images/${filename}`,
      description: 'Should be handled by Apache Alias'
    },
    {
      name: 'Next.js API Route',
      url: `${PRODUCTION_URL}/api/images/serve?filename=${encodeURIComponent(filename)}`,
      description: 'Should be handled by Next.js API route'
    }
  ];
  
  for (const test of testUrls) {
    console.log(`📋 Testing: ${test.name}`);
    console.log(`   URL: ${test.url}`);
    console.log(`   Description: ${test.description}`);
    
    try {
      const response = await fetch(test.url);
      console.log(`   Status: ${response.status} ${response.status === 200 ? '✅' : '❌'}`);
      console.log(`   Content-Type: ${response.headers.get('content-type')}`);
      console.log(`   Content-Length: ${response.headers.get('content-length')}`);
      console.log(`   Server: ${response.headers.get('server')}`);
      console.log(`   X-Powered-By: ${response.headers.get('x-powered-by')}`);
      
      if (response.status !== 200) {
        console.log(`   ❌ Failed to access image`);
      } else {
        console.log(`   ✅ Image accessible`);
      }
      console.log('');
    } catch (error) {
      console.log(`   Error: ${error.message}`);
      console.log('');
    }
  }
}

// Function to check file existence via API
async function checkFileExistence(filename) {
  console.log(`🔍 Checking file existence via API: ${filename}\n`);
  
  try {
    const response = await fetch(`${PRODUCTION_URL}/api/images/validate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        imageUrl: `/images/${filename}`,
        fallbackUrl: '/images/PhotoID.jpeg'
      })
    });
    
    const data = await response.json();
    console.log(`📋 API Response:`);
    console.log(`   Status: ${response.status}`);
    console.log(`   Exists: ${data.exists}`);
    console.log(`   Accessible: ${data.accessible}`);
    console.log(`   Fallback Used: ${data.fallbackUsed}`);
    console.log(`   Final URL: ${data.finalUrl}`);
    console.log(`   Message: ${data.message}`);
    console.log('');
  } catch (error) {
    console.log(`   Error: ${error.message}`);
    console.log('');
  }
}

// Function to compare working vs problematic images
async function compareImages() {
  console.log('🔍 Comparing working vs problematic images...\n');
  
  console.log(`✅ Working image: ${WORKING_IMAGE}`);
  console.log(`❌ Problematic image: ${PROBLEMATIC_IMAGE}\n`);
  
  // Test working image
  console.log('📋 Testing working image:');
  await testImageAccess(WORKING_IMAGE);
  
  // Test problematic image
  console.log('📋 Testing problematic image:');
  await testImageAccess(PROBLEMATIC_IMAGE);
  
  // Check file existence for both
  console.log('📋 Checking file existence:');
  await checkFileExistence(WORKING_IMAGE);
  await checkFileExistence(PROBLEMATIC_IMAGE);
}

// Function to test different file extensions
async function testFileExtensions() {
  console.log('🔍 Testing different file extensions...\n');
  
  const baseName = 'MannKimberly4331';
  const extensions = ['jpeg', 'jpg', 'png'];
  
  for (const ext of extensions) {
    const filename = `${baseName}.${ext}`;
    console.log(`📋 Testing: ${filename}`);
    
    try {
      const response = await fetch(`${PRODUCTION_URL}/images/${filename}`);
      console.log(`   Status: ${response.status} ${response.status === 200 ? '✅' : '❌'}`);
      console.log(`   Content-Type: ${response.headers.get('content-type')}`);
      console.log('');
    } catch (error) {
      console.log(`   Error: ${error.message}`);
      console.log('');
    }
  }
}

// Main function
async function runCheck() {
  console.log('🚀 Starting specific image check...\n');
  
  // Test the problematic image
  await testImageAccess(PROBLEMATIC_IMAGE);
  
  // Check file existence
  await checkFileExistence(PROBLEMATIC_IMAGE);
  
  // Compare with working image
  await compareImages();
  
  // Test different file extensions
  await testFileExtensions();
  
  console.log('📊 Analysis:');
  console.log('============');
  console.log('Based on the test results, we can determine:');
  console.log('1. Whether the file exists on the server');
  console.log('2. If there are permission issues');
  console.log('3. If there are routing conflicts');
  console.log('4. If the file extension is correct');
  console.log('');
  console.log('💡 Recommendations:');
  console.log('1. Check if the file exists in /home/jawilson/fullstack-app/public/images/');
  console.log('2. Verify file permissions (should be 644)');
  console.log('3. Check file ownership (should be jawilson:jawilson)');
  console.log('4. Ensure the file was properly synced from development');
  console.log('5. Check for case sensitivity issues');
}

// Run the check
runCheck().catch(console.error); 