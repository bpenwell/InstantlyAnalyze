#!/bin/bash

# Color codes
MAGENTA='\033[0;35m'
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Absolute path to the root directory
root_path="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Navigate to the root directory
cd "$root_path" || exit

# Function to check if a package directory exists
check_package_dir() {
  local package_name=$1
  if [ ! -d "../$package_name" ]; then
    echo -e "${RED}Error: Package directory ../$package_name not found. Please ensure all required packages are pulled down.${NC}"
    exit 1
  fi
}

# Function to kill existing processes
kill_existing_processes() {
  echo -e "${RED}Killing existing processes...${NC}"

  # Kill processes related to npm run server
  server_pids=$(ps aux | grep "npm run server" | grep -v grep | awk '{print $2}')
  if [ -n "$server_pids" ]; then
    echo "$server_pids" | xargs kill -9
  fi

  # Kill processes related to npm run start
  start_pids=$(ps aux | grep "npm run start" | grep -v grep | awk '{print $2}')
  if [ -n "$start_pids" ]; then
    echo "$start_pids" | xargs kill -9
  fi
}

# Call the function at the start of the script
kill_existing_processes

# Function to display help
show_help() {
  echo -e "${GREEN}Usage: $0 [options]${NC}"
  echo
  echo "Options:"
  echo "  --help             Show this help message and exit"
  echo "  --install          Install dependencies before building"
  echo "  --clean            Clean the build directory before building"
  echo "  --cleanNode        Clean node_modules before building"
  echo "  --prune            Prune npm dependencies before building"
  echo "  --auditFix         Run npm audit fix before building"
  echo "  --quiet            Suppress output messages"
  echo "  --skipTests        Skip running tests during build"
  echo "  --buildLambda      Build Lambda functions in addition to building packages"
  echo "  --server           Skip building and directly start the servers"
  echo 
  exit 0
}

# Trap termination signals
trap cleanup SIGINT SIGTERM

# Function to kill background processes
cleanup() {
  echo -e "${RED}Cleaning up background processes...${NC}"
  pkill -P $$  # Kill all child processes of this script
  exit
}

# Parse parameters
install=false
buildLambda=false
server_mode=false
clean=false
cleanNode=false
quiet=false
prune=false
auditFix=false
skipTests=false

while [[ "$#" -gt 0 ]]; do
  case $1 in
    --help) show_help ;;
    --buildLambda) buildLambda=true ;;
    --server) server_mode=true ;;
    --install) install=true ;;
    --clean) clean=true ;;
    --cleanNode) cleanNode=true ;;
    --quiet) quiet=true ;;
    --prune) prune=true ;;
    --auditFix) auditFix=true ;;
    --skipTests) skipTests=true ;;
    *) 
      echo -e "${RED}Unknown option: $1${NC}"
      show_help
      ;;
  esac
  shift
done

# Function to build a Lambda
build_lambda() {
    local package_name=$1
    echo -e "${MAGENTA}[Build Lambdas][$package_name]${NC}"
    check_package_dir "$package_name"
    cd "../$package_name" || exit

    # Determine if output should be hidden
    local output_redirect
    if [ "$quiet" = true ]; then
        output_redirect="> /dev/null 2>&1"
    else
        output_redirect=""
    fi

    echo -e "${GREEN}Running buildLambda...${NC}"
    eval "npm run buildLambda $output_redirect" || { echo -e "${RED}Error: Failed to build $package_name${NC}"; exit 1; }
}

# Function to build a package
build_package() {
    local package_name=$1
    echo -e "${MAGENTA}[Build][$package_name]${NC}"
    check_package_dir "$package_name"
    cd "../$package_name" || exit

    # Determine if output should be hidden
    local output_redirect
    if [ "$quiet" = true ]; then
        output_redirect="> /dev/null 2>&1"
    else
        output_redirect=""
    fi

    # Run clean if --clean parameter is provided
    if [ "$clean" = true ]; then
        echo -e "${GREEN}Running clean...${NC}"
        eval "npm run clean $output_redirect" || { echo -e "${RED}Error: Failed to clean $package_name${NC}"; exit 1; }
    fi

    # Run cleanNode if --cleanNode parameter is provided
    if [ "$cleanNode" = true ]; then
        echo -e "${GREEN}Running clean node_modules...${NC}"
        eval "npm run cleanNode $output_redirect" || { echo -e "${RED}Error: Failed to cleanNode $package_name${NC}"; exit 1; }
    fi

    # Run prune if --prune parameter is provided
    if [ "$prune" = true ]; then
        echo -e "${GREEN}Running prune...${NC}"
        eval "npm prune $output_redirect" || { echo -e "${RED}Error: Failed to prune $package_name${NC}"; exit 1; }
    fi

    # Run install if --install parameter is provided
    if [ "$install" = true ]; then
        echo -e "${GREEN}Running install...${NC}"
        eval "npm install $output_redirect" || { echo -e "${RED}Error: Failed to install $package_name${NC}"; exit 1; }
    fi
    
    # Run audit fix if --auditFix parameter is provided
    if [ "$auditFix" = true ]; then
        echo -e "${GREEN}Running audit fix...${NC}"
        eval "npm audit fix $output_redirect" || { echo -e "${RED}Error: Failed to audit fix $package_name${NC}"; exit 1; }
    fi

    # Run tests before building (unless skipped)
    if [ "$skipTests" = false ]; then
        echo -e "${GREEN}Running tests...${NC}"
        eval "npm test $output_redirect" || { echo -e "${RED}Error: Tests failed for $package_name${NC}"; exit 1; }
    else
        echo -e "${GREEN}Skipping tests...${NC}"
    fi

    echo -e "${GREEN}Running build...${NC}"
    eval "npm run build $output_redirect" || { echo -e "${RED}Error: Failed to build $package_name${NC}"; exit 1; }
}

# Function to watch a package
server_package() {
    local package_name=$1
    echo -e "${MAGENTA}[Server][$package_name]${NC}"
    check_package_dir "$package_name"
    cd "../$package_name" || exit

    # Determine if output should be hidden
    local output_redirect
    if [ "$quiet" = true ]; then
        output_redirect="> /dev/null 2>&1"
    else
        output_redirect=""
    fi

    eval "npm run server $output_redirect" &
}

# Function to build all packages
build_all_packages() {
    build_package "InstantlyAnalyze-Module"
    build_package "InstantlyAnalyze-Components"
    build_package "InstantlyAnalyze-Layouts"
    # Target packages
    build_package "InstantlyAnalyze-ZillowScraper" &
    build_package "InstantlyAnalyze"
}

# Function to start all servers
start_all_servers() {
    echo -e "${GREEN}Starting servers...${NC}"
    server_package "InstantlyAnalyze-Module" & 
    server_package "InstantlyAnalyze-Components" & 
    server_package "InstantlyAnalyze-Layouts" &
    server_package "InstantlyAnalyze-ZillowScraper" &
    server_package "InstantlyAnalyze" &
}

# Main execution logic based on options
if [ "$server_mode" = true ]; then
    # Server Mode: Skip building and start servers directly
    start_all_servers

    # Determine if output should be hidden for start command
    if [ "$quiet" = true ]; then
        output_redirect="> /dev/null 2>&1"
    else
        output_redirect=""
    fi

    # Run the start command and handle errors
    echo -e "${GREEN}Running npm run start...${NC}"
    eval "npm run start $output_redirect" || { echo -e "${RED}Error: Failed to run npm run start${NC}"; exit 1; }

else
    # Default Mode: Build all packages
    build_all_packages

    # If buildLambda flag is set, build Lambda functions in addition
    if [ "$buildLambda" = true ]; then
        build_lambda "InstantlyAnalyze"
    fi

    # Start all servers
    start_all_servers

    # Wait for background processes to complete
    wait

    # Determine if output should be hidden for start command
    if [ "$quiet" = true ]; then
        output_redirect="> /dev/null 2>&1"
    else
        output_redirect=""
    fi

    # Run the start command and handle errors
    echo -e "${GREEN}Running npm run start...${NC}"
    eval "npm run start $output_redirect" || { echo -e "${RED}Error: Failed to run npm run start${NC}"; exit 1; }
fi