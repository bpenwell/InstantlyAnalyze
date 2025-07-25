# Command Guide - InstantlyAnalyze Monorepo

## 🚀 Overview

This guide covers all the commands available in your optimized InstantlyAnalyze monorepo, including Turborepo commands, publishing workflows, and development tools.

## 📍 **Where to Run Commands**

**All commands should be run from the `InstantlyAnalyze` directory:**
```bash
cd C:\Users\benpe\Coding\REI-Project\InstantlyAnalyze
```

## 🔧 **Turborepo Commands**

### **Build Commands**
```bash
# Build all packages (with caching)
npm run build

# Build specific packages
npx turbo run build --filter=@ben1000240/instantlyanalyze-module
npx turbo run build --filter=@ben1000240/instantlyanalyze-components
npx turbo run build --filter=@ben1000240/instantlyanalyze-layouts

# Force rebuild (ignore cache)
npx turbo run build --force

# Build with parallel execution
npx turbo run build --parallel
```

### **Development Commands**
```bash
# Start development mode for all packages
npm run dev

# Start development for specific packages
npx turbo run dev --filter=@ben1000240/instantlyanalyze-module
npx turbo run dev --filter=@ben1000240/instantlyanalyze-components

# Watch mode for all packages
npx turbo run dev --parallel
```

### **Testing Commands**
```bash
# Run tests for all packages
npm run test

# Run tests for specific packages
npx turbo run test --filter=@ben1000240/instantlyanalyze-module

# Run tests in watch mode
npx turbo run test --watch

# Run tests with coverage
npx turbo run test --coverage
```

### **Linting Commands**
```bash
# Lint all packages
npm run lint

# Lint specific packages
npx turbo run lint --filter=@ben1000240/instantlyanalyze-components

# Fix linting issues
npx turbo run lint --fix
```

### **Type Checking**
```bash
# Type check all packages
npm run type-check

# Type check specific packages
npx turbo run type-check --filter=@ben1000240/instantlyanalyze-module
```

### **Clean Commands**
```bash
# Clean all packages
npm run clean

# Clean specific packages
npx turbo run clean --filter=@ben1000240/instantlyanalyze-module
```

## 📦 **Publishing Commands**

### **Publishing Scripts**
```bash
# Publish all packages with patch version bump (0.1.0 → 0.1.1)
npm run publish:patch

# Publish all packages with minor version bump (0.1.0 → 0.2.0)
npm run publish:minor

# Publish all packages with major version bump (0.1.0 → 1.0.0)
npm run publish:major

# Quick patch release (alias for publish:patch)
npm run publish:all
```

### **Individual Package Publishing**
```bash
# Publish specific package
cd ../InstantlyAnalyze-Module
npm run build:prod
npm publish

cd ../InstantlyAnalyze-Components
npm run build:prod
npm publish

cd ../InstantlyAnalyze-Layouts
npm run build:prod
npm publish
```

### **Migration Commands**
```bash
# Migrate from file:../ dependencies to npm dependencies
npm run migrate:npm

# Rollback to file:../ dependencies
npm run migrate:rollback
```

## 🛠️ **Development Workflow Commands**

### **Full Development Environment**
```bash
# Start complete development environment (build + test + server)
npm run dev:all

# Start development server only
npm run dev:server

# Start build in watch mode
npm run dev:build

# Start tests in watch mode
npm run dev:test
```

### **Production Builds**
```bash
# Build for production
npm run build:production

# Build Lambda functions
npm run build:lambda

# Build specific Lambda
npm run buildLambda:aiRealEstateAgentAPI
npm run buildLambda:userConfigs
npm run buildLambda:propertyData
npm run buildLambda:rentEstimate
npm run buildLambda:rentalReport
npm run buildLambda:sendFeedbackEmail
npm run buildLambda:stripeSubscription
```

### **Theme Building**
```bash
# Build custom Cloudscape theme
npm run build:theme
```

## 🔍 **Cache Management Commands**

### **Turborepo Cache**
```bash
# Check cache status
npx turbo run build

# Clear local cache
npx turbo run build --force

# Clear all caches
rm -rf .turbo
npx turbo run build --force
```

### **Remote Cache Management**
```bash
# Check remote cache status
npx turbo run build

# Disable remote caching
npx turbo unlink

# Re-enable remote caching
npx turbo login
npx turbo link
```

## 📊 **Monitoring & Debugging Commands**

### **Build Analysis**
```bash
# Show build graph
npx turbo run build --graph

# Show task dependencies
npx turbo run build --dry-run

# Show cache status
npx turbo run build --remote-only
```

### **Package Information**
```bash
# List all packages in workspace
npx turbo run build --dry-run

# Show package dependencies
npm ls

# Show outdated packages
npm outdated
```

## 🚨 **Troubleshooting Commands**

### **Common Issues**
```bash
# Clear all caches and node_modules
rm -rf .turbo node_modules package-lock.json
npm install
npx turbo run build --force

# Reset to clean state
npm run clean
npm install
npx turbo run build

# Check for circular dependencies
npx turbo run build --graph
```

### **Dependency Issues**
```bash
# Fix dependency issues
npm audit fix
npm audit fix --force

# Update all dependencies
npm update

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

## 📋 **Command Examples by Use Case**

### **Daily Development**
```bash
# Start your day
npm run dev

# Make changes, then test
npm run test

# Build before committing
npm run build
```

### **Before Committing**
```bash
# Run all checks
npm run lint
npm run test
npm run type-check
npm run build
```

### **Publishing a Release**
```bash
# 1. Test everything
npm run test
npm run build

# 2. Publish packages
npm run publish:patch  # or minor/major

# 3. Migrate dependencies (if needed)
npm run migrate:npm
```

### **Setting Up a New Environment**
```bash
# 1. Install dependencies
npm install

# 2. Build all packages
npm run build

# 3. Start development
npm run dev
```

## ⚡ **Performance Tips**

### **Fast Development**
```bash
# Use parallel execution for faster builds
npx turbo run build --parallel

# Use watch mode for continuous development
npx turbo run dev --parallel

# Leverage remote caching
npx turbo run build  # Uses remote cache automatically
```

### **CI/CD Optimization**
```bash
# Use remote cache in CI
npx turbo run build --remote-only

# Skip cache for clean builds
npx turbo run build --force

# Build only changed packages
npx turbo run build --filter=...[origin/main]
```

## 🔧 **Advanced Turborepo Commands**

### **Task Filtering**
```bash
# Run tasks only for packages with changes
npx turbo run build --filter=...[origin/main]

# Run tasks for specific packages and their dependencies
npx turbo run build --filter=@ben1000240/instantlyanalyze-layouts...

# Run tasks for packages that depend on a specific package
npx turbo run build --filter=...@ben1000240/instantlyanalyze-module
```

### **Output Control**
```bash
# Verbose output
npx turbo run build --verbose

# JSON output
npx turbo run build --json

# Summary only
npx turbo run build --summarize
```

## 📚 **Command Reference Quick Sheet**

| Command | Purpose | Location |
|---------|---------|----------|
| `npm run build` | Build all packages | InstantlyAnalyze |
| `npm run dev` | Start development | InstantlyAnalyze |
| `npm run test` | Run all tests | InstantlyAnalyze |
| `npm run publish:patch` | Publish packages | InstantlyAnalyze |
| `npm run migrate:npm` | Switch to npm deps | InstantlyAnalyze |
| `npx turbo run build --force` | Force rebuild | InstantlyAnalyze |
| `npx turbo run dev --parallel` | Parallel dev mode | InstantlyAnalyze |

## 🎯 **Best Practices**

1. **Always run commands from the `InstantlyAnalyze` directory**
2. **Use `npm run` for predefined scripts**
3. **Use `npx turbo run` for direct Turborepo commands**
4. **Leverage caching for faster builds**
5. **Test before publishing**
6. **Use appropriate version bumps for releases**

---

**Need help?** Check the `PACKAGE_OPTIMIZATION.md` file for detailed explanations of the optimization setup. 