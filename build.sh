#!/bin/bash

# Absolute path to the root directory
root_path="C:\Users\benpe\Coding\REI-Project\REI-App-Root"

# Navigate to the root directory
cd "$root_path" || exit

npm run watch & 

npm run server || { echo "Error: Failed to run npm run server in $folder"; exit 1; }


# --------------------------------

# old script


# Absolute path to the root directory
# root_path="C:\Users\benpe\Coding\REI-Project"

# Navigate to the root directory
# cd "$root_path" || exit

# Enter the sub-folders in order
# for folder in "REI-Components" "REI-Layouts" "REI-App-Root"; do
  # cd "$folder" || { echo "Error: Could not enter $folder directory"; exit 1; }

  # Run npm run build in each sub-folder
  # npm run build || { echo "Error: Failed to run npm run build in $folder"; exit 1; }

  # if [ "$folder" == "REI-App-Root" ]; then
    # npm run server || { echo "Error: Failed to run npm run server in $folder"; exit 1; }
  # fi

  # Move back to the parent directory
  # cd ..
# done