#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const packages = [
  {
    name: '@ben1000240/instantlyanalyze-module',
    path: '../InstantlyAnalyze-Module',
    version: '0.1.0'
  },
  {
    name: '@ben1000240/instantlyanalyze-components',
    path: '../InstantlyAnalyze-Components',
    version: '0.1.0'
  },
  {
    name: '@ben1000240/instantlyanalyze-layouts',
    path: '../InstantlyAnalyze-Layouts',
    version: '0.1.0'
  }
];

function updateDependencies(packageJsonPath, oldDeps, newDeps) {
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  
  // Update dependencies
  if (packageJson.dependencies) {
    for (const [pkg, oldDep] of Object.entries(oldDeps)) {
      if (packageJson.dependencies[pkg] === oldDep) {
        packageJson.dependencies[pkg] = newDeps[pkg];
      }
    }
  }
  
  // Update devDependencies
  if (packageJson.devDependencies) {
    for (const [pkg, oldDep] of Object.entries(oldDeps)) {
      if (packageJson.devDependencies[pkg] === oldDep) {
        packageJson.devDependencies[pkg] = newDeps[pkg];
      }
    }
  }
  
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');
}

function migrateToNpm() {
  console.log('🔄 Migrating from file dependencies to npm dependencies...\n');
  
  // First, publish all packages to npm
  console.log('📦 Publishing packages to npm...');
  for (const pkg of packages) {
    try {
      console.log(`\n📤 Publishing ${pkg.name}...`);
      process.chdir(path.resolve(__dirname, pkg.path));
      
      // Build and publish
      execSync('npm run build:prod', { stdio: 'inherit' });
      execSync('npm publish', { stdio: 'inherit' });
      
      console.log(`✅ Successfully published ${pkg.name}`);
    } catch (error) {
      console.error(`❌ Failed to publish ${pkg.name}:`, error.message);
      return false;
    }
  }
  
  // Now update dependencies in the main package
  console.log('\n🔄 Updating dependencies in main package...');
  process.chdir(path.resolve(__dirname, '..'));
  
  const oldDeps = {
    '@ben1000240/instantlyanalyze-module': 'file:../InstantlyAnalyze-Module',
    '@ben1000240/instantlyanalyze-components': 'file:../InstantlyAnalyze-Components',
    '@ben1000240/instantlyanalyze-layouts': 'file:../InstantlyAnalyze-Layouts'
  };
  
  const newDeps = {
    '@ben1000240/instantlyanalyze-module': '^0.1.0',
    '@ben1000240/instantlyanalyze-components': '^0.1.0',
    '@ben1000240/instantlyanalyze-layouts': '^0.1.0'
  };
  
  updateDependencies('package.json', oldDeps, newDeps);
  
  // Update dependencies in other packages that depend on each other
  console.log('🔄 Updating cross-package dependencies...');
  
  // Components depends on Module
  const componentsPath = path.resolve(__dirname, '../InstantlyAnalyze-Components/package.json');
  if (fs.existsSync(componentsPath)) {
    updateDependencies(componentsPath, 
      { '@ben1000240/instantlyanalyze-module': 'file:../InstantlyAnalyze-Module' },
      { '@ben1000240/instantlyanalyze-module': '^0.1.0' }
    );
  }
  
  // Layouts depends on Components and Module
  const layoutsPath = path.resolve(__dirname, '../InstantlyAnalyze-Layouts/package.json');
  if (fs.existsSync(layoutsPath)) {
    updateDependencies(layoutsPath, 
      {
        '@ben1000240/instantlyanalyze-components': 'file:../InstantlyAnalyze-Components',
        '@ben1000240/instantlyanalyze-module': 'file:../InstantlyAnalyze-Module'
      },
      {
        '@ben1000240/instantlyanalyze-components': '^0.1.0',
        '@ben1000240/instantlyanalyze-module': '^0.1.0'
      }
    );
  }
  
  // Install the new dependencies
  console.log('📦 Installing new npm dependencies...');
  execSync('npm install', { stdio: 'inherit' });
  
  console.log('\n✅ Migration completed successfully!');
  console.log('\n📋 Next steps:');
  console.log('1. Test your application: npm run dev');
  console.log('2. Remove the local package directories if no longer needed');
  console.log('3. Update your CI/CD pipeline to use npm dependencies');
  console.log('4. Consider using npm workspaces for development');
  
  return true;
}

function rollback() {
  console.log('🔄 Rolling back to file dependencies...');
  
  const oldDeps = {
    '@ben1000240/instantlyanalyze-module': '^0.1.0',
    '@ben1000240/instantlyanalyze-components': '^0.1.0',
    '@ben1000240/instantlyanalyze-layouts': '^0.1.0'
  };
  
  const newDeps = {
    '@ben1000240/instantlyanalyze-module': 'file:../InstantlyAnalyze-Module',
    '@ben1000240/instantlyanalyze-components': 'file:../InstantlyAnalyze-Components',
    '@ben1000240/instantlyanalyze-layouts': 'file:../InstantlyAnalyze-Layouts'
  };
  
  process.chdir(path.resolve(__dirname, '..'));
  updateDependencies('package.json', oldDeps, newDeps);
  
  // Update cross-package dependencies
  const componentsPath = path.resolve(__dirname, '../InstantlyAnalyze-Components/package.json');
  if (fs.existsSync(componentsPath)) {
    updateDependencies(componentsPath, 
      { '@ben1000240/instantlyanalyze-module': '^0.1.0' },
      { '@ben1000240/instantlyanalyze-module': 'file:../InstantlyAnalyze-Module' }
    );
  }
  
  const layoutsPath = path.resolve(__dirname, '../InstantlyAnalyze-Layouts/package.json');
  if (fs.existsSync(layoutsPath)) {
    updateDependencies(layoutsPath, 
      {
        '@ben1000240/instantlyanalyze-components': '^0.1.0',
        '@ben1000240/instantlyanalyze-module': '^0.1.0'
      },
      {
        '@ben1000240/instantlyanalyze-components': 'file:../InstantlyAnalyze-Components',
        '@ben1000240/instantlyanalyze-module': 'file:../InstantlyAnalyze-Module'
      }
    );
  }
  
  execSync('npm install', { stdio: 'inherit' });
  console.log('✅ Rollback completed!');
}

function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  switch (command) {
    case 'migrate':
      migrateToNpm();
      break;
    case 'rollback':
      rollback();
      break;
    default:
      console.log('Usage: node migrate-to-npm.js [migrate|rollback]');
      console.log('');
      console.log('Commands:');
      console.log('  migrate  - Migrate from file dependencies to npm dependencies');
      console.log('  rollback - Rollback to file dependencies');
      console.log('');
      console.log('Example:');
      console.log('  node migrate-to-npm.js migrate');
      break;
  }
}

if (require.main === module) {
  main();
}

module.exports = { migrateToNpm, rollback }; 