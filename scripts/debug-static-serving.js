#!/usr/bin/env node

/**
 * Debug Static File Serving Layers
 * 
 * This script helps identify which layer is handling static file requests
 * and why some files work while others don't.
 */

const https = require('https');
const http = require('http');

console.log('🔍 Debugging Static File Serving Layers...\n');

// Configuration
const PRODUCTION_URL = 'https://access.oucsda.org';
const TEST_IMAGE = 'WilsonPaula0850.jpeg';

// Function to test different URL patterns
async function testUrlPatterns(filename) {
  console.log(`🖼️ Testing different URL patterns for: ${filename}\n`);
  
  const patterns = [
    {
      name: 'Direct Apache Alias',
      url: `${PRODUCTION_URL}/images/${filename}`,
      description: 'Should be handled by Apache Alias in oucaccess-ssl.conf'
    },
    {
      name: 'Next.js API Route',
      url: `${PRODUCTION_URL}/api/images/serve?filename=${encodeURIComponent(filename)}`,
      description: 'Should be handled by Next.js API route'
    },
    {
      name: 'Next.js Static (via server.js)',
      url: `${PRODUCTION_URL}/images/${filename}`,
      description: 'Should be handled by server.js custom static handler'
    }
  ];
  
  for (const pattern of patterns) {
    console.log(`📋 Testing: ${pattern.name}`);
    console.log(`   URL: ${pattern.url}`);
    console.log(`   Description: ${pattern.description}`);
    
    try {
      const response = await fetch(pattern.url);
      console.log(`   Status: ${response.status} ${response.status === 200 ? '✅' : '❌'}`);
      console.log(`   Content-Type: ${response.headers.get('content-type')}`);
      console.log(`   Content-Length: ${response.headers.get('content-length')}`);
      console.log(`   Server: ${response.headers.get('server')}`);
      console.log(`   X-Powered-By: ${response.headers.get('x-powered-by')}`);
      console.log('');
    } catch (error) {
      console.log(`   Error: ${error.message}`);
      console.log('');
    }
  }
}

// Function to test file existence via different methods
async function testFileExistence(filename) {
  console.log(`🔍 Testing file existence for: ${filename}\n`);
  
  const tests = [
    {
      name: 'Direct HTTP Request',
      url: `${PRODUCTION_URL}/images/${filename}`,
      method: 'HEAD'
    },
    {
      name: 'API Validation',
      url: `${PRODUCTION_URL}/api/images/serve`,
      method: 'POST',
      body: JSON.stringify({ filename })
    },
    {
      name: 'API GET Request',
      url: `${PRODUCTION_URL}/api/images/serve?filename=${encodeURIComponent(filename)}`,
      method: 'GET'
    }
  ];
  
  for (const test of tests) {
    console.log(`📋 ${test.name}:`);
    console.log(`   URL: ${test.url}`);
    
    try {
      const options = {
        method: test.method,
        headers: {
          'Content-Type': 'application/json'
        }
      };
      
      if (test.body) {
        options.body = test.body;
      }
      
      const response = await fetch(test.url, options);
      console.log(`   Status: ${response.status}`);
      console.log(`   Content-Type: ${response.headers.get('content-type')}`);
      
      if (test.method === 'POST') {
        const data = await response.json();
        console.log(`   Response:`, data);
      }
      
      console.log('');
    } catch (error) {
      console.log(`   Error: ${error.message}`);
      console.log('');
    }
  }
}

// Function to test working vs broken images
async function compareImages() {
  console.log('🔍 Comparing working vs broken images...\n');
  
  const workingImage = 'WilsonJames0350.jpeg';
  const brokenImage = 'WilsonPaula0850.jpeg';
  
  console.log(`✅ Working image: ${workingImage}`);
  console.log(`❌ Broken image: ${brokenImage}\n`);
  
  // Test working image
  console.log('📋 Testing working image:');
  try {
    const workingResponse = await fetch(`${PRODUCTION_URL}/images/${workingImage}`);
    console.log(`   Status: ${workingResponse.status}`);
    console.log(`   Content-Type: ${workingResponse.headers.get('content-type')}`);
    console.log(`   Content-Length: ${workingResponse.headers.get('content-length')}`);
    console.log(`   Server: ${workingResponse.headers.get('server')}`);
    console.log('');
  } catch (error) {
    console.log(`   Error: ${error.message}\n`);
  }
  
  // Test broken image
  console.log('📋 Testing broken image:');
  try {
    const brokenResponse = await fetch(`${PRODUCTION_URL}/images/${brokenImage}`);
    console.log(`   Status: ${brokenResponse.status}`);
    console.log(`   Content-Type: ${brokenResponse.headers.get('content-type')}`);
    console.log(`   Content-Length: ${brokenResponse.headers.get('content-length')}`);
    console.log(`   Server: ${brokenResponse.headers.get('server')}`);
    console.log('');
  } catch (error) {
    console.log(`   Error: ${error.message}\n`);
  }
}

// Function to test Cloudflare Workers routing
async function testCloudflareRouting() {
  console.log('🔍 Testing Cloudflare Workers routing...\n');
  
  const testUrls = [
    `${PRODUCTION_URL}/images/WilsonPaula0850.jpeg`,
    `${PRODUCTION_URL}/api/health`,
    `${PRODUCTION_URL}/access-request`
  ];
  
  for (const url of testUrls) {
    console.log(`📋 Testing: ${url}`);
    try {
      const response = await fetch(url);
      console.log(`   Status: ${response.status}`);
      console.log(`   Server: ${response.headers.get('server')}`);
      console.log(`   CF-Ray: ${response.headers.get('cf-ray')}`);
      console.log(`   CF-Cache-Status: ${response.headers.get('cf-cache-status')}`);
      console.log('');
    } catch (error) {
      console.log(`   Error: ${error.message}\n`);
    }
  }
}

// Main function
async function runDebug() {
  console.log('🚀 Starting static file serving debug...\n');
  
  // Test different URL patterns
  await testUrlPatterns(TEST_IMAGE);
  
  // Test file existence
  await testFileExistence(TEST_IMAGE);
  
  // Compare working vs broken images
  await compareImages();
  
  // Test Cloudflare routing
  await testCloudflareRouting();
  
  console.log('📊 Analysis:');
  console.log('============');
  console.log('Based on the test results, we can determine:');
  console.log('1. Which layer is handling the request (Apache vs Next.js vs Cloudflare)');
  console.log('2. Whether the file exists in the expected location');
  console.log('3. If there are routing conflicts between layers');
  console.log('4. Whether Cloudflare Workers is interfering with static serving');
}

// Run the debug
runDebug().catch(console.error); 