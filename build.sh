#!/bin/bash

# Absolute path to the root directory
root_path="C:\Users\benpe\Coding\REI-Project\REI-Tool"

# Navigate to the root directory
cd "$root_path" || exit

# Run npm scripts in the background and continue execution
npm run clean
npm run install 
npm run build
npm run watch &
npm run server &

# Wait for background processes to complete
wait

# Run the server but continue execution even if it fails
npm run server || { echo "Error: Failed to run npm run server"; true; }

# The only downside is that changes don't hot-reload properly
npm run start || { echo "Error: Failed to run npm run start"; true; }
