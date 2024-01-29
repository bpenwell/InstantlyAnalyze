@echo off

rem Absolute path to the root directory
set "root_path=C:\Users\benpe\Coding\REI-Project"

rem Navigate to the root directory
cd /d "%root_path%" || exit /b

rem Enter the sub-folders in order
for %%F in ("REI-Components" "REI-Layouts" "REI-App-Root") do (
  cd /d "%%~F" || (
    echo Error: Could not enter %%~F directory
    exit /b 1
  )

  rem Run npm run build in each sub-folder
  npm run build || (
    echo Error: Failed to run npm run build in %%~F
    exit /b 1
  )

  if "%%~F"=="REI-App-Root" (
    npm run server || (
      echo Error: Failed to run npm run server in %%~F
      exit /b 1
    )
  )
  rem Move back to the parent directory
  cd ..
)

echo Build process completed successfully for all sub-folders.
