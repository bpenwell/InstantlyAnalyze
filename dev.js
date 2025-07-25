const { spawn } = require('child_process');
const { exec } = require('child_process');
const path = require('path');

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logWithPrefix(prefix, message, color = 'reset') {
  console.log(`${colors[color]}[${prefix}]${colors.reset} ${message}`);
}

// Kill existing processes
function killExistingProcesses() {
  return new Promise((resolve) => {
    log('Killing existing processes...', 'yellow');
    
    // Kill processes on Windows
    exec('taskkill /f /im node.exe 2>nul || echo "No node processes to kill"', (error) => {
      if (error) {
        log('No existing processes to kill', 'cyan');
      } else {
        log('Killed existing processes', 'green');
      }
      resolve();
    });
  });
}

// Run a command and return a promise
function runCommand(command, args = [], options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: 'pipe',
      shell: true,
      ...options
    });

    let output = '';
    let errorOutput = '';

    child.stdout.on('data', (data) => {
      const message = data.toString();
      output += message;
      process.stdout.write(message);
    });

    child.stderr.on('data', (data) => {
      const message = data.toString();
      errorOutput += message;
      process.stderr.write(message);
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolve(output);
      } else {
        reject(new Error(`Command failed with code ${code}: ${errorOutput}`));
      }
    });

    child.on('error', (error) => {
      reject(error);
    });
  });
}

// Main development workflow
async function startDevelopment() {
  try {
    log('🚀 Starting InstantlyAnalyze Development Environment', 'bright');
    
    // Kill existing processes
    await killExistingProcesses();
    
    // Wait a moment for processes to fully terminate
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    log('📦 Building all packages...', 'blue');
    
    // Build all packages first
    await runCommand('npm', ['run', 'build']);
    
    log('✅ Build completed successfully', 'green');
    
    // Start development servers
    log('🔄 Starting development servers...', 'blue');
    
    const processes = [
      {
        name: 'TURBO-DEV',
        command: 'npm',
        args: ['run', 'dev'],
        color: 'magenta'
      },
      {
        name: 'DEV-SERVER',
        command: 'npm',
        args: ['run', 'dev:server'],
        color: 'cyan'
      }
    ];

    // Start all processes
    const runningProcesses = processes.map(process => {
      logWithPrefix(process.name, 'Starting...', process.color);
      
      const child = spawn(process.command, process.args, {
        stdio: 'pipe',
        shell: true
      });

      child.stdout.on('data', (data) => {
        const message = data.toString();
        process.stdout.write(`${colors[process.color]}[${process.name}]${colors.reset} ${message}`);
      });

      child.stderr.on('data', (data) => {
        const message = data.toString();
        process.stderr.write(`${colors[process.color]}[${process.name}]${colors.reset} ${message}`);
      });

      child.on('error', (error) => {
        logWithPrefix(process.name, `Error: ${error.message}`, 'red');
      });

      child.on('close', (code) => {
        logWithPrefix(process.name, `Process exited with code ${code}`, code === 0 ? 'green' : 'red');
      });

      return child;
    });

    // Handle graceful shutdown
    process.on('SIGINT', () => {
      log('\n🛑 Shutting down development environment...', 'yellow');
      runningProcesses.forEach(child => {
        child.kill('SIGTERM');
      });
      process.exit(0);
    });

    process.on('SIGTERM', () => {
      log('\n🛑 Shutting down development environment...', 'yellow');
      runningProcesses.forEach(child => {
        child.kill('SIGTERM');
      });
      process.exit(0);
    });

    log('🎉 Development environment started successfully!', 'green');
    log('📱 Main app will be available at: http://localhost:3000', 'cyan');
    log('🔄 Hot reloading is enabled for all packages', 'cyan');
    log('🧪 Tests will run automatically on file changes', 'cyan');
    log('⏹️  Press Ctrl+C to stop all processes', 'yellow');

  } catch (error) {
    log(`❌ Error starting development environment: ${error.message}`, 'red');
    process.exit(1);
  }
}

// Start the development environment
startDevelopment(); 