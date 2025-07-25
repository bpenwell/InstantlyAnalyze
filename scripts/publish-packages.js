#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const packages = [
  'InstantlyAnalyze-Module',
  'InstantlyAnalyze-Components', 
  'InstantlyAnalyze-Layouts'
];

const versionTypes = ['patch', 'minor', 'major'];

function getVersionType() {
  const args = process.argv.slice(2);
  const versionType = args[0];
  
  if (!versionTypes.includes(versionType)) {
    console.error(`Usage: node publish-packages.js [${versionTypes.join('|')}]`);
    console.error('Example: node publish-packages.js patch');
    process.exit(1);
  }
  
  return versionType;
}

function publishPackage(packagePath, versionType) {
  const fullPath = path.resolve(__dirname, '..', packagePath);
  
  if (!fs.existsSync(fullPath)) {
    console.error(`Package not found: ${fullPath}`);
    return false;
  }
  
  try {
    console.log(`\n📦 Publishing ${packagePath}...`);
    
    // Change to package directory
    process.chdir(fullPath);
    
    // Build the package
    console.log('🔨 Building package...');
    execSync('npm run build:prod', { stdio: 'inherit' });
    
    // Run tests
    console.log('🧪 Running tests...');
    execSync('npm test', { stdio: 'inherit' });
    
    // Bump version
    console.log(`📈 Bumping ${versionType} version...`);
    execSync(`npm version ${versionType} --no-git-tag-version`, { stdio: 'inherit' });
    
    // Publish to npm
    console.log('🚀 Publishing to npm...');
    execSync('npm publish', { stdio: 'inherit' });
    
    console.log(`✅ Successfully published ${packagePath}`);
    return true;
    
  } catch (error) {
    console.error(`❌ Failed to publish ${packagePath}:`, error.message);
    return false;
  }
}

function main() {
  const versionType = getVersionType();
  
  console.log(`🚀 Publishing all packages with ${versionType} version bump...`);
  
  let successCount = 0;
  let totalCount = packages.length;
  
  for (const packagePath of packages) {
    if (publishPackage(packagePath, versionType)) {
      successCount++;
    }
  }
  
  console.log(`\n📊 Publishing Summary:`);
  console.log(`✅ Successfully published: ${successCount}/${totalCount} packages`);
  
  if (successCount === totalCount) {
    console.log('🎉 All packages published successfully!');
  } else {
    console.log('⚠️  Some packages failed to publish. Check the logs above.');
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { publishPackage, packages }; 