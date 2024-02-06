#!/bin/bash

# Absolute path to the root directory
root_path="C:\Users\benpe\Coding\REI-Project\REI-App-Root"

# Navigate to the root directory
cd "$root_path" || exit

npm run watch & 

npm run build & 

# npm run server || { echo "Error: Failed to run npm run server in $folder"; exit 1; }

# This allows us to take advantage of express in order to handle client-side redirection
# That way we don't run into issues with `GET /.../ `
# The only downside is that changes dont hot-reload properly
npm run start || { echo "Error: Failed to run npm run start in $folder"; exit 1; }