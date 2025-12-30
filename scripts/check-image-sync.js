#!/usr/bin/env node

/**
 * Image Synchronization Check Script
 * 
 * This script checks which images are available in development vs production
 * to help identify synchronization issues.
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

console.log('🔍 Checking Image Synchronization...\n');

// Configuration
const LOCAL_IMAGES_DIR = path.join(__dirname, '..', 'public', 'images');
const REMOTE_BASE_URL = 'https://access.oucsda.org';

// Function to get image list from a directory
function getImageList(dirPath) {
  try {
    if (!fs.existsSync(dirPath)) {
      return [];
    }
    
    const files = fs.readdirSync(dirPath);
    return files.filter(file => 
      file.toLowerCase().endsWith('.jpeg') || 
      file.toLowerCase().endsWith('.jpg') || 
      file.toLowerCase().endsWith('.png')
    );
  } catch (error) {
    console.error(`❌ Error reading directory ${dirPath}:`, error.message);
    return [];
  }
}

// Function to check if an image exists on remote server
function checkRemoteImage(filename) {
  return new Promise((resolve) => {
    const url = `${REMOTE_BASE_URL}/images/${filename}`;
    
    const req = https.get(url, (res) => {
      const exists = res.statusCode === 200;
      console.log(`   ${exists ? '✅' : '❌'} ${filename} (${res.statusCode})`);
      resolve({ filename, exists, statusCode: res.statusCode });
    });
    
    req.on('error', (err) => {
      console.log(`   ❌ ${filename} (Error: ${err.message})`);
      resolve({ filename, exists: false, statusCode: 0, error: err.message });
    });
    
    req.setTimeout(5000, () => {
      console.log(`   ⏰ ${filename} (Timeout)`);
      req.destroy();
      resolve({ filename, exists: false, statusCode: 0, error: 'Timeout' });
    });
  });
}

// Function to check multiple remote images
async function checkRemoteImages(filenames) {
  console.log('🖼️ Checking remote images:');
  
  const results = [];
  for (const filename of filenames) {
    const result = await checkRemoteImage(filename);
    results.push(result);
  }
  
  return results;
}

// Main function
async function checkImageSync() {
  console.log('📁 Local images directory:', LOCAL_IMAGES_DIR);
  console.log('🌐 Remote images URL:', `${REMOTE_BASE_URL}/images/`);
  console.log('');
  
  // Get local images
  const localImages = getImageList(LOCAL_IMAGES_DIR);
  console.log('📸 Local images (', localImages.length, '):');
  localImages.forEach(img => console.log('   ✅', img));
  
  console.log('');
  
  // Check remote images
  const remoteResults = await checkRemoteImages(localImages);
  
  console.log('');
  
  // Analyze results
  const remoteExists = remoteResults.filter(r => r.exists);
  const remoteMissing = remoteResults.filter(r => !r.exists);
  
  console.log('📊 Synchronization Analysis:');
  console.log('   📈 Available on both:', remoteExists.length);
  console.log('   📤 Only in local:', remoteMissing.length);
  
  if (remoteMissing.length > 0) {
    console.log('\n⚠️  Images missing from production:');
    remoteMissing.forEach(result => {
      console.log(`   🔄 ${result.filename} (Status: ${result.statusCode})`);
    });
    
    console.log('\n💡 Recommendation: Run the sync script to upload missing images');
    console.log('   ./scripts/automated-deployment.sh');
  } else {
    console.log('\n✅ All local images are available in production!');
  }
  
  // Check specific problematic images
  const problematicImages = ['WilsonPaula0850.jpeg', 'WilsonJames0350.jpeg', 'WilsonJustin2648.jpeg', 'WilsonShia2648.jpeg'];
  
  console.log('\n🔍 Checking specific problematic images:');
  for (const img of problematicImages) {
    const localExists = localImages.includes(img);
    const remoteResult = remoteResults.find(r => r.filename === img);
    const remoteExists = remoteResult ? remoteResult.exists : false;
    
    console.log(`   ${img}:`);
    console.log(`      Local: ${localExists ? '✅' : '❌'}`);
    console.log(`      Remote: ${remoteExists ? '✅' : '❌'}`);
    
    if (localExists && !remoteExists) {
      console.log(`      ⚠️  Needs upload to production`);
    } else if (!localExists && remoteExists) {
      console.log(`      ⚠️  Available in production but not local`);
    } else if (!localExists && !remoteExists) {
      console.log(`      ❌ Missing everywhere`);
    } else {
      console.log(`      ✅ Synchronized`);
    }
  }
  
  // Test the image serve API
  console.log('\n🔍 Testing image serve API:');
  const testImages = ['WilsonPaula0850.jpeg', 'PhotoID.jpeg'];
  
  for (const img of testImages) {
    const apiUrl = `${REMOTE_BASE_URL}/api/images/serve?filename=${encodeURIComponent(img)}`;
    console.log(`   Testing API: ${apiUrl}`);
    
    try {
      const response = await fetch(apiUrl);
      const status = response.status;
      console.log(`   API Status: ${status} ${status === 200 ? '✅' : '❌'}`);
    } catch (error) {
      console.log(`   API Error: ${error.message}`);
    }
  }
}

// Run the check
checkImageSync().catch(console.error); 