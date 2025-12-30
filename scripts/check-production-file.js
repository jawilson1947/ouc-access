#!/usr/bin/env node

/**
 * Check Production File Existence
 * 
 * This script checks if a specific file exists on the production server
 * by running commands via SSH.
 */

const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);

console.log('🔍 Checking production file existence...\n');

// Configuration
const REMOTE_HOST = 'jawilson@192.168.72.250';
const REMOTE_IMAGES_DIR = '/home/jawilson/fullstack-app/public/images';
const PROBLEMATIC_FILE = 'MannKimberly4331.jpeg';
const WORKING_FILE = 'WilsonJames0350.jpeg';

// Function to run SSH command
async function runSSHCommand(command) {
  try {
    const { stdout, stderr } = await execAsync(`ssh ${REMOTE_HOST} "${command}"`);
    return { success: true, stdout, stderr };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Function to check file existence
async function checkFile(filename) {
  console.log(`📋 Checking file: ${filename}`);
  
  // Check if file exists
  const existsResult = await runSSHCommand(`ls -la "${REMOTE_IMAGES_DIR}/${filename}"`);
  
  if (existsResult.success) {
    console.log(`   ✅ File exists`);
    console.log(`   📄 File details: ${existsResult.stdout.trim()}`);
  } else {
    console.log(`   ❌ File does not exist`);
    console.log(`   Error: ${existsResult.error}`);
  }
  
  // Check file permissions
  const permsResult = await runSSHCommand(`stat -c "%a %U:%G" "${REMOTE_IMAGES_DIR}/${filename}"`);
  
  if (permsResult.success) {
    console.log(`   🔐 Permissions: ${permsResult.stdout.trim()}`);
  } else {
    console.log(`   ❌ Could not get permissions: ${permsResult.error}`);
  }
  
  console.log('');
}

// Function to list all files in images directory
async function listImagesDirectory() {
  console.log('📁 Listing all files in images directory:\n');
  
  const result = await runSSHCommand(`ls -la "${REMOTE_IMAGES_DIR}/"`);
  
  if (result.success) {
    console.log(result.stdout);
  } else {
    console.log(`❌ Error listing directory: ${result.error}`);
  }
  
  console.log('');
}

// Function to check for similar files
async function checkSimilarFiles() {
  console.log('🔍 Checking for similar files:\n');
  
  const baseName = 'MannKimberly4331';
  const extensions = ['jpeg', 'jpg', 'png'];
  
  for (const ext of extensions) {
    const filename = `${baseName}.${ext}`;
    const result = await runSSHCommand(`ls -la "${REMOTE_IMAGES_DIR}/${filename}" 2>/dev/null || echo "File not found"`);
    
    if (result.success && !result.stdout.includes('File not found')) {
      console.log(`   ✅ Found: ${filename}`);
      console.log(`   📄 Details: ${result.stdout.trim()}`);
    } else {
      console.log(`   ❌ Not found: ${filename}`);
    }
  }
  
  console.log('');
}

// Function to check file system space and inodes
async function checkFileSystem() {
  console.log('💾 Checking file system:\n');
  
  const result = await runSSHCommand(`df -h "${REMOTE_IMAGES_DIR}" && echo "---" && df -i "${REMOTE_IMAGES_DIR}"`);
  
  if (result.success) {
    console.log(result.stdout);
  } else {
    console.log(`❌ Error checking file system: ${result.error}`);
  }
  
  console.log('');
}

// Main function
async function runCheck() {
  console.log('🚀 Starting production file check...\n');
  
  // List all files in images directory
  await listImagesDirectory();
  
  // Check the problematic file
  await checkFile(PROBLEMATIC_FILE);
  
  // Check a working file for comparison
  await checkFile(WORKING_FILE);
  
  // Check for similar files with different extensions
  await checkSimilarFiles();
  
  // Check file system
  await checkFileSystem();
  
  console.log('📊 Analysis:');
  console.log('============');
  console.log('Based on the check results, we can determine:');
  console.log('1. Whether the file exists on the production server');
  console.log('2. If there are permission issues');
  console.log('3. If the file has the correct extension');
  console.log('4. If there are file system issues');
  console.log('');
  console.log('💡 Recommendations:');
  console.log('1. If file doesn\'t exist: Run sync-images.sh to sync from development');
  console.log('2. If permissions are wrong: Fix with chmod 644 and chown jawilson:jawilson');
  console.log('3. If file system is full: Clean up space or increase storage');
  console.log('4. If file has wrong extension: Rename or update database record');
}

// Run the check
runCheck().catch(console.error); 