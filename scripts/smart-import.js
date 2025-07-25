const fs = require('fs');
const path = require('path');

/**
 * Smart Import Utility
 * 
 * This script automatically detects if local packages are available and updates
 * package.json dependencies accordingly. If local packages exist, it uses file: references.
 * If not, it uses the latest published versions.
 */

const packages = [
  {
    name: '@ben1000240/instantlyanalyze-module',
    localPath: '../InstantlyAnalyze-Module',
    version: '^0.1.1'
  },
  {
    name: '@ben1000240/instantlyanalyze-components',
    localPath: '../InstantlyAnalyze-Components',
    version: '^0.1.1'
  },
  {
    name: '@ben1000240/instantlyanalyze-layouts',
    localPath: '../InstantlyAnalyze-Layouts',
    version: '^0.1.1'
  }
];

function checkLocalPackage(packagePath) {
  const fullPath = path.resolve(__dirname, packagePath);
  return fs.existsSync(fullPath) && fs.existsSync(path.join(fullPath, 'package.json'));
}

function updatePackageJson(packageJsonPath, dependencies, isLocal = false) {
  if (!fs.existsSync(packageJsonPath)) {
    console.log(`Package.json not found at ${packageJsonPath}`);
    return;
  }

  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  let updated = false;

  packages.forEach(pkg => {
    const currentValue = dependencies[pkg.name];
    let newValue;

    if (isLocal && checkLocalPackage(pkg.localPath)) {
      newValue = `file:${pkg.localPath}`;
    } else {
      newValue = pkg.version;
    }

    if (currentValue !== newValue) {
      dependencies[pkg.name] = newValue;
      updated = true;
      console.log(`${pkg.name}: ${currentValue} → ${newValue}`);
    }
  });

  if (updated) {
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
    console.log(`Updated ${packageJsonPath}`);
  } else {
    console.log(`No changes needed for ${packageJsonPath}`);
  }
}

function main() {
  const args = process.argv.slice(2);
  const mode = args[0] || 'auto'; // 'auto', 'local', or 'published'

  console.log(`Smart Import Mode: ${mode}`);

  // Update main package.json
  const mainPackageJson = path.resolve(__dirname, '../package.json');
  updatePackageJson(mainPackageJson, JSON.parse(fs.readFileSync(mainPackageJson, 'utf8')).dependencies, mode !== 'published');

  // Update components package.json
  const componentsPackageJson = path.resolve(__dirname, '../InstantlyAnalyze-Components/package.json');
  if (fs.existsSync(componentsPackageJson)) {
    const componentsJson = JSON.parse(fs.readFileSync(componentsPackageJson, 'utf8'));
    updatePackageJson(componentsPackageJson, componentsJson.dependencies, mode !== 'published');
  }

  // Update layouts package.json
  const layoutsPackageJson = path.resolve(__dirname, '../InstantlyAnalyze-Layouts/package.json');
  if (fs.existsSync(layoutsPackageJson)) {
    const layoutsJson = JSON.parse(fs.readFileSync(layoutsPackageJson, 'utf8'));
    updatePackageJson(layoutsPackageJson, layoutsJson.dependencies, mode !== 'published');
  }

  console.log('\nSmart import completed!');
  console.log('\nUsage:');
  console.log('  node scripts/smart-import.js auto     - Use local if available, otherwise published');
  console.log('  node scripts/smart-import.js local    - Force use of local packages');
  console.log('  node scripts/smart-import.js published - Force use of published packages');
}

if (require.main === module) {
  main();
}

module.exports = { checkLocalPackage, updatePackageJson, packages }; 