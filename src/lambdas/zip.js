const fs = require('fs');
const archiver = require('archiver');
const path = require('path');

// Get the folder path from command line arguments
const folderPath = process.argv[2];
if (!folderPath) {
    console.error('Please provide a folder path.');
    process.exit(1);
}

// Ensure the folder path is absolute
const absoluteFolderPath = path.resolve(folderPath);

// Create the output ZIP file stream
const output = fs.createWriteStream(`${folderPath}/function.zip`);
const archive = archiver('zip', {
    zlib: { level: 9 } // Sets the compression level.
});

// Handle successful completion
output.on('close', function() {
    console.log(archive.pointer() + ' total bytes');
    console.log('Lambda function packaged successfully.');
});

// Handle errors
archive.on('error', function(err) {
    throw err;
});

// Pipe archive data to the file
archive.pipe(output);

// Add the directory to the archive with proper folder structure
console.log(`saving zip file to ${absoluteFolderPath}`);
archive.directory(absoluteFolderPath, path.basename(absoluteFolderPath));

// Finalize the archive
archive.finalize();
