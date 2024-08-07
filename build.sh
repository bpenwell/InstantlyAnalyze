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

# Function to display help
show_help() {
  echo -e "${GREEN}Usage: $0 [options]${NC}"
  echo
  echo "Options:"
  echo "  --help        Show this help message and exit"
  echo "  --install     Install dependencies before building"
  echo "  --clean       Clean the build directory before building"
  echo "  --quiet       Suppress output messages"
  echo 
  exit 0
}

# Parse parameters
install=false
clean=false
quiet=false
prune=false
auditFix=false

while [[ "$#" -gt 0 ]]; do
  case $1 in
    --help) show_help ;;
    --install) install=true ;;
    --clean) clean=true ;;
    --quiet) quiet=true ;;
    --prune) prune=true ;;
    --auditFix) auditFix=true ;;
    *) usage ;;
  esac
  shift
done

# Function to build a package
build_package() {
    local package_name=$1
    echo -e "${MAGENTA}[Build][$package_name]${NC}"
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

    # Run clean if --clean parameter is provided
    if [ "$prune" = true ]; then
        echo -e "${GREEN}Running prune...${NC}"
        eval "npm prune $output_redirect" || { echo -e "${RED}Error: Failed to clean $package_name${NC}"; exit 1; }
    fi

    # Run install if --install parameter is provided
    if [ "$install" = true ]; then
        echo -e "${GREEN}Running install...${NC}"
        eval "npm i $output_redirect" || { echo -e "${RED}Error: Failed to install $package_name${NC}"; exit 1; }
    fi
    
    # Run install if --install parameter is provided
    if [ "$auditFix" = true ]; then
        echo -e "${GREEN}Running audit fix...${NC}"
        eval "npm audit fix $output_redirect" || { echo -e "${RED}Error: Failed to audit fix $package_name${NC}"; exit 1; }
    fi

    echo -e "${GREEN}Running build...${NC}"
    eval "npm run build $output_redirect" || { echo -e "${RED}Error: Failed to build $package_name${NC}"; exit 1; }
}

# Function to watch a package
server_package() {
    local package_name=$1
    echo -e "${MAGENTA}[Server][$package_name]${NC}"
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

# Build each subpackage
build_package "REI-Module"
build_package "REI-Components"
build_package "REI-Layouts"
build_package "REI-Tool"

echo -e "${GREEN}Running server...${NC}"
server_package "REI-Module" & 
server_package "REI-Components" & 
server_package "REI-Layouts" &
server_package "REI-Tool" &

echo -e "${GREEN}Running start...${NC}"
#Run the start command and handle errors
eval "npm run start $output_redirect" || { echo -e "${RED}Error: Failed to run npm run start${NC}"; true; }
